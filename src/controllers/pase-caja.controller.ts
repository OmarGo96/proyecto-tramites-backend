import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';
import {PaseCajaQueries} from "../queries/pase_caja.query";

export class PaseCajaController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static paseCajaQueries: PaseCajaQueries = new PaseCajaQueries()
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

        const cantidadPagar: number = body.cantidad_pagar == null || validator.isEmpty(body.cantidad_pagar + '') ?
            errors.push({ message: 'Favor de proporcionar la cantidad a pagar' }) : Number(body.cantidad_pagar);


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
            ip: req.connection.remoteAddress,
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
        } else if (findDocumentacionBySolicitudId.documento == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
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

        return res.status(200).contentType('application/pdf').send(downloadFile.pdf)
    }

}
