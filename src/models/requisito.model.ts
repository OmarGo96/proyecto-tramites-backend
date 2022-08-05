import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class RequisitoModel extends Model{
    public id!: number
    public tiposDocumentosId!: number
    public uuid!: string
    public nombre!: string
    public descripcion!: string
    public fechaAlta!: string
    public activo!: number
}

RequisitoModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    tipos_documentos_id: {
        type: DataTypes.INTEGER
    },
    uuid: {
        type: DataTypes.STRING
    },
    nombre: {
        type: DataTypes.INTEGER
    },
    descripcion: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'requisitos'
})
