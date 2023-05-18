import * as validator from 'validator';
import moment from 'moment'
import {Request, Response} from 'express'
import {SolicitudQueries} from '../queries/solicitud.query'
import {ServicioQueries} from '../queries/servicio.query'
import {RequerimientoQueries} from '../queries/requerimiento.query'
import {DocumentacionQueries} from '../queries/documentacion.query'
import {Log} from '../helpers/logs'
import {File} from '../helpers/files'
import {DocumentacionPagoQueries} from "../queries/documentacion-pago.query";

export class DocumentacionPagoController {
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionPagoQueries: DocumentacionPagoQueries = new DocumentacionPagoQueries()
    static log: Log = new Log()
    static file: File = new File()

    public async attachFile(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentacionId: string = body.documentacion_id == null ?
            errors.push({message: 'Favor de proporcionar el documento'}) : body.documentacion_id;

        const solicitudId: string = body.solicitud_id == null ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : body.solicitud_id;

        const documentoPago: string = body.documento_pago == null ?
            errors.push({message: 'Favor de proporcionar el tipo de documento'}) : body.documento_pago;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentacionPagoController.documentacionPagoQueries.create({
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
            documento_pago: documentoPago,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 0,
        })

        if (!createDocumento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentacionPagoController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentacion de pago',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async updateDocumentacionPago(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentoPagoId = req.params.documento_pago_id === null ? null : validator.isEmpty(req.params.documento_pago_id) ?
            errors.push({message: 'Favor de proporcionar el id'}) : req.params.documento_pago_id

        const documentacionId: string = body.documentacion_id == null ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.documentacion_id;

        const solicitudId: string = body.solicitud_id == null ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : body.solicitud_id;

        const documentoPago: string = body.documento_pago == null ?
            errors.push({message: 'Favor de proporcionar el tipo de documento'}) : body.documento_pago;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentacionPagoController.documentacionPagoQueries.update({
            id: documentoPagoId,
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
            documento_pago: documentoPago,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 0,
        })

        if (!createDocumento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentacionPagoController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentacion de pago',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async validarDocPago(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionPagoId = req.params.documentacion_pago_id == null ? null : validator.isEmpty(req.params.documentacion_pago_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) : req.params.documentacion_pago_id


        const status: string = body.status == null || validator.isEmpty(body.status) ?
            errors.push({ message: 'Favor de proporcionar la validación' }) : body.status

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (status !== '-1' && status !== '1' && status !== '3') {
            errors.push({ message: 'Favor de proporcionar un estatus valido' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionPagoById = await DocumentacionPagoController.documentacionPagoQueries.findDocumentacionPagoById({ id: documentacionPagoId });

        if (!findDocumentacionPagoById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionPagoById.documentacionPago == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentacionPagoController.documentacionPagoQueries.changeStatus({
            id: documentacionPagoId,
            status
        })

        if (!changeStatus.ok) {
            errors.push({ message: 'Existen problemas al momento de cambiar el estatus del documento.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const logAdministrador = await DocumentacionPagoController.log.administrador({
            administrador_id,
            navegador: req.headers['user-agent'],
            accion: 'El administrador cambio el estatus del documento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha cambiado el estatus del documento'
        })

    }

    public async unlinkDocPago(req: Request, res: Response) {
        const contribuyente_id = req.body.contribuyente_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionPagoId = req.params.documentacion_pago_id == null ? null : validator.isEmpty(req.params.documentacion_pago_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) : req.params.documentacion_pago_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionPagoById = await DocumentacionPagoController.documentacionPagoQueries.findDocumentacionPagoById({ id: documentacionPagoId });

        if (!findDocumentacionPagoById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionPagoById.documentacionPago == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentacionPagoController.documentacionPagoQueries.changeStatus({
            id: documentacionPagoId,
            status: -2
        })

        if (!changeStatus.ok) {
            errors.push({ message: 'Existen problemas al momento de eliminar el documento.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const logContribuyente = await DocumentacionPagoController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente eliminó documento al requisito de pago',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el documento'
        })

    }
}
