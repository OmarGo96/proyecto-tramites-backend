import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {SolicitudQueries} from '../queries/solicitud.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';
import {DocumentacionComplementariaQueries} from "../queries/documentacion_complementaria.query";

export class DocumentacionComplementariaController {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionComplementariaQueries: DocumentacionComplementariaQueries = new DocumentacionComplementariaQueries()
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

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumento = await DocumentacionComplementariaController.documentacionComplementariaQueries.create({
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
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
        const createLogContribuyente = await DocumentacionComplementariaController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentacion complementaria',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async updateDocumentacionComplementaria(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentoAnuenciaId = req.params.documento_anuencia_id === null ? null : validator.isEmpty(req.params.documento_anuencia_id) ?
            errors.push({message: 'Favor de proporcionar el documento'}) : req.params.documento_anuencia_id

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

        const createDocumento = await DocumentacionComplementariaController.documentacionComplementariaQueries.update({
            id: documentoAnuenciaId,
            documentacion_id: documentacionId,
            solicitud_id: solicitudId,
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
        const createLogContribuyente = await DocumentacionComplementariaController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a agregado un documento al requerimiento de documentacion complementaria',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

}
