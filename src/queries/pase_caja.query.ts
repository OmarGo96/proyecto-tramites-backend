
import { Op } from 'sequelize'
import {PaseCajaModel} from "../models/pase_caja.model";

export class PaseCajaQueries {

    /** Crea un nuevo registro */
    public async store(data: any) {
        try {
            const paseCaja = await PaseCajaModel.create(data)
            return { ok: true, paseCaja }
        } catch(e){
            console.log(e)
            return { ok: false }
        }
    }

    public async findDocumentoBySolicitud(data: any) {
        try {
            const documento = await PaseCajaModel.findOne({
                where: {
                    solicitud_id: data.solicitud_id
                },
                order: [['id','DESC']]
            })
            return {ok: true, documento}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

}


