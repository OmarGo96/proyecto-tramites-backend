import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentacionLicenciaComercialModel extends Model{
    public id!: number
    public solicitudId!: number
    public documentacionId!: number
    public documento_licencia_comercial!: number
    public fechaAlta!: string
    public status!: number
}

DocumentacionLicenciaComercialModel.init({
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
    documento_licencia_comercial:{
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
    tableName: 'documentacion_licencia_comercial'
})
