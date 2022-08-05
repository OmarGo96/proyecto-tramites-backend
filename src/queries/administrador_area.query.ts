import {Op} from 'sequelize'
import {AdministratorModel} from '../models/administrator.model'
import {AdministratorAreaModel} from '../models/administrator_area.model'

export class AdministradorAreaQueries {
    public async findAreasByAdministrador(data: any) {
        try {
            const areas = await AdministratorAreaModel.findAll({
                attributes: [
                    'areas_id'
                ],
                where: {
                    administradores_id: data.administrador_id,
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
            const administratorArea = await AdministratorAreaModel.create({
                administradores_id: data.administrador_id,
                areas_id: data.area_id
            })
            return {ok: true, administratorArea}
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
