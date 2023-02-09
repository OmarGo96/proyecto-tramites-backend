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

        const findRequerimientosByServicio = await RequerimientoController.requisitosServiciosQueries.getRequerimeintos({
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

        const servicioUuid: string = body.servicio_uuid == null || validator.isEmpty(body.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el uuid del servicio'}) : body.servicio_uuid

        const tiposDocumentosId: string = body.tipos_documentos_id == null || validator.isEmpty(body.tipos_documentos_id) ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.tipos_documentos_id

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio'}) : body.nombre

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const noCopias: number = body.no_copias === null ?
            errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.no_copias

        const original: string = body.original;

        const complementario: boolean = body.complementario;

        const obligatorio: boolean = body.obligatorio;

        const uuid = uuidv4();

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioByUUID = await RequerimientoController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (!findServicioByUUID.ok) {
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

        /*const findRequisitoByNombre = await RequerimientoController.requerimientoQueries.findRequisitoByNombre({nombre})

        if (!findRequisitoByNombre.ok) {
            errors.push({message: 'Existen problemas al momento de validar el requisito proporcionado.'})
        } else if (findRequisitoByNombre.requisito != null) {
            errors.push({message: 'El requisito proporcionado ya existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
*/
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

        let createRequisitosServicios: any

        if (servicioUuid !== null) {
            createRequisitosServicios = await RequerimientoController.requisitosServiciosQueries.create({
                requisitos_id: createRequisito.requisito ? createRequisito.requisito.id : false,
                servicios_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
                original,
                noCopias,
                complementario,
                obligatorio,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            })

            if (createRequisitosServicios.ok === false) {
                errors.push({message: 'Existen problemas al momento de crear la relacion'})
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
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
            message: 'Se ha dado de alta el requisito proporcionado'
        })


    }

    public async update(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const requerimientoUuid = req.params.requerimiento_uuid == null ? null : validator.isEmpty(req.params.requerimiento_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : req.params.requerimiento_uuid;

        const requisitoId: string = body.requisito_id === null ?
            errors.push({message: 'Favor de proporcionar el uuid del servicio'}) : body.requisito_id;

        const requisitosId: string = body.requisitos_id === null ?
            errors.push({message: 'Favor de proporcionar el requisitos id'}) : body.requisitos_id;

        const serviciosId: string = body.servicios_id === null ?
            errors.push({message: 'Favor de proporcionar el servicios id'}) : body.servicios_id;

        const tiposDocumentosId: string = body.tipos_documentos_id === null ?
            errors.push({message: 'Favor de proporcionar el id del documento'}) : body.tipos_documentos_id;

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio'}) : body.nombre;

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion;

        const noCopias: number = body.no_copias === null ?
            errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.no_copias

        const original: string = body.original;

        const complementario: boolean = body.complementario;

        const obligatorio: boolean = body.obligatorio;

        const regex = new RegExp('^[A-Za-zÀ-ú _]*[A-Za-zÀ-ú][A-Za-zÀ-ú _]*$');

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

        let updateRequisitosServicios: any

        if (requerimientoUuid !== null) {
            updateRequisitosServicios = await RequerimientoController.requisitosServiciosQueries.update({
                id: requisitoId,
                requisitos_id: requisitosId,
                servicios_id: serviciosId,
                original,
                noCopias,
                complementario,
                obligatorio,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            })

            if (updateRequisitosServicios.ok === false) {
                errors.push({message: 'Existen problemas al momento de crear la relacion'})
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    ok: false,
                    errors
                })
            }
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

    public async disable(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const requerimientoUuid = req.params.requerimiento_uuid == null ? null : validator.isEmpty(req.params.requerimiento_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : req.params.requerimiento_uuid;

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
                errors: [{message: 'Existen problemas al momento de desactivar el requerimiento proporcionado.'}]
            });
        }

        const updateRequerimiento = await RequerimientoController.requerimientoQueries.disable({
            uuid: requerimientoUuid,
            activo: 0
        });



        if (!updateRequerimiento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de desactivar el requerimiento proporcionado.'}]
            });
        }

        const updateRequisitosServicios = await RequerimientoController.requisitosServiciosQueries.update({
            requisitos_id: findRequerimientoByUuid.requisito.id,
            activo: 0
        })

        if (!updateRequisitosServicios.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de desactivar el requerimiento proporcionado.'}]
            });
        }

        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha desactivado un requerimiento',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha desactivado el requerimiento correctamente'
        })

    }
}
