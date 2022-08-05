import {Op} from 'sequelize'
import {DocumentacionServicioModel} from '../models/documentos_servicio.model';

export class DocumentoServicioQueries {
    public async findDocumentoByServicio(data: any) {
        try {
            const documento = await DocumentacionServicioModel.findOne({
                where: {
                    servicio_id: data.servicio_id
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
            const document = await DocumentacionServicioModel.create({
                servicio_id: data.servicio_id,
                administradores_id: data.administradores_id,
                url: data.url,
                fecha_alta: data.fecha_alta,
                descripcion: data.descripcion,
                activo: 1
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async attachFile(data: any) {
        try {
            const documentacion = await DocumentacionServicioModel.update(
                {
                    url: data.url,
                    administradores_id: data.administradores_id,
                    fecha_alta: data.fecha_alta,
                    descripcion: data.descripcion
                },
                {where: {id: data.id}}
            )
            return {ok: true, documentacion}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
