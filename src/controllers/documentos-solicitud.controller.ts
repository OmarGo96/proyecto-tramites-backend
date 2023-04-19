import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {DocumentoSolicitudQueries } from '../queries/documento_solicitud.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';

export class DocumentosSolicitudController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentoSolicitudQueries: DocumentoSolicitudQueries = new DocumentoSolicitudQueries()
    static log: Log = new Log()
    static file: File = new File()

    public async upload(req: Request, res: Response) {
        console.log('Ayu')
        const administratorId: number = Number(req.body.administrador_id);
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

        const findSolicitudByID = await DocumentosSolicitudController.solicitudQueries.findSolicitudById({id: solicitudId})

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

        const findDocumentoBySolicitud = await DocumentosSolicitudController.documentoSolicitudQueries.findDocumentoBySolicitud({
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

        const uploadFile = await DocumentosSolicitudController.file.upload(req, file, 'solicitud')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: uploadFile.message}]
            })
        }

        if (findDocumentoBySolicitud.documento !== null) {
            const updateDocumentacion = await DocumentosSolicitudController.documentoSolicitudQueries.attachFile({
                id: findDocumentoBySolicitud.documento ? findDocumentoBySolicitud.documento.id : false,
                administradores_id: administratorId,
                url: uploadFile.nameFile,
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
            const updateDocumentacion = await DocumentosSolicitudController.documentoSolicitudQueries.create({
                solicitud_id: findSolicitudByID.solicitud ? findSolicitudByID.solicitud.id : false,
                administradores_id: administratorId,
                url: uploadFile.nameFile,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            if (!updateDocumentacion.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
                })
            }
        }

        const estatus = "9"

        const changeStatus = await DocumentosSolicitudController.solicitudQueries.changeStatus({
            id: findSolicitudByID.solicitud.id,
            estatus_solicitud_id: estatus,
            fecha_envio: findSolicitudByID.solicitud.fecha_recepcion,
            fecha_recepcion: findSolicitudByID.solicitud.fecha_recepcion,
            fecha_final: null,
            fecha_rechazo: findSolicitudByID.solicitud.fecha_rechazo,
            motivo_rechazo: findSolicitudByID.solicitud.motivo_rechazo,
            comentario: findSolicitudByID.solicitud.comentario
        })

        if (!changeStatus.ok) {
            errors.push({message: 'Existen problemas al momento de actualizar el estatus.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Creamos el log del usuario */
        const createLogAdministrador = await DocumentosSolicitudController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador a adjuntado el documento digital a la solicitud',
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
        const findDocumentacionById = await DocumentosSolicitudController.documentoSolicitudQueries.findDocumentoBySolicitud({ solicitud_id: solicitudId })

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

        const downloadFile = await DocumentosSolicitudController.file.download(findDocumentacionById.documento ? findDocumentacionById.documento.url : false, 'solicitud')

        if (!downloadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        return res.status(200).contentType('application/pdf').send(downloadFile.pdf)
    }

}
