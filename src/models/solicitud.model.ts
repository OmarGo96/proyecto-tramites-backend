import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class SolicitudModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public contribuyente_id!: number
    public area_id!: number
    public servicio_id!: number
    public licencia_id!: number
    public clave_id!: number
    public expediente_id!: number
    public estatus_solicitud_id!: number
    public folio!: string
    public fecha_alta!: string
    public fecha_recepcion!: string
    public fecha_envio!: string
    public fecha_final!: string
    public fecha_rechazo!: string
    public fecha_visita!: string
    public fecha_pago!: string
    public motivo_rechazo!: string
    public comentario!: string;
    public recibo_pago!: number;

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
SolicitudModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contribuyente_id: {
        type: DataTypes.INTEGER
    },
    area_id: {
        type: DataTypes.INTEGER
    },
    servicio_id: {
        type: DataTypes.INTEGER
    },
    clave_id: {
        type: DataTypes.INTEGER
    },
    licencia_id: {
      type: DataTypes.INTEGER
    },
    expediente_id: {
        type: DataTypes.INTEGER
    },
    estatus_solicitud_id: {
        type: DataTypes.INTEGER
    },
    folio: {
        type: DataTypes.STRING
    },
    fecha_recepcion: {
        type: DataTypes.DATE
    },
    fecha_alta: {
        type: DataTypes.DATE
    },
    fecha_envio: {
        type: DataTypes.DATE
    },
    fecha_final: {
        type: DataTypes.DATE
    },
    fecha_rechazo: {
        type: DataTypes.DATE
    },
    fecha_visita: {
        type: DataTypes.DATE
    },
    fecha_pago: {
        type: DataTypes.DATE
    },
    motivo_rechazo: {
        type: DataTypes.STRING
    },
    comentario: {
        type: DataTypes.STRING
    },
    recibo_pago: {
        type: DataTypes.TINYINT
    }
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'solicitudes'
})
