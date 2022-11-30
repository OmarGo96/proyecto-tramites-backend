import * as sequelize from 'sequelize'
import { Op } from 'sequelize'
import { database } from '../config/database'
import { ServicioModel } from '../models/servicio.model'
import { DocumentacionServicioModel } from '../models/documentos_servicio.model'
import { AreaModel } from '../models/area.model'
import {EstatusSolicitudModel} from "../models/estatus_solicitud.model";
import {EstatusServicioModel} from "../models/estatus_servicio.model";
import {CambiaEstatusModel} from "../models/cambia_estatus.model";

export class EstatusesQueries {

    public async getEstatuses(id: any) {
        try {
            const estatuses = await EstatusServicioModel.findAll({
                where: {
                    estatus_solicitud_id: {[Op.in]: [4,5,6,7,8,9,10,11,12]},
                    servicio_id: id,

                },
                include: [
                    { model: EstatusSolicitudModel, as: 'EstatusSolicitud'}
                ]
            });
            return { ok: true, estatuses }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async getEstatusesById(servicio_id: any, estatus_solicitud_id: any) {
        try {
            const estatuses = await CambiaEstatusModel.findAll({
                where: {
                    servicio_id,
                    estatus_solicitud_id
                },
                include: [
                    { model: EstatusSolicitudModel, as: 'EstatusSolicitud'}
                ]
            });
            return { ok: true, estatuses }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

}
