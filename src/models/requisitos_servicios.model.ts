import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class RequisitoServiciosModel extends Model{
    public id!: number;
    public requisitosId!: number;
    public serviciosId!: number;
    public original!: number;
    public noCopias!: number;
    public activo!: number;
    public fechaAlta!: string;
    public complementario!: number;
    public obligatorio!: number;
    public Requisito!: string;
}

RequisitoServiciosModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    requisitos_id: {
        type: DataTypes.INTEGER
    },
    servicios_id: {
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
