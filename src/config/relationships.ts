/** Aquí importamos todos los modelos creado.
 * De igual forma, en este espacio vamos a declarar cada una de las llaves foreneas.
 *  import { ExampleModel } from '../models/example.model'
 */

import {AdministratorAreaModel} from '../models/administrator_area.model'
import {AdministratorModel} from '../models/administrator.model'
import {AreaModel} from '../models/area.model'
import {BitacoraAdministradorModel} from '../models/bitacora_administrador.model'
import {BitacoraContribuyenteModel} from '../models/bitacora_contribuyente.model'
import {BitacoraSolicitudModel} from '../models/bitacora_solicitud.model'
import {ContribuyenteModel} from '../models/contribuyente.model'
// import { DocumentacionModel } from '../models/documentacion.model'
import {DocumentacionServicioModel} from '../models/documentos_servicio.model'
import {RequisitoModel} from '../models/requisito.model'
import {ServicioModel} from '../models/servicio.model'
import {RequisitoServiciosModel} from "../models/requisitos_servicios.model";
import {DocumentacionModel} from "../models/documentacion.model";
import {TiposDocumentosModel} from "../models/tipos-documentos.model";
import {DocumentosSolicitudRequisitoModel} from '../models/documentos_solicitud_requisito.model';
import {SolicitudModel} from "../models/solicitud.model";
import { EstatusSolicitudModel } from '../models/estatus_solicitud.model'
// import { EstatusServicioModel } from '../models/estatus_servicio.model'
import { MensajeModel } from '../models/mensaje.model'
import {EstatusServicioModel} from "../models/estatus_servicio.model";
import {CambiaEstatusModel} from "../models/cambia_estatus.model";
import {DocumentacionPagoModel} from "../models/documentacion_pago.model";
import {DocumentacionAnuenciaModel} from "../models/documentacion_anuencia.model";
import {DocumentacionComplementariaModel} from "../models/documentacion_complementaria.model";

export default class Relationship {
    static init() {
        /**
         * Example.belongsTo(Foreign_Model_Name, { foreignKey: 'foreign_key_id', as: 'NameModel' })
         */
        AdministratorAreaModel.belongsTo(AdministratorModel, {foreignKey: 'administradores_id', as: 'Administrador'})
        AdministratorAreaModel.belongsTo(AreaModel, {foreignKey: 'areas_id', as: 'Area'})
        AdministratorModel.hasMany(AdministratorAreaModel, {foreignKey: 'administradores_id'})
        AreaModel.hasMany(AdministratorAreaModel, {foreignKey: 'areas_id'})

        /*BitacoraSolicitudModel.belongsTo(SolicitudModel, { foreignKey: 'solicitud_id', as: 'Solicitud' })
        DocumentacionModel.belongsTo(SolicitudModel, { foreignKey: 'solicitud_id', as: 'Solicitud' })
        DocumentacionModel.belongsTo(RequisitoModel, { foreignKey: 'requisito_id', as: 'Requisito' })*/


        AreaModel.hasMany(ServicioModel, {foreignKey: 'area_id', as: 'Servicio'})
        ServicioModel.belongsTo(AreaModel, {foreignKey: 'area_id', as: 'Area'})
        // AreaModel.hasMany(ServicioModel, {foreignKey: 'administradores_id', as: 'Area'})

        SolicitudModel.belongsTo(ContribuyenteModel, { foreignKey: 'contribuyente_id', as: 'Contribuyente' })
        SolicitudModel.belongsTo(ServicioModel, { foreignKey: 'servicio_id', as: 'Servicio' })

        // Relaciones Servicio y Requisitos (Pivote)
        RequisitoServiciosModel.belongsTo(ServicioModel, {foreignKey: 'servicio_id', as: 'Servicios'})
        RequisitoServiciosModel.belongsTo(RequisitoModel, {foreignKey: 'requisito_id', as: 'Requisito'})
        ServicioModel.hasMany(RequisitoServiciosModel, {foreignKey: 'servicio_id', as: 'Requisitos'})
        RequisitoModel.hasMany(RequisitoServiciosModel, {foreignKey: 'requisito_id', as: 'Requisitos'})

        DocumentacionServicioModel.belongsTo(ServicioModel, {foreignKey: 'servicio_id', as: 'Servicio'})
        ServicioModel.hasOne(DocumentacionServicioModel, {foreignKey: 'servicio_id', as: 'Documento'})

        DocumentacionModel.belongsTo(TiposDocumentosModel, {foreignKey: 'tipos_documentos_id', as: 'Tipo'})

        // EstatusServicioModel.belongsTo(ServicioModel, { foreignKey: 'servicio_id', as: 'Servicio' })
        EstatusServicioModel.belongsTo(EstatusSolicitudModel, { foreignKey: 'estatus_solicitud_id', as: 'EstatusSolicitud' })
        // ServicioModel.hasMany(EstatusServicioModel, { foreignKey: 'servicio_id' })
        CambiaEstatusModel.belongsTo(EstatusSolicitudModel, { foreignKey: 'estatus_solicitud_id_destino', as: 'EstatusSolicitud' })

        DocumentosSolicitudRequisitoModel.belongsTo(DocumentacionModel, {foreignKey:'documentacion_id', as: 'Documentacion'})
        DocumentacionPagoModel.belongsTo(DocumentacionModel, {foreignKey:'documentacion_id', as: 'Documentacion'})
        DocumentacionAnuenciaModel.belongsTo(DocumentacionModel, {foreignKey:'documentacion_id', as: 'Documentacion'})
        DocumentacionComplementariaModel.belongsTo(DocumentacionModel, {foreignKey:'documentacion_id', as: 'Documentacion'})

        RequisitoModel.hasOne(DocumentosSolicitudRequisitoModel, {foreignKey:'requisito_id', as: 'Documento'})

        SolicitudModel.hasMany(DocumentosSolicitudRequisitoModel, {foreignKey:'solicitudes_id', as: 'DocumentosSolicitudRequisito'})
        SolicitudModel.hasMany(DocumentacionPagoModel, {foreignKey:'solicitud_id', as: 'DocumentosPago'})
        SolicitudModel.hasMany(DocumentacionAnuenciaModel, {foreignKey:'solicitud_id', as: 'DocumentosAnuencia'})
        SolicitudModel.hasOne(DocumentacionComplementariaModel, {foreignKey:'solicitud_id', as: 'DocumentosComplementarios'})
        SolicitudModel.belongsTo(EstatusSolicitudModel, { foreignKey: 'estatus_solicitud_id', as: 'Estatus' })
        SolicitudModel.hasMany(MensajeModel, { foreignKey: 'solicitud_id' })

        MensajeModel.belongsTo(SolicitudModel, {foreignKey: 'solicitud_id'});

        BitacoraSolicitudModel.belongsTo(EstatusSolicitudModel, { foreignKey: 'estatus_solicitud_id', as: 'Estatus' })
    }
}
