import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class EstatusServicioModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public estatus_solicitud_id!: number
    public servicio_id!: number
    public plantilla_email!: string
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
EstatusServicioModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    estatus_solicitud_id: {
        type: DataTypes.INTEGER
    },
    servicio_id: {
        type: DataTypes.INTEGER
    },
    plantilla_email: {
        type: DataTypes.STRING
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'estatus_servicios'
})