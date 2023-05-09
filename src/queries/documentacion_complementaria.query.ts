import {Op} from 'sequelize'
import {DocumentacionComplementariaModel} from "../models/documentacion_complementaria.model";

export class DocumentacionComplementariaQueries {

    public async create(data: any) {
        try {
            const documentComplementaria = await DocumentacionComplementariaModel.create({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                status: data.status,
                fecha_alta: data.fecha_alta,
            })
            return {ok: true, documentComplementaria}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const documentacionComplementaria = await DocumentacionComplementariaModel.update({
                documentacion_id: data.documentacion_id,
                solicitud_id: data.solicitud_id,
                status: data.status,
                fecha_alta: data.fecha_alta,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, documentacionComplementaria}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findDocumentacionComplementariaById(data: any) {
        try {
            const documentacionComplementaria = await DocumentacionComplementariaModel.findOne({
                where: {
                    id: data.id
                }
            })
            return { ok: true, documentacionComplementaria }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }

    public async changeStatus(data: any) {
        try {
            const documentacionComplementaria = await DocumentacionComplementariaModel.update(
                {
                    status: data.status,
                },
                { where: { id: data.id } }
            )
            return { ok: true, documentacionComplementaria }
        } catch (e) {
            console.log(e)
            return { ok: false }
        }
    }
}
