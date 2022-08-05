import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class ServicioModel extends Model{
    public id!: number
    public area_id!: number
    public administradoresId!: number
    public uuid!: string
    public clave!: string
    public nombre!: string
    public descripcion!: string
    public costo!: string
    public fechaAlta!: string
    public vigencia!: string
    public tiempo!: string
    public documentoExpedido!: string
    public enLinea!: number
    public grupoTramiteId!: number
    public tramiteId!: number
    public activo!: number
    public Area: any;
}

ServicioModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    area_id: {
        type: DataTypes.INTEGER
    },
    administradores_id: {
        type: DataTypes.INTEGER
    },
    uuid: {
        type: DataTypes.STRING
    },
    clave: {
        type: DataTypes.STRING
    },
    nombre: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    costo: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    vigencia: {
        type: DataTypes.STRING
    },
    tiempo: {
        type: DataTypes.STRING
    },
    documento_expedido: {
        type: DataTypes.STRING
    },
    en_linea: {
        type: DataTypes.INTEGER
    },
    grupo_tramite_id: {
        type: DataTypes.INTEGER
    },
    tramite_id: {
        type: DataTypes.INTEGER
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'servicios'
})
