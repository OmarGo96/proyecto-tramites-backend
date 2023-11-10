import {Op} from 'sequelize'
import {DocumentacionLicenciaComercialModel} from '../models/documentacion_licencia_comercial.model';
import {DocumentacionPagoModel} from "../models/documentacion_pago.model";

export class DocumentacionLicenciaComercialQueries {

    public async create(data: any) {
        try {
            const documentLicenciaComercial = await DocumentacionLicenciaComercialModel.create({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_licencia_comercial: data.documento_licencia_comercial,
                status: data.status,
                fecha_alta: data.fecha_alta,
            })
            return {ok: true, documentLicenciaComercial}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const documentLicenciaComercial = await DocumentacionLicenciaComercialModel.update({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                documento_licencia_comercial: data.documento_licencia_comercial,
                status: data.status,
                fecha_alta: data.fecha_alta,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, documentLicenciaComercial}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findDocumentacionLicenciaComercialById(data: any) {
        try {
            const documentLicenciaComercial = await DocumentacionLicenciaComercialModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, documentLicenciaComercial }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        try {
            const documentacionLicenciaComercial = await DocumentacionLicenciaComercialModel.update(
                {
                    status: data.status,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documentacionLicenciaComercial }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
