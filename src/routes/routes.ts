import {Application} from 'express';

/* Controllers */
import {SessionController} from "../controllers/session.controller";
import {ContribuyenteController} from '../controllers/contribuyente.controller';
import {AdministradorController} from '../controllers/administrador.controller';
import {AreaController} from '../controllers/area.controller';
import {ServicioController} from '../controllers/servicio.controller';
import {RequerimientoController} from '../controllers/requerimiento.controller';
import {TiposDocumentosController} from '../controllers/tipos-documentos.controller';
import {ClaveController} from '../controllers/clave.controller';
import {PagoController} from '../controllers/pago.controller';
import {LicenciaController} from '../controllers/licencia.controller';
import {SolicitudController} from '../controllers/solicitud.controller';
import {DocumentacionController} from '../controllers/documentacion.controller';
import {DocumentosSolicitudRequisitoController} from '../controllers/documentos-solicitud-requisito.controller';
import {EstatusesController} from '../controllers/estatuses.controller';
import {MensajeController} from "../controllers/mensaje.controller";
import {DocumentacionPagoController} from "../controllers/documentacion-pago.controller";
import {DocumentosSolicitudController} from "../controllers/documentos-solicitud.controller";
import {DocumentosAnuenciaController} from "../controllers/documentos-anuencia.controller";
import {DocumentacionComplementariaController} from "../controllers/documentacion-complementaria.controller";
import {PaseCajaController} from "../controllers/pase-caja.controller";
import {ReportController} from "../controllers/report.controller";
import {TestController} from "../controllers/test.controller";

/* Middlewares */
import { CheckHeaders } from '../middlewares/header';
import { CheckRoles } from '../middlewares/roles'
import { GetValue } from '../middlewares/get-values'




export class Routes {
    public sessionController = new SessionController();
    public contribuyenteController = new ContribuyenteController();
    public administradorController: AdministradorController = new AdministradorController();
    public areaController: AreaController = new AreaController();
    public servicioController: ServicioController = new ServicioController();
    public requerimientoController: RequerimientoController = new RequerimientoController();
    public tiposDocumentosController: TiposDocumentosController = new TiposDocumentosController();
    public claveController: ClaveController = new ClaveController();
    public pagoController: PagoController = new PagoController();
    public licenciaController: LicenciaController = new LicenciaController();
    public solicitudController: SolicitudController = new SolicitudController();
    public documentacionController: DocumentacionController = new DocumentacionController();
    public documentosSolicitudRequisitoController: DocumentosSolicitudRequisitoController = new DocumentosSolicitudRequisitoController();
    public estatusesController: EstatusesController = new EstatusesController();
    public mensajeController: MensajeController = new MensajeController();
    public documentacionPagoController: DocumentacionPagoController = new DocumentacionPagoController();
    public documentosSolicitudController: DocumentosSolicitudController = new DocumentosSolicitudController();
    public documentosAnuenciaController: DocumentosAnuenciaController = new DocumentosAnuenciaController();
    public documentacionComplementariaController: DocumentacionComplementariaController = new DocumentacionComplementariaController();
    public paseCajaController: PaseCajaController = new PaseCajaController();
    public reportController: ReportController = new ReportController();
    public testController: TestController = new TestController();
    /*

    public testController: TestController = new TestController();
    */

    public routes(app: Application) {
        // Routes for user sessions
        app.route('/api/session/administrador').post(this.sessionController.administrador)
        app.route('/api/session/contribuyente').post(this.sessionController.contribuyente)
        app.route('/api/payload').get(CheckHeaders.validateJWTByTypeUser, this.sessionController.checkPayload)
        // Routes for contribuyentes methods
        app.route('/api/contribuyentes').get(CheckHeaders.validateJWTContribuyente, this.contribuyenteController.show)
        app.route('/api/contribuyentes').post(this.contribuyenteController.store)
        app.route('/api/reenvio_activacion').post(this.contribuyenteController.forward)
        app.route('/api/solicitud_restauracion').post(this.contribuyenteController.restoreRequest)
        app.route('/api/restaurar_cuenta').post(this.contribuyenteController.restorePassword)
        app.route('/api/contribuyentes/:contribuyente_uuid').put(CheckHeaders.validateJWTContribuyente, this.contribuyenteController.update)
        app.route('/api/activar_cuenta/:codigo_activacion').get(this.contribuyenteController.active)
        app.route('/api/contribuyentes/:contribuyente_uuid').get(CheckHeaders.validateJWTContribuyente, this.contribuyenteController.drop)
        // Routes for administradores methods
        app.route('/api/administradores').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.administradorController.store)
        app.route('/api/administradores').get(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, GetValue.administrador, this.administradorController.index)
        app.route('/api/info_administrador').get(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.administradorController.show)
        app.route('/api/administradores/:administrador_uuid').put(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.administradorController.update)
        // Routes for areas methods
        app.route('/api/contribuyente/areas').get(CheckHeaders.validateJWTContribuyente, this.areaController.index)
        app.route('/api/areas').get(CheckHeaders.validateJWTAdministrador, GetValue.administrador, this.areaController.index)
        app.route('/api/area/:uuid').get(CheckHeaders.validateJWTByTypeUser,this.areaController.show)
        app.route('/api/areas').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.areaController.store)
        app.route('/api/areas/:area_uuid').put(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.areaController.update)
        // Routes for servicios methods
        app.route('/api/servicios/:area_uuid').get(CheckHeaders.contentAuthorization, this.servicioController.index)
        app.route('/api/servicio/:uuid').get(this.servicioController.show)
        app.route('/api/servicio/delete/:uuid').delete(CheckHeaders.validateJWTAdministrador, this.servicioController.delete)
        app.route('/api/servicios').get(this.servicioController.getAll);
        // app.route('/api/buscar_servicios').post(this.servicioController.findByNameOrDescription)
        // app.route('/api/top_servicios').get(this.servicioController.top)
        app.route('/api/documento_servicios/:servicio_uuid').get(this.servicioController.getDocumentService)
        app.route('/api/adjuntar_documento_servicio/:servicio_uuid').post(CheckHeaders.validateJWTAdministrador, this.servicioController.upload)
        app.route('/api/servicios').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.servicioController.store)
        app.route('/api/servicios/:servicio_uuid').put(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.servicioController.update)
        // Routes for requerimientos methods
        app.route('/api/requerimientos').get(CheckHeaders.contentAuthorization, this.requerimientoController.index)
        app.route('/api/requerimientos-servicio/:servicio_uuid').get(CheckHeaders.contentAuthorization, this.requerimientoController.getRequerimientosByServicio)
        app.route('/api/requerimientos').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.store)
        app.route('/api/requerimientos/:requerimiento_uuid').put(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.update)
        app.route('/api/requerimientos/:requerimiento_uuid').patch(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.changeAction)
        app.route('/api/requerimiento/assign').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.assignRequerimientoServicio)
        app.route('/api/requerimiento/edit/:requerimiento_servicio_id').put(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.editRequerimientoServicio)
        app.route('/api/requerimiento/unlink/:requerimiento_servicio_id').delete(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.requerimientoController.unlinkRequerimientoServicio)
        // Routes for solicitudes methods
        app.route('/api/solicitudes').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.store)
        app.route('/api/solicitudes').get(CheckHeaders.validateJWTContribuyente, this.solicitudController.show)
        app.route('/api/solicitudes/:status').get(CheckHeaders.validateJWTContribuyente, this.solicitudController.showByStatus)
        app.route('/api/solicitud/:id').get(CheckHeaders.validateJWTContribuyente, this.solicitudController.findOne)
        app.route('/api/solicitud/pase_caja').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.pasecaja)
        app.route('/api/solicitud/link_pago').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.linkpago)

        app.route('/api/cambiar_solicitud_estatus/:solicitud_id').post(CheckHeaders.validateJWTByTypeUser, GetValue.solicitud, this.solicitudController.changeStatus);
        app.route('/api/solicitud/fecha-visita/:solicitud_id').post(CheckHeaders.validateJWTAdministrador,GetValue.solicitud, this.solicitudController.addVisitDate)


        app.route('/api/todas_solicitudes').post(CheckHeaders.validateJWTAdministrador, this.solicitudController.index)
        app.route('/api/solicitud-detalle/:id').get(CheckHeaders.validateJWTAdministrador, this.solicitudController.findOneAdmin)
        app.route('/api/solicitud/get-documents-zip/:id').get(CheckHeaders.validateJWTAdministrador, this.solicitudController.downloadDocumentsZip)
        // app.route('/api/estatuses/:id').get(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.estatusesController.index)
        app.route('/api/estatusesById/:servicio_id/:estatus_id').get(CheckHeaders.validateJWTAdministrador, this.estatusesController.indexByEstatusId)
        app.route('/api/solicitudes/badges/count').get(CheckHeaders.validateJWTAdministrador, this.solicitudController.getBadgesByEstatusSolicitud)
        app.route('/api/solicitud/documento-digital/:solicitud_id').post(CheckHeaders.validateJWTAdministrador, this.documentosSolicitudController.upload)
        app.route('/api/solicitud/documento-digital/:solicitud_id').get(CheckHeaders.validateJWTByTypeUser, this.documentosSolicitudController.getFile)

        // PAGO CONTROLLER

        app.route('/api/solicitud/pago_online').post(CheckHeaders.validateJWTContribuyente, this.pagoController.onlinePayment)
        app.route('/api/solicitud/respuesta_intento_pago/:referencia').post(this.pagoController.respuestaIntentoPago)



        /*app.route('/api/adjuntar_comentario').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.attachComment)
        app.route('/api/eliminar_solicitud/:solicitud_id').delete(CheckHeaders.validateJWTContribuyente, this.solicitudController.delete)
        app.route('/api/pagar_tramite').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.pay)
        app.route('/api/pase_caja_tramite').post(CheckHeaders.validateJWTContribuyente, this.solicitudController.paseCaja)*/
        // Routes for messages methods
        app.route('/api/mensajes/no-leidos').get(CheckHeaders.validateJWTContribuyente, this.mensajeController.getUnreadMessages)
        app.route('/api/mensajes').post(CheckHeaders.validateJWTAdministrador, this.mensajeController.store)
        app.route('/api/archivo_mensajes/:mensaje_id').get(CheckHeaders.validateJWTByTypeUser, this.mensajeController.getFile)
        // Routes for documentacion methods
        app.route('/api/documentacion').post(CheckHeaders.validateJWTContribuyente, this.documentacionController.attachFile)
        app.route('/api/documentacion').get(CheckHeaders.validateJWTContribuyente, this.documentacionController.index)
        app.route('/api/archivo_documentacion/:documentacion_id').get(/*CheckHeaders.validateJWTByTypeUser, */this.documentacionController.getFile)
        app.route('/api/documentacion/:documentacion_id').post(CheckHeaders.validateJWTContribuyente,this.documentacionController.deleteDocument)
        // Routes for documentos-solicitud-requisito
        app.route('/api/documentos-solcicitud').post(CheckHeaders.validateJWTContribuyente, this.documentosSolicitudRequisitoController.attachFile)
        app.route('/api/documentos-solicitud-requisito/:documento_solicitud_requisito_id').put(CheckHeaders.validateJWTContribuyente, this.documentosSolicitudRequisitoController.updateDocumentoSolicitudRequisito)
        app.route('/api/cambiar_estatus_documentacion/:documentacion_id').put(CheckHeaders.validateJWTAdministrador, this.documentosSolicitudRequisitoController.validarDocumentoRequisito)
        app.route('/api/eliminar-documentacion/:documentacion_id').put(CheckHeaders.validateJWTContribuyente, this.documentosSolicitudRequisitoController.unlinkDocumentoRequisito)
        // Routes for documentacion-pago
        app.route('/api/documentacion-pago').post(CheckHeaders.validateJWTContribuyente, this.documentacionPagoController.attachFile)
        app.route('/api/documentacion-pago/:documento_pago_id').put(CheckHeaders.validateJWTContribuyente, this.documentacionPagoController.updateDocumentacionPago)
        app.route('/api/validar_documentacion_pago/:documentacion_pago_id').put(CheckHeaders.validateJWTAdministrador, this.documentacionPagoController.validarDocPago)
        app.route('/api/eliminar_documentacion_pago/:documentacion_pago_id').put(CheckHeaders.validateJWTContribuyente, this.documentacionPagoController.unlinkDocPago)
        // Routes para documentacion-anuencia
        app.route('/api/documento-anuencia').post(CheckHeaders.validateJWTContribuyente, this.documentosAnuenciaController.attachFile)
        app.route('/api/documento-anuencia/:documento_anuencia_id').put(CheckHeaders.validateJWTByTypeUser, this.documentosAnuenciaController.updateDocumentacionAneuncia)
        app.route('/api/validar-documento-anuencia/:documentacion_anuencia_id').put(CheckHeaders.validateJWTAdministrador, this.documentosAnuenciaController.validarDocAnuencia)
        app.route('/api/eliminar-documentacion-anuencia/:documentacion_anuencia_id').put(CheckHeaders.validateJWTContribuyente, this.documentosAnuenciaController.unlinkDocAnuencia)
        // Routes para documentacion-complementaria
        app.route('/api/documento-complementaria').post(CheckHeaders.validateJWTContribuyente, this.documentacionComplementariaController.attachFile)
        app.route('/api/documento-complementaria/:documentacion_complementaria_id').put(CheckHeaders.validateJWTContribuyente, this.documentacionComplementariaController.updateDocumentacionComplementaria)
        app.route('/api/validar-documento-complementario/:documentacion_complementaria_id').put(CheckHeaders.validateJWTAdministrador, this.documentacionComplementariaController.validarDocComplementario)
        app.route('/api/eliminar-documento-complementario/:documentacion_complementaria_id').put(CheckHeaders.validateJWTContribuyente, this.documentacionComplementariaController.unlinkDocComplementario)
        // Routes for tipo documentos methods
        app.route('/api/tipo_documentos').get(CheckHeaders.contentAuthorization, this.tiposDocumentosController.index)
        app.route('/api/tipo_documentos').post(CheckHeaders.validateJWTAdministrador, CheckRoles.permisos, this.tiposDocumentosController.store);
        app.route('/api/documentos_tipos/:documento_tipo_id').get(CheckHeaders.contentAuthorization, this.tiposDocumentosController.tiposDocumentosList)
        // Routes for pago predial
        app.route('/api/claves').post(CheckHeaders.validateJWTContribuyente, this.claveController.store)
        app.route('/api/claves').get(CheckHeaders.validateJWTContribuyente, this.claveController.show)
        app.route('/api/deslindar_clave').post(CheckHeaders.validateJWTContribuyente, this.claveController.demarcate)
        app.route('/api/estado_cuenta').post(CheckHeaders.validateJWTContribuyente, this.claveController.statementaccount)
        app.route('/api/pase_caja').post(CheckHeaders.validateJWTContribuyente, this.claveController.linkToPay)
        app.route('/api/pago_banco').post(CheckHeaders.validateJWTContribuyente, this.claveController.linkToBank)
        app.route('/api/pase_caja/catastral').post(/* CheckHeaders.validateJWTContribuyente,  */this.claveController.generate)
        app.route('/api/simular_pago').post(/* CheckHeaders.validateJWTContribuyente,  */this.pagoController.simulate)
        app.route('/api/contribuyentes_no_activos').get(this.contribuyenteController.resendActivationCode)
        // Routes for licencias funcionamiento
        app.route('/api/licencia-funcionamiento').get(CheckHeaders.validateJWTContribuyente, this.licenciaController.show)
        app.route('/api/licencia-funcionamiento').post(CheckHeaders.validateJWTContribuyente, this.licenciaController.store)
        app.route('/api/licencia-funcionamiento/check').post(CheckHeaders.validateJWTContribuyente, this.licenciaController.checkLicense)
        app.route('/api/licencia-funcionamiento-estado-de-cuenta').post(CheckHeaders.validateJWTContribuyente, this.licenciaController.statementaccount)
        app.route('/api/licencia-pase-caja').post(CheckHeaders.validateJWTContribuyente, this.licenciaController.pasecaja)
        app.route('/api/licencia-pago-en-linea').post(CheckHeaders.validateJWTContribuyente, this.licenciaController.linkpago)
        // Routes for pase a caja
        app.route('/api/solicitud/pase-caja/:solicitud_id').post(CheckHeaders.validateJWTAdministrador, this.paseCajaController.upload)
        app.route('/api/solicitud/pase-caja/:solicitud_id').get(CheckHeaders.validateJWTByTypeUser, this.paseCajaController.getFile)
        app.route('/api/solicitud/check/pase-caja').post(CheckHeaders.validateJWTAdministrador, this.paseCajaController.checkPCFolio)
        // Routes for solicitudes history
        app.route('/api/solicitud/history/:id').get(this.solicitudController.history);
        app.route('/api/solicitud/messages/:id').get(this.solicitudController.messages);

        // Routes for reports
        app.route('/api/reportes/generateByDateRange')
            .post(CheckHeaders.validateJWTAdministrador, GetValue.administrador, this.reportController.solicitudesReportByDateRange)
        app.route('/api/reportes/generateByDateRange/excel')
            .post(CheckHeaders.validateJWTAdministrador, GetValue.administrador, this.reportController.solicitudesReportByDateRangeExcel)

        /* app.route('/api/example/mail/activation').get(this.exampleController.mailActivation);
        app.route('/api/example/mail/reset').get(this.exampleController.mailReset); */

        app.route('/api/test/twilio').get(this.testController.twilio);
    }
}
