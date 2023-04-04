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
    static documentacionQueries: DocumentacionQueries = new DocumentacionQueries()
    static documentacionPagoQueries: DocumentacionPagoQueries = new DocumentacionPagoQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
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
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.documentacion_id;

        const solicitudId: string = body.solicitud_id == null ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : body.solicitud_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentacionPagoController.documentacionPagoQueries.create({
            documentacion_id: documentacionId,
            solicitudes_id: solicitudId,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            estatus: 0,
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
            accion: 'El contribuyente a agregado un documento al requerimiento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el requisito de forma exitosa'
        })
    }

    public async updateDocumentacionPago(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentoSolicitudRequisitoId = req.params.documento_solicitud_requisito_id === null ? null : validator.isEmpty(req.params.documento_solicitud_requisito_id) ?
            errors.push({message: 'Favor de proporcionar el id'}) : req.params.documento_solicitud_requisito_id

        const documentacionId: string = body.documentacion_id == null ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.documentacion_id;

        const solicitudId: string = body.solicitud_id == null ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : body.solicitud_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentacionPagoController.documentacionPagoQueries.update({
            id: documentoSolicitudRequisitoId,
            documentacion_id: documentacionId,
            solicitudes_id: solicitudId,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            estatus: 0,
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
            accion: 'El contribuyente a agregado un documento al requerimiento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el requisito de forma exitosa'
        })
    }

    /* public async getFile(req: Request, res: Response) {
         /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
         const errors = []

         if (req.body.auth == false) {
             errors.push({ message: 'Es neecsario la cabecera de autenticacion' })
         }

         const documentacion_id = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
             errors.push({ message: 'Favor de proporcionar la documentación' }) :
             req.params.documentacion_id

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }
         /!** Buscamos en la base de datos si existe un contrato con el nombre proporcionado *!/
         const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({ id: documentacion_id })

         if (findDocumentacionById.ok == false) {
             errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' })
         } else if (findDocumentacionById.documentacion == null) {
             errors.push({ message: 'La documentación proporcionada no existe.' })
         }

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }

         const download_file = await DocumentacionController.file.download(findDocumentacionById.documentacion.url, 'documentacion')

         if (download_file.ok == false) {
             return res.status(400).json({
                 ok: false,
                 errors: [{ message: download_file.message }]
             })
         }

         return res.status(200).contentType('application/pdf').send(download_file.pdf)
     }

     public async changeStatus(req: Request, res: Response) {
         const administrador_id = req.body.administrador_id
         /!** Creamos un array que nos almacenará los errores que surjan en la función *!/
         const errors = []

         /!** Obtenemos toda la información que nos envia el cliente *!/
         const body = req.body

         const documentacion_id = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
             errors.push({ message: 'Favor de proporcionar la documentación' }) :
             req.params.documentacion_id

         const estatus: string = body.estatus == null || validator.isEmpty(body.estatus) == true ?
             errors.push({ message: 'Favor de proporcionar el tipo de documento' }) : body.estatus

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }

         if (estatus != '-1' && estatus != '1') {
             errors.push({ message: 'Favor de proporcionar un estatus valido' })
         }

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }

         /!** Buscamos en la base de datos si existe un contrato con el nombre proporcionado *!/
         const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({ id: documentacion_id })

         if (findDocumentacionById.ok == false) {
             errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' })
         } else if (findDocumentacionById.documentacion == null) {
             errors.push({ message: 'La documentación proporcionada no existe.' })
         }

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }

         const changeStatus = await DocumentacionController.documentacionQueries.changeStatus({
             id: documentacion_id,
             estatus
         })

         if (changeStatus.ok == false) {
             errors.push({ message: 'Existen problemas al momento de cambiar el estatus del documento.' })
         }

         if (errors.length > 0) {
             return res.status(400).json({
                 ok: false,
                 errors
             })
         }

         const logAdministrador = await DocumentacionController.log.administrador({
             administrador_id,
             navegador: req.headers['user-agent'],
             accion: 'El administrador cambio el estatus del documento con el index: ' + documentacion_id + '. Estatus: ' + estatus,
             ip: req.connection.remoteAddress,
             fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
         })

         return res.status(200).json({
             ok: true,
             message: 'Se ha cambiado el estatus del documento'
         })

     }*/
}
