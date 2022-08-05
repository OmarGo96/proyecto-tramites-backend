import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class MensajeModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public solicitud_id!: number
    public administrador_id!: number
    public mensaje!: string
    public url!: string
    public fecha_alta!: string
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
MensajeModel.init({
    // Example:
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
    mensaje: {
        type: DataTypes.STRING
    },
    url: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    }
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'mensajes'
})