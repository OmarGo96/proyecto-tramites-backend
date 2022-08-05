import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class DocumentacionServicioModel extends Model{
    public id!: number
    public servicioId!: number
    public administradoresId!: number
    public url!: string
    public fechaAlta!: string
    public descripcion!: string
    public activo!: number
}

DocumentacionServicioModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    servicio_id: {
        type: DataTypes.INTEGER
    },
    administradores_id: {
        type: DataTypes.INTEGER
    },
    url: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.STRING
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'documentos_servicios'
})
