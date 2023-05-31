import { Response, Request, NextFunction } from 'express'
import { JsonResponse } from '../enums/json-response'
import {SolicitudQueries} from "../queries/solicitud.query";
import {AdministratorQueries} from "../queries/administrator.query";

export class GetValue {
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()

    static administradorQueries: AdministratorQueries = new AdministratorQueries()

    /** Middleware para identificar roles y permitir acceso a funciones */
    static async solicitud(req: Request, res: Response, next: NextFunction) {
        const errors = []

        let solicitud_id: number = req.params.solicitud_id == null || (!req.params.solicitud_id)
            || !Number.isInteger(+req.params.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) :
            +req.params.solicitud_id

        if(errors.length > 0){
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: {errors}
            })
        }

        const getSolicitudById = await GetValue.solicitudQueries.findSolicitudById({
            id: solicitud_id
        })

        if (getSolicitudById.ok === false) {
            return res.status(JsonResponse.INTERNAL_SERVER_ERROR).json({
                ok: false,
                errors: [{ message: 'No es posible obtener la información de la solicitud en este momento.' }]
            })
        }else if(getSolicitudById.solicitud === null){
            return res.status(JsonResponse.NOT_FOUND).json({
                ok: false,
                errors: [{ message: 'La solicitud proporcionada no existe.' }]
            })
        }

        req.body.negotiation = getSolicitudById.solicitud
        next()
    }

    static async contribuyente(req: Request, res: Response, next: NextFunction) {
        const errors = []

        let solicitud_id: number = req.params.solicitud_id == null || (!req.params.solicitud_id)
        || !Number.isInteger(+req.params.solicitud_id) ?
            errors.push({ message: 'Favor de proporcionar la solicitud' }) :
            +req.params.solicitud_id

        if(errors.length > 0){
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: {errors}
            })
        }

        const getSolicitudById = await GetValue.solicitudQueries.findSolicitudById({
            id: solicitud_id
        })

        if (getSolicitudById.ok === false) {
            return res.status(JsonResponse.INTERNAL_SERVER_ERROR).json({
                ok: false,
                errors: [{ message: 'No es posible obtener la información de la solicitud en este momento.' }]
            })
        }else if(getSolicitudById.solicitud === null){
            return res.status(JsonResponse.NOT_FOUND).json({
                ok: false,
                errors: [{ message: 'La solicitud proporcionada no existe.' }]
            })
        }

        req.body.negotiation = getSolicitudById.solicitud
        next()
    }

    static async administrador(req: Request, res: Response, next: NextFunction) {
        const errors = []

        /** Variable con contendrá la información del usuario encontrado en la db */
        let user: any = null;

        /** Buscamos si el usuario existe en la base de datos */
        const getAdminInfo = await GetValue.administradorQueries.findAdministradorById({ id: req.body.administrador_id })

        /** Validamos las futuras permutaciones al no encontrar registro en la base de datos */
        if (getAdminInfo.ok == false) {
            return res.status(400).json({
                ok: false,
                errors: [ 'Existen problemas para obtener la información del usuario' ]
            })
        } else if (getAdminInfo.administrator == null) {
            return res.status(404).json({
                ok: false,
                errors: ['El usuario no esta registrado en el sistema.' ]
            })
        }else{
            user = getAdminInfo.administrator
        }
        /** Creamos un objeto que contenga al usuario encontrado en la base de datos */
        req.body.adminInfo = user
        next()
    }
}
