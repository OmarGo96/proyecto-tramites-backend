import { createClient, createClientAsync } from 'soap';
import moment from 'moment'
export class Soap {

    public request(data: any) {
        return new Promise((resolve, reject) => {
            createClientAsync(data.url).then((client) => {
                return client[data.function + 'Async'](data.args);
            }).then((result) => {
                resolve({ ok: true, result })
                //return { ok: true, result: JSON.stringify(result) }
            }).catch(err => {
                console.log('Error a las ' + moment().format('YYYY-MM-DD HH:mm:ss')+ ', ' + err)
                reject({ ok: false, message: err })
                //return {ok: false, 'message': 'Existen problemas para conectarse al servidor'}
            });
        })
    }
}
