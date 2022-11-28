import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class CambiaEstatusModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public servicio_id!: number
    public estatus_solicitud_id!: number
    public estatus_solicitud_id_destino!: number

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
CambiaEstatusModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    servicio_id: {
        type: DataTypes.INTEGER
    },
    estatus_solicitud_id: {
        type: DataTypes.INTEGER
    },
    estatus_solicitud_id_destino: {
        type: DataTypes.INTEGER
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'cambia_estatus'
})
