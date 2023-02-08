import sequelize, { Op } from 'sequelize'
import { MensajeModel } from '../models/mensaje.model'
import {SolicitudModel} from "../models/solicitud.model";

export class MensajeQueries {

    public async findMensajeById(data: any) {
        try {
            const mensaje = await MensajeModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, mensaje }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findSolicitudesAndUnreadMessages() {
        try {
            const mensajes = await MensajeModel.findAll({
                attributes: ['MensajeModel.*', [sequelize.fn('COUNT', 'SolicitudModel.id'), 'UnreadMessages']],
                where: {
                    leido: 0
                },
                include: [SolicitudModel]
            })
            return { ok: true, mensajes }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async create(data: any) {
        try {
            const mensaje = await MensajeModel.create({
                solicitud_id: data.solicitud_id,
                administrador_id: data.administrador_id,
                mensaje: data.mensaje,
                url: data.url,
                fecha_alta: data.fecha_alta
            })
            return { ok: true, mensaje }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

}
