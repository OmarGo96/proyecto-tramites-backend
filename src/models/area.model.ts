import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class AreaModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number;
    public administradoresId!: number;
    public uuid!: string;
    public nombre!: string;
    public descripcion!: string;
    public responsable!: string;
    public telefono!: string;
    public extension!: string;
    public email!: string;
    public horario!: string;
    public fecha_alta!: string;
    public ubicacion!: string;
    public icono!: string;
    public activo!: string;
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
AreaModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    administradores_id: {
        type: DataTypes.INTEGER
    },
    uuid: {
        type: DataTypes.STRING
    },
    nombre: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    responsable: {
        type: DataTypes.STRING
    },
    telefono: {
        type: DataTypes.STRING
    },
    extension: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    horario: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    ubicacion: {
        type: DataTypes.STRING
    },
    icono: {
        type: DataTypes.STRING
    },
    activo: {
        type: DataTypes.STRING
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'areas'
})
