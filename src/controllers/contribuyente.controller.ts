import * as bcrypt from 'bcrypt';
import * as validator from 'validator';
import moment from 'moment';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Log } from '../helpers/logs';
import { Mailer } from '../helpers/mailer';
import { Axios } from '../helpers/axios';
import { ContribuyenteQueries } from '../queries/contribuyente.query';
import {SmsMangerHelper} from "../helpers/sms-manger.helper";

export class ContribuyenteController {
    static salt = bcrypt.genSaltSync(Number(process.env.NO_SALT));
    static log: Log = new Log()
    static mailer: Mailer = new Mailer()
    static smsTwilio: SmsMangerHelper = new SmsMangerHelper()
    static contribuyenteQueries: ContribuyenteQueries = new ContribuyenteQueries()
    static axios: Axios = new Axios()

    public async show(req: Request, res: Response) {
        const contribuyente_id = req.body.contribuyente_id
        const errors = []
        const findContribuyenteById = await ContribuyenteController.contribuyenteQueries.findContribuyenteById({
            id: contribuyente_id
        })

        if (findContribuyenteById.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteById.contribuyente == null) {
            errors.push({ message: 'El contribuyente proporcionado no se encuentra dado de alta en el sistema.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            contribuyente: findContribuyenteById.contribuyente
        })
    }

    public async active(req: Request, res: Response) {
        const body = req.body
        const errors = []

        const codigoActivacion = req.params.codigo_activacion == null ? null : validator.isEmpty(req.params.codigo_activacion) ?
            errors.push({ message: 'Favor de proporcionar el código de activación' }) :
            req.params.codigo_activacion

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        /** Verificamos que el contribuyente no haya sido dado de alta anteriormente */
        const findContribuyenteByCodAct = await ContribuyenteController.contribuyenteQueries.findContribuyenteByCodAct({
            codigo_activacion: codigoActivacion
        })

        if (findContribuyenteByCodAct.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el código esta dado de alta.' })
        } else if (findContribuyenteByCodAct.contribuyente === null) {
            errors.push({ message: 'El codigo proporcionado no se encuentra dado de alta en el sistema.' })
        } else if (findContribuyenteByCodAct.contribuyente && findContribuyenteByCodAct.contribuyente.activo !== 0) {
            errors.push({ message: 'El codigo proporcionado ya no es valido.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const activeContribuyente = await ContribuyenteController.contribuyenteQueries.active({
            id: findContribuyenteByCodAct.contribuyente ? findContribuyenteByCodAct.contribuyente.id : false
        })

        if (activeContribuyente.ok === false) {
            errors.push({ message: 'Existen problemas al momento de activar su cuenta, favor de ponerse en contacto con soporte.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: findContribuyenteByCodAct.contribuyente ? findContribuyenteByCodAct.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente activo su cuenta',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Su cuenta ha sido activada de forma correcta, favor de iniciar sesión'
        })
    }

    public async store(req: Request, res: Response) {
        const body = req.body || false;
        const errors = [];
        const countryCode: string = '+52'
        const codigo_activacion = moment().unix()

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({ message: 'Favor de proporcionar su nombre' }) : body.nombre

        const apellidos: string = body.apellidos == null || validator.isEmpty(body.apellidos) === true ?
            errors.push({ message: 'Favor de proporcionar su(s) apellidos.' }) : body.apellidos

        const email: string = body.email == null || validator.isEmpty(body.email) === true ?
            errors.push({ message: 'Favor de proporcionar su email.' }) : body.email

        const reEmail: string = body.re_email == null || validator.isEmpty(body.re_email) === true ?
            errors.push({ message: 'Favor de proporcionar la confirmación del email.' }) : body.re_email

        const password: string = body.password == null || validator.isEmpty(body.password) === true ?
            errors.push({ message: 'Favor de proporcionar su contraseña.' }) : body.password

        const rePassword: string = body.re_password == null || validator.isEmpty(body.re_password) === true ?
            errors.push({ message: 'Favor de confirmar su contraseña.' }) : body.re_password

        const telefono: string = body.telefono == null || validator.isEmpty(body.telefono+ '') === true ?
            errors.push({ message: 'Favor de proporcionar su teléfono.' }) :  body.telefono

        // const telefonoReferencia: string = body.telefono_referencia == null || validator.isEmpty(body.telefono_referencia) === true ?
        //     errors.push({ message: 'Favor de proporcionar su teléfono de referencia.' }) : body.telefono_referencia

        const rfc: string = body.rfc == null || validator.isEmpty(body.rfc) === true ?
            errors.push({ message: 'Favor de proporcionar su RFC.' }) : body.rfc

        const genero: string = body.genero == null || validator.isEmpty(body.genero) === true ?
            errors.push({ message: 'Favor de proporcionar su género.' }) : body.genero

        const edad: string = body.edad == null || validator.isEmpty(body.edad) === true ?
            errors.push({ message: 'Favor de proporcionar su rango de edad.' }) : body.edad

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (validator.isEmail(email) === false) {
            errors.push({ message: 'Favor de respetar la nomenclatura del email.' })
        }

        if (!regex.test(nombre)) {
            errors.push({ message: 'Favor de solo proporcionar letras para el campo nombre' })
        }

        if (!regex.test(apellidos)) {
            errors.push({ message: 'Favor de solo proporcionar letras para el campo de apellido(s)' })
        }

        if (validator.isNumeric(telefono) === false) {
            errors.push({ message: 'Favor de solo proporcionar números para el campo de teléfono' })
        }

        // if (validator.isNumeric(telefonoReferencia) === false) {
        //     errors.push({ message: 'Favor de solo proporcionar números para el campo de teléfono referencia' })
        // }

        if (genero !== "1" && genero !== "0") {
            errors.push({ message: 'Favor de solo proporcionar un género valido' })
        }

        if (edad !== "1" && edad !== "2" && edad !== "3") {
            errors.push({ message: 'Favor de solo proporcionar un rango de edad valido' })
        }

        if ((Array.from(password).length < 5)) {
            errors.push({ message: 'La contraseña debe tener al menos 5 dígitos' })
        }

        if (password !== rePassword) {
            errors.push({ message: 'La contraseñas proporcionadas no coinciden' })
        }

        if (email !== reEmail) {
            errors.push({ message: 'Los correos electrónicos proporcionados no coinciden' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findContribuyenteByEmail = await ContribuyenteController.contribuyenteQueries.findContribuyenteByEmail({ email })

        if (findContribuyenteByEmail.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteByEmail.contribuyente != null) {
            errors.push({ message: 'El email proporcionado ya se encuentra dado de alta en el sistema.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createContribuyente = await ContribuyenteController.contribuyenteQueries.create({
            uuid: uuidv4(),
            nombre,
            apellidos,
            email,
            password: bcrypt.hashSync(password, ContribuyenteController.salt),
            telefono: countryCode + telefono,
            rfc,
            genero,
            edad,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            codigo_activacion,
            activo: 0,
        })

        if (createContribuyente.ok === false) {
            errors.push({ message: 'Existen problemas al momento de dar de alta su cuenta, intente más tarde' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const smsMessage = 'Ingresa el siguiente código para activar tu cuenta: ' + codigo_activacion

        const sendSMS = await ContribuyenteController.smsTwilio.sendSMS(countryCode + telefono, smsMessage);

        /* const options = {
            data: {
                'email': email,
                'code': createContribuyente.contribuyente ? createContribuyente.contribuyente.codigoActivacion : false
            },
            url: 'http://144.126.219.159/delivery/api/mail/activation',
            method: 'POST'
        }

        const sendEmail = await ContribuyenteController.axios.getResponse(options) */

        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: createContribuyente.contribuyente ? createContribuyente.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente se ha dado de alta en el sistema',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            codigo_activacion,
            message: 'Favor de revisar su celular para activar su cuenta '
        })
    }

    public async restoreRequest(req: Request, res: Response) {
        const contribuyente_id = req.body.contribuyente_id;
        const errors = [];
        const body = req.body;

        const email: string = body.email == null || validator.isEmpty(body.email) === true ?
            errors.push({ message: 'Favor de proporcionar su email.' }) : body.email

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (validator.isEmail(email) === false) {
            errors.push({ message: 'Favor de respetar la nomenclatura del email.' })
        }
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        const findContribuyenteByEmail = await ContribuyenteController.contribuyenteQueries.findContribuyenteByEmail({ email })

        if (findContribuyenteByEmail.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteByEmail.contribuyente == null) {
            errors.push({ message: 'El email proporcionado no esta dado de alta en el sistema.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const restablecerPassword = moment().unix()

        const restoreRequest = await ContribuyenteController.contribuyenteQueries.restoreRequest({
            restablecer_password: restablecerPassword,
            id: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.id : false
        })

        if (restoreRequest.ok === false) {
            errors.push({ message: 'Existen problemas al momento de realizar la solicitud de restauración de contraseña.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const smsMessage = 'Ingresa al siguiente link para cambiar tu contraseña: ' + 'http://66.175.238.197/usuario_tramites/restablecer/' + findContribuyenteByEmail.contribuyente.restablecerPassword

        const sendSMS = await ContribuyenteController.smsTwilio.sendSMS(findContribuyenteByEmail.contribuyente.telefono, smsMessage);

        if (sendSMS.ok === false) {
            errors.push({ message: 'Existen problemas al momento de enviar link para cambiar contraseña, intente más tarde.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /* const options = {
            data: {
                'email': email,
                'code': restablecerPassword
            },
            url: 'http://144.126.219.159/delivery/api/mail/reset',
            method: 'POST'
        }

        const sendEmail = await ContribuyenteController.axios.getResponse(options) */

        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: findContribuyenteByEmail.contribuyente ? findContribuyenteByEmail.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente solicito restablecer su contraseña',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha enviado los pasos a seguir para restablecer su contraseña'
        })

    }

    public async restorePassword(req: Request, res: Response) {
        const errors = [];
        const body = req.body;

        const codigo: string = body.codigo == null || validator.isEmpty(body.codigo) == true ?
            errors.push({ message: 'Favor de proporcionar su codigo.' }) : body.codigo

        const password: string = body.password == null || validator.isEmpty(body.password) == true ?
            errors.push({ message: 'Favor de proporcionar su nueva contraseña.' }) : body.password

        const rePassword: string = body.re_password == null || validator.isEmpty(body.re_password) == true ?
            errors.push({ message: 'Favor de proporcionar la confirmación de la contraseña.' }) : body.re_password

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (password !== rePassword) {
            errors.push({ message: 'Las contraseñas proporcionadas no coinciden.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findContribuyenteByCambioPassword = await ContribuyenteController.contribuyenteQueries.findContribuyenteByCambioPassword({
            restablecer_password: codigo
        })

        if (findContribuyenteByCambioPassword.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el código esta dado de alta.' })
        } else if (findContribuyenteByCambioPassword.contribuyente == null) {
            errors.push({ message: 'El codigo proporcionado no se encuentra dado de alta en el sistema.' })
        } else if (findContribuyenteByCambioPassword.contribuyente.cambioPassword !== 1) {
            errors.push({ message: 'Usted no ha solicitado hacer un cambio de contraseña, favor de ponerse en contacto con el administrador.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const changePassword = await ContribuyenteController.contribuyenteQueries.changePassword({
            password: bcrypt.hashSync(password, ContribuyenteController.salt),
            id: findContribuyenteByCambioPassword.contribuyente ? findContribuyenteByCambioPassword.contribuyente.id : false
        })

        if (changePassword.ok === false) {
            errors.push({ message: 'Existen problemas al momento de cambiar su contraseña.' })
        }

        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: findContribuyenteByCambioPassword.contribuyente ? findContribuyenteByCambioPassword.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente cambio su contraseña',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha cambiado su contraseña, favor de iniciar sesión'
        })
    }

    public async forward(req: Request, res: Response) {
        const body = req.body;
        const errors = [];
        const email: string = body.email === null || validator.isEmpty(body.email) === true ? errors.push({ message: 'Favor de proporcionar su email.' }) : body.email
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        if (validator.isEmail(email) === false) {
            errors.push({ message: 'Favor de respetar la nomenclatura del email.' })
        }
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        const findContribuyenteByEmail = await ContribuyenteController.contribuyenteQueries.findContribuyenteByEmail({ email })

        if (findContribuyenteByEmail.ok === false) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteByEmail.contribuyente == null) {
            errors.push({ message: 'El email proporcionado no se encuentra dado de alta en el sistema.' })
        } else if (findContribuyenteByEmail.contribuyente.activo != 0) {
            errors.push({ message: 'Su cuenta ya se encuentra activa.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const smsMessage = 'Ingresa el siguiente código para activar tu cuenta: ' + findContribuyenteByEmail.contribuyente.codigo_activacion

        const sendSMS = await ContribuyenteController.smsTwilio.sendSMS(findContribuyenteByEmail.contribuyente.telefono, smsMessage);

        if (sendSMS.ok === false) {
            errors.push({ message: 'Existen problemas al momento de reeenviar el código de activación, intente más tarde.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Favor de revisar su celular para activar su cuenta '
        })
    }

    public async update(req: Request, res: Response) {
        const body = req.body;
        const errors = [];

        const contribuyenteUuid = req.params.contribuyente_uuid == null ? null : validator.isEmpty(req.params.contribuyente_uuid) ?
            errors.push({ message: 'Favor de proporcionar al contribuyente' }) :
            req.params.contribuyente_uuid

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({ message: 'Favor de proporcionar su nombre' }) : body.nombre

        const apellidos: string = body.apellidos == null || validator.isEmpty(body.apellidos) ?
            errors.push({ message: 'Favor de proporcionar su(s) apellidos.' }) : body.apellidos

        const email: string = body.email == null || validator.isEmpty(body.email) ?
            errors.push({ message: 'Favor de proporcionar su email.' }) : body.email

        const password: string = body.password == null || validator.isEmpty(body.password) ?
            null : body.password

        const rePassword: string = body.re_password == null || validator.isEmpty(body.re_password) ?
            null : body.re_password

        const telefono: string = body.telefono == null || validator.isEmpty(body.telefono) ?
            errors.push({ message: 'Favor de proporcionar su teléfono.' }) : body.telefono

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (!validator.isEmail(email)) {
            errors.push({ message: 'Favor de respetar la nomenclatura del email.' })
        }

        if (!regex.test(nombre)) {
            errors.push({ message: 'Favor de solo proporcionar letras para el campo nombre' })
        }

        if (!regex.test(apellidos)) {
            errors.push({ message: 'Favor de solo proporcionar letras para el campo de apellido(s)' })
        }

        if (!validator.isNumeric(telefono)) {
            errors.push({ message: 'Favor de solo proporcionar números para el campo de teléfono' })
        }

        if (password != null && (Array.from(password).length < 5)) {
            errors.push({ message: 'La contraseña debe tener al menos 5 dígitos' })
        }

        if (password != null && password !== rePassword) {
            errors.push({ message: 'La contraseñas proporcionadas no coinciden' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Verificamos que el contribuyente no haya sido dado de alta anteriormente */
        const findContribuyenteByUUID = await ContribuyenteController.contribuyenteQueries.findContribuyenteByUUID({
            uuid: contribuyenteUuid
        })

        if (!findContribuyenteByUUID.ok) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteByUUID.contribuyente === null) {
            errors.push({ message: 'El contribuyente proporcionado no se encuentra dado de alta en el sistema.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const updateContribuyente = await ContribuyenteController.contribuyenteQueries.update({
            nombre,
            apellidos,
            email,
            password: (password != null) ? bcrypt.hashSync(password, ContribuyenteController.salt) : findContribuyenteByUUID.contribuyente ? findContribuyenteByUUID.contribuyente.password : false,
            telefono,
            id: findContribuyenteByUUID.contribuyente ? findContribuyenteByUUID.contribuyente.id : false
        })

        if (!updateContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de actualizar la información del cliente.' })
        }

        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: findContribuyenteByUUID.contribuyente ? findContribuyenteByUUID.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente actualizo su información',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se actualizo la información de forma exitosa'
        })
    }

    public async drop(req: Request, res: Response) {
        const body = req.body;
        const errors = [];

        const contribuyenteUuid = req.params.contribuyente_uuid == null ? null : validator.isEmpty(req.params.contribuyente_uuid) ?
            errors.push({ message: 'Favor de proporcionar al contribuyente' }) :
            req.params.contribuyente_uuid

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Verificamos que el contribuyente no haya sido dado de alta anteriormente */
        const findContribuyenteByUUID = await ContribuyenteController.contribuyenteQueries.findContribuyenteByUUID({
            uuid: contribuyenteUuid
        })

        if (!findContribuyenteByUUID.ok) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        } else if (findContribuyenteByUUID.contribuyente === null) {
            errors.push({ message: 'El contribuyente proporcionado no se encuentra dado de alta en el sistema.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Verificamos que el contribuyente no haya sido dado de alta anteriormente */
        const dropContribuyente = await ContribuyenteController.contribuyenteQueries.drop({
            id: findContribuyenteByUUID.contribuyente ? findContribuyenteByUUID.contribuyente.id : false,
            fecha_baja: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        if (!dropContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de verificar si el contribuyente esta dado de alta.' })
        }
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        const createLogContribuyente = await ContribuyenteController.log.contribuyente({
            contribuyente_id: findContribuyenteByUUID.contribuyente ? findContribuyenteByUUID.contribuyente.id : false,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente se dio de baja en el sistema',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se cuenta se ha dado de baja, a continuación su sesión expirará'
        })
    }

    /** Función para reenviar codigo de activación */
    public async resendActivationCode(req: Request, res: Response) {
        const findContribuyentesInactive = await ContribuyenteController.contribuyenteQueries.findContribuyentesInactive()

        if (findContribuyentesInactive.contribuyentes && findContribuyentesInactive.contribuyentes.length > 0) {
            findContribuyentesInactive.contribuyentes.forEach(async (contribuyente) => {
                const options = {
                    data: {
                        'email': contribuyente.email,
                        'code': contribuyente.codigo_activacion
                    },
                    url: 'http://144.126.219.159/delivery/api/mail/activation',
                    method: 'POST'
                }

                const sendEmail = await ContribuyenteController.axios.getResponse(options)
            });
        }

        return res.status(200).json({
            ok: true
        })
    }
}
