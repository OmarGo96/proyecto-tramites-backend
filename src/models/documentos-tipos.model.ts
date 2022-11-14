import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentosTiposModel extends Model{
    public id!: number;
    public tipos_documentos_id!: number;
    public nombre!: string;
}

DocumentosTiposModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    tipos_documentos_id: {
        type: DataTypes.NUMBER
    },
    nombre: {
        type: DataTypes.STRING
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'documentos_tipos'
})
