import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {DocumentoAnuenciaQueries } from '../queries/documento_anuencia.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';

export class DocumentosAnuenciaController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentoAnuenciaQueries: DocumentoAnuenciaQueries = new DocumentoAnuenciaQueries()
    static log: Log = new Log()
    static file: File = new File()
    public async upload(req: Request, res: Response) {
        const contribuyenteId: number = Number(req.body.contribuyente_id);
        const body = req.body;
        const errors = [];

        const solicitudId = req.params.solicitud_id == null ? null : validator.isEmpty(req.params.solicitud_id) ?
            errors.push({message: 'Favor de proporcionar la solicitud'}) :
            req.params.solicitud_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findSolicitudByID = await DocumentosAnuenciaController.solicitudQueries.findSolicitudById({id: solicitudId})

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

        const findDocumentoBySolicitud = await DocumentosAnuenciaController.documentoAnuenciaQueries.findDocumentoBySolicitud({
            solicitud_id: findSolicitudByID.solicitud ? findSolicitudByID.solicitud.id : false
        })

        if (!findDocumentoBySolicitud.ok) {
            errors.push({message: 'Existen problemas al momento de validar si la solicitud contiene un documento adjunto.'})
        }
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const file = (findDocumentoBySolicitud.documento != null) ? findDocumentoBySolicitud.documento.url : null

        const uploadFile = await DocumentosAnuenciaController.file.upload(req, file, 'anuencia')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: uploadFile.message}]
            })
        }

        if (findDocumentoBySolicitud.documento !== null) {
            const updateDocumentacion = await DocumentosAnuenciaController.documentoAnuenciaQueries.attachFile({
                id: findDocumentoBySolicitud.documento ? findDocumentoBySolicitud.documento.id : false,
                contribuyente_id: contribuyenteId,
                url: uploadFile.nameFile,
                status: 0,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            if (!updateDocumentacion.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
                })
            }
        }

        if (findDocumentoBySolicitud.documento === null) {
            const updateDocumentacion = await DocumentosAnuenciaController.documentoAnuenciaQueries.create({
                solicitud_id: findSolicitudByID.solicitud ? findSolicitudByID.solicitud.id : false,
                contribuyente_id: contribuyenteId,
                url: uploadFile.nameFile,
                status: 0,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            if (!updateDocumentacion.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
                })
            }
        }


        /** Creamos el log del usuario */
        const createLogAdministrador = await DocumentosAnuenciaController.log.contribuyente({
            contribuyente_id: contribuyenteId,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a adjuntado el documento de anuencia a la solicitud',
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
        const findDocumentacionById = await DocumentosAnuenciaController.documentoAnuenciaQueries.findDocumentoBySolicitud({ solicitud_id: solicitudId })

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' })
        } else if (findDocumentacionById.documento == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const downloadFile = await DocumentosAnuenciaController.file.download(findDocumentacionById.documento ? findDocumentacionById.documento.url : false, 'anuencia')

        if (!downloadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        return res.status(200).contentType('application/pdf').send(downloadFile.pdf)
    }

    public async validarDocAnuencia(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionAnuenciaId = req.params.documentacion_anuencia_id == null ? null : validator.isEmpty(req.params.documentacion_anuencia_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) : req.params.documentacion_anuencia_id


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
        const findDocumentacionAnuenciaById = await DocumentosAnuenciaController.documentoAnuenciaQueries.findDocumentoByID({ id: documentacionAnuenciaId });

        if (!findDocumentacionAnuenciaById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' });
        } else if (findDocumentacionAnuenciaById.documento == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changeStatus = await DocumentosAnuenciaController.documentoAnuenciaQueries.changeStatus({
            id: documentacionAnuenciaId,
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

        const logAdministrador = await DocumentosAnuenciaController.log.administrador({
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

}