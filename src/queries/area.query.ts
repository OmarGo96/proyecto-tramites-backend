import {Op, where} from 'sequelize'
import {AreaModel} from '../models/area.model'
import {AdministratorAreaModel} from "../models/administrator_area.model";
import {ServicioModel} from "../models/servicio.model";
import {AdministratorModel} from "../models/administrator.model";
import {Roles} from "../enums/roles";

export class AreaQueries {
    public async getAreas(data: any) {

        let query: any
        if (data.auth === true) {
            let where = {}
            let required = false;
            if (data.adminInfo.rol === Roles.ADMINISTRADOR || data.adminInfo.rol === Roles.REVISOR ) {
                required = true;
                where = {
                    area_id: data.adminInfo.area_id
                }
            }
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
                    },
                    {
                        required,
                        model: AdministratorModel, as: 'Administrador',
                        where
                    }
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

    public async create(data: any) {
        try {
            const area = await AreaModel.create({
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
