import {Response, Request, NextFunction} from 'express'

export class Roles {
    static administrador(req: Request, res: Response, next: NextFunction) {
        if (req.body.administrador_rol !== "2") {
            return res.status(403).json({
                ok: false,
                errors: [{message: 'Usted no tiene permisos para hacer uso de esta opción: '}]
            })
        }
        next()
    }
}
