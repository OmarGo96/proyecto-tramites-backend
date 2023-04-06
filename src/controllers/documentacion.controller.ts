import * as validator from 'validator';
import moment from 'moment'
import { Request, Response } from 'express'
import { SolicitudQueries } from '../queries/solicitud.query'
import { ServicioQueries } from '../queries/servicio.query'
import { RequerimientoQueries } from '../queries/requerimiento.query'
import { DocumentacionQueries } from '../queries/documentacion.query'
import { DocumentoSolicitudRequisitoQueries } from '../queries/documento-solicitud-requisito.query'
import { Log } from '../helpers/logs'
import { File } from '../helpers/files'
import {DocumentacionPagoQueries} from "../queries/documentacion-pago.query";

export class DocumentacionController {
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionQueries: DocumentacionQueries = new DocumentacionQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
    static documentoSolicitudRequisitoQueries: DocumentoSolicitudRequisitoQueries = new DocumentoSolicitudRequisitoQueries()
    static documentacionPagoQueries: DocumentacionPagoQueries = new DocumentacionPagoQueries()
    static log: Log = new Log()
    static file: File = new File()

    /** Tipos de documentos
     * 0 = anexo,
     * 1 = pase a caja
     */

    /** Función que permite adjuntar un archivo a la documentación */

    public async index(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        const auth = req.body.auth;
        const errors = [];

        const findRequerimientosByContribuyente = await DocumentacionController.documentacionQueries.findRequerimientosByContribuyente({
            auth,
            contribuyente_id
        });

        if (!findRequerimientosByContribuyente.ok) {
            errors.push({message: 'Existen problemas al momento de obtener los requerimientos por servicio/trámite.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            documentacion: findRequerimientosByContribuyente.documentacion
        })
    }

    public async attachFile(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const tiposDocumentoId: string = body.tipos_documentos_id == null || validator.isEmpty(body.tipos_documentos_id) ?
            errors.push({ message: 'Favor de proporcionar el id del documento' }) : body.tipos_documentos_id;

        /*const contribuyentesId: string = body.contribuyentes_id == null || validator.isEmpty(body.contribuyentes_id) ?
            errors.push({ message: 'Favor de proporcionar el contribuy' }) : body.contribuyentes_id;*/

        const tipoDocumento: string = body.tipo_documento == null || validator.isEmpty(body.tipo_documento) ?
            errors.push({ message: 'Favor de proporcionar el tipo de documento' }) : body.tipo_documento;

        /*const vigenciaInicial: string = body.vigencia_inicial == null || validator.isEmpty(body.vigencia_inicial) ?
            errors.push({ message: 'Favor de proporcionar la vigencia inicial' }) : body.vigencia_inicial;*/

        const vigenciaFinal: string = body.vigencia_final == null || validator.isEmpty(body.vigencia_final + '') ?
            null : body.vigencia_final;

        const nombreDocumento: string = !body.nombre_documento || validator.isEmpty(body.nombre_documento) ?
            null: body.nombre_documento;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*if (tipoDocumento !== '0' && tipoDocumento !== '1') {
            errors.push({ message: 'Favor de proporcionar un tipo de documento valido' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        /*const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({
            id: documentacionId
        })

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar el id de la documentacion proporcionada.' })
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'Actualmente no existe el registro de la documentacion proporcionada' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        const uploadFile = await DocumentacionController.file.upload(req, null, 'documentacion')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: uploadFile.message }]
            })
        }

        const updateDocumentacion = await DocumentacionController.documentacionQueries.attachFile({
            tipos_documentos_id: Number(tiposDocumentoId),
            contribuyente_id,
            url: uploadFile.nameFile,
            nombre_otro: nombreDocumento,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            tipo_documento: tipoDocumento,
            vigencia_final: (vigenciaFinal) ? moment(vigenciaFinal).format('YYYY-MM-DD HH:mm:ss') : null,
            aprobado: 1,
            status: 1
        })

        if (!updateDocumentacion.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.' }]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentacionController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a adjuntado un nuevo documento a su cuenta',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async deleteDocument(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentacionId = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
            errors.push({ message: 'Favor de proporcionar el documento' }) :
            req.params.documentacion_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const deleteDoc = await DocumentacionController.documentacionQueries.changeStatus({
            id: documentacionId,
            status: 0
        })

        if (!deleteDoc.ok) {
            errors.push({ message: 'Existen problemas al momento de cambiar el estatus del documento.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await DocumentacionController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente elimino un documento de su cuenta',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el documento correctamente'
        })

    }

    public async getFile(req: Request, res: Response) {
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        if (req.body.auth === false) {
            errors.push({ message: 'Es neecsario la cabecera de autenticacion' })
        }

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
        const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({ id: documentacionId })

        if (!findDocumentacionById.ok) {
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

        const downloadFile = await DocumentacionController.file.download(findDocumentacionById.documentacion ? findDocumentacionById.documentacion.url : false, 'documentacion')

        if (!downloadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        return res.status(200).contentType('application/pdf').send(downloadFile.pdf)
    }

    public async changeStatus(req: Request, res: Response) {
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
        const findDocumentacionById = await DocumentacionController.documentoSolicitudRequisitoQueries.findDocumentacionById({ id: documentacionId });

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

        const changeStatus = await DocumentacionController.documentoSolicitudRequisitoQueries.changeStatus({
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

        const logAdministrador = await DocumentacionController.log.administrador({
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
    public async validarDocPago(req: Request, res: Response) {
        const administrador_id = req.body.administrador_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body

        const documentacionPagoId = req.params.documentacion_pago_id == null ? null : validator.isEmpty(req.params.documentacion_pago_id) ?
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
        const findDocumentacionPagoById = await DocumentacionController.documentacionPagoQueries.findDocumentacionPagoById({ id: documentacionPagoId });

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

        const changeStatus = await DocumentacionController.documentacionPagoQueries.changeStatus({
            id: documentacionPagoId,
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

        const logAdministrador = await DocumentacionController.log.administrador({
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
