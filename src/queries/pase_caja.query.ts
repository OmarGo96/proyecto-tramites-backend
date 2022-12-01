
import { Op } from 'sequelize'
import {PaseCajaModel} from "../models/pase_caja.model";

export class PaseCajaQueries {

    /** Crea un nuevo registro */
    public async store(data: any) {
        try {
            const paseCaja = await PaseCajaModel.create(data)
            return { ok: true, paseCaja }
        } catch{
            return { ok: false }
        }
    }

}


