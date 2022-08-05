import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class AdministratorModel extends Model{
    public id!: number
    public rol!: number
    public uuid!: string
    public nombre!: string
    public apellidos!: string
    public usuario!: string
    public password!: string
    public fechaAlta!: string
    public fechaBaja!: string
    public activo!: number
}

AdministratorModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    rol: {
        type: DataTypes.INTEGER
    },
    uuid: {
        type: DataTypes.STRING
    },
    nombre: {
        type: DataTypes.STRING
    },
    apellidos: {
        type: DataTypes.STRING
    },
    usuario: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    fecha_baja: {
        type: DataTypes.STRING
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'administradores'
})
