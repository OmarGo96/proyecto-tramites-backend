import validator from 'validator';
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { SolicitudQueries } from '../queries/solicitud.query'
import { Log } from '../helpers/logs'
import {PaseCajaQueries} from "../queries/pase_caja.query";
import {Soap} from "../helpers/soap";
import {UrlIntencionCobroQueries} from "../queries/url_intencion_cobro.query";

export class PagoController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static paseCajaQueries: PaseCajaQueries = new PaseCajaQueries()
    static urlIntencionCobroQueries: UrlIntencionCobroQueries = new UrlIntencionCobroQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()

    public async simulate(req: Request, res: Response) {
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitudId: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) : body.solicitud_id

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
        /** Obtenemos el id del contribuyente */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitudId: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) : body.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const pase_caja = await PagoController.paseCajaQueries.findDocumentoBySolicitud({
            solicitud_id: solicitudId,
        })

        if (!pase_caja.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el pago el linea, intente más tarde' }]
            })
        } else if (pase_caja.documento == null) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'La solicitud no cuenta con pase a caja para realizar el pago.' }]
            })
        }

        const referencia = moment().unix().toString() + solicitudId
        console.log(pase_caja.documento.folio_pase_caja)
        const data = {
            url: process.env.GLOBAL_PAYMENT,
            function: 'daoGeneraIntenciondecobroGlobal',
            args: {
                parStrPaseCaja: pase_caja.documento.folio_pase_caja,
                parStrTokenValidate: 'token',

            }
        }

        const soap: any = await PagoController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        console.log(soap.result[0].daoGeneraIntenciondecobroGlobalResult)

        if (soap.result[0].daoGeneraIntenciondecobroGlobalResult.CodigoError && soap.result[0].daoGeneraIntenciondecobroGlobalResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoGeneraIntenciondecobroGlobalResult.MensajeError }]
            })
        }

        if(!soap.result[0].daoGeneraIntenciondecobroGlobalResult.UrlIntencionCobro){
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el link de pago, intente más tarde.' }]
            })
        }

        const url_intencion_cobro = await PagoController.urlIntencionCobroQueries.store({
            solicitud_id: solicitudId,
            grupo_tramite_id: soap.result[0].daoGeneraIntenciondecobroGlobalResult.GrupoTramiteId,
            tramite_id: soap.result[0].daoGeneraIntenciondecobroGlobalResult.TramiteId,
            solicitud_tramite_id: soap.result[0].daoGeneraIntenciondecobroGlobalResult.SolicitudId,
            referencia,
            folio_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroGlobalResult.FolioPaseCaja,
            url_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroGlobalResult.UrlIntencionCobro,
            status: 0,
            fecha_alta:  moment().format('YYYY-MM-DD HH:mm:ss'),

        })

        if (!url_intencion_cobro.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el link de pago, intente más tarde' }]
            })
        }

        return res.status(200).json({
            ok: true,
            link: soap.result[0].daoGeneraIntenciondecobroGlobalResult.UrlIntencionCobro
        })


    }

    public async respuestaIntentoPago(req: Request, res: Response) {
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const referencia: any = req.params.referencia == null || validator.isEmpty(req.params.referencia + '') ?
            errors.push({ message: 'Favor de proporcionar la referencia' }) : req.params.referencia

        const findUrlIntentoCobro = await PagoController.urlIntencionCobroQueries.findByReference({
            folio_intencion_cobro: referencia
        })

        if (!findUrlIntentoCobro.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para encontrar el intento de pago' }]
            })
        } else if (findUrlIntentoCobro.urlIntencionCobro == null) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'No se encontró ningún intento de pago relacionado a la referencia proporcionada.' }]
            })
        }

        const processPaymentResponse = await PagoController.urlIntencionCobroQueries.update({
            status: (body.ok === false) ? -1 : 1,
            codigo_error: (body.codigo) ? body.codigo : null,
            mensaje_error: (body.mensaje) ? body.mensaje : null,
            importe: (body.importe) ? body.importe : null,
            fecha_pago: (body.fecha_pago) ? moment(body.fecha_pago).format('YYYY-MM-DD HH:mm:ss') : null,
            confirmacion_pago: (body.confirmacion_pago) ? body.confirmacion_pago : null

        }, findUrlIntentoCobro.urlIntencionCobro.id)

        if (!processPaymentResponse.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para actualizar el intento de cobro' }]
            })
        }

        if (body.ok) {
            const updateSolicitud = await PagoController.solicitudQueries.changeStatus({
                id: findUrlIntentoCobro.urlIntencionCobro.solicitud_id,
                estatus_solicitud_id: 11,
                fecha_pago: moment(body.fecha_pago).format('YYYY-MM-DD HH:mm:ss')
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Se ha actualizado el estatus del intento de cobro'
        })



    }
}
