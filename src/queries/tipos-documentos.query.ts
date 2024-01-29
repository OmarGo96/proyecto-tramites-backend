import {Op, where} from 'sequelize'
import {DocumentacionServicioModel} from '../models/documentos_servicio.model';
import {ServicioModel} from "../models/servicio.model";
import {TiposDocumentosModel} from "../models/tipos-documentos.model";
import {RequisitoServiciosModel} from "../models/requisitos_servicios.model";

export class TiposDocumentosQueries {
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

    public async findDocumentByNombre(data: any) {
        try {
            const document = await TiposDocumentosModel.findOne({
                where: {
                    nombre: data.nombre
                }
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findDocumentById(data: any) {
        try {
            const document = await TiposDocumentosModel.findOne({
                where: {
                    id: data.id
                }
            })
            return {ok: true, document}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async getTiposDocumentos(data: any) {
        try {
            const documentos = await TiposDocumentosModel.findAll();
            return {ok: true, documentos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const documento = await TiposDocumentosModel.create({
                nombre: data.nombre,
                clave: data.clave,
                descripcion: data.descripcion,
                fecha_Alta: data.fecha_alta,
                requiere_aprobacion: data.aprobacion,
                expediente_unico: data.expediente_unico
            })
            return {ok: true, documento}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const documento = await TiposDocumentosModel.update(
                {
                    nombre: data.nombre,
                    fecha_Alta: data.fecha_alta,
                },{
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

    public async attachFile(data: any) {
        try {
            const documentacion = await DocumentacionServicioModel.update(
                {
                    url: data.url,
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
