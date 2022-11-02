import {Op} from 'sequelize'
import {AdministratorModel} from '../models/administrator.model'
import {AdministratorAreaModel} from '../models/administrator_area.model'
import {RequisitoModel} from "../models/requisito.model";
import {RequisitoServiciosModel} from "../models/requisitos_servicios.model";
import {DocumentacionServicioModel} from "../models/documentos_servicio.model";
import {DocumentosSolicitudRequisitoModel} from "../models/documentos_solicitud_requisito.model";
import {DocumentacionModel} from "../models/documentacion.model";

export class RequisitosServiciosQueries {
    public async findAreasByAdministrador(data: any) {
        try {
            const areas = await AdministratorAreaModel.findAll({
                attributes: [
                    'area_id'
                ],
                where: {
                    administrador_id: data.administrador_id,
                    activo: 1
                }
            })
            return {ok: true, areas}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async getRequerimeintos(data: any) {
        let query: any

        if (data.auth === true) {
            query = {
                attributes: [
                    'id', 'servicios_id', 'requisitos_id', 'original', 'no_copias', 'complementario', 'obligatorio', 'activo'
                ],
                where: {
                    servicios_id: data.servicio_id
                },
                include: [
                    {model: RequisitoModel, as: 'Requisito'}
                ]
            }
        } else {
            query = {
                attributes: [
                    'id', 'servicios_id', 'requisitos_id', 'original', 'no_copias', 'complementario', 'obligatorio',
                ],
                where: {
                    [Op.and]: [
                        {servicios_id: data.servicio_id},
                        {activo: 1}
                    ]
                },
                include: [
                    {model: RequisitoModel, as: 'Requisito'}
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
            const requisitos = await RequisitoServiciosModel.findAll({
                order: [
                    ['id', 'ASC']
                ],
                where: {
                    servicios_id: data.servicio_id
                },
                include: [
                    {
                        model: RequisitoModel, as: 'Requisito',
                        include: [
                            {
                                model: DocumentosSolicitudRequisitoModel, as: 'Documento',
                                where: {
                                    solicitudes_id: data.solicitud_id
                                },
                                required: false,
                                include: [
                                    {model: DocumentacionModel, as: 'Documentacion'}
                                ]
                            },
                        ]
                    },
                ]
            })
            return {ok: true, requisitos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const requisitos = await RequisitoServiciosModel.create({
                requisitos_id: data.requisitos_id,
                servicios_id: data.servicios_id,
                original: data.original,
                no_copias: data.noCopias,
                complementario: data.complementario,
                obligatorio: data.obligatorio,
                fecha_alta: data.fecha_alta,
                activo: 1,
            })
            return {ok: true, requisitos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const requisitos = await RequisitoServiciosModel.update({
                requisitos_id: data.requisitos_id,
                servicios_id: data.servicios_id,
                original: data.original,
                no_copias: data.noCopias,
                complementario: data.complementario,
                obligatorio: data.obligatorio,
                fecha_alta: data.fecha_alta,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, requisitos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async inactive(data: any) {
        try {
            const administratorArea = await AdministratorAreaModel.update({
                activo: -1
            }, {
                where: {
                    administrador_id: data.administrador_id
                }
            })
            return {ok: true, administratorArea}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }


}
