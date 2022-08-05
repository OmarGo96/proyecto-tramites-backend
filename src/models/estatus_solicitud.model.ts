import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class EstatusSolicitudModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public nombre!: string
    public descripcion!: string
    public color!: string
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
EstatusSolicitudModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    color: {
        type: DataTypes.STRING
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'estatus_solicitud'
})