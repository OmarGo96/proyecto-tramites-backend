import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentosSolicitudModel extends Model{
    public id!: number
    public solicitud_id!: number
    public administradoresId!: number
    public url!: string
    public fechaAlta!: string
    public status!: number
}

DocumentosSolicitudModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    administradores_id: {
        type: DataTypes.INTEGER
    },
    url: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'documentos_solicitud'
})
