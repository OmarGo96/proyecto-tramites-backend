import { Op } from 'sequelize'
import { TransaccionModel } from '../models/transaccion.model'

export class TransaccionQueries {
public async create(data: any) {
        try {
            const transaccion = await TransaccionModel.create({
                solicitud_id: data.solicitud_id,
                folio: data.folio,
                importe: data.importe,
                fecha_alta: data.fecha_alta
            })
            return { ok: true, transaccion }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
