import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class ClaveModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public contribuyente_id!: number
    public predio_id!: number
    public clave!: string
    public poblacion_id!: number
    public colonia!: string
    public distrito!: string
    public entidad!: string
    public localidad!: string
    public municipio!: string
    public pais!: string
    public region!: string
    public codigo_postal!: string
    public direccion!: string
    public predio_tipo!: string
    public fecha_alta!: string
    public activo!: number
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
ClaveModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contribuyente_id: {
        type: DataTypes.INTEGER
    },
    predio_id: {
        type: DataTypes.INTEGER
    },
    clave: {
        type: DataTypes.STRING
    },
    poblacion_id: {
        type: DataTypes.INTEGER
    },
    colonia: {
        type: DataTypes.STRING
    },
    distrito: {
        type: DataTypes.STRING
    },
    entidad: {
        type: DataTypes.STRING
    },
    localidad: {
        type: DataTypes.STRING
    },
    municipio: {
        type: DataTypes.STRING
    },
    pais: {
        type: DataTypes.STRING
    },
    region: {
        type: DataTypes.STRING
    },
    codigo_postal: {
        type: DataTypes.STRING
    },
    direccion: {
        type: DataTypes.STRING
    },
    predio_tipo: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'claves'
})