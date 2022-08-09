import { Response, Request } from 'express'
import { JsonResponse } from "../enums/json-response";
import { Mailer } from "../helpers/mailer";

export class ExampleController {
    static mailer: Mailer = new Mailer()

    public async example(req: Request, res: Response) {
        return res.status(200).json({
            ok: true,
            message: '¡Hola mundo! Soy un ejemplo :)'
        })
    }

    public async users(req: Request, res: Response) {
        return res.status(JsonResponse.OK).json({
            ok: true,
            users: [
                { 'name': 'Xavier', 'password': 'Xavier123--' },
                { 'name': 'Peter', 'password': 'Peter123--' },
                { 'name': 'María', 'password': 'Maria123--' },
                { 'name': 'Jhon', 'password': 'Jhon123--' },
                { 'name': 'Adele', 'password': 'Adele123--' },
            ]
        })
    }

    public async mailActivation(req: Request, res: Response) {
        let sendEmail = await ExampleController.mailer.send({
            email: 'omargonzalez9911@gmail.com',
            subject: 'Alta de cuenta',
            template: 'activation',
            codigo_activacion: '123ABC'
        })

        if(sendEmail.ok == false){
            return res.status(400).json({
                ok: true,
                message: 'Existen problemas al momento de enviar el email'
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Correo enviado'
        })
    }

    public async mailReset(req: Request, res: Response) {
        let sendEmail = await ExampleController.mailer.send({
            email: 'omargonzalez9911@gmail.com',
            subject: 'Restablecer mi cuenta',
            template: 'reset',
            restablecer_password: '1234DCBA'
        })

        if(sendEmail.ok == false){
            return res.status(400).json({
                ok: true,
                message: 'Existen problemas al momento de enviar el email'
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Correo enviado'
        })
    }
}

