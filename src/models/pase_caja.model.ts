import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class PaseCajaModel extends Model{
    // Declare public properties (one per column in database)
    // Note the ! at the end of each property
    //example:
    public id!: number
    public solicitud_id!: number
    public licencia_funcionamiento_id!: number
    public clave_id!: number
    public grupo_tramite_id!: number
    public tramite_id!: number
    public solicitud_tramite_id!: number
    public observaciones!: string
    public folio_pase_caja!: string
    public urlPaseImpresion!: string
    public codigo_error!: string
    public mensaje_error!: string
    public fecha_alta!: string

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
PaseCajaModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    solicitud_id: {
        type: DataTypes.INTEGER
    },
    licencia_funcionamiento_id: {
        type: DataTypes.INTEGER
    },
    clave_id: {
        type: DataTypes.INTEGER
    },
    grupo_tramite_id: {
        type: DataTypes.INTEGER
    },
    tramite_id: {
        type: DataTypes.INTEGER
    },
    observaciones: {
        type: DataTypes.STRING
    },
    folio_pase_caja: {
        type: DataTypes.STRING
    },
    urlPaseImpresion: {
        type: DataTypes.TEXT
    },
    codigo_error: {
        type: DataTypes.STRING
    },
    mensaje_error: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.DATE
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'pase_caja'
})
