import moment from 'moment'
import * as bcrypt from 'bcrypt';
import * as validator from 'validator';
import {Request, Response} from 'express'
import {AdministratorQueries} from '../queries/administrator.query'
import {ContribuyenteQueries} from '../queries/contribuyente.query'
import {EstatusesQueries} from '../queries/estatuses.queries'
import {Payload} from '../helpers/payload'
import {Log} from '../helpers/logs'

export class EstatusesController {

    static log: Log = new Log()
    static administradorQueries: AdministratorQueries = new AdministratorQueries()
    static contribuyenteQueries: ContribuyenteQueries = new ContribuyenteQueries()
    static estatusesQueries: EstatusesQueries = new EstatusesQueries()
    static payload: Payload = new Payload()

    public async index(req: Request, res: Response) {
        const body = req.body
        const errors = []

        const servicioId = req.params.id == null ? null : validator.isEmpty(req.params.id) ?
            errors.push({message: 'Favor de proporcionar el id de la solicitud'}) : req.params.id

        const estatuses = await EstatusesController.estatusesQueries.getEstatuses(servicioId);

        if (!estatuses.ok) {
            errors.push({message: 'Existen problemas al obtener los estatuses'});
        } else if (estatuses.estatuses == null) {
            errors.push({message: 'No se encontraron estatuses'});
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            estatuses: estatuses.estatuses
        })
    }


}
