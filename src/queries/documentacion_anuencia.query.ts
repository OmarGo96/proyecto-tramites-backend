import {Op} from 'sequelize'
import {DocumentacionAnuenciaModel} from '../models/documentacion_anuencia.model';
import {DocumentacionPagoModel} from "../models/documentacion_pago.model";

export class DocumentacionAnuenciaQueries {

    public async create(data: any) {
        try {
            const documentAnuencia = await DocumentacionAnuenciaModel.create({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_anuencia: data.documento_anuencia,
                status: data.status,
                fecha_alta: data.fecha_alta,
            })
            return {ok: true, documentAnuencia}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const documentacionAnuencia = await DocumentacionAnuenciaModel.update({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_anuencia: data.documento_anuencia,
                status: data.status,
                fecha_alta: data.fecha_alta,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, documentacionAnuencia}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findDocumentacionAnuenciaById(data: any) {
        try {
            const documentacionAnuencia = await DocumentacionAnuenciaModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, documentacionAnuencia }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        try {
            const documentacionAnuencia = await DocumentacionAnuenciaModel.update(
                {
                    status: data.status,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documentacionAnuencia }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
