import validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';
import {PaseCajaQueries} from "../queries/pase_caja.query";
import {Soap} from "../helpers/soap";

export class PaseCajaController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static paseCajaQueries: PaseCajaQueries = new PaseCajaQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()
    static file: File = new File()

    public async upload(req: Request, res: Response) {
        const administratorId: number = Number(req.body.administrador_id);
        const body = req.body;
        const errors = [];

        const solicitudId = req.params.solicitud_id == null ? null : validator.isEmpty(req.params.solicitud_id + '') ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) :
            req.params.solicitud_id

        const grupo_tramite_id: string = body.grupo_tramite_id == null || validator.isEmpty(body.grupo_tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el grupo del tramite' }) : body.grupo_tramite_id

        const tramite_id: string = body.tramite_id == null || validator.isEmpty(body.tramite_id + '') ?
            errors.push({ message: 'Favor de proporcionar el tramite' }) : body.tramite_id

        const cantidadPagar: string = body.cantidad_pagar == null || validator.isEmpty(body.cantidad_pagar + '') ?
            errors.push({ message: 'Favor de proporcionar la cantidad a pagar' }) : body.cantidad_pagar;


        const folio: string = body.folio == null || validator.isEmpty(body.folio) ?
            errors.push({ message: 'Favor de proporcionar el folio' }) : body.folio;

        const vigenciaPase: string = body.vigencia == null || validator.isEmpty(body.vigencia + '') ?
            errors.push({ message: 'Favor de proporcionar la vigencia' }) : body.vigencia;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        const findSolicitudByID = await PaseCajaController.solicitudQueries.findSolicitudById({id: solicitudId})

        if (!findSolicitudByID.ok) {
            errors.push({message: 'Existen problemas al momento de validar la solicitud proporcionada.'})
        } else if (findSolicitudByID.solicitud === null) {
            errors.push({message: 'La solicitud proporcionado no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const file: any = null

        const uploadFile = await PaseCajaController.file.upload(req, file, 'pase_caja')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: uploadFile.message}]
            })
        }

        const uploadPaseCaja = await PaseCajaController.paseCajaQueries.store({
            solicitud_id: solicitudId,
            grupo_tramite_id,
            tramite_id,
            folio_pase_caja: folio,
            cantidad_pagar: cantidadPagar,
            fecha_vencimiento: moment(vigenciaPase).format('YYYY-MM-DD HH:mm:ss'),
            urlPaseImpresion: uploadFile.nameFile,
            tipo: 1,
            fecha_alta:  moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (!uploadPaseCaja.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
            })
        }

        /** Creamos el log del usuario */
        const createLogAdministrador = await PaseCajaController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador a adjuntado el pase a caja a la solicitud',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async getFile(req: Request, res: Response) {
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitudId = req.params.solicitud_id == null ? null : validator.isEmpty(req.params.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) :
            req.params.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionBySolicitudId = await PaseCajaController.paseCajaQueries.findDocumentoBySolicitud({ solicitud_id: solicitudId })

        if (!findDocumentacionBySolicitudId.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' })
        }  else if (findDocumentacionBySolicitudId.documento == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        } else if(moment(findDocumentacionBySolicitudId.documento.fecha_vencimiento).format('YYYY-MM-DD') < moment().format('YYYY-MM-DD')) {
            errors.push({ message: 'La pase a caja venció, favor de solicitar otro.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const downloadFile = await PaseCajaController.file.download(findDocumentacionBySolicitudId.documento ? findDocumentacionBySolicitudId.documento.urlPaseImpresion : false, 'pase_caja')

        if (!downloadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        return res.status(200).contentType('application/pdf').send(downloadFile.file)
    }

    public async checkPCFolio(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const folioPaseCaja: string = body.folioPaseCaja == null || validator.isEmpty(body.folioPaseCaja + '')  ?
            errors.push({ message: 'El folio es obligatorio' }) : body.folioPaseCaja


        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        const data = {
            url: process.env.VALIDAR_FOLIO_PC,
            function: 'daoValidaPagoPaseCaja',
            args: {
                // tslint:disable-next-line:radix
                parStrFolioPaseCaja: folioPaseCaja,
            }
        }

        const soap: any = await PaseCajaController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (!soap.result[0].daoValidaPagoPaseCajaResult) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'El folio proporcionado no existe' }]
            })
        }


        if (soap.result[0].daoValidaPagoPaseCajaResult.CveError !== 200) {
            return res.status(400).json({
                ok: false,
                message: [{ message: soap.result[0].daoValidaPagoPaseCajaResult.DescripcionError }]
            })

        }


        const Importe = soap.result[0].daoValidaPagoPaseCajaResult.Importe
        const SolicitudVencimientoFecha = soap.result[0].daoValidaPagoPaseCajaResult.SolicitudVencimientoFecha

        return res.status(200).json({
            ok: true,
            data: {
                Importe,
                SolicitudVencimientoFecha
            },
            message: 'Folio encontrado'
        })
    }

}
