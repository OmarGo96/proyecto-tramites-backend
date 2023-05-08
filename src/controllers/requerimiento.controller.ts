import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {ServicioQueries} from '../queries/servicio.query';
import {RequerimientoQueries} from '../queries/requerimiento.query';
import {RequisitosServiciosQueries} from '../queries/requisitos-servicios.query';
import {AreaQueries} from '../queries/area.query';
import {Log} from '../helpers/logs';

export class RequerimientoController {
    static areaQueries: AreaQueries = new AreaQueries()
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
    static requisitosServiciosQueries: RequisitosServiciosQueries = new RequisitosServiciosQueries()
    static log: Log = new Log()

    public async index(req: Request, res: Response) {
        const auth = req.body.auth;
        const errors = [];

        const findRequerimientosByServicio = await RequerimientoController.requisitosServiciosQueries.getRequerimientos();

        if (findRequerimientosByServicio.ok === false) {
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
            requerimientos: findRequerimientosByServicio.requerimientos
        })
    }

    public async getRequerimientosByServicio(req: Request, res: Response) {
        const auth = req.body.auth;
        const errors = [];

        const servicioUuid = req.params.servicio_uuid == null ? null : validator.isEmpty(req.params.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el área'}) :
            req.params.servicio_uuid

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioByUUID = await RequerimientoController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (findServicioByUUID.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el servicio proporcionado.'})
        } else if (findServicioByUUID.servicio == null) {
            errors.push({message: 'El servicio proporcionada no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findRequerimientosByServicio = await RequerimientoController.requisitosServiciosQueries.getRequerimientosByServicio({
            auth,
            servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false
        });

        if (findRequerimientosByServicio.ok === false) {
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
            requerimientos: findRequerimientosByServicio.requerimientos
        })
    }

    public async store(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const tiposDocumentosId: string = body.tipos_documentos_id == null || validator.isEmpty(body.tipos_documentos_id + '') ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.tipos_documentos_id

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio'}) : body.nombre

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const uuid = uuidv4();

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createRequisito = await RequerimientoController.requerimientoQueries.create({
            uuid,
            tiposDocumentosId,
            nombre,
            descripcion,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        });

        if (!createRequisito.ok) {
            errors.push({message: 'Existen problemas al momento de dar de alta el requisito.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha creado un nuevo requisito',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha dado de alta el requisito'
        })


    }

    public async update(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const requerimientoUuid = req.params.requerimiento_uuid == null || validator.isEmpty(req.params.requerimiento_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : req.params.requerimiento_uuid;

        const tiposDocumentosId: string = body.tipos_documentos_id === null || validator.isEmpty(req.body.tipos_documentos_id + '') ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.tipos_documentos_id;

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio'}) : body.nombre;

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }


        const updateRequerimiento = await RequerimientoController.requerimientoQueries.update({
            uuid: requerimientoUuid,
            tiposDocumentosId,
            nombre,
            descripcion,
        });

        if (!updateRequerimiento.ok) {
            errors.push({message: 'Existen problemas al momento de actualizar el requerimiento proporcionado.'})
        }

        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha actualizado la información del requerimiento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha actualizado la información del requerimiento'
        })

    }

    public async changeAction(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        console.log(req.params);

        const requerimientoUuid = req.params.requerimiento_uuid == null ? null : validator.isEmpty(req.params.requerimiento_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : req.params.requerimiento_uuid;

        const action = req.body.action == null ? null : validator.isEmpty(req.body.action) ?
            errors.push({message: 'Favor de proporcionar la accion a realizar'}) : req.body.action;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const findRequerimientoByUuid = await RequerimientoController.requerimientoQueries.findRequisitoByUUID({
            uuid: requerimientoUuid
        })

        if (!findRequerimientoByUuid.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de realizar la acción al requerimiento proporcionado.'}]
            });
        }

        const updateRequerimiento = await RequerimientoController.requerimientoQueries.change({
            uuid: requerimientoUuid,
            activo: action
        });

        if (!updateRequerimiento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de realizar la acción al requerimiento proporcionado.'}]
            });
        }

        const actionString = (action === 1) ? "activado" : "desactivado"

        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha ' + actionString + ' un requerimiento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha ' + actionString + ' el requerimiento correctamente'
        })

    }

    public async assingRequerimiento(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const servicioUuid: string = body.servicio_uuid === null ?
            errors.push({message: 'Favor de proporcionar el servicio '}) : body.servicio_uuid;

        const requisitoId: string = body.requisito_id === null ?
            errors.push({message: 'Favor de proporcionar el requisito'}) : body.requisito_id;

        const noCopias: number = body.no_copias === null ?
            errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.no_copias

        const original: string = body.original;

        const complementario: boolean = body.complementario;

        const obligatorio: boolean = body.obligatorio;

        const findServicioByUUID = await RequerimientoController.servicioQueries.findOneServicioByUUID({
            uuid: servicioUuid
        });

        if (findServicioByUUID.ok === false) {
            errors.push({message: 'Existen problemas al momento de vincular el requerimiento al servicio/trámite.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createRequisitosServicios = await RequerimientoController.requisitosServiciosQueries.create({
            requisito_id: requisitoId,
            servicio_id: findServicioByUUID.servicio.id,
            original,
            noCopias,
            complementario,
            obligatorio,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (createRequisitosServicios.ok === false) {
            errors.push({message: 'Existen problemas al momento de crear la vinculación del requisito con el servicio/ tramite'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


    }
}
