import { Op } from 'sequelize'
import { DocumentacionModel } from '../models/documentacion.model'
import {TiposDocumentosQueries} from "./tipos-documentos.query";
import {ServicioModel} from "../models/servicio.model";
import {TiposDocumentosModel} from "../models/tipos-documentos.model";

export class DocumentacionQueries {

    public async findRequerimientosByContribuyente(data: any) {
        try {
            const documentacion = await DocumentacionModel.findAll({
                where: {
                    contribuyentes_id: data.contribuyente_id
                },
                include: [
                    {
                        model: TiposDocumentosModel, as: 'Tipo',
                    }
                ]
            })
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findDocumentacionById(data: any) {
        try {
            const documentacion = await DocumentacionModel.findOne({
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

    public async findDocumentacionBySolicitud(data: any) {
        try {
            const documentacion = await DocumentacionModel.findAll({
                where: {
                    solicitud_id: data.solicitud_id
                }
            })
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async create(data: any) {
        try {
            const documentacion = await DocumentacionModel.create({
                tipos_documentos_id: data.tipos_documentos_id,
                contribuyentes_id: data.contribuyentes_id
            })
            return { ok: true, documentacion }
        } catch(e){
            console.log(e)
            return { ok: false }
        }
    }

    public async attachFile(data: any) {
        try {
            const documentacion = await DocumentacionModel.create(
                {
                    tipos_documentos_id: data.tipos_documentos_id,
                    contribuyentes_id: data.contribuyente_id,
                    url: data.url,
                    fecha_alta: data.fecha_alta,
                    tipo_documento: data.tipo_documento,
                    vigencia_final: data.vigencia_final,
                    aprobado: data.aprobado
                }
            )
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatusRevision(data: any) {
        try {
            const documentacion = await DocumentacionModel.update(
                {
                    estatus: 0,
                },
                { where: { solicitud_id: data.solicitud_id } }
            )
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        try {
            const documentacion = await DocumentacionModel.update(
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

    public async destroy(data: any) {
        try {
            const documentacion = await DocumentacionModel.destroy(
                {
                    where: {
                        id: data.id
                    }
                }
            )
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
