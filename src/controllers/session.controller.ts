import moment from 'moment'
import * as bcrypt from 'bcrypt';
import validator from 'validator';
import {Request, Response} from 'express'
import {AdministratorQueries} from '../queries/administrator.query'
import {ContribuyenteQueries} from '../queries/contribuyente.query'
import {Payload} from '../helpers/payload'
import {Log} from '../helpers/logs'

export class SessionController {

    static log: Log = new Log()
    static administradorQueries: AdministratorQueries = new AdministratorQueries()
    static contribuyenteQueries: ContribuyenteQueries = new ContribuyenteQueries()
    static payload: Payload = new Payload()

    public async contribuyente(req: Request, res: Response) {
        const body = req.body
        const errors = []

        const email: string = body.email == null || validator.isEmpty(body.email) ?
            errors.push({message: 'Favor de proporcionar su email con el que se dio de alta.'}) : body.email

        const password: string = body.password == null || validator.isEmpty(body.password) ?
            errors.push({message: 'Favor de proporcionar la contraseña.'}) : body.password

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (!validator.isEmail(email)) {
            errors.push({message: 'Favor de respetar la nomenclatura del email.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findContribuyenteByEmail = await SessionController.contribuyenteQueries.findContribuyenteByEmail({email});

        if (findContribuyenteByEmail.ok === false) {
            errors.push({message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.'})
        } else if (findContribuyenteByEmail.contribuyente == null) {
            errors.push({message: 'El email proporcionado no se encuentra dado de alta en el sistema.'})
        } else if (findContribuyenteByEmail.contribuyente !== null &&
            bcrypt.compareSync(password, findContribuyenteByEmail.contribuyente.password) === false) {
            errors.push({message: 'Las credenciales no coinciden, favor de proporcionarlas de nuevo.'})
        } else if (findContribuyenteByEmail.contribuyente.activo === 0) {
            errors.push({message: 'Su cuenta aún no ha sido verificada'})
        } else if (findContribuyenteByEmail.contribuyente.activo === -1) {
            errors.push({message: 'Su cuenta esta dado de baja'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Creamos el JWT correspondiente */
        const result = await SessionController.payload.createToken({
            user_type: 'contribuyente',
            contribuyente_id: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.id.toString() : false
        })

        if (result && !result.ok) {
            errors.push({message: 'Existen problemas al momento de crear el token de autenticación.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await SessionController.log.contribuyente({
            contribuyente_id: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a iniciado sesión',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        // @ts-ignore
        return res.status(200).json({
            ok: true,
            token: result ? result.token : false,
            activo: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.activo === 1 ? true : false : false,
            cambio_password: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.cambioPassword === 1 ? true : false : false,
            message: "Inicio de sesión"
        })
    }

    public async administrador(req: Request, res: Response) {
        const body = req.body
        const errors = []

        const usuario: string = body.usuario == null || validator.isEmpty(body.usuario) === true ?
            errors.push({message: 'Favor de proporcionar su usuario.'}) : body.usuario

        const password: string = body.password == null || validator.isEmpty(body.password) === true ?
            errors.push({message: 'Favor de proporcionar la contraseña.'}) : body.password

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findAdministradorByUsuario = await SessionController.administradorQueries.findAdministradorByUsuario({usuario});

        if (findAdministradorByUsuario.ok === false) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (findAdministradorByUsuario.administrator == null) {
            errors.push({message: 'El email proporcionado no se encuentra dado de alta en el sistema.'})
        } else if (findAdministradorByUsuario.administrator != null &&
            bcrypt.compareSync(password, findAdministradorByUsuario.administrator.password) === false) {
            errors.push({message: 'Las credenciales no coinciden, favor de proporcionarlas de nuevo.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const result = await SessionController.payload.createToken({
            user_type: 'administrador',
            administrador_id: findAdministradorByUsuario.administrator ? findAdministradorByUsuario.administrator.id : false,
            rol: findAdministradorByUsuario.administrator ? findAdministradorByUsuario.administrator.rol : false
        })

        if (result && result.ok === false) {
            errors.push({message: 'Existen problemas al momento de crear el token de autenticación.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogAdministrador = await SessionController.log.administrador({
            administrador_id: findAdministradorByUsuario.administrator ? findAdministradorByUsuario.administrator.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El administrador a iniciado sesión',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            token: result ? result.token : false,
            name: findAdministradorByUsuario.administrator.nombre + ' ' + findAdministradorByUsuario.administrator.apellidos,
            dependencia: (findAdministradorByUsuario.administrator['Area']) ? findAdministradorByUsuario.administrator['Area'].nombre : 'Todas las direcciones',
            rol: findAdministradorByUsuario.administrator ? findAdministradorByUsuario.administrator.rol : false,
            message: "Inicio de sesión"
        })
    }

    public async checkPayload(req: Request, res: Response) {
        return res.status(200).json({
            ok: true
        })
    }

}
