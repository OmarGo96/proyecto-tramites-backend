import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class LicenciaModel extends Model{
    public id!: number
    public contribuyentes_id!: number
    public rfc!: string
    public licencia_funcionamiento_id!: string
    public licencia_funcionamiento_folio!: string
    public razon_social!: string
    public nombre_establecimiento!: string
    public habitaciones!: number
    public domicilio_fiscal!: number
    public calle!: string
    public no_interior!: string
    public no_exterior!: string
    public cp!: string
    public colonia!: number
    public localidad!: number
    public municipio!: string
    public estado!: string
    public propietario_nombre!: string
    public fecha_inicio_operacion!: string
    public estatus!: string
    public ultimo_ejercicio_pagado!: string
    public ultimo_periodo_pagado!: string
    public renovable!: number
    public fecha_alta!: string
}

// Initialize the class with the properties exactly as they are in the Database.
// Do not initialize utility columns like timestamps
LicenciaModel.init({
    // Example:
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contribuyentes_id: {
        type: DataTypes.INTEGER
    },
    rfc: {
        type: DataTypes.STRING
    },
    licencia_funcionamiento_id: {
        type: DataTypes.STRING
    },
    licencia_funcionamiento_folio: {
        type: DataTypes.STRING
    },
    clave_catastral: {
        type: DataTypes.STRING
    },
    razon_social: {
        type: DataTypes.STRING
    },
    nombre_establecimiento: {
        type: DataTypes.STRING
    },
    habitaciones: {
        type: DataTypes.STRING
    },
    domicilio_fiscal: {
        type: DataTypes.STRING
    },
    calle: {
        type: DataTypes.STRING
    },
    no_interior: {
        type: DataTypes.STRING
    },
    no_exterior: {
        type: DataTypes.STRING
    },
    cp: {
        type: DataTypes.STRING
    },
    colonia: {
        type: DataTypes.STRING
    },
    localidad: {
        type: DataTypes.STRING
    },
    municipio: {
        type: DataTypes.STRING
    },
    estado: {
        type: DataTypes.STRING
    },
    propietario_nombre: {
        type: DataTypes.STRING
    },
    fecha_inicio_operacion: {
        type: DataTypes.STRING
    },
    estatus: {
        type: DataTypes.STRING
    },
    ultimo_ejercicio_pagado: {
        type: DataTypes.STRING
    },
    ultimo_periodo_pagado: {
        type: DataTypes.STRING
    },
    renovable: {
      type: DataTypes.TINYINT
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
}, {
    // Then add the configuration:
    sequelize: database,
    timestamps: false,
    tableName: 'licencias_funcionamiento'
})
