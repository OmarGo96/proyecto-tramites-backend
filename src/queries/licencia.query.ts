import * as sequelize from 'sequelize'
import { Op } from 'sequelize'
import { database } from '../config/database'
import { LicenciaModel } from '../models/licencia.model'

export class LicenciaQueries {

    public async findLicenciasByContribuyente(data: any) {
        try {
            const licencias = await LicenciaModel.findAll({
                where: {
                    [Op.and]: [
                        { contribuyentes_id: data.contribuyente_id },
                        { estatus: 'A' }
                    ]
                }
            })
            return { ok: true, licencias }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findLicenciaByContribuyente(data: any) {
        try {
            const licencia = await LicenciaModel.findOne({
                where: {
                    [Op.and]: [
                        { contribuyentes_id: data.contribuyente_id },
                        { licencia_funcionamiento_id: data.licencia_funcionamiento_id },
                        { estatus: 'A' }
                    ]
                }
            })
            return { ok: true, licencia }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async create(data: any) {
        try {
            const licencia = await LicenciaModel.create({
                contribuyentes_id: data.contribuyente_id,
                rfc: data.rfc,
                licencia_funcionamiento_id: data.licencia_funcionamiento_id,
                licencia_funcionamiento_folio: data.licencia_funcionamiento_folio,
                razon_social: data.razon_social,
                nombre_establecimiento: data.nombre_establecimiento,
                habitaciones: data.habitaciones,
                domicilio_fiscal: data.domicilio_fiscal,
                clave_catastral: data.clave_catastral,
                calle: data.calle,
                no_interior: data.no_interior,
                no_exterior: data.no_exterior,
                cp: data.cp,
                colonia: data.colonia,
                localidad: data.localidad,
                municipio: data.municipio,
                estado: data.estado,
                propietario_nombre: data.propietario_nombre,
                fecha_inicio_operacion: data.fecha_inicio_operacion,
                ultimo_ejercicio_pagado: data.ultimo_ejercicio_pagado,
                ultimo_periodo_pagado: data.ultimo_periodo_pagado,
                fecha_alta: data.fecha_alta,
                estatus: data.estatus
            })
            return { ok: true, licencia }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

}
