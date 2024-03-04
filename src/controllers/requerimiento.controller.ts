import validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {ServicioQueries} from '../queries/servicio.query';
import {RequerimientoQueries} from '../queries/requerimiento.query';
import {RequisitosServiciosQueries} from '../queries/requisitos-servicios.query';
import {AreaQueries} from '../queries/area.query';
import {Log} from '../helpers/logs';
import {DocumentoSolicitudRequisitoQueries} from "../queries/documento-solicitud-requisito.query";
import sequelize, {Sequelize} from "sequelize";
import {database} from "../config/database";

export class RequerimientoController {
    static areaQueries: AreaQueries = new AreaQueries()
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
    static requisitosServiciosQueries: RequisitosServiciosQueries = new RequisitosServiciosQueries()
    static documentoSolicitudRequisitoQueries: DocumentoSolicitudRequisitoQueries = new DocumentoSolicitudRequisitoQueries()
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
            ip: req.socket.remoteAddress,
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
            ip: req.socket.remoteAddress,
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
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha ' + actionString + ' el requerimiento correctamente'
        })

    }

    public async deleteRequirement(req: Request, res: Response) {
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
                errors: [{message: 'Existen problemas al momento de realizar la acción al requerimiento proporcionado.'}]
            });
        }

        let dbTransaction = await database.transaction({ autocommit: false})
        try{
            const deleteDocumentoRequisito = await RequerimientoController.documentoSolicitudRequisitoQueries.delete({
                requisito_id: findRequerimientoByUuid.requisito.id
            }, dbTransaction)

            if (!deleteDocumentoRequisito.ok) {
                await dbTransaction.rollback()
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de eliminar el requerimiento proporcionado.'}]
                })
            }


            const deleteRequisitosServicio = await RequerimientoController.requisitosServiciosQueries.deleteByRequisitoId({
                requisito_id: findRequerimientoByUuid.requisito.id
            }, dbTransaction);

            if (!deleteRequisitosServicio.ok) {
                await dbTransaction.rollback()
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de eliminar el requerimiento proporcionado.'}]
                });
            }

            const deleteRequerimiento = await RequerimientoController.requerimientoQueries.delete({
                uuid: requerimientoUuid
            },dbTransaction);

            if (!deleteRequerimiento.ok) {
                await dbTransaction.rollback()
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de eliminar el requerimiento proporcionado.'}]
                });
            }
        } catch (e) {
            console.log(e)
            await dbTransaction.rollback()
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de eliminar el requerimiento proporcionado.'}]
            });
        }
        await dbTransaction.commit()


        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha eliminado un requerimiento',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el requerimiento correctamente'
        })

    }

    public async assignRequerimientoServicio(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const servicioUuid: string = body.servicio_uuid === null || validator.isEmpty(body.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio '}) : body.servicio_uuid;

        const requisitoId: string = body.requisito_id === null || validator.isEmpty(body.requisito_id + '') ?
            errors.push({message: 'Favor de proporcionar el requisito'}) : body.requisito_id;

        const noCopias: number = body.no_copias === null || validator.isEmpty(body.no_copias + '') ?
            errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.no_copias

        const original: string = body.original;

        const obligatorio: string = body.obligatorio === null || validator.isEmpty(body.obligatorio + '')
            ? errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.obligatorio;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

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
            complementario: (obligatorio === '0') ? 1 : 0,
            obligatorio: (obligatorio === '1') ? 1 : 0,
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

        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha asignado el requerimiento al tramite',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha asignado el requisito al tramite/servicio correctamente'
        })


    }
    public async unlinkRequerimientoServicio(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const requerimiento_servicio_id = req.params.requerimiento_servicio_id == null || validator.isEmpty(req.params.requerimiento_servicio_id + '') ?
            errors.push({message: 'Favor de proporcionar el requerimiento'}) : req.params.requerimiento_servicio_id;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const findRequerimientoByUuid = await RequerimientoController.requerimientoQueries.findRequisitoByUUID({
            uuid: requerimiento_servicio_id
        })

        if (!findRequerimientoByUuid.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de realizar la acción al requerimiento proporcionado.'}]
            });
        }

        const updateRequerimiento = await RequerimientoController.requisitosServiciosQueries.delete({
            id: requerimiento_servicio_id
        });

        if (!updateRequerimiento.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de realizar la acción al requerimiento proporcionado.'}]
            });
        }


        const createLogAdministrador = await RequerimientoController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha desasignado un requerimiento del servicio',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha desasignado el requerimiento correctamente'
        })
    }

    public async editRequerimientoServicio(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const requerimiento_servicio_id = req.params.requerimiento_servicio_id == null || validator.isEmpty(req.params.requerimiento_servicio_id + '') ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : req.params.requerimiento_servicio_id;

        const noCopias: number = body.no_copias === null || validator.isEmpty(body.no_copias + '') ?
            errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.no_copias

        const original: string = body.original;

        const obligatorio: string = body.obligatorio === null || validator.isEmpty(body.obligatorio + '')
            ? errors.push({message: 'Favor de proporcionar el número de copias necesarios'}) : body.obligatorio;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findRequerimientoServicioById= await RequerimientoController.requisitosServiciosQueries.findRequerimientoServicioById({
            id: requerimiento_servicio_id
        });

        if (findRequerimientoServicioById.ok === false) {
            errors.push({message: 'Existen problemas al momento de editar el requerimiento al servicio/trámite.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const editRequisitoServicio = await RequerimientoController.requisitosServiciosQueries.update({
            id: findRequerimientoServicioById.requerimientoServicio.id,
            requisito_id: findRequerimientoServicioById.requerimientoServicio.requisitoId,
            servicio_id: findRequerimientoServicioById.requerimientoServicio.servicioId,
            original,
            noCopias,
            complementario: (obligatorio === '0') ? 1 : 0,
            obligatorio: (obligatorio === '1') ? 1 : 0,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (editRequisitoServicio.ok === false) {
            errors.push({message: 'Existen problemas al momento de editar la vinculación del requisito con el servicio/ tramite'})
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
            accion: 'El administrador ha editado el requerimiento del tramite',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha editado el requisito correctamente'
        })
    }
}
