import validator from 'validator';
import moment from 'moment'
import {Request, Response} from 'express'
import {SolicitudQueries} from '../queries/solicitud.query'
import {ServicioQueries} from '../queries/servicio.query'
import {ContribuyenteQueries} from '../queries/contribuyente.query'
import {RequerimientoQueries} from '../queries/requerimiento.query'
import {DocumentacionQueries} from '../queries/documentacion.query'
import {AdministradorAreaQueries} from '../queries/administrador_area.query'
import {TransaccionQueries} from '../queries/transaccion.query'
import {RequisitosServiciosQueries} from "../queries/requisitos-servicios.query";
import {DocumentoSolicitudRequisitoQueries} from '../queries/documento-solicitud-requisito.query';
import {Log} from '../helpers/logs'
import {File} from '../helpers/files'
import {Soap} from '../helpers/soap'
import {PaseCajaQueries} from "../queries/pase_caja.query";
import {UrlIntencionCobroQueries} from "../queries/url_intencion_cobro.query";
import fs from "fs";
import AdmZip from "adm-zip";
import {LicenciaQueries} from "../queries/licencia.query";
import {ExpedientePaoQueries} from "../queries/expediente-pao.query";
import https from "https";
import {Axios} from "../helpers/axios";

export class SolicitudController {
    static licenciaQueries: LicenciaQueries = new LicenciaQueries()
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static contribuyenteQueries: ContribuyenteQueries = new ContribuyenteQueries()
    static documentacionQueries: DocumentacionQueries = new DocumentacionQueries()
    static documentoSolicitudRequisitoQueries: DocumentoSolicitudRequisitoQueries = new DocumentoSolicitudRequisitoQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
    static paseCajaQueries: PaseCajaQueries = new PaseCajaQueries()
    static urlIntencionCobroQueries: UrlIntencionCobroQueries = new UrlIntencionCobroQueries()
    static requisitosServiciosQueries: RequisitosServiciosQueries = new RequisitosServiciosQueries()
    static administradorAreaQueries: AdministradorAreaQueries = new AdministradorAreaQueries()
    static transaccionQueries: TransaccionQueries = new TransaccionQueries()
    static expedientePaoQueries: ExpedientePaoQueries = new ExpedientePaoQueries()
    static log: Log = new Log()
    static file: File = new File()
    static soap: Soap = new Soap()
    static axios: Axios = new Axios()

    public async store(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const servicioUuid: string = body.servicio_uuid == null || validator.isEmpty(body.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : body.servicio_uuid

        const licencia: string = body.licencia == null || validator.isEmpty(body.licencia + '') ?
            null : body.licencia

        const expediente_id: string = body.expediente_id == null || validator.isEmpty(body.expediente_id + '') ?
            null : body.expediente_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findServicioByUUID = await SolicitudController.servicioQueries.findServicioByUUID({uuid: servicioUuid})
        if (!findServicioByUUID.ok) {
            errors.push({message: 'Existen problemas al momento de validar el servicio proporcionado.'})
        } else if (findServicioByUUID.servicio == null) {
            errors.push({message: 'El servicio proporcionado no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        let findSolicitudByLicenciaId;

        if (licencia != null) {
            // Verificar si la licencia esta en alguna solicitud activa.
            findSolicitudByLicenciaId = await SolicitudController.licenciaQueries.findLicenciaByContribuyentev2({
                licencia_funcionamiento_id: licencia,
                contribuyente_id
            })

            if (!findSolicitudByLicenciaId.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{ message: 'Existen problemas al momento de obtener la licencia de funcionamiento proporcionada.' }]
                })
            }
        }

        /** Creamos una nueva solicitud en la base de datos */
        const createSolicitud = await SolicitudController.solicitudQueries.create({
            contribuyente_id,
            area_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.area_id : false,
            servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
            licencia_id: (licencia) ? findSolicitudByLicenciaId.licencia.id : null,
            expediente_id: (expediente_id) ? expediente_id : null,
            folio: contribuyente_id + '-' + moment().unix(),
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        if (!createSolicitud.ok) {
            errors.push({message: 'Existen problemas al momento de dar de alta su solicitud.'})
        }

        /** Buscamos los requisitos necesarios para el tramite y los damos de alta en la documentación */
        const findRequisitosByServicio = await SolicitudController.requisitosServiciosQueries.findRequisitosByServicio({
            servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
            solicitud_id: createSolicitud.solicitud.id
        });

        if (!findRequisitosByServicio.ok) {
            errors.push({message: 'Existen problemas al momento de buscar información del servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*for (const requisito of findRequisitosByServicio.requisitos) {
            const createDocumentacion = await SolicitudController.documentoSolicitudQueries.create({
                documentacion_id: '',
                solicitudes_id: createSolicitud.solicitud ? createSolicitud.solicitud.id : false,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
                estatus: 0
            })
        }
*/
        /** Creamos el log del usuario */
        const createLogContribuyente = await SolicitudController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a iniciado una solicitud',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        /** Creamos log de solicitud */
        const createLogSolicitud = await SolicitudController.log.solicitud({
            solicitud_id: createSolicitud.solicitud ? createSolicitud.solicitud.id : false,
            estatus_solicitud_id: 1,
            administradores_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.Area.administradores_id : false,
            contribuyente_id,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: 'El contribuyente creo una nueva solicitud'
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha creado la solicitud, favor de adjuntar los requisitos solicitados',
            solicitud_id: createSolicitud.solicitud ? createSolicitud.solicitud.id : false
        })

    }

    public async show(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        const errors = [];

        const findSolicitudesByContribuyente = await SolicitudController.solicitudQueries.findSolicitudesByContribuyente({
            contribuyente_id
        })

        if (!findSolicitudesByContribuyente.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const solicitudesData = []

        for (const solicitud of findSolicitudesByContribuyente.solicitudes) {

            let data = {
                id: solicitud.id,
                folio: solicitud.folio,
                contribuyente_id: solicitud.contribuyente_id,
                contribuyente: solicitud['Contribuyente'].nombre + ' ' + solicitud['Contribuyente'].apellidos,
                area_id: solicitud.area_id,
                area: solicitud['Area'].nombre,
                servicio_id: solicitud.servicio_id,
                servicio: solicitud['Servicio'].nombre,
                licencia_id: solicitud.licencia_id,
                licencia: (solicitud['LicenciaFuncionamiento']) ? solicitud['LicenciaFuncionamiento'].licencia_funcionamiento_id : 'N/A',
                estatus_solicitud_id: solicitud.estatus_solicitud_id,
                estatus: solicitud['Estatus'].nombre,
                fecha_alta: (solicitud.fecha_alta) ? moment(solicitud.fecha_alta).format('DD/MM/YYYY HH:mm:ss') : '',
                fecha_envio: (solicitud.fecha_envio) ? moment(solicitud.fecha_envio).format('DD/MM/YYYY HH:mm:ss') : '',
                fecha_recepcion: (solicitud.fecha_recepcion) ? moment(solicitud.fecha_recepcion).format('DD/MM/YYYY HH:mm:ss') : '',
                fecha_rechazo: (solicitud.fecha_rechazo) ? moment(solicitud.fecha_rechazo).format('DD/MM/YYYY HH:mm:ss') : '',
                motivo_rechazo: solicitud.motivo_rechazo,
                comentario: solicitud.comentario,
                DocumentosSolicitudRequisito: solicitud['DocumentosSolicitudRequisito'],
                Servicio: solicitud['Servicio'],
                Area: solicitud['Area'],
                Estatus: solicitud['Estatus'],
                Contribuyente: solicitud['Contribuyente'],
                LicenciaFuncionamiento: solicitud['LicenciaFuncionamiento'],
                Clave: solicitud['Clave']


            }
            solicitudesData.push(data);
        }

        return res.status(200).json({
            ok: true,
            solicitudes: solicitudesData
        })
    }

    public async showByStatus(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        const errors = [];

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const estatus: any = req.params.status == null || validator.isEmpty(req.params.status + '') ?
            errors.push({ message: 'Favor de proporcionar el estatus' }) : req.params.status

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findSolicitudesByContribuyente = await SolicitudController.solicitudQueries.findSolicitudesByContribuyenteByEstatus({
            contribuyente_id,
            estatus
        })

        if (!findSolicitudesByContribuyente.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        return res.status(200).json({
            ok: true,
            solicitudes: findSolicitudesByContribuyente.solicitudes
        })
    }

    public async findOne(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        const errors = [];

        const solicitudId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : req.params.id

        const findSolicitudesByContribuyente = await SolicitudController.solicitudQueries.findSolicitudDetail({
            solicitud_id: solicitudId
        })

        if (!findSolicitudesByContribuyente.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        // @ts-ignore
        const serviceId = findSolicitudesByContribuyente.solicitud.Servicio.id;

        const findRequisitosByServicio = await SolicitudController.requisitosServiciosQueries.findRequisitosByServicio({
            servicio_id: serviceId,
            solicitud_id: solicitudId
        });

        if (!findRequisitosByServicio.ok) {
            errors.push({message: 'Existen problemas al momento de buscar información del servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            solicitud: findSolicitudesByContribuyente.solicitud,
            requisitos: findRequisitosByServicio.requisitos
        })
    }

    public async findOneAdmin(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        const errors = [];

        const solicitudId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : req.params.id

        const finSolicitudDetalle = await SolicitudController.solicitudQueries.findSolicitudDetail({
            solicitud_id: solicitudId
        })

        if (!finSolicitudDetalle.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        // @ts-ignore
        const serviceId = finSolicitudDetalle.solicitud.Servicio.id;

        const findRequisitosByServicio = await SolicitudController.requisitosServiciosQueries.findRequisitosByServicio({
            servicio_id: serviceId,
            solicitud_id: solicitudId
        });

        if (!findRequisitosByServicio.ok) {
            errors.push({message: 'Existen problemas al momento de buscar información del servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*let solicitudes: any[];
        solicitudes = [];

        findSolicitudesByContribuyente.solicitudes.forEach(solicitud => {
            const data = {
                id: solicitud.id,
                comentario: solicitud.comentario,
                referencia: solicitud.referencia,
                servicio: solicitud.Servicio.nombre,
                fecha_alta: moment(solicitud.fecha_alta).format('YYYY-MM-DD HH:mm:ss'),
                fecha_envio: (solicitud.fecha_envio != null) ? moment(solicitud.fecha_envio).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_recepcion: (solicitud.fecha_recepcion != null) ? moment(solicitud.fecha_recepcion).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_final: (solicitud.fecha_final != null) ? moment(solicitud.fecha_final).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_rechazo: (solicitud.fecha_rechazo != null) ? moment(solicitud.fecha_rechazo).format('YYYY-MM-DD HH:mm:ss') : null,
                estatus: solicitud.Estatus.nombre,
                color: solicitud.Estatus.color,
                documentacion: solicitud.DocumentacionModels,
                mensajes: solicitud.MensajeModels
            }
            solicitudes.push(data)
        })*/

        return res.status(200).json({
            ok: true,
            solicitud: finSolicitudDetalle.solicitud,
            requisitos: findRequisitosByServicio.requisitos
        })
    }

    public async changeStatus(req: Request, res: Response) {
        const body = req.body
        const solicitud = req.body.solicitud

        const errors = [];

        const contribuyenteId: any = (req.body.contribuyente_id) ? req.body.contribuyente_id : null

        const motivoRechazo = body.motivo_rechazo == null || validator.isEmpty(body.motivo_rechazo) ? null : body.motivo_rechazo;

        const comentario = body.comentario == null || validator.isEmpty(body.comentario) ? null : body.comentario

        const estatus: string = body.estatus_solicitud_id == null || validator.isEmpty(body.estatus_solicitud_id + '') ?
            errors.push({message: 'Favor de proporcionar el estatus'}) : body.estatus_solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const findSolicitudById = await SolicitudController.solicitudQueries.findSolicitudDetail({
            solicitud_id: solicitud.id
        })

        if (!findSolicitudById.ok) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findSolicitudById.solicitud === null) {
            errors.push({message: 'La solicitud proporcionada no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (estatus === '3') {
            if (findSolicitudById.solicitud.estatus_solicitud_id !== 2) {
                errors.push({message: 'Esta solicitud no tiene permitido cambiar de estatus'})
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
        }

        if (findSolicitudById.solicitud.servicio_id == 10 && findSolicitudById.solicitud.estatus_solicitud_id == 1 && estatus != '1') {
            let sendDocumentsPAO = await SolicitudController.sendDocumentsPAO({
                solicitud: findSolicitudById.solicitud,
                documentacionRequisitos: findSolicitudById.solicitud['DocumentosSolicitudRequisito'],
                expediente: findSolicitudById.solicitud['ExpedientePao'],
            })

            if(!sendDocumentsPAO.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: sendDocumentsPAO.errors}]
                })
            }

            let saveTokenPao = await SolicitudController.expedientePaoQueries.saveTokenPao({
                url_consulta: process.env.CONSULTAR_RENOVACION_PAO + sendDocumentsPAO.token_solicitud,
                token_solicitud_api: sendDocumentsPAO.token_solicitud,
                id: sendDocumentsPAO.expediente_id
            })

            if (!saveTokenPao.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: "Existen problemas para actualizar el expediente. Por favor intente más tarde."}]
                })
            }
        }

        const changeStatus = await SolicitudController.solicitudQueries.changeStatus({
            id: findSolicitudById.solicitud.id,
            estatus_solicitud_id: estatus,
            fecha_envio: (estatus === "2") ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_envio,
            fecha_recepcion: (estatus === '3' || estatus === '12') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_recepcion,
            fecha_final: (estatus === '18') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_final,
            fecha_rechazo: (estatus === '7') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_rechazo,
            motivo_rechazo: (estatus === '7') ? motivoRechazo : null,
            comentario: (comentario) ? comentario : findSolicitudById.solicitud.comentario
        })

        if (!changeStatus.ok) {
            errors.push({message: 'Existen problemas al momento de actualizar el estatus.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        if (estatus === '1' || estatus === '2') {
            const createLogContribuyente = await SolicitudController.log.contribuyente({
                contribuyente_id: contribuyenteId,
                navegador: req.headers['user-agent'],
                accion: 'El contribuyente a enviado la solicitud',
                ip: req.socket.remoteAddress,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })
        } else if (estatus !== '2' && contribuyenteId == null) {
            const createLogAdministrador = await SolicitudController.log.administrador({
                administrador_id: req.body.administrador_id || null,
                navegador: req.headers['user-agent'],
                accion: 'El administrador cambio el estatus de la solicitud a ' + estatus,
                ip: req.socket.remoteAddress,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })
        }

        let message: string

        switch (estatus) {
            case '1':
                message = 'La solicitud se ha guardado como borrador'
                break;
            case '2':
                message = 'Se ha enviado la solicitud a revisión'
                break;
            case '3':
                message = 'Se ha recepcionado la información de la solicitud de forma correcta'
                break;
            case '4':
                message = 'Se ha aceptado la solicitud'
                break;
            case '5':
                message = 'Se ha cambiado el estatus de la solicitud a pendiente de documentación'
                break;
            case '6':
                message = 'Se ha enviado la solicitud a la sección de prevención'
                break;
            case '7':
                message = 'Se ha enviado la solicitud a la sección de cancelados'
                break;
            case '8':
                message = 'Se ha enviado la solicitud a la sección de en firma'
                break;
            case '9':
                message = 'Se ha enviado la solicitud a la sección de en ventanilla'
                break;
            case '12':
                message = 'La solicitud esta en revisión de documentos'
                break;
            case '13':
                message = 'La solicitud ha sido eliminada'
                break;
            default:
                message = 'La solicitud ha cambiado de estatus'
                break;
        }

        const createLogSolicitud = await SolicitudController.log.solicitud({
            solicitud_id: solicitud.id,
            estatus_solicitud_id: estatus,
            administrador_id: req.body.administradorId || null,
            contribuyente_id: (contribuyenteId) ? contribuyenteId : null,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: message
        });

        return res.status(200).json({
            ok: true,
            message
        })
    }

    public async addVisitDate(req: Request, res: Response) {
        const body = req.body
        const solicitud = req.body.solicitud

        const errors = [];

        const fecha_visita: string = body.fecha_visita == null || validator.isEmpty(body.fecha_visita + '') ?
           null : body.fecha_visita

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const addVisitDate = await SolicitudController.solicitudQueries.addVisitDate({
            fecha_visita: (fecha_visita) ? moment(fecha_visita).format() : null,
            id: solicitud.id
        })

        if (!addVisitDate.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: "No se puede agregar la fecha de visita en este momento."}]
            });
        }

        const createLogSolicitud = await SolicitudController.log.solicitud({
            solicitud_id: solicitud.id,
            estatus_solicitud_id: 27,
            administrador_id: req.body.administradorId || null,
            contribuyente_id: (req.body.contribuyenteId) ? req.body.contribuyenteId : null,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: 'Se agrego una fecha para visita topográfica en la siguiente fecha ' + moment(fecha_visita).format('DD/MM/YYYY')
        });

        return res.status(200).json({
            ok: true,
            message: 'Se ha agregado la fecha correctamente.'
        })
    }

    public async index(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const estatus: any = req.body.estatus == null || validator.isEmpty(req.body.estatus + '') ?
            errors.push({ message: 'Favor de proporcionar el estatus' }) : req.body.estatus

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findAreasByAdministrador = await SolicitudController.administradorAreaQueries.findAreasByAdministrador({
            administrador_id
        });

        const areas = findAreasByAdministrador.areas || [''];

        if (!findAreasByAdministrador.ok) {
            errors.push({message: 'Existen problemas al momento de buscar las areas por perfil'})
        } else if (areas.length === 0) {
            errors.push({message: 'Actualmente este perfil no cuenta con areas adjuntas'})
        }

        const solicitudesData = []

        for (const value of areas) {
            const findAllSolicitudes = await SolicitudController.solicitudQueries.findAllSolicitudes({
                // @ts-ignore
                area_id: value.areas_id,
                estatus
            })

            if (!findAllSolicitudes.ok) {
                errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
            }


            for (const solicitud of findAllSolicitudes.solicitudes) {

                let data = {
                    id: solicitud.id,
                    folio: solicitud.folio,
                    contribuyente_id: solicitud.contribuyente_id,
                    contribuyente: solicitud['Contribuyente'].nombre + ' ' + solicitud['Contribuyente'].apellidos,
                    area_id: solicitud.area_id,
                    area: solicitud['Area'].nombre,
                    servicio_id: solicitud.servicio_id,
                    servicio: solicitud['Servicio'].nombre,
                    licencia_id: solicitud.licencia_id,
                    licencia: (solicitud['LicenciaFuncionamiento']) ? solicitud['LicenciaFuncionamiento'].licencia_funcionamiento_id : 'N/A',
                    estatus_solicitud_id: solicitud.estatus_solicitud_id,
                    estatus: solicitud['Estatus'].nombre,
                    fecha_alta: (solicitud.fecha_alta) ? moment(solicitud.fecha_alta).format('DD/MM/YYYY HH:mm:ss') : '',
                    fecha_envio: (solicitud.fecha_envio) ? moment(solicitud.fecha_envio).format('DD/MM/YYY HH:mm:ss') : '',
                    fecha_recepcion: (solicitud.fecha_recepcion) ? moment(solicitud.fecha_recepcion).format('DD/MM/YYY HH:mm:ss') : '',
                    fecha_rechazo: (solicitud.fecha_rechazo) ? moment(solicitud.fecha_rechazo).format('DD/MM/YYY HH:mm:ss') : '',
                    motivo_rechazo: solicitud.motivo_rechazo,
                    comentario: solicitud.comentario,
                    DocumentosSolicitudRequisito: solicitud['DocumentosSolicitudRequisito'],
                    Servicio: solicitud['Servicio'],
                    Area: solicitud['Area'],
                    Estatus: solicitud['Estatus'],
                    Contribuyente: solicitud['Contribuyente'],
                    LicenciaFuncionamiento: solicitud['LicenciaFuncionamiento']


                }
                solicitudesData.push(data);
            }
        }


        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            solicitudes: solicitudesData
        })


    }

    public async history(req: Request, res: Response) {
        const errors = [];

        const solicitudId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : req.params.id

        const historialDeSolicitud = await SolicitudController.solicitudQueries.historyRequest({
            solicitud_id: solicitudId
        })

        if (!historialDeSolicitud.ok) {
            errors.push({message: 'Existen problemas al obtener el historial de cambios'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        return res.status(200).json({
            ok: true,
            history: historialDeSolicitud.history
        })
    }

    public async messages(req: Request, res: Response) {
        const errors = [];

        const solicitudId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : req.params.id

        const mensajesDeSolicitud = await SolicitudController.solicitudQueries.messagesRequest({
            solicitud_id: solicitudId
        })

        if (!mensajesDeSolicitud.ok) {
            errors.push({message: 'Existen problemas al obtener el historial de cambios'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        return res.status(200).json({
            ok: true,
            mensajes: mensajesDeSolicitud.mensajes
        })
    }

    public async paseCaja(req: Request, res: Response) {
        /** Obtenemos el id del contribuyente */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitud_id: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id + '') ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) : body.solicitud_id

        const grupo_tramite_id: string = body.grupo_tramite_id == null || validator.isEmpty(body.grupo_tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el grupo del tramite' }) : body.grupo_tramite_id

        const tramite_id: string = body.tramite_id == null || validator.isEmpty(body.tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el tramite' }) : body.tramite_id

        const importe: string = body.importe == null || validator.isEmpty(body.importe + '') ?
            errors.push({ message: 'Favor de proporcionar el importe a pagar' }) : body.importe

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.PASE_CAJA_GEN,
            function: 'daoCreaPaseCajaGenerico',
            args: {
                GrupoTramiteId: grupo_tramite_id,
                TramiteId: tramite_id,
                parDouImporte: importe
            }
        }

        const soap: any = await SolicitudController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoCreaPaseCajaGenericoResult.CodigoError && soap.result[0].daoCreaPaseCajaGenericoResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoCreaPaseCajaGenericoResult.MensajeError }]
            })
        }


        if(!soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el pase a caja, intente más tarde' }]
            })
        }

        const pase_caja = await SolicitudController.paseCajaQueries.store({
            solicitud_id,
            grupo_tramite_id,
            tramite_id,
            urlPaseImpresion: soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion,
            fecha_alta:  moment().format('YYYY-MM-DD HH:mm:ss'),

        })

        if (!pase_caja.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el pase a caja, intente más tarde' }]
            })
        }

        return res.status(200).json({
            ok: true,
            pase_caja: soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion
        })
    }

    public async linkPago(req: Request, res: Response) {
        /** Obtenemos el id del contribuyente */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitud_id: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id + '') ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) : body.solicitud_id

        const grupo_tramite_id: number = body.grupo_tramite_id == null || validator.isEmpty(body.grupo_tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el grupo del tramite' }) : Number(body.grupo_tramite_id)

        const tramite_id: number = body.tramite_id == null || validator.isEmpty(body.tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el tramite' }) : Number(body.tramite_id)

        const importe: number = body.importe == null || validator.isEmpty(body.importe + '') ?
            errors.push({ message: 'Favor de proporcionar el importe a pagar' }) : Number(body.importe)

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const contribuyente = await SolicitudController.contribuyenteQueries.findContribuyenteById({ id: contribuyente_id})

        if (contribuyente.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de generar link de pago, intente más tarde.' }]
            })
        }
        const referencia = moment().unix().toString() + contribuyente_id

        const data = {
            url: process.env.INTENTO_COBRO_GEN,
            function: 'daoGeneraIntenciondecobro',
            args: {
                parIntGrupoTramiteId: grupo_tramite_id,
                parIntTramiteId: tramite_id,
                parStrReferencia: referencia,
                parDouImporte: importe,
                parStrTokenValidate: 'token',
                parStrRFC: contribuyente.contribuyente.rfc,
                parStrNombreContrib: contribuyente.contribuyente.nombre + ' ' + contribuyente.contribuyente.apellidos,
                parStrPadronId: ''
            }
        }

        const soap: any = await SolicitudController.soap.request(data)

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
                message: [{ message: 'Existen problemas para generar el link de pago, intente más tarde.' }]
            })
        }

        const url_intencion_cobro = await SolicitudController.urlIntencionCobroQueries.store({
            solicitud_id,
            grupo_tramite_id,
            tramite_id,
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

    public async downloadDocumentsZip(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        const errors = [];

        const solicitudId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : req.params.id

        const finSolicitudDetalle = await SolicitudController.solicitudQueries.findSolicitudDetail({
            solicitud_id: solicitudId
        })

        if (!finSolicitudDetalle.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        // @ts-ignore
        const serviceId = finSolicitudDetalle.solicitud.Servicio.id;

        const findRequisitosByServicio = await SolicitudController.requisitosServiciosQueries.findRequisitosByServicio({
            servicio_id: serviceId,
            solicitud_id: solicitudId
        });

        if (!findRequisitosByServicio.ok) {
            errors.push({message: 'Existen problemas al momento de buscar información del servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        try {
            // @ts-ignore
            const documentation = (finSolicitudDetalle.solicitud.DocumentosSolicitudRequisito) ? finSolicitudDetalle.solicitud.DocumentosSolicitudRequisito : null;
            const zip = new AdmZip();

            if(documentation) {
                for (const documento of documentation) {
                        const path = process.env.DOCUMENTATION_PATH + documento.Documentacion.url
                    zip.addLocalFile(path);
                }
                const outputFile =  'Documentos' + '_' + finSolicitudDetalle.solicitud.folio + '.zip'

                fs.writeFileSync(outputFile, zip.toBuffer());

                return res.download(outputFile, (err) => {
                    if(err) {
                        return res.status(500).json({
                            ok: false,
                            message: [{ message: 'No es posible generar zip en estos momentos.' }]
                        })
                    }
                    fs.unlinkSync(outputFile)
                });

            } else {
                return res.status(400).json({
                    ok: false,
                    message: [{ message: 'La solicitud no tiene documentación para generar archivo.' }]
                })
            }

        } catch (e) {
            console.log(e)
            return res.status(400).json({
                ok: false,
                message: [{ message: 'No es posible generar zip en estos momentos.' }]
            })
        }




    }

    public async getBadgesByEstatusSolicitud(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        const errors = [];
        const getCountSolicitudesByStatus = await SolicitudController.solicitudQueries.solicitudesCount()

        if (!getCountSolicitudesByStatus.ok) {
            errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            badges: getCountSolicitudesByStatus.count,
            message: 'Solicitudes por status'
        })
    }

    public async addReceiptPayment(req: Request, res: Response) {
        const body = req.body
        const solicitud = req.body.solicitud

        const errors = [];

        const addReciboPago = await SolicitudController.solicitudQueries.addReciboPago({
            id: solicitud.id
        })

        if (!addReciboPago.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: "No se puede actualizar la solicitud en estos momentos"}]
            });
        }

        const createLogSolicitud = await SolicitudController.log.solicitud({
            solicitud_id: solicitud.id,
            estatus_solicitud_id: 20,
            administrador_id: req.body.administradorId || null,
            contribuyente_id: (req.body.contribuyenteId) ? req.body.contribuyenteId : null,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: 'Se agrego un recibo de pago a la solicitud'
        });

        return res.status(200).json({
            ok: true,
            message: 'Se ha indicado que la solicitud tiene recibo de pago correctamente.'
        })
    }

    public async changeStatusApi(req: Request, res: Response) {

        const errors = [];

        let token_solicitud: number = req.params.token_solicitud == null || (!req.params.token_solicitud)
        || !Number.isInteger(+req.params.token_solicitud) ?
            errors.push({ message: 'Favor de proporcionar el token de la solicitud.' }) :
            +req.params.token_solicitud

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const findExpedienteByToken = await SolicitudController.expedientePaoQueries.findExpedienteByToken({
            token_solicitud_api: token_solicitud
        })

        if (!findExpedienteByToken.ok) {
            errors.push({message: 'Existen problemas al momento de obtener el expediente.'})
        } else if (findExpedienteByToken.expedientePao === null) {
            errors.push({message: 'Expediente el expediente no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }



        let findSolicitudById = await SolicitudController.solicitudQueries.findSolicitudByExpedienteId({
            expediente_id: findExpedienteByToken.expedientePao.id
        })

        if(!findSolicitudById.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'La solicitud con el token proporcionado no existe.'}]
            })
        }

        const changeStatus = await SolicitudController.solicitudQueries.changeStatus({
            estatus_solicitud_id: 10,
            id: findSolicitudById.solicitud.id,
        })

        if (!changeStatus.ok) {
            errors.push({message: 'Existen problemas al momento de actualizar el estatus.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        const createLogAdministrador = await SolicitudController.log.administrador({
            administrador_id: req.body.administrador_id || null,
            navegador: req.headers['user-agent'],
            accion: 'La API cambio el estatus de la solicitud a ' + '10',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })


        const createLogSolicitud = await SolicitudController.log.solicitud({
            solicitud_id: findSolicitudById.solicitud.id,
            estatus_solicitud_id: 10,
            administrador_id: req.body.administradorId || null,
            contribuyente_id: null,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: 'La solicitud fue cambiada a pendiente de pago.'
        });

        return res.status(200).json({
            ok: true,
            message: 'La solicitud se ha cambiado de estatus correctamente.'
        })
    }

    private static async sendDocumentsPAO(data) {
        let solicitud = data.solicitud;
        let documentos = data.documentacionRequisitos;
        let expediente = data.expediente;

        try {
            let requisitosApi = []
            for (const documento of documentos) {
                const getFile64 = await SolicitudController.file.getFileBase64(documento['Documentacion'].url, 'documentacion');

                console.log({
                    file: documento['Documentacion'].url,
                    requisitoId: documento['Requisito'].id,
                    idrequisito: documento['Requisito'].requisito_id_api

                })

                if (!getFile64.ok) {
                    return {
                        ok: false,
                        errors: ["Hubo problemas al momento de procesar archivos."]
                    }
                }

                let data = {
                    idrequisito: String(documento['Requisito'].requisito_id_api),
                    archivo: 'data:application/pdf;base64,'+ getFile64.file

                }

                requisitosApi.push(data)

            }

            let dataJson = {
                requisitos: requisitosApi,
                establecimiento: {
                    claveCatastral: expediente.clave_catastral,
                    telefono: expediente.telefono_contacto,
                    correo: expediente.correo,
                    nombreGestor: expediente.nombre_gestor,
                    representanteLegal: expediente.representante_legal,
                    idExpediente: Number(expediente.expediente_pao_id)

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
                method: 'POST',
                url: process.env.SOLICITAR_RENOVACION_PAO,
                headers: headers,
                httpsAgent: agent,
                data: dataJson
            }

            /** Wait a response to Axios and validate the response */
            let response = await SolicitudController.axios.getResponse(options)

            if (response.ok == true) {
                if (response.result.respuesta === 'error-archivos-requisitos') {
                    return {
                        ok: false,
                        errors: [ "Alguno de los archivos se encuentra dañado, favor de verificarlos."]
                    }
                }

                if (response.result.respuesta === 'error-datos') {
                    return {
                        ok: false,
                        errors: [ "Existen errores en los datos del expediente."]
                    }
                }

                if (response.result.respuesta === 'registrado') {
                    return {
                        ok: true,
                        token_solicitud: response.result['token-solicitud'],
                        expediente_id: expediente.id
                    }

                }
            } else {
                return {
                    ok: false,
                    errors: ['Existen problemas para realizar la conectarse al servicio.']
                }
            }


        } catch (e) {
            console.log(e)
            return {
                ok: false,
                errors: ['Existen problemas para procesar la información.']
            }
        }




    }

}
