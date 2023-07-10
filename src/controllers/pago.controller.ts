import validator from 'validator';
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { SolicitudQueries } from '../queries/solicitud.query'
import { Log } from '../helpers/logs'
import {PaseCajaQueries} from "../queries/pase_caja.query";
import {Soap} from "../helpers/soap";

export class PagoController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static paseCajaQueries: PaseCajaQueries = new PaseCajaQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()

    public async simulate(req: Request, res: Response) {
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitudId: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud al cual se le cambiara el estatus' }) : body.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await PagoController.solicitudQueries.simulatePayment({
            id: solicitudId
        })

        return res.status(200).json({
            ok: true,
            message:  'Pago realizado'
        })
    }

    public async onlinePayment(req: Request, res: Response) {

    }
}
