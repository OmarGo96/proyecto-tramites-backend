import {Op} from 'sequelize'
import {DocumentosAnuenciaModel} from '../models/documentos_anuencia.model';
import {DocumentacionPagoModel} from "../models/documentacion_pago.model";

export class DocumentoAnuenciaQueries {

    public async findDocumentoByID(data: any) {
        try {
            const documento = await DocumentosAnuenciaModel.findOne({
                where: {
                    id: data.id
                }
            })
            return {ok: true, documento}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
    public async findDocumentoBySolicitud(data: any) {
        try {
            const documento = await DocumentosAnuenciaModel.findOne({
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
            const document = await DocumentosAnuenciaModel.create({
                solicitud_id: data.solicitud_id,
                contribuyente_id: data.contribuyente_id,
                url: data.url,
                fecha_alta: data.fecha_alta,
                status: data.status
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async attachFile(data: any) {
        try {
            const document = await DocumentosAnuenciaModel.update(
                {
                    url: data.url,
                    contribuyente_id: data.contribuyente_id,
                    status: data.status,
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

    public async changeStatus(data: any) {
        try {
            const documento = await DocumentosAnuenciaModel.update(
                {
                    status: data.estatus,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documento }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
