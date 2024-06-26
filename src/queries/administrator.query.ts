import {Op} from 'sequelize'
import {AreaModel} from '../models/area.model'
import {AdministratorModel} from '../models/administrator.model'
import {AdministratorAreaModel} from '../models/administrator_area.model'

export class AdministratorQueries {
    public async findAdministradorByUsuario(data: any) {
        try {
            const administrator = await AdministratorModel.findOne({
                where: {
                    usuario: data.usuario,
                    activo: 1
                },
                include: [
                    {
                        model: AreaModel, as: 'Area',
                    },
                ]
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async getAdministrators(data: any) {
        try {
            let where = {};

            if(data.auth === false) {
                where = {
                    id: {
                        [Op.ne]: data.id
                    },
                    area_id: data.area_id,
                    activo: { [Op.in]: [0,1] }
                }
            }else {
                where = {
                    id: {
                        [Op.ne]: data.id
                    },
                    activo: { [Op.in]: [0,1] }
                }
            }

            const administrators = await AdministratorModel.findAll({
                attributes: [
                    'uuid', 'rol', 'nombre', 'apellidos', 'usuario',
                    'activo'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                where,
                include: [
                    {

                        model: AreaModel, as: 'Area',
                    },
                ]
            })
            return {ok: true, administrators}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findAdministradorById(data: any) {
        try {
            const administrator = await AdministratorModel.findOne({
                where: {
                    id: data.id
                },
                include: [
                    {
                        model: AreaModel, as: 'Area'
                    },
                ]
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findAdministradorByUUID(data: any) {
        try {
            let administrator = await AdministratorModel.findOne({
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const administrator = await AdministratorModel.create({
                area_id: data.area_id,
                rol: data.rol,
                uuid: data.uuid,
                nombre: data.nombre,
                apellidos: data.apellidos,
                usuario: data.usuario,
                password: data.password,
                fecha_alta: data.fecha_alta,
                fecha_baja: null
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const administrator = await AdministratorModel.update({
                area_id: data.area_id,
                nombre: data.nombre,
                apellidos: data.apellidos,
                rol: data.rol,
                usuario: data.usuario,
                activo: data.activo,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async delete(data: any) {
        try {
            const administrator = await AdministratorModel.update({
                activo: data.activo,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
