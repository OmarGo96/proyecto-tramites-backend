import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class UrlIntentoCobroModel extends Model{
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
    public referencia!: string
    public folio_intencion_cobro!: string
    public url_intencion_cobro!: string
    public status!: number
    public confirmacion_pago!: string
    public importe!: number
    public confirmacion_url!: string
    public fecha_pago!: string
    public codigo_result!: string
    public mensaje_result!: string
    public fecha_alta!: string

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
UrlIntentoCobroModel.init({
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
    solicitud_tramite_id: {
        type: DataTypes.INTEGER
    },
    referencia: {
        type: DataTypes.STRING
    },
    folio_intencion_cobro: {
        type: DataTypes.STRING
    },
    url_intencion_cobro: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.TINYINT
    },
    confirmacion_pago: {
        type: DataTypes.STRING
    },
    confirmacion_url: {
        type: DataTypes.STRING
    },
    importe: {
        type: DataTypes.NUMBER    },
    fecha_pago: {
        type: DataTypes.DATE
    },
    codigo_result: {
        type: DataTypes.STRING
    },
    mensaje_result: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.DATE
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'url_intencion_cobro'
})
