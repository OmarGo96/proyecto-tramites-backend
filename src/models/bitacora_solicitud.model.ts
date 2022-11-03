import {Model, DataTypes} from 'sequelize'
import {database} from '../config/database'

export class BitacoraSolicitudModel extends Model {
    public id!: number
    public solicitudId!: number
    public administradoresId!: number
    public contribuyenteId!: number
    public fechaAlta!: string
    public estatusSolicitudId!: number
}

BitacoraSolicitudModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    administrador_id: {
        type: DataTypes.INTEGER
    },
    contribuyente_id: {
        type: DataTypes.INTEGER
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    estatus_solicitud_id: {
        type: DataTypes.INTEGER
    },
    comentario: {
        type: DataTypes.STRING
    }
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'bitacora_solicitudes'
})
