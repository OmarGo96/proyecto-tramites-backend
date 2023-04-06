import {Op} from 'sequelize'
import {DocumentacionPagoModel} from '../models/documentacion_pago.model';
import {DocumentacionModel} from "../models/documentacion.model";

export class DocumentacionPagoQueries {
    public async create(data: any) {
        try {
            const documentacionPago = await DocumentacionPagoModel.create({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_pago: data.documento_pago,
                fecha_alta: data.fecha_alta,
                estatus: data.estatus
            })
            return {ok: true, documentacionPago}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const documentacionPago = await DocumentacionPagoModel.update({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_pago: data.documento_pago,
                fecha_alta: data.fecha_alta,
                estatus: data.estatus
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, documentacionPago}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findDocumentacionPagoById(data: any) {
        try {
            const documentacionPago = await DocumentacionPagoModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, documentacionPago }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        try {
            const documentacionPago = await DocumentacionPagoModel.update(
                {
                    estatus: data.estatus,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documentacionPago }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
