
import { Op } from 'sequelize'
import {UrlIntentoCobroModel} from "../models/url_intento_cobro.model";

export class UrlIntencionCobroQueries {

    /** Crea un nuevo registro */
    public async store(data: any) {
        try {
            const urlIntencionCobro = await UrlIntentoCobroModel.create(data)
            return { ok: true, urlIntencionCobro }
        } catch{
            return { ok: false }
        }
    }

    public async findByReference(data: any) {
        try {
            const urlIntencionCobro = await UrlIntentoCobroModel.findOne({
                where: {
                    reference: data.reference
                }
            })
            return { ok: true, urlIntencionCobro }
        } catch{
            return { ok: false }
        }
    }

}


