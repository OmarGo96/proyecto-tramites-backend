import twilio, { Twilio } from 'twilio'

export class SmsMangerHelper {

    // region
    // declaramos variables con credenciales
    private accountID: string = process.env.TWILIO_ACCOUNT_SID;
    private authToken: string = process.env.TWILIO_AUTH_TOKEN;
    private messagingServiceSID = process.env.TWILIO_MESSAGINSERVICE_SID;

    //endregion


    //region Funciones

    // funcion para enviar sms
    public async sendSMS(contribuyenteNumber: any,message: any) {
        const client = twilio(this.accountID, this.authToken);
        try {
            const clientResponse = await client.messages.create({
                to: contribuyenteNumber,
                body: message,
                messagingServiceSid: this.messagingServiceSID
            });

            return {ok: true, clientResponse}

        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }
}
