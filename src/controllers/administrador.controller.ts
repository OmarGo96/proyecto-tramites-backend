import * as bcrypt from 'bcrypt';
import * as validator from 'validator';
import moment from 'moment';
import {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import {AreaQueries} from '../queries/area.query';
import {AdministratorQueries} from '../queries/administrator.query';
import {AdministradorAreaQueries} from '../queries/administrador_area.query';
import {Log} from '../helpers/logs';
import {Roles} from "../enums/roles";

export class AdministradorController {
    static salt = bcrypt.genSaltSync(Number(process.env.NO_SALT))
    static log: Log = new Log()
    static areaQueries: AreaQueries = new AreaQueries()
    static administradorQueries: AdministratorQueries = new AdministratorQueries()
    static administradorAreaQueries: AdministradorAreaQueries = new AdministradorAreaQueries()

    public async show(req: Request, res: Response) {
        const administradorId = req.body.administrador_id
        const errors = []

        const findAdministradorById = await AdministradorController.administradorQueries.findAdministradorById({
            id: administradorId
        })

        if (findAdministradorById.ok === false) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (findAdministradorById.administrator == null) {
            errors.push({message: 'El administrador proporcionado no se encuentra dado de alta en el sistema.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            administrador: findAdministradorById.administrator
        })
    }

    public async index(req: Request, res: Response) {
        const adminInfo = req.body.adminInfo;
        const errors = [];
        console.log(adminInfo.AdministradorArea[0].areas_id)
        const getAdministradores = await AdministradorController.administradorQueries.getAdministrators({id: adminInfo.id, areas_id: adminInfo.AdministradorArea[0].areas_id});

        if (getAdministradores.ok === false) {
            errors.push({message: 'Existen problemas al momento de obtener a los usuarios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        return res.status(200).json({
            ok: true,
            administradores: getAdministradores.administrators
        })
    }

    public async store(req: Request, res: Response) {
        const administradorId = req.body.administrador_id;
        const body = req.body;
        const errors = [];
        const areas: any = [];

        const rol: number = body.rol == null || validator.isEmpty(body.rol + '') ?
            errors.push({message: 'Favor de proporcionar el rol'}) : Number(body.rol)

        const areaUuid: string = body.area_uuid == null ?
            null : body.area_uuid

        /*areas = (body.areas == null) ? null : body.areas*/

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar su nombre'}) : body.nombre

        const apellidos: string = body.apellidos == null || validator.isEmpty(body.apellidos) ?
            errors.push({message: 'Favor de proporcionar su(s) apellidos.'}) : body.apellidos

        const usuario: string = body.usuario == null || validator.isEmpty(body.usuario) ?
            errors.push({message: 'Favor de proporcionar el usuario con el que se dara de alta.'}) : body.usuario

        const password: string = body.password == null || validator.isEmpty(body.password) ?
            errors.push({message: 'Favor de proporcionar su contraseña.'}) : body.password

        const rePassword: string = body.re_password == null || validator.isEmpty(body.re_password) ?
            errors.push({message: 'Favor de confirmar su contraseña.'}) : body.re_password

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (!validator.isNumeric(rol + '')) {
            errors.push({message: 'Favor de proporcionar un rol valido.'})
        }

        if (!regex.test(nombre)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo nombre'})
        }

        if (!regex.test(apellidos)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo de apellido(s)'})
        }

        if ((Array.from(password).length < 5)) {
            errors.push({message: 'La contraseña debe tener al menos 5 dígitos'})
        }

        if (password !== rePassword) {
            errors.push({message: 'La contraseñas proporcionadas no coinciden'})
        }

        // tslint:disable-next-line:radix
        if (!Object.values(Roles).includes(rol)) {
            errors.push({message: 'El rol proporcionado no existe.'})
        }

        /*if (rol === "2" && areas == null) {
            errors.push({message: 'Favor de proporcionar un array de areas para crear a este tipo de usuario.'})
        }*/

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        let singleFindAreaByUUID: any;
        let multiFindAreaByUUID: any;
        const areasBuscadas: any = [];
        if (areaUuid != null) {
            /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
            singleFindAreaByUUID = await AdministradorController.areaQueries.findAreaByUUID({uuid: areaUuid});

            if (singleFindAreaByUUID.ok === false) {
                errors.push({message: 'Existen problemas al momento de validar el área proporcionada.'})
            } else if (singleFindAreaByUUID.area == null) {
                errors.push({message: 'El área proporcionada no existe.'})
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
        }

        if (areas.length > 0) {
            for (const area of areas) {
                multiFindAreaByUUID = await AdministradorController.areaQueries.findAreaByUUID({uuid: area.uuid})

                if (multiFindAreaByUUID.ok === false) {
                    errors.push({message: 'Existen problemas al momento de validar el área proporcionada.'})
                } else if (multiFindAreaByUUID.area == null) {
                    errors.push({message: 'El área proporcionada no existe.'})
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        ok: false,
                        errors
                    })
                }
                areasBuscadas.push(multiFindAreaByUUID.area)
            }
        }

        const findAdministradorByUsuario = await AdministradorController.administradorQueries.findAdministradorByUsuario({usuario});

        if (!findAdministradorByUsuario.ok) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (findAdministradorByUsuario.administrator != null) {
            errors.push({message: 'El usuario proporcionado ya se encuentra dado de alta en el sistema.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Damos de alta al contribuyente en la base de datos */
        const createAdministrador = await AdministradorController.administradorQueries.create({
            uuid: uuidv4(),
            rol,
            nombre,
            apellidos,
            usuario,
            password: bcrypt.hashSync(password, AdministradorController.salt),
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (!createAdministrador.ok) {
            errors.push({message: 'Existen problemas al momento de dar de alta su cuenta, intente más tarde'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        let createAdministradorArea: any

        if (areaUuid != null) {
            createAdministradorArea = await AdministradorController.administradorAreaQueries.create({
                administrador_id: createAdministrador.administrator ? createAdministrador.administrator.id : false,
                area_id: singleFindAreaByUUID.area.id
            })

            if (createAdministradorArea.ok === false) {
                errors.push({message: 'Existen problemas al momento de dar de alta su cuenta, intente más tarde'})
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
        }

        if (areasBuscadas.length > 0) {
            for (const area of areasBuscadas) {
                createAdministradorArea = await AdministradorController.administradorAreaQueries.create({
                    administrador_id: createAdministrador.administrator ? createAdministrador.administrator.id : false,
                    area_id: area.id
                })

                if (createAdministradorArea.ok === false) {
                    errors.push({message: 'Existen problemas al momento de dar de alta su cuenta, intente más tarde'})
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        ok: false,
                        errors
                    })
                }
            }
        }

        const createLogAdministrador = await AdministradorController.log.administrador({
            administrador_id: administradorId,
            navegador: req.headers['user-agent'],
            accion: 'Se ha dado de alta al administrador',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha dado de alta al usuario'
        })
    }

    public async update(req: Request, res: Response) {
        const body = req.body;
        const errors = [];

        const administradorUuid = req.params.administrador_uuid == null ? null : validator.isEmpty(req.params.administrador_uuid) ?
            errors.push({message: 'Favor de proporcionar al administrador'}) :
            req.params.administrador_uuid

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({message: 'Favor de proporcionar su nombre'}) : body.nombre

        const apellidos: string = body.apellidos == null || validator.isEmpty(body.apellidos) === true ?
            errors.push({message: 'Favor de proporcionar su(s) apellidos.'}) : body.apellidos

        const rol: number = body.rol == null || validator.isEmpty(body.rol + '') === true ?
            errors.push({message: 'Favor de proporcionar su rol.'}) : Number(body.rol)

        const usuario: string = body.usuario == null || validator.isEmpty(body.usuario) === true ?
            errors.push({message: 'Favor de proporcionar el usuario.'}) : body.usuario

        const activo: string = body.activo == null || validator.isEmpty(body.activo + '') === true ?
            errors.push({message: 'Favor de proporcionar si el usuario esta activo o inactivo'}) : body.activo

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

        if (!regex.test(apellidos)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo de apellido(s)'})
        }

        if (validator.isNumeric(rol + '') === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo de teléfono'})
        }

        if (!Object.values(Roles).includes(rol)) {
            errors.push({message: 'Favor de solo proporcionar un rol valido'})
        }

        if (validator.isNumeric(activo) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo activo'})
        }

        if (activo !== "1" && activo !== "-1") {
            errors.push({message: 'Favor de solo proporcionar un valor para el modo activo valido'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findAdministradorByUUID = await AdministradorController.administradorQueries.findAdministradorByUUID({
            uuid: administradorUuid
        })

        if (findAdministradorByUUID.ok === false) {
            errors.push({message: 'Existen problemas al momento de verificar si el usuario esta dado de alta.'})
        } else if (findAdministradorByUUID.administrator == null) {
            errors.push({message: 'El usuario proporcionado no se encuentra dado de alta en el sistema.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const updateAdministrador = await AdministradorController.administradorQueries.update({
            nombre,
            apellidos,
            rol,
            activo,
            usuario,
            id: findAdministradorByUUID.administrator ? findAdministradorByUUID.administrator.id : false
        })

        if (updateAdministrador.ok === false) {
            errors.push({message: 'Existen problemas al momento de actualizar la información del administrador.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogAdministrador = await AdministradorController.log.administrador({
            administrador_id: findAdministradorByUUID.administrator ? findAdministradorByUUID.administrator.id : false,
            navegador: req.headers['user-agent'],
            accion: 'Se ha modificado la informacion del administrador',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se actualizo la información de forma exitosa'
        })
    }
}
