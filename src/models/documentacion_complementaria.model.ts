import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentacionComplementariaModel extends Model{
    public id!: number
    public solicitudId!: number
    public documentacionId!: number
    public status!: number
    public fechaAlta!: string
}

DocumentacionComplementariaModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    documentacion_id: {
        type: DataTypes.INTEGER
    },
    status: {
        type: DataTypes.INTEGER
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'documentacion_complementaria'
})
