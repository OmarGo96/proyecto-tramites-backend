import validator from 'validator';
import moment from 'moment'
import { Request, Response } from 'express'
import { MensajeQueries } from '../queries/mensaje.queries'
import { SolicitudQueries } from '../queries/solicitud.query'
import { File } from '../helpers/files'
import { Log } from '../helpers/logs'

export class MensajeController {
    static mensajeQueries: MensajeQueries = new MensajeQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static log: Log = new Log()
    static file: File = new File()

    /** Funcion pora obtener los mensajes no leidos por solicitud */
    public async getUnreadMessages(req: Request, res: Response) {
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []
        const getSolicitudesMessages = await MensajeController.mensajeQueries.findSolicitudesAndUnreadMessages();

        if (getSolicitudesMessages.ok === false) {
            errors.push({ message: 'Existen problemas al momento de obtener mensajes no leídos.' })
        } else if (getSolicitudesMessages.mensajes == null) {
            errors.push({ message: 'No se encontraron mensajes no leídos' })
        }

        return res.status(200).json({
            ok: true,
            message: "Mensaje no leídos",
            unreadMessages: getSolicitudesMessages.mensajes
        })
    }

    /** Función que permite dar de alta a un mensaje */
    public async getFile(req: Request, res: Response) {
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        if(req.body.auth === false){
            errors.push({ message: 'Es neecsario la cabecera de autenticacion' })
        }

        const mensajeId = req.params.mensaje_id == null ? null : validator.isEmpty(req.params.mensaje_id) ?
            errors.push({ message: 'Favor de proporcionar el mensaje' }) :
            req.params.mensaje_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findMensajeById = await MensajeController.mensajeQueries.findMensajeById({ id: mensajeId })

        if (findMensajeById.ok === false) {
            errors.push({ message: 'Existen problemas al momento de validar el mensaje  proporcionado.' })
        } else if (findMensajeById.mensaje == null) {
            errors.push({ message: 'El mensaje proporcionado no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const downloadFile = await MensajeController.file.download(findMensajeById.mensaje.url, 'mensaje')

        if (downloadFile.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        let ext = downloadFile.name.split(".").pop()

        if (ext == 'dwg') {
            return res.status(200).contentType('application/dwg').send(downloadFile.file)

        } else if (ext == 'dxf') {
            return res.status(200).contentType('application/dxf').send(downloadFile.file)

        } else {
            return res.status(200).contentType('application/pdf').send(downloadFile.file)
        }

    }

    /** Función que permite dar de alta a un mensaje */
    public async store(req: Request, res: Response) {
        /** Obtenemos al administrador que dio de alta el mensaje */
        const administrador_id = req.body.administrador_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const solicitudId: string = body.solicitud_id == null || validator.isEmpty(body.solicitud_id) === true ?
            errors.push({ message: 'Favor de proporcionar el solicitud_id' }) : body.solicitud_id

        const mensaje: string = body.mensaje == null || validator.isEmpty(body.mensaje) === true ?
            errors.push({ message: 'Favor de proporcionar su mensaje' }) : body.mensaje

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findSolicitudById = await MensajeController.solicitudQueries.findSolicitudById({
            id: solicitudId
        })

        if (findSolicitudById.ok === false) {
            errors.push({ message: 'Existen problemas al momento de obtener la solicitud proporcionada.' })
        } else if (findSolicitudById.solicitud == null) {
            errors.push({ message: 'La solicitud proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        let uploadFile: any = null

        if (req.files != null) {
            uploadFile = await MensajeController.file.upload(req, null, 'mensaje')

            if (uploadFile.ok === false) {
                return res.status(400).json({
                    ok: false,
                    errors: [{ message: uploadFile.message }]
                })
            }
        }

        const createMensaje = await MensajeController.mensajeQueries.create({
            solicitud_id: solicitudId,
            administrador_id,
            mensaje,
            url: (uploadFile != null) ? uploadFile.nameFile : null,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (createMensaje.ok === false) {
            errors.push({ message: 'Existen problemas al momento de guardar el mensaje.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogAdministrador = await MensajeController.log.administrador({
            administrador_id: req.body.administrador_id,
            navegador: req.headers['user-agent'],
            accion: 'El administrador adjunto un nuevo mensaje con el index: ' + createMensaje.mensaje.id,
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: "Mensaje enviado correctamente"
        })
    }

}
