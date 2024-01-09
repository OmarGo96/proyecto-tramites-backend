import { Op } from 'sequelize'
import { DocumentacionModel } from '../models/documentacion.model'
import {TiposDocumentosQueries} from "./tipos-documentos.query";
import {ServicioModel} from "../models/servicio.model";
import {TiposDocumentosModel} from "../models/tipos-documentos.model";

export class DocumentacionQueries {

    public async findDocumentosByContribuyente(data: any) {
        try {
            const documentacion = await TiposDocumentosModel.findAll({
                where: {
                    expediente_unico: 0
                },
                include: [
                    {
                        model: DocumentacionModel, as: 'Documentacion',
                        where: {
                            contribuyentes_id: data.contribuyente_id,
                            status: 1
                        },
                        order: [
                            ['fecha_alta','DESC']
                        ]
                    }
                ]
            })
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findExpedienteByContribuyente(data: any) {
        try {
            const documentacion = await TiposDocumentosModel.findAll({
                where: {
                    expediente_unico: 1
                },
                include: [
                    {
                        required: false,
                        model: DocumentacionModel, as: 'Documentacion',
                        where: {
                            contribuyentes_id: data.contribuyente_id,
                            status: 1
                        },
                        order: [
                            ['fecha_alta','DESC']
                        ],
                        limit: 1
                    }
                ]
            })
            return { ok: true, documentacion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findExpedienteDocsByContribuyente(data: any) {
        try {
            const documentacion = await DocumentacionModel.findAll({
                where: {
                    contribuyentes_id: data.contribuyente_id
                },
                include: [
                    {
                        model: TiposDocumentosModel, as: 'TipoDocumentacion',
                        where: {
                            expediente_unico: 1
                        },
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
                    nombre_otro: data.nombre_otro,
                    fecha_alta: data.fecha_alta,
                    tipo_documento: data.tipo_documento,
                    vigencia_final: data.vigencia_final,
                    aprobado: data.aprobado,
                    status: data.status
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
                    status: data.status,
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
