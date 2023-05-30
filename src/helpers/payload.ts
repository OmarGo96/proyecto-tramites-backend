/* Libraries to create the jwt */
import jwt from 'jsonwebtoken'
import fs from 'fs'
import Cryptr from 'cryptr'

export class Payload {

    public createToken(data: any) {
        try {
            let privateKey: any

            if (process.env.MODE !== 'dev') {
                privateKey = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8')
            } else {
                privateKey = fs.readFileSync('./src/keys/private.pem', 'utf8')
            }

            const cryptr = new Cryptr(process.env.CRYPTR_KEY || '')

            if (data.user_type === 'contribuyente') {
                const contribuyenteId = cryptr.encrypt((data.contribuyente_id))
                const userType = cryptr.encrypt((data.user_type))

                const token = jwt.sign({
                    contribuyenteId,
                    userType,
                }, privateKey, {algorithm: 'RS256', expiresIn: '9h', allowInsecureKeySizes: true})

                return {ok: true, token}
            }

            if (data.user_type === 'administrador') {
                const administradorId = cryptr.encrypt((data.administrador_id))
                const rol = cryptr.encrypt((data.rol))
                const userType = cryptr.encrypt((data.user_type))

                const token = jwt.sign({
                    administradorId,
                    rol,
                    userType,
                }, privateKey, {algorithm: 'RS256', expiresIn: '9h', allowInsecureKeySizes: true})

                return {ok: true, token}
            }

        } catch (e) {
            console.log(e)
            return {ok: false}
        }

    }
}
