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
        }

        const file: any = data.files.file

        let allowed_ext = ['.pdf','.PDF','.dwg','.dxf']

        const ext = '.' + file.name.split(".").pop()

        if (!allowed_ext.includes(ext)) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo con extensión valida'
            }
        }

        const size: number = data.files.file.size;
        const bytes: number = 1048576;
        const totalSize: number = (size / bytes)

        if (totalSize > 30.00) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo menor o igual a 30 Mb.'
            }
        }


        const nameFile: number = moment().unix()
        let path: any;

        switch (type) {
            case 'documentacion': {
                path = process.env.DOCUMENTATION_PATH;
                break;
            }
            case 'solicitud': {
                path = process.env.SOLICITUD_DOCS_PATH;
                break;
            }
            case 'servicio': {
                path = process.env.SERVICES_DOCS_PATH;
                break;
            }
            case 'message': {
                path = process.env.MESSAGE_DOCS_PATH;
                break;
            }
            case 'pase_caja': {
                path = process.env.PASECAJA_DOCS_PATH;
                break;
            }
        }

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

        file.mv(path + nameFile + ext, (err: any) => {
            if (err) {
                return {
                    ok: false,
                    message: 'Existen problemas al momento de salvar el archivo'
                }
            }
        })

        return {ok: true, nameFile: nameFile + ext}
    }

    public async download(name: any, type: any) {

        let path: any;

        switch (type) {
            case 'documentacion': {
                path = process.env.DOCUMENTATION_PATH;
                break;
            }
            case 'solicitud': {
                path = process.env.SOLICITUD_DOCS_PATH;
                break;
            }
            case 'servicio': {
                path = process.env.SERVICES_DOCS_PATH;
                break;
            }
            case 'message': {
                path = process.env.MESSAGE_DOCS_PATH;
                break;
            }
            case 'pase_caja': {
                path = process.env.PASECAJA_DOCS_PATH;
                break;
            }
        }

        try {
            return {ok: true, file: fs.readFileSync(path + name), path: path + name, name}
        } catch (e) {
            console.log(e)
            return {ok: false, message: 'Existen problemas al momento de obtener el pdf!'}
        }

    }

    public async getFileBase64(name: any, type: any) {

        let path: any;

        switch (type) {
            case 'documentacion': {
                path = process.env.DOCUMENTATION_PATH;
                break;
            }
            case 'solicitud': {
                path = process.env.SOLICITUD_DOCS_PATH;
                break;
            }
            case 'servicio': {
                path = process.env.SERVICES_DOCS_PATH;
                break;
            }
            case 'message': {
                path = process.env.MESSAGE_DOCS_PATH;
                break;
            }
            case 'pase_caja': {
                path = process.env.PASECAJA_DOCS_PATH;
                break;
            }
        }

        try {
            return {ok: true, file: fs.readFileSync(path + name, {encoding: "base64"}), path: path + name, name}
        } catch (e) {
            console.log(e)
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
