import {Op} from 'sequelize'
import {DocumentosSolicitudRequisitoModel} from '../models/documentos_solicitud_requisito.model';
import {DocumentacionModel} from "../models/documentacion.model";

export class DocumentoSolicitudRequisitoQueries {
    public async create(data: any) {
        try {
            const document = await DocumentosSolicitudRequisitoModel.create({
                documentacion_id: data.documentacion_id,
                solicitudes_id: data.solicitudes_id,
                requisito_id: data.requisito_id,
                fecha_alta: data.fecha_alta,
                estatus: data.estatus
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findDocumentacionById(data: any) {
        try {
            const documentacion = await DocumentosSolicitudRequisitoModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        console.log(data);
        try {
            const documentacion = await DocumentosSolicitudRequisitoModel.update(
                {
                    estatus: data.estatus,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
