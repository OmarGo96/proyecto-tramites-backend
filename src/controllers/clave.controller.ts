import validator from 'validator';
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response } from 'express'
import { AreaQueries } from '../queries/area.query'
import { ClaveQueries } from '../queries/clave.query'
import { Soap } from '../helpers/soap'
import { Log } from '../helpers/logs'
import {UrlIntencionCobroQueries} from "../queries/url_intencion_cobro.query";
import {ServicioQueries} from "../queries/servicio.query";
import {SolicitudQueries} from "../queries/solicitud.query";

export class ClaveController {
    static areaQueries: AreaQueries = new AreaQueries()
    static claveQueries: ClaveQueries = new ClaveQueries()
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static soap: Soap = new Soap()
    static log: Log = new Log()
    static urlIntencionCobroQueries: UrlIntencionCobroQueries = new UrlIntencionCobroQueries()

    /** Funcion para obtener todos las claves catastrales adjuntas a un cliente */
    public async show(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyenteId: number = req.body.contribuyente_id
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClavesByContribuyente = await ClaveController.claveQueries.findClavesByContribuyente({
            contribuyente_id: contribuyenteId
        })

        if (!findClavesByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener las clave catastrales.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            claves: findClavesByContribuyente.claves
        })
    }

    /** Funcion para obtener todos los servicios por area proporcionada */
    public async store(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyenteId: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({ message: 'Favor de proporcionar el clave' }) : body.clave

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id: contribuyenteId
        })

        if (!findClaveByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        } else if (findClaveByContribuyente.clave != null) {
            errors.push({ message: 'La clave catastral proporcionada ya esta adjunta a su cuenta.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.DATOS_PREDIAL,
            function: 'daoObtieneDatosPredio',
            args: {
                parStrCveCatastral: clave
            }
        }

        const soap: any = await ClaveController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoObtieneDatosPredioResult.PredioId === 0) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'La clave proporcionada no existe' }]
            })
        }

        const predioId = soap.result[0].daoObtieneDatosPredioResult.PredioId
        const poblacionId = soap.result[0].daoObtieneDatosPredioResult.CatastroPoblacionId
        const colonia = soap.result[0].daoObtieneDatosPredioResult.NombreColonia
        const distrito = soap.result[0].daoObtieneDatosPredioResult.NombreOficialDistrito
        const entidad = soap.result[0].daoObtieneDatosPredioResult.NombreOficialEntidadFederativa
        const localidad = soap.result[0].daoObtieneDatosPredioResult.NombreOficialLocalidad
        const municipio = soap.result[0].daoObtieneDatosPredioResult.NombreOficialMunicipio
        const pais = soap.result[0].daoObtieneDatosPredioResult.NombreOficialPais
        const region = soap.result[0].daoObtieneDatosPredioResult.NombreOficialRegion
        const codigoPostal = soap.result[0].daoObtieneDatosPredioResult.PredioCodigoPostal
        const direccion = soap.result[0].daoObtieneDatosPredioResult.PredioCalle
        const predioTipo = soap.result[0].daoObtieneDatosPredioResult.PredioTipo
        const fechaAlta = moment(soap.result[0].daoObtieneDatosPredioResult.PredioAltaFecha).format('YYYY-MM-DD HH:mm:ss')

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const createClaveCatastral = await ClaveController.claveQueries.create({
            contribuyente_id: contribuyenteId,
            predio_id: predioId,
            clave,
            poblacion_id: poblacionId,
            colonia,
            distrito,
            entidad,
            localidad,
            municipio,
            pais,
            region,
            codigo_postal: codigoPostal,
            direccion,
            predio_tipo: predioTipo,
            fecha_alta: fechaAlta
        })

        if (!createClaveCatastral.ok) {
            errors.push({ message: 'Existen problemas al momento de salvar la clave catastral.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await ClaveController.log.contribuyente({
            contribuyente_id: contribuyenteId,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente activo adjunto una nueva clave catastral a su cuenta',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha adjuntado su clave catastral a su cuenta'
        })
    }

    public async demarcate(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({ message: 'Favor de proporcionar el clave' }) : body.clave

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id
        })

        if (!findClaveByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        } else if (findClaveByContribuyente.clave == null) {
            errors.push({ message: 'La clave catastral proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const demarcateClave = await ClaveController.claveQueries.delete({
            id: findClaveByContribuyente.clave ? findClaveByContribuyente.clave.id : false
        })

        if (!demarcateClave.ok) {
            errors.push({ message: 'Existen problemas al momento de deslindar la clave catastral.' })
        }

        const createLogContribuyente = await ClaveController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente deslindo la clave catastral',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha deslindado la clave catastral'
        })
    }

    public async statementAccount(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({ message: 'Favor de proporcionar el clave' }) : body.clave

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id
        })

        if (!findClaveByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.ESTADO_CUENTA_PREDIAL,
            function: 'daoObtienerEdoCuentaPredial',
            args: {
                parStrCveCatastral: clave
            }
        }

        const soap: any = await ClaveController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }



        if (soap.result[0].daoObtienerEdoCuentaPredialResult && soap.result[0].daoObtienerEdoCuentaPredialResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoObtienerEdoCuentaPredialResult.parMensajeError }]
            })
        }

        if (!soap.result[0].daoObtienerEdoCuentaPredialResult) {
            return res.status(400).json({
                ok: false,
                soap,
                errors: [{ message: 'La clave proporcionada no tiene ningún valor' }]
            })
        }

        if (!soap.result[0].daoObtienerEdoCuentaPredialResult.proRFCPersona) {
            return res.status(400).json({
                ok: true,
                errors: [{ message: 'La clave proporcionada no tiene ningún valor' }]
            })
        }

        if (!soap.result[0].daoObtienerEdoCuentaPredialResult.proConsultaWSWSAdeudo) {
            return res.status(400).json({
                ok: false,
                soap,
                errors: [{ message: 'No es posible generar el estado de cuenta, favor de pasar a tesorería.' }]
            })
        }


        if (!soap.result[0].daoObtienerEdoCuentaPredialResult.proConsultaWSWSAdeudo.claEntFuenteIngresos) {
            return res.status(400).json({
                ok: false,
                soap,
                errors: [{ message: 'No es posible generar el estado de cuenta, favor de pasar a tesorería.' }]
            })
        }

        let updateImporteAdeudo = await ClaveController.claveQueries.updateImporteAdeudo({
            id: findClaveByContribuyente.clave.id,
            importe_adeudo: soap.result[0].daoObtienerEdoCuentaPredialResult.proImporteTotal.toString(),
        })

        if (updateImporteAdeudo.ok == false) {
            return res.status(400).json({
                ok: false,
                soap,
                errors: [{ message: 'Existen problemas para actualizar estado de cuenta, intente más tarde.' }]
            })
        }

        return res.status(200).json({
            ok: true,
            estado_cuenta: soap.result[0].daoObtienerEdoCuentaPredialResult.proConsultaWSWSAdeudo.claEntFuenteIngresos,
            rfc: soap.result[0].daoObtienerEdoCuentaPredialResult.proRFCPersona,
            direccion: soap.result[0].daoObtienerEdoCuentaPredialResult.proDireccionPersona,
            nombre_contribuyente: soap.result[0].daoObtienerEdoCuentaPredialResult.proNombreCompletoPersona,
            total: soap.result[0].daoObtienerEdoCuentaPredialResult.proImporteTotal.toString(),
            cedula: clave
        })
    }

    public async linkToPay(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({ message: 'Favor de proporcionar el clave' }) : body.clave

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id
        })

        if (!findClaveByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.PASE_CAJA_PREDIAL,
            function: 'daoCreaPaseCajaPredial',
            args: {
                parStrCveCatastral: clave
            }
        }

        const soap: any = await ClaveController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoCreaPaseCajaPredialResult.CodigoError && soap.result[0].daoCreaPaseCajaPredialResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoCreaPaseCajaPredialResult.MensajeError }]
            })
        }


        if (typeof (soap.result[0].daoCreaPaseCajaPredialResult.PaseCaja) === 'undefined') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'No es posible generar el pase a caja, favor de pasar a tesorería' }]
            })
        }

        return res.status(200).json({
            ok: true,
            clave,
            pase: soap.result[0].daoCreaPaseCajaPredialResult.PaseCaja,
            link: soap.result[0].daoCreaPaseCajaPredialResult.UrlPaseImpresion,
        })
    }

    public async linkToBank(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const clave: string = body.clave == null || validator.isEmpty(body.clave) ?
            errors.push({ message: 'Favor de proporcionar el clave' }) : body.clave

        const total: string = body.total == null || validator.isEmpty(body.total) ?
            errors.push({ message: 'Favor de proporcionar el total' }) : body.total

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        if (!validator.isNumeric(total)) {
            errors.push({ message: 'Favor de proporcionar el total' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        const findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id
        })

        if (!findClaveByContribuyente.ok) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const data = {
            url: process.env.INTENTO_COBRO_PREDIAL,
            function: 'daoGeneraIntenciondecobro',
            args: {
                parStrCveCatastral: clave,
                parDouImporte: total,
                parStrTokenValidate: process.env.BANK_TOKEN
            }
        }

        const soap: any = await ClaveController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }

        if (soap.result[0].daoGeneraIntenciondecobroResult.CodigoError && soap.result[0].daoGeneraIntenciondecobroResult.CodigoError !== '200') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.result[0].daoGeneraIntenciondecobroResult.MensajeError }]
            })
        }

        if (typeof (soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro) === 'undefined') {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'No es posible generar el link de pago, favor de pasar a tesorería' }]
            })
        }

        const referencia = moment().unix().toString() + contribuyente_id

        const url_intencion_cobro = await ClaveController.urlIntencionCobroQueries.store({
            clave_id: findClaveByContribuyente.clave.id,
            grupo_tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.GrupoTramiteId,
            tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.TramiteId,
            solicitud_tramite_id: soap.result[0].daoGeneraIntenciondecobroResult.SolicitudId,
            referencia,
            folio_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroResult.FolioPaseCaja,
            url_intencion_cobro: soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro,
            status: 0,
            fecha_alta:  moment().format('YYYY-MM-DD HH:mm:ss'),

        })

        if (!url_intencion_cobro.ok) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar el link de pago, intente más tarde' }]
            })
        }

        return res.status(200).json({
            ok: true,
            clave,
            link: soap.result[0].daoGeneraIntenciondecobroResult.UrlIntencionCobro,
            show: "browser"
        })
    }

    public async generate(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const observaciones: string = body.observaciones == null || validator.isEmpty(body.observaciones) ?
            errors.push({ message: 'Favor de proporcionar las observaciones' }) : body.observaciones

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base d edatos si el contribuyente ya tiene adjunto esa clave catastral */
        /* let findClaveByContribuyente = await ClaveController.claveQueries.findClaveByContribuyente({
            clave,
            contribuyente_id
        })

        if (findClaveByContribuyente.ok == false) {
            errors.push({ message: 'Existen problemas al momento de obtener la clave catastral proporcionada.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        } */

        const data = {
            url: 'https://tesoreria.gobiernodesolidaridad.gob.mx/wsTestSIGEM/catastro/IServiceCreaPaseCajaGenerico.svc?singleWsdl',
            function: 'daoCreaPaseCajaGenerico',
            args: {
                GrupoTramiteId : '3',
                TramiteId: '20',
                observaciones,
                id: ''
            }
        }

        const soap: any = await ClaveController.soap.request(data)

        if (soap.ok === false) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: soap.message }]
            })
        }
        return res.status(200).json({
            ok: true,
            link: soap.result[0].daoCreaPaseCajaGenericoResult.UrlPaseImpresion
        })
    }

    public async createSolicitud(req: Request, res: Response) {
        /** Obtenemos el id del administrador */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const servicioUuid: string = body.servicio_uuid == null || validator.isEmpty(body.servicio_uuid) ?
            errors.push({message: 'Favor de proporcionar el servicio/trámite'}) : body.servicio_uuid

        const clave: string = body.clave == null || validator.isEmpty(body.clave + '') ?
            errors.push({message: 'Favor de proporcionar la clave.'}) : body.clave

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findServicioByUUID = await ClaveController.servicioQueries.findServicioByUUID({uuid: servicioUuid})
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

        let findSolicitudByClavePredial = await ClaveController.solicitudQueries.findSolicitudByClaveId({
            clave
        })

        if (!findSolicitudByClavePredial.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{message: "Existen problemas para crear la solicitud."}]
            })
        }

        if (findSolicitudByClavePredial.solicitud != null ) {
            if ( !(findSolicitudByClavePredial.solicitud.estatus_solicitud_id === 7 || findSolicitudByClavePredial.solicitud.estatus_solicitud_id === 13 || findSolicitudByClavePredial.solicitud.estatus_solicitud_id === 18)) {
                return res.status(400).json({
                    ok: false,
                    errors: [{ message: 'La clave catastral proporcionada ya esta adjunta a una solicitud activa.' }]
                })
            }

        }

        /** Creamos una nueva solicitud en la base de datos */
        const createSolicitud = await ClaveController.solicitudQueries.createPredial({
            contribuyente_id,
            area_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.area_id : false,
            servicio_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.id : false,
            clave_id: clave,
            folio: contribuyente_id + '-' + moment().unix(),
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        if (!createSolicitud.ok) {
            errors.push({message: 'Existen problemas al momento de dar de alta su solicitud.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await ClaveController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a iniciado una solicitud',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        /** Creamos log de solicitud */
        const createLogSolicitud = await ClaveController.log.solicitud({
            solicitud_id: createSolicitud.solicitud ? createSolicitud.solicitud.id : false,
            estatus_solicitud_id: 10,
            administradores_id: findServicioByUUID.servicio ? findServicioByUUID.servicio.Area.administradores_id : false,
            contribuyente_id,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            comentario: 'El contribuyente creo una nueva solicitud'
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha creado la solicitud, favor de adjuntar los requisitos solicitados.',
            solicitud_id: createSolicitud.solicitud ? createSolicitud.solicitud.id : false
        })

    }

}
