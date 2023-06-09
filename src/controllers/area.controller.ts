import validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {AreaQueries} from '../queries/area.query';
import {Log} from '../helpers/logs';
import {Roles} from "../enums/roles";

export class AreaController {
    static areaQueries: AreaQueries = new AreaQueries()
    static log: Log = new Log()

    public async show(req: Request, res: Response) {
        // const administradorId = req.body.administrador_id
        const errors = [];

        const areaUuid = req.params.uuid == null ? null : validator.isEmpty(req.params.uuid) ?
            errors.push({message: 'Favor de proporcionar el uuid del área.'}) : req.params.uuid

        const findedArea = await AreaController.areaQueries.findAreaByUUID({
            uuid: areaUuid
        })

        if (!findedArea.ok) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (findedArea === null) {
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
            area: findedArea.area
        })
    }

    public async index(req: Request, res: Response) {
        const auth = (req.body.rol === Roles.SUPERADMIN || req.body.rol === Roles.ADMINISTRADOR || req.body.rol === Roles.REVISOR);
        const adminInfo = req.body.adminInfo
        const errors = []
        const getAreas = await AreaController.areaQueries.getAreas({auth,  adminInfo})

        if (getAreas.ok === false) {
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
            areas: getAreas.areas
        })
    }

    public async store(req: Request, res: Response) {
        const administratorId = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({message: 'Favor de proporcionar el nombre del área'}) : body.nombre

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) === true ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const responsable: string = body.responsable == null || validator.isEmpty(body.responsable) === true ?
            errors.push({message: 'Favor de proporcionar al responsable'}) : body.responsable

        const telefono: string = body.telefono == null || validator.isEmpty(body.telefono) === true ?
            errors.push({message: 'Favor de proporcionar el número teléfono'}) : body.telefono

        const extension: string = body.extension == null || validator.isEmpty(body.extension) === true ?
            null : body.extension

        const email: string = body.email == null || validator.isEmpty(body.email) === true ?
            errors.push({message: 'Favor de proporcionar el email de contacto'}) : body.email

        const horario: string = body.horario == null || validator.isEmpty(body.horario) === true ?
            errors.push({message: 'Favor de proporcionar el horario de atención'}) : body.horario

        const ubicacion: string = body.ubicacion == null || validator.isEmpty(body.ubicacion) === true ?
            errors.push({message: 'Favor de proporcionar la ubicación'}) : body.ubicacion

        const uuid = uuidv4()

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (validator.isEmail(email) === false) {
            errors.push({message: 'Favor de respetar la nomenclatura del email.'})
        }

        if (!regex.test(nombre)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo nombre'})
        }

        if (!regex.test(responsable)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo responsable'})
        }

        if (validator.isNumeric(telefono) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo de teléfono'})
        }

        if (extension != null && validator.isNumeric(extension) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo extensión'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findAreaByNombre = await AreaController.areaQueries.findAreaByNombre({nombre})

        if (findAreaByNombre.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el área proporcionada.'})
        } else if (findAreaByNombre.area != null) {
            errors.push({message: 'El área proporcionada ya existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createArea = await AreaController.areaQueries.create({
            administratorId,
            nombre,
            descripcion,
            responsable,
            telefono,
            extension,
            email,
            horario,
            ubicacion,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            uuid
        })

        if (createArea.ok === false) {
            errors.push({message: 'Existen problemas al momento de dar de alta el área.'})
        }

        const createLogAdministrador = await AreaController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha creado una nueva área',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha dado de alta el área proporcionada'
        })
    }

    public async update(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const areaUuid = req.params.area_uuid == null ? null : validator.isEmpty(req.params.area_uuid) ?
            errors.push({message: 'Favor de proporcionar el área'}) :
            req.params.area_uuid

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({message: 'Favor de proporcionar el nombre del área'}) : body.nombre

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) === true ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const responsable: string = body.responsable == null || validator.isEmpty(body.responsable) === true ?
            errors.push({message: 'Favor de proporcionar al responsable'}) : body.responsable

        const telefono: string = body.telefono == null || validator.isEmpty(body.telefono) === true ?
            errors.push({message: 'Favor de proporcionar el número teléfono'}) : body.telefono

        const extension: string = body.extension == null || validator.isEmpty(body.extension) === true ?
            null : body.extension

        const email: string = body.email == null || validator.isEmpty(body.email) === true ?
            errors.push({message: 'Favor de proporcionar el email de contacto'}) : body.email

        const horario: string = body.horario == null || validator.isEmpty(body.horario) === true ?
            errors.push({message: 'Favor de proporcionar el horario de atención'}) : body.horario

        const ubicacion: string = body.ubicacion == null || validator.isEmpty(body.ubicacion) === true ?
            errors.push({message: 'Favor de proporcionar la ubicación'}) : body.ubicacion

        // const activo: string = body.activo == null || validator.isEmpty(body.activo) === true ?
        //     errors.push({message: 'Favor de proporcionar si el area esta activa'}) : body.activo

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (validator.isEmail(email) === false) {
            errors.push({message: 'Favor de respetar la nomenclatura del email.'})
        }

        if (!regex.test(nombre)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo nombre'})
        }

        if (!regex.test(responsable)) {
            errors.push({message: 'Favor de solo proporcionar letras para el campo responsable'})
        }

        if (validator.isNumeric(telefono) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo de teléfono'})
        }

        // if (validator.isNumeric(activo) === false) {
        //     errors.push({message: 'Favor de solo proporcionar números para el campo de activo'})
        // }

        // if (activo !== "1" && activo !== "0") {
        //     errors.push({message: 'Favor de solo proporcionar un valor valido para el campo de activo'})
        // }

        if (extension !== null && validator.isNumeric(extension) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo extensión'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findAreaByUUID = await AreaController.areaQueries.findAreaByUUID({uuid: areaUuid})

        if (findAreaByUUID.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el área proporcionada.'})
        } else if (findAreaByUUID.area == null) {
            errors.push({message: 'El área proporcionada no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Actualizamos la información proporcionada */
        const updateArea = await AreaController.areaQueries.update({
            id: findAreaByUUID.area ? findAreaByUUID.area.id : false,
            nombre,
            descripcion,
            responsable,
            telefono,
            extension,
            email,
            horario,
            ubicacion
        })

        if (updateArea.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el área proporcionada.'})
        }

        const createLogAdministrador = await AreaController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha actualizado la información del área',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha actualizado la información del área'
        })

    }
}
