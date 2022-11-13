import {Op, where} from 'sequelize'
import {AreaModel} from '../models/area.model'
import {AdministratorAreaModel} from "../models/administrator_area.model";
import {ServicioModel} from "../models/servicio.model";

export class AreaQueries {
    public async getAreas(data: any) {
        let query: any

        if (data.auth === true) {
            query = {
                attributes: [
                    'uuid', 'nombre', 'descripcion', 'responsable', 'telefono', 'extension',
                    'email', 'horario', 'ubicacion', 'icono', 'activo'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                include: [
                    {
                        model: ServicioModel, as: 'Servicio',
                        where: {
                            activo: 1
                        }
                    },
                ]
            }
        } else {
            query = {
                attributes: [
                    'uuid', 'nombre', 'descripcion', 'responsable', 'telefono', 'extension',
                    'email', 'horario', 'ubicacion', 'icono'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                where: {
                    activo: 1
                },
                include: [
                    {
                        model: ServicioModel, as: 'Servicio',
                        where: {
                            activo: 1
                        }
                    }
                ]
            }
        }

        try {
            const areas = await AreaModel.findAll(query)
            return {ok: true, areas}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const area = await AreaModel.create({
                administradores_id: data.administratorId,
                uuid: data.uuid,
                nombre: data.nombre,
                descripcion: data.descripcion,
                responsable: data.responsable,
                telefono: data.telefono,
                extension: data.extension,
                email: data.email,
                horario: data.horario,
                fecha_alta: data.fecha_alta,
                activo: 1,
                ubicacion: data.ubicacion
            })
            return {ok: true, area}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findAreaByUUID(data: any) {
        try {
            const area = await AreaModel.findOne({
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, area}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findAreaByNombre(data: any) {
        try {
            const area = await AreaModel.findOne({
                where: {
                    nombre: data.nombre
                }
            })
            return {ok: true, area}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const area = await AreaModel.update({
                nombre: data.nombre,
                descripcion: data.descripcion,
                responsable: data.responsable,
                telefono: data.telefono,
                extension: data.extension,
                email: data.email,
                horario: data.horario,
                ubicacion: data.ubicacion,
                activo: data.activo,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, area}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
