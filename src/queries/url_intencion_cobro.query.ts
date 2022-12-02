
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
                    referencia: data.referencia
                }
            })
            return { ok: true, urlIntencionCobro }
        } catch{
            return { ok: false }
        }
    }

    public async update(data: any, id: any) {
        try {
            const urlIntencionCobro = await UrlIntentoCobroModel.update(data,{
                where: {
                    id
                }
            })
            return { ok: true, urlIntencionCobro }
        } catch{
            return { ok: false }
        }
    }


}


