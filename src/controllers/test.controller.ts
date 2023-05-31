import { Request, Response } from 'express';
import { Twilio } from "twilio"
import {SmsMangerHelper} from "../helpers/sms-manger.helper";

export class TestController {
    
    static smsTwilio: SmsMangerHelper = new SmsMangerHelper()

    public async twilio(req: Request, res: Response) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        const client = new Twilio(accountSid, authToken);

        let message = `Este es un mensaje de prueba <3`

        try {
            const twilio = await client.messages
                .create({
                    from: '+13203810700',
                    to: '+529841779468',
                    body: message,
                })
        } catch (e) {
            console.log(e)
        }

        return res.status(200).json({
            ok: true
        })
    }
}