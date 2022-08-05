import {BitacoraAdministradorModel} from '../models/bitacora_administrador.model'
import {BitacoraContribuyenteModel} from '../models/bitacora_contribuyente.model'
import {BitacoraSolicitudModel} from '../models/bitacora_solicitud.model'

export class Log {
    public async administrador(data: any) {
        try {
            const log = await BitacoraAdministradorModel.create({
                administrador_id: data.administrador_id,
                navegador: data.navegador,
                ip: data.ip,
                accion: data.accion,
                fecha_alta: data.fecha_alta
            })
            return {ok: true, log}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async contribuyente(data: any) {
        try {
            const log = await BitacoraContribuyenteModel.create({
                contribuyente_id: data.contribuyente_id,
                navegador: data.navegador,
                ip: data.ip,
                accion: data.accion,
                fecha_alta: data.fecha_alta
            })
            return {ok: true, log}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async solicitud(data: any) {
        try {
            const log = await BitacoraSolicitudModel.create({
                solicitud_id: data.solicitud_id,
                fecha_alta: data.fecha_alta,
                administradores_id: data.administradores_id,
                estatus_solicitud_id: data.estatus_solicitud_id,
                comentario: data.comentario
            })
            return {ok: true, log}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
