import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentosSolicitudModel extends Model{
    public id!: number
    public documentacionId!: number
    public solicitudesId!: number
    public fechaAlta!: string
    public estaus!: number
}

DocumentosSolicitudModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    documentacion_id: {
        type: DataTypes.INTEGER
    },
    solicitudes_id: {
        type: DataTypes.INTEGER
    },
    requisito_id: {
        type: DataTypes.INTEGER
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    estatus: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'documento_solicitud'
})
