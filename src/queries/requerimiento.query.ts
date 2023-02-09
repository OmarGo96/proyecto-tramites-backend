import {Op} from 'sequelize'
import {RequisitoModel} from '../models/requisito.model'
import {DocumentacionServicioModel} from "../models/documentos_servicio.model";
import {RequisitoServiciosModel} from "../models/requisitos_servicios.model";

export class RequerimientoQueries {
    public async getRequerimeintos(data: any) {
        let query: any

        if (data.auth === true) {
            query = {
                attributes: [
                    'original', 'no_copias', 'complementario', 'obligatorio', 'activo'
                ],
                where: {
                    servicios_id: data.servicio_id
                },
                include: [
                    {model: RequisitoModel, as: 'Requisitos'}
                ]
            }
        } else {
            query = {
                attributes: [
                    'original', 'no_copias', 'complementario', 'obligatorio',
                ],
                where: {
                    [Op.and]: [
                        {servicios_id: data.servicio_id},
                        {activo: 1}
                    ]
                },
                include: [
                    {model: RequisitoModel, as: 'Requisitos'}
                ]
            }
        }

        try {
            const requerimientos = await RequisitoServiciosModel.findAll(query)
            return {ok: true, requerimientos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findRequisitosByServicio(data: any) {
        try {
            const requisitos = await RequisitoModel.findAll({
                where: {
                    servicio_id: data.servicio_id
                }
            })
            return {ok: true, requisitos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findRequisitoByUUID(data: any) {
        console.log(data)
        try {
            const requisito = await RequisitoModel.findOne({
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, requisito}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const requisito = await RequisitoModel.create({
                uuid: data.uuid,
                tipos_documentos_id: data.tiposDocumentosId,
                nombre: data.nombre,
                descripcion: data.descripcion,
                fecha_alta: data.fecha_alta,
                activo: 1,
            })
            return {ok: true, requisito}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findRequisitoByNombre(data: any) {
        try {
            const requisito = await RequisitoModel.findOne({
                where: {
                    nombre: data.nombre
                }
            })
            return {ok: true, requisito}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const requisito = await RequisitoModel.update({
                tipos_documentos_id: data.tiposDocumentosId,
                nombre: data.nombre,
                descripcion: data.descripcion
            }, {
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, requisito}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async disable(data: any) {
        try {
            const requisito = await RequisitoModel.update({
                activo: data.activo
            }, {
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, requisito}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
