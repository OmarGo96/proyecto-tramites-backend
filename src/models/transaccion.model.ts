import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class TransaccionModel extends Model {
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public solicitudId!: number
    public folio!: string
    public recibo!: string
    public transferencia!: string
    public importe!: string
    public tipoPago!: string
    public numeroAutorizacion!: string
    public sha!: string
    public fechaAlta!: string
    public fechaRespuesta!: string
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
TransaccionModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    folio: {
        type: DataTypes.STRING
    },
    recibo: {
        type: DataTypes.STRING
    },
    transferencia: {
        type: DataTypes.STRING
    },
    importe: {
        type: DataTypes.STRING
    },
    tipo_pago: {
        type: DataTypes.STRING
    },
    numero_autorizacion: {
        type: DataTypes.STRING
    },
    sha: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    fecha_respuesta: {
        type: DataTypes.STRING
    }
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'transacciones'
})
