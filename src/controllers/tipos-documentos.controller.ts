import validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {ServicioQueries} from '../queries/servicio.query';
import {DocumentoServicioQueries} from '../queries/documento_servicio.query';
import {TiposDocumentosQueries} from '../queries/tipos-documentos.query';
import {AreaQueries} from '../queries/area.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';
import {DocumentosTiposQueries} from "../queries/documentos-tipos.query";

export class TiposDocumentosController {
    static areaQueries: AreaQueries = new AreaQueries();
    static servicioQueries: ServicioQueries = new ServicioQueries();
    static tiposDocumentoQueries: TiposDocumentosQueries = new TiposDocumentosQueries();
    static documentosTiposQueries: DocumentosTiposQueries = new DocumentosTiposQueries();
    static documentoServicioQueries: DocumentoServicioQueries = new DocumentoServicioQueries();
    static log: Log = new Log()
    static file: File = new File();

    public async index(req: Request, res: Response) {
        const auth = req.body.auth
        const errors = []
        const tiposDocumentos = await TiposDocumentosController.tiposDocumentoQueries.getTiposDocumentos({auth})

        if (!tiposDocumentos.ok) {
            errors.push({message: 'Existen problemas al momento de obtener las áreas.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            documentos: tiposDocumentos.documentos
        })
    }

    public async store(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre'}) : body.nombre

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({message: 'Favor de proporcionar la clave'}) : body.clave

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const aprobacion: boolean = body.aprobacion

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (!regex.test(nombre)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo nombre'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentByNombre = await TiposDocumentosController.tiposDocumentoQueries.findDocumentByNombre({nombre})

        if (!findDocumentByNombre.ok) {
            errors.push({message: 'Existen problemas al momento de validar el tipo de documento proporcionado.'})
        } else if (findDocumentByNombre.document !== null) {
            errors.push({message: 'El tipo de documento proporcionado ya existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createDocumentType = await TiposDocumentosController.tiposDocumentoQueries.create({
            nombre,
            clave,
            descripcion,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            aprobacion
        })

        if (!createDocumentType.ok) {
            errors.push({message: 'Existen problemas al momento de dar de alta el área.'})
        }

        const createLogAdministrador = await TiposDocumentosController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha creado un nuevo tipo de documento',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha dado de alta el tipo de documento'
        })
    }

    public async tiposDocumentosList(req: Request, res: Response) {
        const auth = req.body.auth
        const errors = []
        const documento_tipo_id = req.params.documento_tipo_id == null ?
            errors.push({message: 'Favor de proporcionar el id del tipo documento'}) : req.params.documento_tipo_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const documentosTipos = await TiposDocumentosController.documentosTiposQueries.getDocumentosTiposByTipoDocumento_id({
            documento_tipo_id
        })

        if (!documentosTipos.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de obtener la lista de documentos'}]
            })
        }



        return res.status(200).json({
            ok: true,
            documentosTipos: documentosTipos.documentosTipos
        })
    }
}
