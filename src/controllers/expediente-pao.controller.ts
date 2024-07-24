import validator from 'validator';
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { AreaQueries } from '../queries/area.query'
import { Soap } from '../helpers/soap'
import { Log } from '../helpers/logs'
import {SolicitudQueries} from "../queries/solicitud.query";
import https from "https";
import {Axios} from "../helpers/axios";
import {ExpedientePaoQueries} from "../queries/expediente-pao.query";

export class ExpedientePaoController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static areaQueries: AreaQueries = new AreaQueries()
    static expedientePaoQueries: ExpedientePaoQueries = new ExpedientePaoQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()
    static axios: Axios = new Axios()

    public async checkExpedientPAO(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const folio: string = body.folio == null || validator.isEmpty(body.folio + '') || validator.isNumeric(body.folio + '') == false  ?
            errors.push({ message: 'El folio es obligatorio y debe contener solo números' }) : body.folio

        const ejercicio: string = body.ejercicio == null || validator.isEmpty(body.ejercicio + '')  || validator.isNumeric(body.ejercicio + '') == false ?
            errors.push({ message: 'El ejercicio de renovación es obligatorio y debe contener solo números' }) : body.ejercicio

        const vigenciaPermiso: string = body.vigenciaPermiso == null || validator.isEmpty(body.vigenciaPermiso) ?
            errors.push({ message: 'Favor de proporcionar la fecha de vigencia del permiso' }) : body.vigenciaPermiso

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si el contribuyente ya tiene adjunto el expediente pao */
        let findExpedienteByFolioEjercicio = await ExpedientePaoController.expedientePaoQueries.findExpedienteByFolioEjercicio({
            folio_expediente: folio,
            ejercicio_fiscal: ejercicio,
        })

        if (!findExpedienteByFolioEjercicio.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: "Existen problemas para validar el expediente. Por favor intente más tarde."}]
            })
        }

        // Verificar si el expediente esta en alguna solicitud activa.
        if (findExpedienteByFolioEjercicio.expedientePao != null) {
            const findSolicitudByExpedienteId = await ExpedientePaoController.solicitudQueries.findSolicitudByExpedienteId({
                expediente_id: findExpedienteByFolioEjercicio.expedientePao.id
            })

            if (!findSolicitudByExpedienteId.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' }]
                })
            }

            if (findSolicitudByExpedienteId.solicitud != null ) {
                if ( !(findSolicitudByExpedienteId.solicitud.estatus_solicitud_id === 7 || findSolicitudByExpedienteId.solicitud.estatus_solicitud_id === 13 || findSolicitudByExpedienteId.solicitud.estatus_solicitud_id === 18)) {
                    return res.status(400).json({
                        ok: false,
                        errors: [{ message: 'El folio ingresado ya esta adjunto a una solicitud activa.' }]
                    })
                }

            }
        }

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        let headers = {
            'Content-Type': 'application/json'
        }


        /** Proporcionamos esos datos y hacemos la solicitud al cliente */
        let options = {
            method: 'GET',
            url: process.env.VALIDAR_EXPEDIENTE_PAO + folio + '/' + ejercicio + '/' + vigenciaPermiso,
            headers: headers,
            httpsAgent: agent
        }

        /** Wait a response to Axios and validate the response */
        let response = await ExpedientePaoController.axios.getResponse(options)

        if (response.ok == true) {
            if (response.result.respuesta === 'sin-coincidencias' ) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: "No se encontró ningún dato relacionado a la información proporcionada, favor de validar que sean correctos los datos introducidos."}]
                });
            }

            if (response.result.respuesta === 'solicitudes-pendientes' ) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: "Actualmente cuenta con solicitudes pendientes sobre este expediente, favor de acudir a la dirección de Medio ambiente."}]
                });
            }

            if (response.result.respuesta === 'correcto') {

                let upsertExpedientePao = await ExpedientePaoController.expedientePaoQueries.upsert({
                    id: (findExpedienteByFolioEjercicio.expedientePao) ? findExpedienteByFolioEjercicio.expedientePao.id : null,
                    contribuyente_id: contribuyente_id,
                    expediente_pao_id: response.result.datosExpediente.id,
                    folio_expediente: folio,
                    ejercicio_fiscal: ejercicio,
                    vigencia_permiso: vigenciaPermiso,
                    expediente_json: JSON.stringify(response.result.datosExpediente),
                    requisitos_json: JSON.stringify(response.result.requisitos)
                })

                if (!upsertExpedientePao.ok) {
                    return res.status(400).json({
                        ok: false,
                        errors: [{message: "Existen problemas para validar el expediente. Por favor intente más tarde."}]
                    })
                }

                return res.status(200).json({
                    ok: true,
                    message: 'Puede continuar con la solicitud.',
                    expediente: (findExpedienteByFolioEjercicio.expedientePao) ? findExpedienteByFolioEjercicio.expedientePao.id : upsertExpedientePao.expedientePao.id
                })
            }
        } else {
            return res.status(400).json({
                ok: false,
                errors: [{message: "Existen problemas para validar el expediente. Por favor intente más tarde."}]
            });
        }


    }

    public async addExpedientInformation (req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const expediente_id: string = body.expediente_id == null || validator.isEmpty(body.expediente_id + '') ?
            errors.push({ message: 'El expediente a actualizar es obligatorio' }) : body.expediente_id

        const clave_catastral: string = body.clave_catastral == null || validator.isEmpty(body.clave_catastral + '') ?
            errors.push({ message: 'La clave catastral es obligatorio' }) : body.clave_catastral

        const correo: string = body.correo == null || validator.isEmpty(body.correo + '')  || validator.isEmail(body.correo + '') == false ?
            errors.push({ message: 'El correo es obligatorio y debe respetar la estructura de un correo.' }) : body.correo

        const nombre_gestor: string = body.nombre_gestor == null || validator.isEmpty(body.nombre_gestor + '') ?
            errors.push({ message: 'El nombre del gestor es obligatorio' }) : body.nombre_gestor

        const representante_legal: string = body.representante_legal == null || validator.isEmpty(body.representante_legal + '') ?
            errors.push({ message: 'El representante legal es obligatorio' }) : body.representante_legal

        const telefono_contacto: string = body.telefono_contacto == null || validator.isEmpty(body.telefono_contacto + '')  || validator.isNumeric(body.telefono_contacto) == false ?
            errors.push({ message: 'El teléfono de contacto es obligatorio' }) : body.telefono_contacto

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        let updateExpedientInformation = await ExpedientePaoController.expedientePaoQueries.updateExpedientInformation({
            id: expediente_id,
            clave_catastral: clave_catastral,
            correo: correo,
            nombre_gestor: nombre_gestor,
            representante_legal: representante_legal,
            telefono_contacto: telefono_contacto
        })

        if (!updateExpedientInformation.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: "Existen problemas para actualizar el expediente. Por favor intente más tarde."}]
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'La información del expediente se ha actualizado correctamente.'
        })


    }

}
