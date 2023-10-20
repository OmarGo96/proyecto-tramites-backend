/** Importamos librerías a utilizar */
import fs from 'fs';
import jwt from 'jsonwebtoken';
import Cryptr from 'cryptr';
import {NextFunction, Request, Response} from 'express';

export class CheckHeaders {

    /** Este middleware valida que la cabecera de autenticación sea correcta */
    static validateJWTAdministrador(req: Request, res: Response, next: NextFunction) {
        /* Obtenemos la cabecera de autenticación */
        const token: string = req.get('Authorization');
        let publicKey
        /** Dependiendo del modo de desarrollo en el que estemos, vamos a obtener
         * las llaves publicas y privadas para desencriptar la información
         * obteneida en el token.
         */
        if (process.env.MODE !== 'dev') {
            publicKey = fs.readFileSync(process.env.PUBLIC_KEY || './src/keys/public.pem', 'utf8')
        } else {
            publicKey = fs.readFileSync('./src/keys/public.pem', 'utf8')
        }

        /** Hacemos uso del controlador Crypter y de sus funciones */
        const cryptr = new Cryptr(process.env.CRYPTR_KEY)
        try {
            /* Primero verificamos que el token proporcionado sea valido */
            const decoded: any = jwt.verify(token, publicKey)

            if (!decoded.administradorId) {
                return res.status(403).json({
                    ok: false,
                    errors: [{message: 'Usted no cuenta con la cabecera de autenticación'}]
                })
            }

            /*Desencriptamos información deseada del usuario*/
            const administratorId = cryptr.decrypt(decoded.administradorId)
            const rol = cryptr.decrypt(decoded.rol)
            /*Retornamos el id del usuario decodificado junto con el token */
            req.body.administrador_id = +administratorId
            req.body.rol = +rol
        } catch (e) {
            /*Cachamos los errores posibles*/
            return res.status(403).json({
                ok: false,
                errors: [{message: 'Existe el siguiente problema con la cabecera: ' + e}]
            })
        }
        /** Si se cumple las validaciones correctas, pasamos a la función requerida */
        next()
    }

    static validateJWTContribuyente(req: Request, res: Response, next: NextFunction) {
        /* Obtenemos la cabecera de autenticación */
        const token = req.get('Authorization');
        let publicKey;
        /** Dependiendo del modo de desarrollo en el que estemos, vamos a obtener
         * las llaves publicas y privadas para desencriptar la información
         * obteneida en el token.
         */
        if (process.env.MODE !== 'dev') {
            publicKey = fs.readFileSync(process.env.PUBLIC_KEY || './src/keys/public.pem', 'utf8')
        } else {
            publicKey = fs.readFileSync('./src/keys/public.pem', 'utf8')
        }

        /** Hacemos uso del controlador Crypter y de sus funciones */
        const cryptr = new Cryptr(process.env.CRYPTR_KEY)
        try {
            /* Primero verificamos que el token proporcionado sea valido */
            const decoded: any = jwt.verify(token, publicKey)

            if (!decoded.contribuyenteId) {
                return res.status(403).json({
                    ok: false,
                    errors: [{message: 'You do not have the required authentication'}]
                })
            }

            /*Desencriptamos información deseada del usuario*/
            const contribuyenteId = cryptr.decrypt(decoded.contribuyenteId)
            /*Retornamos el id del usuario decodificado junto con el token */
            req.body.contribuyente_id = +contribuyenteId
        } catch (e) {
            /*Cachamos los errores posibles*/
            return res.status(403).json({
                ok: false,
                errors: [{message: 'Existe el siguiente problema con la cabecera: ' + e}]
            })
        }
        /** Si se cumple las validaciones correctas, pasamos a la función requerida */
        next()
    }

    static validateJWTByTypeUser(req: Request, res: Response, next: NextFunction) {
        /* Obtenemos la cabecera de autenticación */
        const token = req.get('Authorization')

        let publicKey;
        /** Dependiendo del modo de desarrollo en el que estemos, vamos a obtener
         * las llaves publicas y privadas para desencriptar la información
         * obteneida en el token.
         */
        if (process.env.MODE !== 'dev') {
            publicKey = fs.readFileSync(process.env.PUBLIC_KEY || './src/keys/public.pem', 'utf8');
        } else {
            publicKey = fs.readFileSync('./src/keys/public.pem', 'utf8');
        }

        /** Hacemos uso del controlador Crypter y de sus funciones */
        const cryptr = new Cryptr(process.env.CRYPTR_KEY);
        try {
            /* Primero verificamos que el token proporcionado sea valido */
            const decoded: any = jwt.verify(token, publicKey);

            const userType = cryptr.decrypt(decoded.userType);
            if (userType === 'contribuyente') {
                const contribuyenteId = cryptr.decrypt(decoded.contribuyenteId)
                req.body.contribuyente_id = +contribuyenteId
            }

            if (userType === 'administrador') {
                const administratorId = cryptr.decrypt(decoded.administradorId)
                const rol = cryptr.decrypt(decoded.rol)
                req.body.administrador_id = +administratorId
                req.body.rol = +rol
            }


        } catch (e) {
            /*Cachamos los errores posibles*/
            return res.status(403).json({
                ok: false,
                errors: [{message: 'Existe el siguiente problema con la cabecera: ' + e}]
            })
        }
        /** Si se cumple las validaciones correctas, pasamos a la función requerida */
        next()
    }

    static contentAuthorization(req: Request, res: Response, next: NextFunction) {
        /* Obtenemos la cabecera de autenticación */
        let auth: boolean = false;
        const token = (req.get('Authorization') == null || req.get('Authorization') === "") ? null : req.get('Authorization')
        let publicKey;

        if (token != null) {
            /** Dependiendo del modo de desarrollo en el que estemos, vamos a obtener
             * las llaves publicas y privadas para desencriptar la información
             * obteneida en el token.
             */
            if (process.env.MODE !== 'dev') {
                publicKey = fs.readFileSync(process.env.PUBLIC_KEY || './src/keys/public.pem', 'utf8');
            } else {
                publicKey = fs.readFileSync('./src/keys/public.pem', 'utf8');
            }

            /** Hacemos uso del controlador Crypter y de sus funciones */
            const cryptr = new Cryptr(process.env.CRYPTR_KEY);
            try {
                /* Primero verificamos que el token proporcionado sea valido */
                const decoded: any = jwt.verify(token, publicKey);

                if (!decoded.administradorId) {
                    return res.status(403).json({
                        ok: false,
                        errors: [{message: 'Usted no cuenta con el permiso correcto'}]
                    })
                }
                req.body.administrador_id = cryptr.decrypt(decoded.administradorId)

                auth = true;

            } catch (e) {
                /*Cachamos los errores posibles*/
                return res.status(403).json({
                    ok: false,
                    errors: [{message: 'Existe el siguiente problema con la cabecera: ' + e}]
                })
            }
        }

        if (auth === true) {
            req.body.auth = true
        } else {
            req.body.auth = false
        }

        /** Si se cumple las validaciones correctas, pasamos a la función requerida */
        next()

    }
}
