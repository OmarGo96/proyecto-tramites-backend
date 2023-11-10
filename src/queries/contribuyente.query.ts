import {Op} from 'sequelize'
import {ContribuyenteModel} from '../models/contribuyente.model'

export class ContribuyenteQueries {
    public async findContribuyenteByEmail(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.findOne({
                where: {
                    email: data.email
                }
            });
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findContribuyenteById(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.findOne({
                attributes: [
                    'uuid', 'rfc', 'nombre', 'apellidos', 'email', 'telefono', 'telefono_referencia',
                    'genero'
                ],
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findContribuyentesInactive() {
        try {
            const contribuyentes = await ContribuyenteModel.findAll({
                where: {
                    activo: 0,
                    fecha_alta: {
                        [Op.like]: '%2021-12-%'
                    }
                }
            })
            return {ok: true, contribuyentes}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findContribuyenteByUUID(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.findOne({
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findContribuyenteByCodAct(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.findOne({
                where: {
                    codigo_activacion: data.codigo_activacion
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findContribuyenteByCambioPassword(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.findOne({
                where: {
                    restablecer_password: data.restablecer_password
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.create({
                uuid: data.uuid,
                rfc: data.rfc,
                nombre: data.nombre,
                apellidos: data.apellidos,
                email: data.email,
                password: data.password,
                telefono: data.telefono,
                // telefono_referencia: data.telefono_referencia,
                genero: data.genero,
                edad: data.edad,
                fecha_alta: data.fecha_alta,
                fecha_baja: null,
                codigo_activacion: data.codigo_activacion,
                aviso_privacidad: data.aviso_privacidad,
                terms_condiciones: data.terms_condiciones,
                activo: data.activo
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        console.log(data);
        try {
            const contribuyente = await ContribuyenteModel.update({
                nombre: data.nombre,
                apellidos: data.apellidos,
                email: data.email,
                password: data.password,
                telefono: data.telefono,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async changePassword(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.update({
                password: data.password,
                cambio_password: 0,
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async active(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.update({
                activo: 1
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async restoreRequest(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.update({
                restablecer_password: data.restablecer_password,
                cambio_password: 1
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async drop(data: any) {
        try {
            const contribuyente = await ContribuyenteModel.update({
                fecha_baja: data.fecha_baja,
                activo: -1
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, contribuyente}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
