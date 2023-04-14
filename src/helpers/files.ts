import moment from 'moment'
import fs from 'fs'

export class File {
    public async upload(data: any, lastFile: any, type: any) {
        if (data.files == null) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo a procesar'
            }
        } else if (!data.files.file) {
            return {
                ok: false,
                message: 'Si desea adjuntar un archivo pdf, es necesario proporcionar uno'
            }
        } else if (data.files.file === null) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo a procesar'
            }
        }

        if (data.files.file.mimetype !== 'application/pdf') {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo con extensión ".pdf"'
            }
        }

        const size: number = data.files.file.size;
        const bytes: number = 1048576;
        const totalSize: number = (size / bytes)

        if (totalSize > 2.00) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo menor o igual a 2 mb.'
            }
        }

        const file: any = data.files.file
        const nameFile: number = moment().unix()
        const path: any = (type === 'documentacion') ? process.env.DOCUMENTATION_PATH : (type === 'solicitud') ? process.env.SOLICITUD_DOCS_PATH : (type === 'servicio') ? process.env.SERVICES_DOCS_PAT : process.env.MESSAGE_DOCS_PATH

        if (lastFile != null) {
            try {
                fs.unlinkSync(path + lastFile);
            } catch {
                return {
                    ok: false,
                    message: 'Existen problemas al momento de eliminar el archivo anterior'
                }
            }
        }

        file.mv(path + nameFile + '.pdf', (err: any) => {
            if (err) {
                return {
                    ok: false,
                    message: 'Existen problemas al momento de salvar el archivo'
                }
            }
        })

        return {ok: true, nameFile: nameFile + '.pdf'}
    }

    public async download(name: any, type: any) {

        const path: any = (type === 'documentacion') ? process.env.DOCUMENTATION_PATH : process.env.MESSAGE_DOCS_PATH

        try {
            return {ok: true, pdf: fs.readFileSync(path + name)}
        } catch {
            return {ok: false, message: 'Existen problemas al momento de obtener el pdf!'}
        }

    }

    public async destroy(name: any, type: any) {
        const path: any = (type === 'documentacion') ? process.env.DOCUMENTATION_PATH : null;

        try {
            return {ok: true, pdf: fs.unlinkSync(path + name)}
        } catch {
            return {ok: false, message: 'Existen problemas al momento de eliminar el pdf!'}
        }
    }

    public async documentService(name: any) {
        const path: any = process.env.SERVICES_DOCS_PATH;

        try {
            return {ok: true, pdf: fs.readFileSync(path + name)}
        } catch {
            return {ok: false, message: 'Existen problemas al momento de obtener el pdf!'}
        }
    }
}
