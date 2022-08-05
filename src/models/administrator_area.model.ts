import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class AdministratorAreaModel extends Model{}

AdministratorAreaModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    administradores_id: {
        type: DataTypes.INTEGER
    },
    areas_id: {
        type: DataTypes.INTEGER
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'administradores_areas'
})
