import {Op} from 'sequelize'
import {DocumentosTiposModel} from "../models/documentos-tipos.model";


export class DocumentosTiposQueries {

    public async getDocumentosTiposByTipoDocumento_id(data: any) {
        try {
            const documentosTipos = await DocumentosTiposModel.findAll({
                where: {
                    tipos_documentos_id: data.tipo_documento_id
                }
            });
            return {ok: true, documentosTipos}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

}
