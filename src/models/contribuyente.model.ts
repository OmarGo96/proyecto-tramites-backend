import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class ContribuyenteModel extends Model{
    public id!: number
    public uuid!: string
    public rfc!: string
    public nombre!: string
    public apellidos!: string
    public razon_social!: string
    public representante_legal!: string
    public email!: string
    public password!: string
    public telefono!: string
    public telefonoReferencia!: string
    public genero!: number
    public edad!: number
    public fechaAlta!: string
    public fechaBaja!: string
    public codigo_activacion!: string
    public restablecer_password!: string
    public cambio_password!: number
    public aviso_privacidad!: number
    public terms_condiciones!: number
    public tipo_persona!: number
    public activo!: number
}

ContribuyenteModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    uuid: {
        type: DataTypes.STRING
    },
    rfc: {
        type: DataTypes.STRING
    },
    nombre: {
        type: DataTypes.STRING
    },
    apellidos: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    razon_social: {
        type: DataTypes.STRING
    },
    representante_legal: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    telefono: {
        type: DataTypes.STRING
    },
    telefono_referencia: {
        type: DataTypes.STRING
    },
    genero: {
        type: DataTypes.INTEGER
    },
    edad: {
        type: DataTypes.INTEGER
    },
    fecha_alta: {
        type: DataTypes.STRING
    },
    fecha_baja: {
        type: DataTypes.STRING
    },
    codigo_activacion: {
        type: DataTypes.STRING
    },
    restablecer_password: {
        type: DataTypes.STRING
    },
    cambio_password: {
        type: DataTypes.INTEGER
    },
    aviso_privacidad: {
        type: DataTypes.INTEGER
    },
    tipo_persona: {
        type: DataTypes.INTEGER
    },
    activo: {
        type: DataTypes.INTEGER
    },
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'contribuyentes'
});
