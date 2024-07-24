import * as sequelize from 'sequelize'
import { Op } from 'sequelize'
import { database } from '../config/database'
import {ExpedientePaoModel} from "../models/expediente_pao.model";

export class ExpedientePaoQueries {

    public async findExpedienteByContribuyente(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.findOne({
                where: {
                    [Op.and]: [
                        { contribuyente_id: data.contribuyente_id },
                        { expediente_pao_id: data.expediente_pao_id },
                    ]
                }
            })
            return { ok: true, expedientePao }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findExpedienteByToken(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.findOne({
                where: {
                    [Op.and]: [
                        { contribuyente_id: data.contribuyente_id },
                        { expediente_pao_id: data.expediente_pao_id },
                    ]
                }
            })
            return { ok: true, expedientePao }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async findExpedienteByFolioEjercicio(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.findOne({
                where: {
                    [Op.and]: [
                        { folio_expediente: data.folio_expediente },
                        { ejercicio_fiscal: data.ejercicio_fiscal }
                    ]
                }
            })
            return { ok: true, expedientePao }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async updateExpedientInformation(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.update({
                clave_catastral: data.clave_catastral,
                correo: data.correo,
                nombre_gestor: data.nombre_gestor,
                representante_legal: data.representante_legal,
                telefono_contacto: data.telefono_contacto
            },{
                where: {
                    id: data.id
                }
            })
            return { ok: true, expedientePao }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async saveTokenPao(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.update({
                status: 1,
                token_solicitud_api: data.token_solicitud_api,
                url_consulta: data.url_consulta
            },{
                where: {
                    id: data.id
                }
            })
            return { ok: true, expedientePao }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async upsert(data: any) {
        try {
            const expedientePao = await ExpedientePaoModel.upsert({
                id: data.id,
                contribuyente_id: data.contribuyente_id,
                expediente_pao_id: data.expediente_pao_id,
                folio_expediente: data.folio_expediente,
                ejercicio_fiscal: data.ejercicio_fiscal,
                vigencia_permiso: data.vigencia_permiso,
                expediente_json: data.expediente_json,
                requisitos_json: data.requisitos_json,
                status: 0

            })
            return { ok: true, expedientePao: expedientePao[0] }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

}
