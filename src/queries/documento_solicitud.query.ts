import {Op} from 'sequelize'
import {DocumentosSolicitudModel} from '../models/documentos_solicitud.model';

export class DocumentoSolicitudQueries {
    public async findDocumentoBySolicitud(data: any) {
        try {
            const documento = await DocumentosSolicitudModel.findOne({
                where: {
                    solicitud_id: data.solicitud_id
                }
            })
            return {ok: true, documento}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const document = await DocumentosSolicitudModel.create({
                solicitud_id: data.solicitud_id,
                administradores_id: data.administradores_id,
                url: data.url,
                fecha_alta: data.fecha_alta,
                status: 1
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async attachFile(data: any) {
        try {
            const document = await DocumentosSolicitudModel.update(
                {
                    url: data.url,
                    administradores_id: data.administradores_id,
                    fecha_alta: data.fecha_alta,
                },
                {where: {id: data.id}}
            )
            return {ok: true, document }
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
