
import { Op } from 'sequelize'
import {UrlIntentoCobroModel} from "../models/url_intento_cobro.model";

export class UrlIntencionCobroQueries {

    /** Crea un nuevo registro */
    public async store(data: any) {
        try {
            const urlIntencionCobro = await UrlIntentoCobroModel.create(data)
            return { ok: true, urlIntencionCobro }
        } catch(e){
            console.log(e)
            return { ok: false }
        }
    }

    public async findByReference(data: any) {
        try {
            const urlIntencionCobro = await UrlIntentoCobroModel.findOne({
                where: {
                    folio_intencion_cobro: data.folio_intencion_cobro
                }
            })
            return { ok: true, urlIntencionCobro }
        } catch(e){
            console.log(e)
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
        } catch(e){
            console.log(e)
            return { ok: false }
        }
    }


}


