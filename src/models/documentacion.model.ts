import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentacionModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public tipos_documentos_id!: number
    public contribuyentes_id!: number
    public url!: string
    public nombre_otro!: string
    public fecha_alta!: string
    public tipo_documento!: number
    public vigencia_inicial!: string
    public vigencia_final!: string
    public aprobado!: number
    public status!: number

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
DocumentacionModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    tipos_documentos_id: {
        type: DataTypes.INTEGER
    },
    contribuyentes_id: {
        type: DataTypes.INTEGER
    },
    url: {
        type: DataTypes.STRING
    },
    nombre_otro: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    tipo_documento: {
        type: DataTypes.INTEGER
    },
    vigencia_inicial: {
        type: DataTypes.STRING
    },
    vigencia_final: {
        type: DataTypes.STRING
    },
    aprobado: {
        type: DataTypes.INTEGER
    },
    status: {
        type: DataTypes.INTEGER
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'documentacion'
})
