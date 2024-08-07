import validator from 'validator';
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { AreaQueries } from '../queries/area.query'
import { LicenciaQueries } from '../queries/licencia.query'
import { Soap } from '../helpers/soap'
import { Log } from '../helpers/logs'
import {UrlIntencionCobroQueries} from "../queries/url_intencion_cobro.query";
import {ServicioQueries} from "../queries/servicio.query";
import {SolicitudQueries} from "../queries/solicitud.query";

export class LicenciaController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static areaQueries: AreaQueries = new AreaQueries()
    static licenciaQueries: LicenciaQueries = new LicenciaQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()
    static urlIntencionCobroQueries: UrlIntencionCobroQueries = new UrlIntencionCobroQueries()

    public async show(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []
        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findLicenciasByContribuyente = await LicenciaController.licenciaQueries.findLicenciasByContribuyente({
            contribuyente_id
        })

        if (!findLicenciasByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener las licencias.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            licencias: findLicenciasByContribuyente.licencias
        })
    }

    public async store(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia) ?
            errors.push({ message: 'Favor de proporcionar la licencia' }) : body.licencia

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findLicenciaByContribuyente = await LicenciaController.licenciaQueries.findLicenciaByContribuyente({
            licencia_funcionamiento_id: licencia,
            contribuyente_id
        })

        if (!findLicenciaByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' })
        } else if (findLicenciaByContribuyente.licencia != null) {
            errors.push({ message: 'La licencia proporcionada ya esta adjunta a su cuenta.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.DATOS_LICENCIA,
            function: 'daoObtieneDatosLicenciaFuncionamientoId',
            args: {
                // tslint:disable-next-line:radix
                parIntIdComercio: parseInt(licencia)
            }
        }

        const soap: any = await LicenciaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (!soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'La licencia proporcionada no existe' }]
            })
        }

        if (!soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.LicenciasFuncionamientoStatus) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'La licencia proporcionada no existe' }]
            })
        }


        const rfc = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.RFCPersona
        const licenciaFuncionamientoFolio = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.LicenciasFuncionamientoFolio
        const razonSocial = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.RazonSocialPersona
        const nombreEstablecimiento = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.nombrecomercial
        const habitaciones = 0
        const domicilioFiscal = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.Domicilio_Fiscal
        const claveCatastral = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.PredioCveCatastral
        const calle = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.calle
        const noInterior = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NumInt
        const noExterior = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NumExt
        const cp = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.CodigoPostalColonia
        const colonia = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NombreColonia
        const localidad = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NombreOficialLocalidad
        const municipio = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NombreOficialMunicipio
        const estado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.NombreEntidadFederativa
        const estatus = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.LicenciasFuncionamientoStatus
        const propietarioNombre = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.propietario
        const fechaInicioOperacion = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.FechaInicioOperacion
        const ultimoEjercicioPagado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.LicenciasFuncionamientoUltimoEjercicioPagado
        const ultimoPeriodoPagado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoIdResult.LicenciasFuncionamientoUltimoPeriodoPagado

        const createLicncia = await LicenciaController.licenciaQueries.create({
            contribuyente_id,
            rfc,
            licencia_funcionamiento_id: licencia,
            licencia_funcionamiento_folio: licenciaFuncionamientoFolio,
            razon_social: razonSocial,
            nombre_establecimiento: nombreEstablecimiento,
            habitaciones,
            domicilio_fiscal: domicilioFiscal,
            clave_catastral: claveCatastral,
            calle,
            no_interior: noInterior,
            no_exterior: noExterior,
            cp,
            colonia,
            localidad,
            municipio,
            estado,
            propietario_nombre: propietarioNombre,
            fecha_inicio_operacion: moment(fechaInicioOperacion).format('YYYY-MM-DD'),
            ultimo_ejercicio_pagado: ultimoEjercicioPagado,
            ultimo_periodo_pagado: ultimoPeriodoPagado,
            fecha_alta: moment().format('YYYY-MM-DD'),
            estatus
        })

        if (!createLicncia.ok) {
            errors.push({ message: 'Existen problemas al momento de guardar su licencia.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await LicenciaController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente adjunto una licencia a su cuenta',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha adjuntado su licencia a su cuenta de forma correcta'
        })
    }

    public async checkLicense(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia + '') || validator.isNumeric(body.licencia + '') == false  ?
            errors.push({ message: 'La licencia es obligatoria y debe contener solo números' }) : body.licencia

        const folioRenovacion: string = body.folioRenovacion == null || validator.isEmpty(body.folioRenovacion + '')  || validator.isNumeric(body.folioRenovacion + '') == false ?
            errors.push({ message: 'El ultimo folio de renovación es obligatorio y debe contener solo números' }) : body.folioRenovacion

        const ultimoAnoRenovacion: string = body.ultimoAnoRenovacion == null || validator.isEmpty(body.ultimoAnoRenovacion) || validator.isNumeric(body.ultimoAnoRenovacion + '') == false ?
            errors.push({ message: 'Favor de proporcionar el ultimo año de la renovación' }) : body.ultimoAnoRenovacion

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si el contribuyente ya tiene adjunto esa licencia */
        const findLicenciaByContribuyente = await LicenciaController.licenciaQueries.findLicenciaByContribuyentev2({
            licencia_funcionamiento_id: licencia,
            contribuyente_id
        })

        if (!findLicenciaByContribuyente.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' }]
            })
        }

        // if (findLicenciaByContribuyente.licencia.contribuyentes_id != contribuyente_id) {
        //     return res.status(400).json({
        //         ok: false,
        //         errors: [{ message: 'La licencia proporcionada ya esta adjunta a su cuenta.' }]
        //     })
        // }

        // Verificar si la licencia esta en alguna solicitud activa.
        if (findLicenciaByContribuyente.licencia != null) {
            const findSolicitudByLicenciaId = await LicenciaController.solicitudQueries.findSolicitudByLicenciaId({
                licencia_id: findLicenciaByContribuyente.licencia.id
            })

            if (!findSolicitudByLicenciaId.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' }]
                })
            }

            if (findSolicitudByLicenciaId.solicitud != null ) {
                if ( !(findSolicitudByLicenciaId.solicitud.estatus_solicitud_id === 7 || findSolicitudByLicenciaId.solicitud.estatus_solicitud_id === 13 || findSolicitudByLicenciaId.solicitud.estatus_solicitud_id === 18)) {
                    errors.push({ message: 'La licencia proporcionada ya esta adjunta a una solicitud' })
                }

            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
        }



        const data = {
            url: process.env.RENOVACION_LICENCIA,
            function: 'daoObtieneDatosLicenciaFuncionamientoRenovacionId',
            args: {
                // tslint:disable-next-line:radix
                parIntIdComercio: parseInt(licencia),
                // tslint:disable-next-line:radix
                parFolioLicencia: parseInt(folioRenovacion),
                // tslint:disable-next-line:radix
                parEjercicio: parseInt(ultimoAnoRenovacion)
            }
        }

        const soap: any = await LicenciaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (!soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'La licencia proporcionada no existe' }]
            })
        }

        if (!soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoStatus) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'La licencia proporcionada no existe' }]
            })
        }

        if (soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoEsRenovable === false) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'No es posible renovar su licencia en estos momentos.' }]
            })

        }


        const rfc = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.RFCPersona
        const licenciaFuncionamientoFolio = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoFolio
        const razonSocial = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.RazonSocialPersona
        const nombreEstablecimiento = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.nombrecomercial
        const habitaciones = 0
        const domicilioFiscal = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.Domicilio_Fiscal
        const claveCatastral = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.PredioCveCatastral
        const calle = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.calle
        const noInterior = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NumInt
        const noExterior = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NumExt
        const cp = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.CodigoPostalColonia
        const colonia = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NombreColonia
        const localidad = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NombreOficialLocalidad
        const municipio = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NombreOficialMunicipio
        const estado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.NombreEntidadFederativa
        const estatus = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoStatus
        const propietarioNombre = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.propietario
        const fechaInicioOperacion = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.FechaInicioOperacion
        const ultimoEjercicioPagado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoUltimoEjercicioPagado
        const ultimoPeriodoPagado = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoUltimoPeriodoPagado
        const renovable = soap.result[0].daoObtieneDatosLicenciaFuncionamientoRenovacionIdResult.LicenciasFuncionamientoEsRenovable


        const createLicncia = await LicenciaController.licenciaQueries.upsert({
            id: (findLicenciaByContribuyente.licencia) ? findLicenciaByContribuyente.licencia.id : null,
            contribuyente_id,
            rfc,
            licencia_funcionamiento_id: licencia,
            licencia_funcionamiento_folio: licenciaFuncionamientoFolio,
            razon_social: razonSocial,
            nombre_establecimiento: nombreEstablecimiento,
            habitaciones,
            domicilio_fiscal: domicilioFiscal,
            clave_catastral: claveCatastral,
            calle,
            no_interior: noInterior,
            no_exterior: noExterior,
            cp,
            colonia,
            localidad,
            municipio,
            estado,
            propietario_nombre: propietarioNombre,
            fecha_inicio_operacion: moment(fechaInicioOperacion).format('YYYY-MM-DD'),
            ultimo_ejercicio_pagado: ultimoEjercicioPagado,
            ultimo_periodo_pagado: ultimoPeriodoPagado,
            renovable,
            estatus
        })

        if (!createLicncia.ok) {
            errors.push({message: 'Existen problemas al momento de guardar su licencia.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        const createLogContribuyente = await LicenciaController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente adjunto una licencia para su renovación',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Puede renovar su licencia'
        })
    }

    public async statementaccount(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia) ?
            errors.push({ message: 'Favor de proporcionar el licencia' }) : body.licencia

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa licencia catastral */
        const findLicenciaByContribuyente = await LicenciaController.licenciaQueries.findLicenciaByContribuyente({
            licencia_funcionamiento_id: licencia,
            contribuyente_id
        })

        if (!findLicenciaByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.ESTADO_CUENTA_LICENCIA,
            function: 'daoObtienerEdoCuentaLicenciaFuncionamiento',
            args: {
                parLngLicenciaFuncionamiento: licencia
            }
        }

        const soap: any = await LicenciaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.CodigoError && soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.parMensajeError }]
            })
        }

        if (!soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.proConsultaWSWSAdeudo.claEntFuenteIngresos) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'No fue posible obtener el estado de cuenta.' }]
            })
        }

        return res.status(200).json({
            ok: true,
            estado_cuenta: soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.proConsultaWSWSAdeudo.claEntFuenteIngresos,
            rfc: soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.proRFCPersona,
            direccion: soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.proDireccionPersona,
            nombre_contribuyente: soap.result[0].daoObtienerEdoCuentaLicenciaFuncionamientoResult.proNombreCompletoPersona,
        })

    }

    public async pasecaja(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia+'') ?
            errors.push({ message: 'Favor de proporcionar el licencia' }) : body.licencia

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa licencia catastral */
        const findLicenciaByContribuyente = await LicenciaController.licenciaQueries.findLicenciaByContribuyente({
            id: licencia,
            contribuyente_id
        })

        if (!findLicenciaByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.PASE_CAJA_LICENCIA,
            function: 'daoCreaPaseCajaLicenciasFuncionamiento',
            args: {
                parStrLicenciaFuncionamiento: findLicenciaByContribuyente.licencia.licencia_funcionamiento_id

            }
        }

        const soap: any = await LicenciaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoCreaPaseCajaLicenciasFuncionamientoResult.CodigoError && soap.result[0].daoCreaPaseCajaLicenciasFuncionamientoResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoCreaPaseCajaLicenciasFuncionamientoResult.MensajeError }]
            })
        }

        if(!soap.result[0].daoCreaPaseCajaLicenciasFuncionamientoResult){
            return res.status(400).json({
                ok: false,
                message: [{ message: 'La licencia proporcionada no existe' }]
            })
        }

        return res.status(200).json({
            ok: true,
            pase_caja: soap.result[0].daoCreaPaseCajaLicenciasFuncionamientoResult.UrlPaseImpresion
        })
    }

    public async linkpago(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia+ '') ?
            errors.push({ message: 'Favor de proporcionar el licencia' }) : body.licencia

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa licencia catastral */
        const findLicenciaByContribuyente = await LicenciaController.licenciaQueries.findLicenciaByContribuyente({
            id: licencia,
            contribuyente_id
        })

        if (!findLicenciaByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.INTENTO_COBRO_LICENCIA,
            function: 'daoGeneraIntenciondecobro',
            args: {
                parStrLicenciaFuncionamiento: findLicenciaByContribuyente.licencia.licencia_funcionamiento_id,
                parStrTokenValidate: 'dedededed'
            }
        }

        const soap: any = await LicenciaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoGeneraIntenciondecobroResult.CodigoError && soap.result[0].daoGeneraIntenciondecobroResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoGeneraIntenciondecobroResult.MensajeError }]
            })
        }

        if(!soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro){
            return res.status(400).json({
                ok: false,
                message: [{ message: 'La licencia proporcionada no existe' }]
            })
        }

        const referencia = moment().unix().toString() + contribuyente_id

        const url_intencion_cobro = await LicenciaController.urlIntencionCobroQueries.store({
            licencia_funcionamiento_id: findLicenciaByContribuyente.licencia.id,
            grupo_tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.GrupoTramiteId,
            tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.TramiteId,
            solicitud_tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.SolicitudId,
            referencia,
            folio_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroResult.FolioPaseCaja,
            url_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro,
            status: 0,
            fecha_alta:  moment().format('YYYY-MM-DD HH:mm:ss'),

        })

        if (!url_intencion_cobro.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el link de pago, intente más tarde' }]
            })
        }

        return res.status(200).json({
            ok: true,
            link: soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro
        })
    }
}
