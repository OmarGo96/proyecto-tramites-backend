import * as validator from 'validator';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {Request, Response} from 'express';
import {ServicioQueries} from '../queries/servicio.query';
import {DocumentoServicioQueries} from '../queries/documento_servicio.query';
import {AreaQueries} from '../queries/area.query';
import {Log} from '../helpers/logs';
import {File} from '../helpers/files';

export class ServicioController {
    static areaQueries: AreaQueries = new AreaQueries()
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static documentoServicioQueries: DocumentoServicioQueries = new DocumentoServicioQueries()
    static log: Log = new Log()
    static file: File = new File()

    public async getAll(req: Request, res: Response) {
        const errors = []

        const findServiciosByArea = await ServicioController.servicioQueries.getAllServicios();

        if (!findServiciosByArea.ok) {
            errors.push({message: 'Existen problemas al momento de obtener los servicios por area.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            servicios: findServiciosByArea.servicios
        })
    }

    public async index(req: Request, res: Response) {
        const auth = req.body.auth
        const errors = []

        const areaUuid = req.params.area_uuid == null ? null : validator.isEmpty(req.params.area_uuid) ?
            errors.push({message: 'Favor de proporcionar el área'}) :
            req.params.area_uuid

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findAreaByUUID = await ServicioController.areaQueries.findAreaByUUID({uuid: areaUuid})

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

        const FindServiciosByArea = await ServicioController.servicioQueries.getServicios({
            auth,
            area_id: findAreaByUUID.area ? findAreaByUUID.area.id : false
        });

        if (FindServiciosByArea.ok === false) {
            errors.push({message: 'Existen problemas al momento de obtener los servicios por area.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            servicios: FindServiciosByArea.servicios
        })
    }

    public async show(req: Request, res: Response) {
        // const administradorId = req.body.administrador_id
        const errors = [];

        const serviceUuid = req.params.uuid == null ? null : validator.isEmpty(req.params.uuid) ?
            errors.push({message: 'Favor de proporcionar el uuid del servicio.'}) : req.params.uuid

        const findedService = await ServicioController.servicioQueries.findServicioByUUID({
            uuid: serviceUuid
        })

        if (!findedService.ok) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (!findedService) {
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
            servicio: findedService.servicio
        })
    }


    public async top(req: Request, res: Response) {
        const errors = []
        const getTop = await ServicioController.servicioQueries.topServicios()

        if (getTop.ok === false) {
            errors.push({message: 'Existen problemas al momento de obtener los servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            servicios: getTop.result
        })
    }

    public async getDocumentService(req: Request, res: Response) {
        const errors = [];

        const servicioUuid = req.params.servicio_uuid == null ? null : validator.isEmpty(req.params.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio'}) :
            req.params.servicio_uuid

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioByUUID = await ServicioController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (findServicioByUUID.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el servicio proporcionada.'})
        } else if (findServicioByUUID.servicio == null) {
            errors.push({message: 'El área proporcionada no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const getDocumentoServicio = await ServicioController.servicioQueries.getDocumentoServicio({servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false})

        if (getDocumentoServicio.ok === false) {
            errors.push({message: 'Existen problemas al momento de buscar el documento.'})
        } else if (getDocumentoServicio.documento == null) {
            errors.push({message: 'Este servicio no cuenta con un formato de solicitud'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const downloadFile = await ServicioController.file.documentService(getDocumentoServicio.documento ? getDocumentoServicio.documento.url : false)

        if (downloadFile.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{message: downloadFile.message}]
            });
        }

        return res.status(200).contentType('application/pdf').send(downloadFile.pdf)

    }

    public async findByNameOrDescription(req: Request, res: Response) {
        const errors = [];
        const body = req.body;

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio/trámite'}) : body.nombre

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findByNameOrDescription = await ServicioController.servicioQueries.findByNameOrDescription({nombre})

        if (findByNameOrDescription.ok === false) {
            errors.push({message: 'Existen problemas al momento de obtener los servicios.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            servicios: findByNameOrDescription.servicios
        })
    }

    public async store(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const areaUuid: string = body.area_uuid == null || validator.isEmpty(body.area_uuid) === true ?
            errors.push({message: 'Favor de proporcionar el area_uuid del servicio/trámite'}) : body.area_uuid

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) === true ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio/trámite'}) : body.nombre

        const clave: string = body.clave == null || validator.isEmpty(body.clave) === true ?
            errors.push({message: 'Favor de proporcionar la clave del servicio/trámite'}) : body.clave

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) === true ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const costo: string = body.costo == null || validator.isEmpty(body.costo) === true ?
            errors.push({message: 'Favor de proporcionar el costo'}) : body.costo

        const vigencia: string = body.vigencia == null || validator.isEmpty(body.vigencia) === true ?
            errors.push({message: 'Favor de proporcionar la vigencia del documento expedido'}) : body.vigencia

        const tiempo: string = body.tiempo == null || validator.isEmpty(body.tiempo) === true ?
            errors.push({message: 'Favor de proporcionar el tiempo que se toma realizar el trámite'}) : body.tiempo

        const documentoExpedido: string = body.documento_expedido == null || validator.isEmpty(body.documento_expedido) === true ?
            errors.push({message: 'Favor de proporcionar la descripción del documento expedido'}) : body.documento_expedido

        const uuid = uuidv4()

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
        const findAreaByUUID = await ServicioController.areaQueries.findAreaByUUID({uuid: areaUuid})

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

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findServicioByNombre = await ServicioController.servicioQueries.findServicioByNombre({nombre})

        if (findServicioByNombre.ok === false) {
            errors.push({message: 'Existen problemas al momento de validar el servicio/trámite proporcionada.'})
        } else if (findServicioByNombre.servicio != null) {
            errors.push({message: 'El servicio/trámite proporcionado ya existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createServicio = await ServicioController.servicioQueries.create({
            area_id: findAreaByUUID.area ? findAreaByUUID.area.id : false,
            administradores_id: administratorId,
            nombre,
            clave,
            descripcion,
            costo,
            vigencia,
            tiempo,
            documentoExpedido,
            uuid,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
        })

        if (createServicio.ok === false) {
            errors.push({message: 'Existen problemas al momento de dar de alta el área.'})
        }

        const createLogAdministrador = await ServicioController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha creado un nuevo servicio/trámite',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha dado de alta el servico/trámite proporcionado'
        })
    }

    public async update(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const servicioUuid = req.params.servicio_uuid === null ? null : validator.isEmpty(req.params.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) :
            req.params.servicio_uuid

        const nombre: string = body.nombre == null || validator.isEmpty(body.nombre) ?
            errors.push({message: 'Favor de proporcionar el nombre del servicio/trámite'}) : body.nombre

        const clave: string = body.clave == null || validator.isEmpty(body.clave) === true ?
            errors.push({message: 'Favor de proporcionar la clave del servicio/trámite'}) : body.clave

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar una descripción'}) : body.descripcion

        const costo: string = body.costo == null || validator.isEmpty(body.costo) ?
            errors.push({message: 'Favor de proporcionar el costo'}) : body.costo

        const vigencia: string = body.vigencia == null || validator.isEmpty(body.vigencia) ?
            errors.push({message: 'Favor de proporcionar la vigencia del documento expedido'}) : body.vigencia

        const tiempo: string = body.tiempo == null || validator.isEmpty(body.tiempo) ?
            errors.push({message: 'Favor de proporcionar el tiempo que se toma realizar el trámite'}) : body.tiempo

        const documentoExpedido: string = body.documento_expedido == null || validator.isEmpty(body.documento_expedido) ?
            errors.push({message: 'Favor de proporcionar la descripción del documento expedido'}) : body.documento_expedido

        const enLinea: string = body.en_linea === null ?
            errors.push({message: 'Favor de proporcionar si el servicio esta disponible para realizar en linea'}) : body.en_linea

        const activo: string = body.activo === null ?
            errors.push({message: 'Favor de proporcionar si el servicio esta activo'}) : body.activo


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

        /*if (validator.isNumeric(activo) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo de activo'})
        }*/

        /*if (activo !== "1" && activo !== "0") {
            errors.push({message: 'Favor de solo proporcionar un valor valido para el campo de activo'})
        }*/

        /*if (validator.isNumeric(enLinea) === false) {
            errors.push({message: 'Favor de solo proporcionar números para el campo de en linea'})
        }*/

        /*if (enLinea !== "1" && enLinea !== "0") {
            errors.push({message: 'Favor de solo proporcionar un valor valido para el campo de en linea'})
        }*/


        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findServicioByUUID = await ServicioController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (!findServicioByUUID.ok) {
            errors.push({message: 'Existen problemas al momento de validar el servicio proporcionado.'})
        } else if (findServicioByUUID.servicio == null) {
            errors.push({message: 'El servicio proporcionado no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Actualizamos la información proporcionada */
        const updateArea = await ServicioController.servicioQueries.update({
            id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
            nombre,
            clave,
            descripcion,
            costo,
            vigencia,
            tiempo,
            documentoExpedido,
            enLinea,
            activo
        })

        if (!updateArea.ok) {
            errors.push({message: 'Existen problemas al momento de actualizar el servicio/trámite proporcionado.'})
        }

        const createLogAdministrador = await ServicioController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha actualizado la información del servicio/trámite',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha actualizado la información del servicio/trámite'
        })

    }

    public async delete(req: Request, res: Response) {
        const administratorId: number = req.body.administrador_id;
        const body = req.body;
        const errors = [];

        const servicioUuid = req.params.servicio_uuid === null ? null : validator.isEmpty(req.params.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) :
            req.params.servicio_uuid

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findServicioByUUID = await ServicioController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (!findServicioByUUID.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de validar el servicio proporcionado.'}]
            })
        } else if (findServicioByUUID.servicio == null) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'El servicio proporcionado no existe.'}]
            })
        }

        /** Actualizamos la información proporcionada */
        const updateArea = await ServicioController.servicioQueries.delete({
            id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
            activo: 0
        })

        if (!updateArea.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de eliminar el servicio/trámite proporcionado.'}]
            })
        }

        const createLogAdministrador = await ServicioController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador ha eliminado un servicio/trámite con index: ' + findServicioByUUID.servicio.id,
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el servicio/trámite'
        })
    }

    public async upload(req: Request, res: Response) {
        const administratorId: number = Number(req.body.administrador_id);
        const body = req.body;
        const errors = [];

        const servicioUuid = req.params.servicio_uuid == null ? null : validator.isEmpty(req.params.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) :
            req.params.servicio_uuid

        const descripcion: string = body.descripcion == null || validator.isEmpty(body.descripcion) ?
            errors.push({message: 'Favor de proporcionar la descripción'}) : body.descripcion

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findServicioByUUID = await ServicioController.servicioQueries.findServicioByUUID({uuid: servicioUuid})

        if (!findServicioByUUID.ok) {
            errors.push({message: 'Existen problemas al momento de validar el servicio proporcionado.'})
        } else if (findServicioByUUID.servicio === null) {
            errors.push({message: 'El servicio proporcionado no existe.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const findDocumentoByServicio = await ServicioController.documentoServicioQueries.findDocumentoByServicio({
            servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false
        })

        if (!findDocumentoByServicio.ok) {
            errors.push({message: 'Existen problemas al momento de validar el servicio contiene un documento adjunto.'})
        }
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const file = (findDocumentoByServicio.documento != null) ? findDocumentoByServicio.documento.url : null

        const uploadFile = await ServicioController.file.upload(req, file, 'solicitud')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: uploadFile.message}]
            })
        }

        if (findDocumentoByServicio.documento !== null) {
            const updateDocumentacion = await ServicioController.documentoServicioQueries.attachFile({
                id: findDocumentoByServicio.documento ? findDocumentoByServicio.documento.id : false,
                administradores_id: administratorId,
                url: uploadFile.nameFile,
                descripcion,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            if (!updateDocumentacion.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de adjuntar el xzzzzzzzzzzarchivo y actualizar la información.'}]
                })
            }
        }

        if (findDocumentoByServicio.documento === null) {
            const updateDocumentacion = await ServicioController.documentoServicioQueries.create({
                servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
                administradores_id: administratorId,
                url: uploadFile.nameFile,
                descripcion,
                fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            if (!updateDocumentacion.ok) {
                return res.status(400).json({
                    ok: false,
                    errors: [{message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.'}]
                })
            }
        }

        /** Creamos el log del usuario */
        const createLogAdministrador = await ServicioController.log.administrador({
            administrador_id: administratorId,
            navegador: req.headers['user-agent'],
            accion: 'El administrador a adjuntado un nuevo documento de solicitud al servicio',
            ip: req.connection.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }
}
