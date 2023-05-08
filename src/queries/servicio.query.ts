import * as sequelize from 'sequelize'
import {Op} from 'sequelize'
import {database} from '../config/database'
import {ServicioModel} from '../models/servicio.model'
import {DocumentacionServicioModel} from '../models/documentos_servicio.model'
import {AreaModel} from '../models/area.model'
import {RequisitoModel} from "../models/requisito.model";
import {RequisitoServiciosModel} from "../models/requisitos_servicios.model";

export class ServicioQueries {

    public async getAllServicios() {
        try {
            const servicios = await ServicioModel.findAll()
            return {ok: true, servicios}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async getDocumentoServicio(data: any) {
        try {
            const documento = await DocumentacionServicioModel.findOne({
                where: {
                    servicio_id: data.servicio_id
                }
            })
            return {ok: true, documento}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async topServicios() {
        const query: string = `SELECT servicios.uuid, servicios.nombre, servicios.descripcion, servicios.vigencia, servicios.tiempo, servicios.documento_expedido, servicios.en_linea, areas.uuid as uuidArea, areas.horario, areas.ubicacion, areas.telefono, areas.extension, areas.email, count(*) as total
        from solicitudes
        RIGHT JOIN
        servicios ON
        solicitudes.servicio_id = servicios.id
        RIGHT JOIN
        areas ON
        areas.id = servicios.area_id
        WHERE servicios.area_id = 8 or servicios.area_id = 1
        GROUP BY servicios.id ORDER BY total DESC LIMIT 5;`

        try {
            const result = await database.query(query, {type: sequelize.QueryTypes.SELECT})
            return {ok: true, result}
        } catch {
            return {ok: false}
        }
    }

    public async findServicioByNombre(data: any) {
        try {
            const servicio = await ServicioModel.findOne({
                where: {
                    nombre: data.nombre
                }
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findServicioById(data: any) {
        try {
            const servicio = await ServicioModel.findOne({
                where: {
                    id: data.id
                }
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findServicioByArea(data: any) {
        try {
            const servicios = await ServicioModel.findAll({
                attributes: [
                    'id'
                ],
                where: {
                    area_id: data.area_id
                }
            })
            return {ok: true, servicios}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async create(data: any) {
        try {
            const servicio = await ServicioModel.create({
                uuid: data.uuid,
                area_id: data.area_id,
                administradores_id: data.administradores_id,
                clave: data.clave,
                nombre: data.nombre,
                descripcion: data.descripcion,
                costo: data.costo,
                fecha_alta: data.fecha_alta,
                vigencia: data.vigencia,
                tiempo: data.tiempo,
                documento_expedido: data.documento_expedido
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async findByNameOrDescription(data: any) {
        try {
            const servicios = await ServicioModel.findAll({
                attributes: [
                    'uuid', 'nombre', 'descripcion', 'costo', 'vigencia', 'tiempo',
                    'documento_expedido'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                where: {
                    [Op.or]: [
                        {
                            nombre: {
                                [Op.like]: '%' + data.nombre + '%'
                            }
                        },
                        {
                            descripcion: {
                                [Op.like]: '%' + data.nombre + '%'
                            }
                        }
                    ]

                },
                include: [
                    {
                        attributes: [
                            'uuid', 'horario', 'ubicacion', 'telefono', 'extension', 'email'
                        ],
                        model: AreaModel, as: 'Area'
                    }
                ]
            })
            return {ok: true, servicios}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async getServicios(data: any) {
        let query: any

        if (data.auth === true) {
            query = {
                attributes: [
                    'id', 'uuid', 'nombre', 'descripcion', 'costo', 'vigencia', 'tiempo',
                    'documento_expedido', 'activo', 'en_linea', 'clave'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                where: {
                    area_id: data.area_id
                },
                include: [
                    {model: DocumentacionServicioModel, as: 'Documento'},
                    {model: RequisitoServiciosModel, as: 'Requisitos'}
                ]
            }
        } else {
            query = {
                attributes: [
                    'uuid', 'nombre', 'descripcion', 'costo', 'vigencia', 'tiempo',
                    'documento_expedido', 'en_linea'
                ],
                order: [
                    ['nombre', 'ASC']
                ],
                where: {
                    [Op.and]: [
                        {area_id: data.area_id},
                        {activo: 1}
                    ]
                }
            }
        }
        try {
            const servicios = await ServicioModel.findAll(query)
            return {ok: true, servicios}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findOneServicioByUUID(data: any) {
        try {
            const servicio = await ServicioModel.findOne({
                where: {
                    uuid: data.uuid
                }
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async findServicioByUUID(data: any) {
        try {
            const servicio = await ServicioModel.findOne({
                where: {
                    uuid: data.uuid
                },
                include: [
                    {model: AreaModel, as: 'Area'},
                    {model: DocumentacionServicioModel, as: 'Documento'},
                    {
                        model: RequisitoServiciosModel, as: 'Requisitos',
                        required: false,
                        include: [
                            {
                                model: RequisitoModel, as: 'Requisito',
                                where: {
                                    activo: 1
                                },
                                required: false
                            }
                        ]
                    }
                ]
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async update(data: any) {
        try {
            const servicio = await ServicioModel.update({
                nombre: data.nombre,
                clave: data.clave,
                descripcion: data.descripcion,
                costo: data.costo,
                vigencia: data.vigencia,
                tiempo: data.tiempo,
                documento_expedido: data.documentoExpedido,
                en_linea: data.enLinea,
                activo: data.activo
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    public async delete(data: any) {
        try {
            const servicio = await ServicioModel.update({
                activo: data.activo
            }, {
                where: {
                    id: data.id
                }
            })
            return {ok: true, servicio}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
