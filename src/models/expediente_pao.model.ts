import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class ExpedientePaoModel extends Model{
    public id!: number
    public contribuyente_id!: number
    public expediente_pao_id!: number
    public folio_expediente!:string
    public ejercicio_fiscal!:string
    public vigencia_permiso!:string
    public expediente_json!: string
    public requisitos_json!: string
    public clave_catastral!: string
    public correo!: string
    public nombre_gestor!: string
    public representante_legal!: string
    public telefono_contacto!: string
    public token_solicitud_api!: string
    public url_consulta!: string
    public status!: number

}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
ExpedientePaoModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contribuyente_id: {
        type: DataTypes.INTEGER
    },
    expediente_pao_id: {
        type: DataTypes.STRING
    },
    folio_expediente: {
        type: DataTypes.STRING
    },
    ejercicio_fiscal: {
        type: DataTypes.STRING
    },
    vigencia_permiso: {
        type: DataTypes.DATE
    },
    expediente_json: {
        type: DataTypes.STRING
    },
    requisitos_json: {
        type: DataTypes.STRING
    },
    clave_catastral: {
        type: DataTypes.STRING
    },
    correo: {
        type: DataTypes.STRING
    },
    nombre_gestor: {
        type: DataTypes.STRING
    },
    representante_legal: {
        type: DataTypes.STRING
    },
    telefono_contacto: {
        type: DataTypes.STRING
    },
    token_solicitud_api: {
        type: DataTypes.STRING
    },
    url_consulta: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.INTEGER
    }
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'expedientes_pao'
})
