import * as validator from 'validator';
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
    static log: Log = new Log()
    static file: File = new File()
    static soap: Soap = new Soap()

    /** Función que permite dar de alta a un administrador */
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
            folio: moment().unix(),
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
            ip: req.connection.remoteAddress,
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

        /* let solicitudes: any[];
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
            solicitudes: findSolicitudesByContribuyente.solicitudes
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

        const errors = [];

        const contribuyenteId: any = (req.body.contribuyente_id) ? req.body.contribuyente_id : null

        const solicitudId: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id + '') ?
            errors.push({message: 'Favor de proporcionar la solicitud al cual se le cambiara el estatus'}) : body.solicitud_id

        const motivoRechazo = body.motivo_rechazo == null ? null : body.motivo_rechazo;

        const comentario = body.comentario == null ? null : body.comentario

        const estatus: string = body.estatus_solicitud_id == null || validator.isEmpty(body.estatus_solicitud_id + '') ?
            errors.push({message: 'Favor de proporcionar el estatus'}) : body.estatus_solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const findSolicitudById = await SolicitudController.solicitudQueries.findSolicitudById({
            id: solicitudId
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

        // Se valida que el estatus que se esta proporcionando sea valido
        // if (estatus !== "1" && estatus !== "2" && estatus !== "3" && estatus !== "4" && estatus !== "5" && estatus !== "6"
        //     && estatus !== "7" && estatus !== "8" && estatus !== "9" && estatus !== "10" && estatus !== "11"
        //     && estatus !== "12" && estatus !== "13") {
        //     errors.push({message: 'El estatus proporcionado no es valido'})
        // }

        /*if (estatus !== '2' && contribuyenteId !== null) {
            errors.push({ message: 'Usted no tiene permisos para usar este estatus' })
        }

        if (estatus === '2' && contribuyenteId !== null) {
            errors.push({ message: 'Usted no tiene permisos para usar este estatus' })
        }*/

        /*if (estatus === '5' && motivoRechazo == null ||
            estatus === '6' && motivoRechazo == null ||
            estatus === '7' && motivoRechazo == null) {
            errors.push({ message: 'Es obligatorio el proporcionar el motivo por el cual esta enviando esta solicitud a dicha sección' })
        }
*/
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*if (estatus === '2' || estatus === '4' || estatus === '5') {
            let findDocumentacionBySolicitud = await SolicitudController.documentacionQueries.findDocumentacionBySolicitud({
                solicitud_id
            })

            if (findDocumentacionBySolicitud.ok == false) {
                errors.push({ message: 'Existen problemas al momento de extraer la soliictud de la documentacion.' })
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }

            let total_documentation = findDocumentacionBySolicitud.documentacion.length
            let real_documentation: number = 0

            if (estatus == '2') {
                findDocumentacionBySolicitud.documentacion.forEach(function (documentacion) {
                    real_documentation + real_documentation

                    if (documentacion.url != null) {
                        real_documentation = real_documentation + 1
                    }
                })

                if (total_documentation != real_documentation) {
                    errors.push({ message: 'No es posible hacer uso de esta acción, ya que no ha completado los requisitos.' })
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        ok: false,
                        errors
                    })
                }
            }

            if (estatus == '4') {
                findDocumentacionBySolicitud.documentacion.forEach(function (documentacion) {
                    real_documentation + real_documentation

                    if (documentacion.estatus == 1) {
                        real_documentation = real_documentation + 1
                    }
                })

                if (total_documentation != real_documentation) {
                    errors.push({ message: 'No es posible hacer uso de esta acción, ya que no todos los documentos han sido aceptados.' })
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        ok: false,
                        errors
                    })
                }
            }

            if (estatus == '5') {
                findDocumentacionBySolicitud.documentacion.forEach(function (documentacion) {
                    real_documentation + real_documentation

                    if (documentacion.estatus != -1) {
                        console.log(documentacion.id)
                        real_documentation = real_documentation + 1
                    }
                })

                if (total_documentation == real_documentation) {
                    errors.push({ message: 'No es posible hacer uso de esta acción, ya que todos los documentos han sido aceptados.' })
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        ok: false,
                        errors
                    })
                }
            }


            /!* let changeStatusRevision = await SolicitudController.documentacionQueries.changeStatusRevision({
                solicitud_id
            }) *!/

        }*/

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

        const changeStatus = await SolicitudController.solicitudQueries.changeStatus({
            id: findSolicitudById.solicitud.id,
            estatus_solicitud_id: estatus,
            fecha_envio: (estatus === '2') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_recepcion,
            fecha_recepcion: (estatus === '3' || estatus === '12') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_recepcion,
            fecha_final: (estatus === '18') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_final,
            fecha_rechazo: (estatus === '5' || estatus === '6' || estatus === '7') ? moment().format('YYYY-MM-DD HH:mm:ss') : findSolicitudById.solicitud.fecha_rechazo,
            motivo_rechazo: (estatus === '5' || estatus === '6' || estatus === '7') ? motivoRechazo : null,
            comentario: comentario ? comentario : null
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
                ip: req.connection.remoteAddress,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })
        } else if (estatus !== '2' && contribuyenteId == null) {
            const createLogAdministrador = await SolicitudController.log.administrador({
                administrador_id: req.body.administrador_id || null,
                navegador: req.headers['user-agent'],
                accion: 'El administrador cambio el estatus de la solicitud a ' + estatus,
                ip: req.connection.remoteAddress,
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
            solicitud_id: solicitudId,
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

        const totalSolicitudes: any = []
        const solicitudes: any = []
        for (const value of areas) {
            const findAllSolicitudes = await SolicitudController.solicitudQueries.findAllSolicitudes({
                // @ts-ignore
                area_id: value.areas_id,
                estatus
            })

            // tslint:disable-next-line:no-shadowed-variable
            const solicitudes = findAllSolicitudes.solicitudes || [''];

            if (!findAllSolicitudes.ok) {
                errors.push({message: 'Existen problemas al momento de obtener sus solicitudes.'})
            }

            totalSolicitudes.push(...solicitudes)
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*totalSolicitudes.forEach((solicitud: any) => {
            const data = {
                // Solicitud
                id: solicitud.id,
                folio: solicitud.folio,
                comentario: solicitud.comentario,
                referencia: solicitud.referencia,
                fecha_alta: moment(solicitud.fecha_alta).format('YYYY-MM-DD HH:mm:ss'),
                fecha_envio: (solicitud.fecha_envio != null) ? moment(solicitud.fecha_envio).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_recepcion: (solicitud.fecha_recepcion != null) ? moment(solicitud.fecha_recepcion).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_final: (solicitud.fecha_final != null) ? moment(solicitud.fecha_final).format('YYYY-MM-DD HH:mm:ss') : null,
                fecha_rechazo: (solicitud.fecha_rechazo != null) ? moment(solicitud.fecha_rechazo).format('YYYY-MM-DD HH:mm:ss') : null,
                motivo_rechazo: solicitud.motivo_rechazo,
                // Servicio
                servicio: solicitud.Servicio.nombre,
                // Estatus del servicio
                estatus_del_servicio: solicitud.Servicio.EstatusServicioModels,
                // Contribuyente
                contribuyente: {
                    nombre: solicitud.Contribuyente.nombre,
                    apellido: solicitud.Contribuyente.apellido,
                    email: solicitud.Contribuyente.email,
                    telefono: solicitud.Contribuyente.telefono,
                    telefono_referencia: solicitud.Contribuyente.telefono_referencia,
                },
                estatus: solicitud.Estatus.nombre,
                color: solicitud.Estatus.color,
                documentacion: solicitud.DocumentacionModels,
                mensajes: solicitud.MensajeModels,
            }
            solicitudes.push(data)
        })*/

        return res.status(200).json({
            ok: true,
            solicitudes: totalSolicitudes
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

    public async pasecaja(req: Request, res: Response) {
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

    public async linkpago(req: Request, res: Response) {
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

    public async respuestaIntentoPago(req: Request, res: Response) {
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const paymentResponse = body.paymentResponse;

        const referencia: any = req.params.referencia == null || validator.isEmpty(req.params.referencia + '') ?
            errors.push({ message: 'Favor de proporcionar la referencia' }) : req.params.referencia

        const findUrlIntentoCobro = await SolicitudController.urlIntencionCobroQueries.findByReference({
            folio_intencion_cobro: referencia
        })

        if (!findUrlIntentoCobro.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para encontrar el intento de pago' }]
            })
        } else if (findUrlIntentoCobro.urlIntencionCobro == null) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'No se encontró ningún intento de pago relacionado a la referencia proporcionada.' }]
            })
        }

        const processPaymentResponse = await SolicitudController.urlIntencionCobroQueries.update({
            status: (body.ok === false) ? -1 : 1,
            codigo_error: body.codigo,
            mensaje_error: body.menaje
        }, findUrlIntentoCobro.urlIntencionCobro.id)

        if (!processPaymentResponse.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para actualizar el intento de cobro' }]
            })
        }

        if (body.ok) {
            const updateSolicitud = await SolicitudController.solicitudQueries.changeStatus({
                estatus_solicitud_id: 11
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Se ha actualizado el estatus del intento de cobro'
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

    /*

    public async delete(req: Request, res: Response) {
        /!** Obtenemos toda la información que nos envia el cliente *!/
        const body = req.body
        /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
        const errors = []

        const contribuyente_id = req.body.contribuyente_id

        const solicitud_id = req.params.solicitud_id == null ? null : validator.isEmpty(req.params.solicitud_id) ?
            errors.push({message: 'Favor de proporcionar la solicitud a eliminar'}) :
            req.params.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findSolicitudById = await SolicitudController.solicitudQueries.findSolicitudById({
            id: solicitud_id
        })

        if (findSolicitudById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findSolicitudById.solicitud == null) {
            errors.push({message: 'La solicitud proporcionada no existe.'})
        } else if (findSolicitudById.solicitud.contribuyente_id != contribuyente_id) {
            errors.push({message: 'La solicitud no le pertenece, será investigado y pasado con las autoridades.'})
        } else if (findSolicitudById.solicitud.estatus_solicitud_id != 1) {
            errors.push({message: 'No es posible realizar esta acción con la soliictud proporcionada'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findDocumentacionBySolicitud = await SolicitudController.documentacionQueries.findDocumentacionBySolicitud({
            solicitud_id
        })

        if (findDocumentacionBySolicitud.ok == false) {
            errors.push({message: 'Existen problemas al momento de extraer la soliictud de la documentacion.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        findDocumentacionBySolicitud.documentacion.forEach(async function (documentacion) {
            if (documentacion.url != null) {
                const upload_file = await SolicitudController.file.destroy(documentacion.url, 'documentacion')
            }

            const destroyDocumentacion = await SolicitudController.documentacionQueries.destroy({
                id: documentacion.id
            })
        })

        const destroyLogs = await SolicitudController.solicitudQueries.destroyLogs({
            solicitud_id
        })

        const destroySolicitud = await SolicitudController.solicitudQueries.destroy({
            id: solicitud_id
        })

        if (destroySolicitud.ok == false) {
            errors.push({message: 'Existen problemas al momento de eliminar su solicitud.'})
        }

        const createLogContribuyente = await SolicitudController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a eliminado la solicitud con el index: ' + solicitud_id,
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado la solicitud de forma exitosa'
        })

    }





    public async attachComment(req: Request, res: Response) {
        /!* Get info from validateJWT middleware *!/
        const contribuyente_id: number = req.body.contribuyente_id
        /!** Obtenemos toda la información que nos envia el cliente *!/
        const body = req.body
        /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
        const errors = []

        const solicitud_id: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) == true ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : body.solicitud_id

        const comentario: string = body.comentario == null || validator.isEmpty(body.comentario) == true ?
            null : body.comentario

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findSolicitudById = await SolicitudController.solicitudQueries.findSolicitudById({
            id: solicitud_id
        })

        if (findSolicitudById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findSolicitudById.solicitud == null) {
            errors.push({message: 'La solicitud proporcionada no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const addComentario = await SolicitudController.solicitudQueries.addComentario({
            id: solicitud_id,
            comentario
        })

        if (addComentario.ok == false) {
            errors.push({message: 'Existen problemas al momento de adjuntar su comentario.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /!** Creamos el log del usuario *!/
        const createLogContribuyente = await SolicitudController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente adjunto un comentario a la solicitud con el index: ' + solicitud_id,
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha adjuntado el comentario de forma exitosa'
        })
    }

    public async pay(req: Request, res: Response) {
        /!* Get info from validateJWT middleware *!/
        const contribuyente_id: number = req.body.contribuyente_id
        /!** Obtenemos toda la información que nos envia el cliente *!/
        const body = req.body
        /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
        const errors = []

        const solicitud_id: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) == true ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : body.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findContribuyenteById = await SolicitudController.contribuyenteQueries.findContribuyenteById({
            id: contribuyente_id
        })

        if (findContribuyenteById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findContribuyenteById.contribuyente == null) {
            errors.push({message: 'El contribuyente proporcionado no existe no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioById = await SolicitudController.servicioQueries.findServicioById({
            id: contribuyente_id
        })

        if (findServicioById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findServicioById.servicio == null) {
            errors.push({message: 'El servicio proporcionado no existe no existe.'})
        }

        const createTransaccion = await SolicitudController.transaccionQueries.create({
            solicitud_id,
            folio: moment().unix(),
            importe: 1,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        if (createTransaccion.ok == false) {
            errors.push({message: 'Existen problemas al momento de adjuntar su comentario.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: 'https://tesoreria.gobiernodesolidaridad.gob.mx/wsSIGEM/coatl/IServiceUrlIntenciondePagoGen.svc?singleWsdl',
            function: 'daoGeneraIntenciondecobro',
            args: {
                parIntGrupoTramiteId: 68,
                parIntTramiteId: 12,
                parStrReferencia: createTransaccion.transaccion.folio.toString(),
                parDouImporte: createTransaccion.transaccion.importe,
                parStrTokenValidate: "WSWSWSWSWSSWWSWS",
                parStrRFC: "GOCO960827NYA",
                parStrNombreContrib: findContribuyenteById.contribuyente.nombre,
                parStrPadronId: "3232323232"
            }
        }

        const soap = await SolicitudController.soap.request(data)

        if (soap.ok == false) {
            return res.status(400).json({
                ok: false,
                errors: [{message: soap.message}]
            })
        }

        if (typeof (soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro) == 'undefined') {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'No es posible generar el pase a caja, favor de pasar a tesorería'}]
            })
        }

        return res.status(200).json({
            ok: true,
            link: soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro,
        })
    }

    public async paseCaja(req: Request, res: Response) {
        /!* Get info from validateJWT middleware *!/
        const contribuyente_id: number = req.body.contribuyente_id
        /!** Obtenemos toda la información que nos envia el cliente *!/
        const body = req.body
        /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
        const errors = []

        const solicitud_id: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) == true ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : body.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findContribuyenteById = await SolicitudController.contribuyenteQueries.findContribuyenteById({
            id: contribuyente_id
        })

        if (findContribuyenteById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findContribuyenteById.contribuyente == null) {
            errors.push({message: 'El contribuyente proporcionado no existe no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioById = await SolicitudController.servicioQueries.findServicioById({
            id: contribuyente_id
        })

        if (findServicioById.ok == false) {
            errors.push({message: 'Existen problemas al momento de obtener la solicitud proporcionada.'})
        } else if (findServicioById.servicio == null) {
            errors.push({message: 'El servicio proporcionado no existe no existe.'})
        }

        const createTransaccion = await SolicitudController.transaccionQueries.create({
            solicitud_id,
            folio: moment().unix(),
            importe: 1,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        if (createTransaccion.ok == false) {
            errors.push({message: 'Existen problemas al momento de adjuntar su comentario.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: 'https://tesoreria.gobiernodesolidaridad.gob.mx/wsSIGEM/catastro/IServiceCreaPaseCajaGenerico.svc?singleWsdl',
            function: 'daoCreaPaseCajaGenerico',
            args: {
                GrupoTramiteId: 68,
                TramiteId: 12,
                parDouImporte: 1,
                observaciones: "",
                id: ""
            }
        }

        const soap = await SolicitudController.soap.request(data)

        if (soap.ok == false) {
            return res.status(400).json({
                ok: false,
                errors: [{message: soap.message}]
            })
        }

        if (typeof (soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion) == 'undefined') {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'No es posible generar el pase a caja, favor de pasar a tesorería'}]
            })
        }

        return res.status(200).json({
            ok: true,
            link: soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion,
        })
    }
*/
}
