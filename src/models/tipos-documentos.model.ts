import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class TiposDocumentosModel extends Model{
    public id!: number;
    public nombre!: string;
    public clave!: string;
    public descripcion!: string;
    public activo!: number;
    public fechaAlta!: string;
    public aprobacion!: number
}

TiposDocumentosModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING
    },
    clave: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    fecha_Alta: {
        type: DataTypes.STRING
    },
    requiere_aprobacion: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'tipos_documentos'
})
