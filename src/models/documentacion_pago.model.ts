import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentacionPagoModel extends Model{
    public id!: number
    public documentacionId!: number
    public solicitudId!: number
    public documento_pago!: number
    public fechaAlta!: string
    public estaus!: number
}

DocumentacionPagoModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    documentacion_id: {
        type: DataTypes.INTEGER
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    documento_pago: {
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
    tableName: 'documentacion_pago'
})
