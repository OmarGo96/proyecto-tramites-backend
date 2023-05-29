import {Response, Request, NextFunction} from 'express'
import {Roles} from "../enums/roles";

export class CheckRoles {
    static permisos(req: Request, res: Response, next: NextFunction) {
        if (req.body.rol === Roles.REVISOR) {
            return res.status(403).json({
                ok: false,
                errors: [{message: 'Usted no tiene permisos para hacer uso de esta opción: '}]
            })
        }
        next()
    }
}
