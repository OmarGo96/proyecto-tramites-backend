import validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {DocumentacionLicenciaComercialQueries } from '../queries/documentacion_licencia_comercial.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';

export class DocumentosLicenciaComercialController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionLicenciaComercialQueries: DocumentacionLicenciaComercialQueries = new DocumentacionLicenciaComercialQueries()
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

        const documentoLicenciaComercial: string = body.documento_licencia_comercial == null ?
            errors.push({message: 'Favor de proporcionar el tipo de documento'}) : body.documento_licencia_comercial;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.create({
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
            documento_licencia_comercial: documentoLicenciaComercial,
            status: 0,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (!createDocumento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentosLicenciaComercialController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentación de licencia de uso comercial',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async updateDocumentacionLicenciaComercial(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentoLicenciaComercialId = req.params.documento_licencia_comercial_id === null ? null : validator.isEmpty(req.params.documento_licencia_comercial_id) ?
            errors.push({message: 'Favor de proporcionar el documento'}) : req.params.documento_licencia_comercial_id

        const documentacionId: string = body.documentacion_id == null ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.documentacion_id;

        const solicitudId: string = body.solicitud_id == null ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) : body.solicitud_id;

        const documentoLicenciaComercial: string = body.documento_licencia_comercial == null ?
            errors.push({message: 'Favor de proporcionar el tipo de documento'}) : body.documento_licencia_comercial;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.update({
            id: documentoLicenciaComercialId,
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
            documento_licencia_comercial: documentoLicenciaComercial,
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
        const createLogContribuyente = await DocumentosLicenciaComercialController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentación de licencia de uso comercial',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async validarDocLicenciaComercial(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionLicenciaComercialId = req.params.documento_licencia_comercial_id == null ? null : validator.isEmpty(req.params.documento_licencia_comercial_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) : req.params.documento_licencia_comercial_id


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
        const findDocumentacionLicenciaComercialById = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.findDocumentacionLicenciaComercialById({ id: documentacionLicenciaComercialId });

        if (!findDocumentacionLicenciaComercialById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionLicenciaComercialById.documentLicenciaComercial == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.changeStatus({
            id: documentacionLicenciaComercialId,
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

        const logAdministrador = await DocumentosLicenciaComercialController.log.administrador({
            administrador_id,
            navegador: req.headers['user-agent'],
            accion: 'El administrador cambio el estatus del documento',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha cambiado el estatus del documento'
        })

    }

    public async unlinkDocLicenciaComercial(req: Request, res: Response) {
        const contribuyente_id = req.body.contribuyente_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionAnuenciaId = req.params.documentacion_anuencia_id == null ? null : validator.isEmpty(req.params.documentacion_anuencia_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) : req.params.documentacion_anuencia_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionAnuenciaById = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.findDocumentacionLicenciaComercialById({ id: documentacionAnuenciaId });

        if (!findDocumentacionAnuenciaById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionAnuenciaById.documentLicenciaComercial == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentosLicenciaComercialController.documentacionLicenciaComercialQueries.changeStatus({
            id: documentacionAnuenciaId,
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

        const logContribuyente = await DocumentosLicenciaComercialController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente eliminó documento al requisito de licencia de uso comercial',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el documento'
        })

    }

}
