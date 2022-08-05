/** Librería que nos permite acceder a recursos de otros servidores */
import axios from 'axios';

export class Axios {
    /** Obtenemos un array predefinido con las configuraciones y valores a enviar */
    getResponse = (data: any) => axios(data)
        .then(response => {
            return {
                ok: true,
                result: response.data
            }
        })
        .catch(error => {
            return {
                ok: false,
                result: error
            }
        })
}
