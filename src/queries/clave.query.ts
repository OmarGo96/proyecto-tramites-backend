import { Op } from 'sequelize'
import { ClaveModel } from '../models/clave.model';

export class ClaveQueries {
    public async findClaveByContribuyente(data: any) {
        try {
            const clave = await ClaveModel.findOne({
                where: {
                    [Op.and]: [
                        { contribuyente_id: data.contribuyente_id },
                        { clave: data.clave },
                        { activo: 1 }
                    ]
                }
            })
            return { ok: true, clave }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findClavesByContribuyente(data: any) {
        try {
            const claves = await ClaveModel.findAll({
                where: {
                    [Op.and]: [
                        { contribuyente_id: data.contribuyente_id },
                        { activo: 1 }
                    ]
                }
            })
            return { ok: true, claves }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async create(data: any) {
        try {
            const clave = await ClaveModel.create({
                contribuyente_id: data.contribuyente_id,
                predio_id: data.predio_id,
                clave: data.clave,
                poblacion_id: data.poblacion_id,
                colonia: data.colonia,
                distrito: data.distrito,
                entidad: data.entidad,
                localidad: data.localidad,
                municipio: data.municipio,
                pais: data.pais,
                region: data.region,
                codigo_postal: data.codigo_postal,
                direccion: data.direccion,
                predio_tipo: data.predio_tipo,
                fecha_alta: data.fecha_alta,
                activo: 1
            })
            return { ok: true, clave }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async delete(data: any) {
        try {
            const clave = await ClaveModel.update({
                activo: 0
            }, {
                where: {
                    id: data.id
                }
            })
            return { ok: true, clave }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
