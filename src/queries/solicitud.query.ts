import {Op} from 'sequelize'
import {SolicitudModel} from '../models/solicitud.model'
import {DocumentacionModel} from '../models/documentacion.model'
import {ServicioModel} from '../models/servicio.model'
import {RequisitoModel} from '../models/requisito.model'
import {EstatusSolicitudModel} from '../models/estatus_solicitud.model'
import {EstatusServicioModel} from '../models/estatus_servicio.model'
import {ContribuyenteModel} from '../models/contribuyente.model'
import {MensajeModel} from '../models/mensaje.model'
import {BitacoraSolicitudModel} from '../models/bitacora_solicitud.model'
import {DocumentosSolicitudModel} from "../models/documentos_solicitud.model";
import moment from "moment";

export class SolicitudQueries {
    public async findSolicitudesByContribuyente(data: any) {
        try {
            const solicitudes = await SolicitudModel.findAll({
                order: [
                    ['fecha_alta', 'ASC']
                ],
                where: {
                    contribuyente_id: data.contribuyente_id
                },
                include: [
                    {
                        model: DocumentosSolicitudModel, as: 'DocumentosSolicitud',
                        include: [
                            {model: DocumentacionModel, as: 'Documentacion'}
                        ]
                    },
                    {model: MensajeModel},
                    {model: ServicioModel, as: 'Servicio'},
                    {model: EstatusSolicitudModel, as: 'Estatus'},
                ]
            })
            return {ok: true, solicitudes}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findAllSolicitudes(data: any) {
        try {
            const solicitudes = await SolicitudModel.findAll({
                order: [
                    ['fecha_alta', 'ASC']
                ],
                where: {
                    area_id: data.area_id,
                    estatus_solicitud_id: {
                        [Op.gte]: 2
                    }

                },
                include: [
                    {model: ServicioModel, as: 'Servicio'},
                    {model: EstatusSolicitudModel, as: 'Estatus'},
                ]
                /*include: [
                    { model: MensajeModel },
                    { model: ServicioModel, as: 'Servicio' },
                    { model: ContribuyenteModel, as: 'Contribuyente' },
                    { model: EstatusSolicitudModel, as: 'Estatus' },
                ]*/
            })
            return {ok: true, solicitudes}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findSolicitudById(data: any) {
        try {
            const solicitud = await SolicitudModel.findOne({
                where: {
                    id: data.id
                }
            })
            return {ok: true, solicitud}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findSolicitudDetail(data: any) {
        try {
            const solicitud = await SolicitudModel.findOne({
                where: {
                    id: data.solicitud_id
                },
                include: [
                    {model: ServicioModel, as: 'Servicio'},
                    {
                        model: DocumentosSolicitudModel, as: 'DocumentosSolicitud',
                        include: [
                            {model: DocumentacionModel, as: 'Documentacion'}
                        ]
                    },
                    {model: MensajeModel},
                    {model: ContribuyenteModel, as: 'Contribuyente'}
                ]
            })
            return {ok: true, solicitud}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const solicitud = await SolicitudModel.create({
                contribuyente_id: data.contribuyente_id,
                area_id: data.area_id,
                servicio_id: data.servicio_id,
                fecha_alta: data.fecha_alta,
                folio: data.folio,
                estatus_solicitud_id: 1
            })
            return {ok: true, solicitud}
        } catch (e) {
            return {ok: false}
        }
    }

    public async changeStatus(data: any) {

        let toUpdate = {}
        if (data.estatus_solicitud_id === '2') {
            toUpdate = {
                estatus_solicitud_id: data.estatus_solicitud_id,
                fecha_envio: data.fecha_envio,
                comentario: data.comentario
            }
        }

        if (data.estatus_solicitud_id === '3' || data.estatus_solicitud_id === '12') {
            toUpdate = {
                estatus_solicitud_id: data.estatus_solicitud_id,
                fecha_recepcion: data.fecha_recepcion
            }
        }

        if (data.estatus_solicitud_id === '4') {
            toUpdate = {
                estatus_solicitud_id: data.estatus_solicitud_id
            }
        }

        if (data.estatus_solicitud_id === '5' || data.estatus_solicitud_id === '6' || data.estatus_solicitud_id === '7') {
            toUpdate = {
                estatus_solicitud_id: data.estatus_solicitud_id,
                fecha_rechazo: data.fecha_rechazo,
                motivo_rechazo: data.motivo_rechazo
            }
        }

        if (data.estatus_solicitud_id === '8' || data.estatus_solicitud_id === '9' || data.estatus_solicitud_id === '10' || data.estatus_solicitud_id === '11') {
            toUpdate = {
                estatus_solicitud_id: data.estatus_solicitud_id,
                fecha_rechazo: null,
                motivo_rechazo: null
            }
        }

        /*const toUpdate = {
            id: data.id,
            estatus_solicitud_id: data.estatus_solicitud_id,
            fecha_envio: data.fecha_envio,
            fecha_recepcion: data.fecha_recepcion,
            fecha_final: data.fecha_final,
            fecha_rechazo: data.fecha_rechazo,
            motivo_rechazo: data.motivo_rechazo,
            comentario: data.comentario
        }*/
        try {
            const solicitud = await SolicitudModel.update(toUpdate, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, solicitud}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async simulatePayment(data: any) {
        try {
            const solicitud = await SolicitudModel.update({
                estatus_solicitud_id: 11
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, solicitud}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async addComentario(data: any) {
        try {
            const solicitud = await SolicitudModel.update({
                comentario: data.comentario
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, solicitud}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async destroy(data: any) {
        try {
            const logs = await SolicitudModel.destroy(
                {
                    where: {
                        id: data.id
                    }
                }
            )
            return {ok: true, logs}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async destroyLogs(data: any) {
        try {
            const logs = await BitacoraSolicitudModel.destroy(
                {
                    where: {
                        solicitud_id: data.solicitud_id
                    }
                }
            )
            return {ok: true, logs}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async historyRequest(data: any) {
        try {
            const history = await BitacoraSolicitudModel.findAll(
                {
                    order: [['fecha_alta', 'DESC']],
                    where: {
                        solicitud_id: data.solicitud_id
                    },
                    include: [
                        { model: EstatusSolicitudModel, as: 'Estatus'}
                    ]
                }
            )
            return {ok: true, history}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async messagesRequest(data: any) {
        try {
            const mensajes = await MensajeModel.findAll(
                {
                    order: [['fecha_alta', 'DESC']],
                    where: {
                        solicitud_id: data.solicitud_id
                    }
                }
            )
            return {ok: true, mensajes}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
