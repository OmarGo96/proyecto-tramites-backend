import validator from 'validator';
import moment from 'moment'
import {Request, Response} from 'express'
import {SolicitudQueries} from '../queries/solicitud.query'
import {ServicioQueries} from '../queries/servicio.query'
import {RequerimientoQueries} from '../queries/requerimiento.query'
import {DocumentacionQueries} from '../queries/documentacion.query'
import {Log} from '../helpers/logs'
import {File} from '../helpers/files'
import {DocumentoSolicitudRequisitoQueries} from "../queries/documento-solicitud-requisito.query";
import {DocumentosSolicitudRequisitoModel} from "../models/documentos_solicitud_requisito.model";

export class DocumentosSolicitudRequisitoController {
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionQueries: DocumentacionQueries = new DocumentacionQueries()
    static documentoSolicitudRequisitoQueries: DocumentoSolicitudRequisitoQueries = new DocumentoSolicitudRequisitoQueries()
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

        const requisitoId: string = body.requisito_id == null ?
            errors.push({message: 'Favor de proporcionar el requisito'}) : body.requisito_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.create({
            documentacion_id: documentacionId,
            solicitudes_id: solicitudId,
            requisito_id: requisitoId,
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
        const createLogContribuyente = await DocumentosSolicitudRequisitoController.log.contribuyente({
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

    public async updateDocumentoSolicitudRequisito(req: Request, res: Response) {
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

        const requisitoId: string = body.requisito_id == null ?
            errors.push({message: 'Favor de proporcionar el requisito'}) : body.requisito_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.update({
            id: documentoSolicitudRequisitoId,
            documentacion_id: documentacionId,
            solicitudes_id: solicitudId,
            requisito_id: requisitoId,
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
        const createLogContribuyente = await DocumentosSolicitudRequisitoController.log.contribuyente({
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

    public async validarDocumentoRequisito(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionId = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) :
            req.params.documentacion_id

        const estatus: string = body.estatus == null || validator.isEmpty(body.estatus) ?
            errors.push({ message: 'Favor de proporcionar el tipo de documento' }) : body.estatus

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (estatus !== '-1' && estatus !== '1' && estatus !== '3') {
            errors.push({ message: 'Favor de proporcionar un estatus valido' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionById = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.findDocumentacionById({ id: documentacionId });

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.changeStatus({
            id: documentacionId,
            estatus
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

        const logAdministrador = await DocumentosSolicitudRequisitoController.log.administrador({
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

    public async unlinkDocumentoRequisito(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionId = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) :
            req.params.documentacion_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionById = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.findDocumentacionById({ id: documentacionId });

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentosSolicitudRequisitoController.documentoSolicitudRequisitoQueries.changeStatus({
            id: documentacionId,
            estatus: -2
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

        const logContribuyente = await DocumentosSolicitudRequisitoController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente eliminó documento al requisito',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el documento'
        })

    }
}
