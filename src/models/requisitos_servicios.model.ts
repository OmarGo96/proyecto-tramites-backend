import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class RequisitoServiciosModel extends Model{
    public id!: number;
    public servicio_id!: number;
    public requisito_id!: number;
    public requisito_id_api!: number;
    public original!: number;
    public no_copias!: number;
    public activo!: number;
    public fecha_alta!: string;
    public complementario!: number;
    public obligatorio!: number;
}

RequisitoServiciosModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    servicio_id: {
        type: DataTypes.INTEGER
    },
    requisito_id: {
        type: DataTypes.INTEGER
    },
    requisito_id_api: {
        type: DataTypes.INTEGER
    },
    original: {
        type: DataTypes.INTEGER
    },
    no_copias: {
        type: DataTypes.INTEGER
    },
    activo: {
        type: DataTypes.INTEGER
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    complementario: {
        type: DataTypes.INTEGER
    },
    obligatorio: {
        type: DataTypes.INTEGER
    }

}, {
    sequelize: database,
    timestamps: false,
    tableName: 'requisitos_servicios'
})
