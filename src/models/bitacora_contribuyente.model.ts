import {Model, DataTypes} from 'sequelize'
import {database} from '../config/database'

export class BitacoraContribuyenteModel extends Model {
    public id!: number
    public contribuyenteId!: number
    public navegador!: string
    public ip!: string
    public accion!: string
    public fechaAlta!: string
}

BitacoraContribuyenteModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contribuyente_id: {
        type: DataTypes.INTEGER
    },
    navegador: {
        type: DataTypes.STRING
    },
    ip: {
        type: DataTypes.STRING
    },
    accion: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    }
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'bitacora_contribuyentes'
})
