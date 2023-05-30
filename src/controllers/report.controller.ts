import moment from 'moment'
import validator from 'validator';
import * as ExcelJS from 'exceljs'
import {Request, Response} from 'express'
import {Log} from "../helpers/logs";
import {SolicitudQueries} from "../queries/solicitud.query";
import {JsonResponse} from "../enums/json-response";
import {Roles} from "../enums/roles";


export class ReportController {
    /** Global variables to use in all the controller */
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static logs: Log = new Log()

    public async solicitudesReportByDateRange (req: Request, res: Response) {
        const adminInfo = req.body.adminInfo;
        const auth = (adminInfo.rol === Roles.SUPERADMIN)
        const errors = []

        const startDate = (req.body.startDate == null || validator.isEmpty(req.body.startDate)) ?
            errors.push({message: 'Favor de proporcionar la fecha de inicio.'}) : req.body.startDate;
        const endDate = (req.body.endDate == null || validator.isEmpty(req.body.endDate)) ?
            errors.push({message: 'Favor de proporcionar la fecha final.'}) : req.body.endDate;

        const getSolicitudes = await ReportController.solicitudQueries.findSolicitudByDateRange({
            auth,
            area_id: adminInfo.area_id,
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate:  moment(endDate).format('YYYY-MM-DD'),
        })

        if (!getSolicitudes.ok) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{message: 'Action not available, please try again later.'}]
            })
        }

        const solicitudesData = []

        for (const solicitud of getSolicitudes.solicitudes) {

            let data = {
                folioSolicitud: solicitud.folio,
                contribuyente: solicitud['Contribuyente'].nombre + ' ' + solicitud['Contribuyente'].apellidos,
                area: solicitud['Area'].nombre,
                servicio: solicitud['Servicio'].nombre,
                licencia: (solicitud['LicenciaFuncionamiento']) ? solicitud['LicenciaFuncionamiento'].licencia_funcionamiento_id : 'N/A',
                estatus: solicitud['Estatus'].nombre,
                fecha_alta: (solicitud.fecha_alta) ? moment(solicitud.fecha_alta).format('DD/MM/YYYY') : '',
                fecha_envio: (solicitud.fecha_envio) ? moment(solicitud.fecha_envio).format('DD/MM/YYYY') : '',
                fecha_recepcion: (solicitud.fecha_recepcion) ? moment(solicitud.fecha_recepcion).format('DD/MM/YYYY') : '',
                fecha_rechazo: (solicitud.fecha_rechazo) ? moment(solicitud.fecha_rechazo).format('DD/MM/YYYY') : 'N/A',
            }
            solicitudesData.push(data);
        }

        try {
            return res.status(200).json({
                ok: true,
                message: 'Solicitudes',
                solicitudes: solicitudesData
            })
        } catch (e) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Problemas para generar el reporte de excel de las solicitudes.' }]
            })
        }


    }


    public async solicitudesReportByDateRangeExcel (req: Request, res: Response) {
        const adminInfo = req.body.adminInfo;
        const auth = (adminInfo.rol === Roles.SUPERADMIN)

        const startDate = req.body.startDate;
        const endDate = req.body.endDate;

        const getSolicitudes = await ReportController.solicitudQueries.findSolicitudByDateRange({
            auth,
            area_id: adminInfo.AdministradorArea[0].areas_id,
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate:  moment(endDate).format('YYYY-MM-DD'),
        })

        if (!getSolicitudes.ok) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{message: 'Action not available, please try again later.'}]
            })
        }

        const solicitudesData = []

        for (const solicitud of getSolicitudes.solicitudes) {
            let data = {
                folioSolicitud: solicitud.folio,
                contribuyente: solicitud['Contribuyente'].nombre + ' ' + solicitud['Contribuyente'].apellidos,
                area: solicitud['Area'].nombre,
                servicio: solicitud['Servicio'].nombre,
                licencia: (solicitud['LicenciaFuncionamiento']) ? solicitud['LicenciaFuncionamiento'].licencia_funcionamiento_id : 'N/A',
                estatus: solicitud['Estatus'].nombre,
                fecha_alta: (solicitud.fecha_alta) ? moment(solicitud.fecha_alta).format('DD/MM/YYYY') : '',
                fecha_envio: (solicitud.fecha_envio) ? moment(solicitud.fecha_envio).format('DD/MM/YYYY') : '',
                fecha_recepcion: (solicitud.fecha_recepcion) ? moment(solicitud.fecha_recepcion).format('DD/MM/YYYY') : '',
                fecha_final: (solicitud.fecha_final) ? moment(solicitud.fecha_final).format('DD/MM/YYYY') : '',
                fecha_rechazo: (solicitud.fecha_rechazo) ? moment(solicitud.fecha_rechazo).format('DD/MM/YYYY') : 'N/A',
            }
            solicitudesData.push(data);
        }

        try {
            const buffer = await ReportController.generateExcel(solicitudesData)
            res.status(200)
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            return res.send(buffer);
        } catch (e) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Problemas para generar el reporte de excel de las solicitudes.' }]
            })
        }


    }

    private static async generateExcel(data: any[], type?: string, startDate?: string, endDate?: string ) {
        // Prepare workbook
        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Solicitudes');

        const columnStyle = {
            font: {
                bold: true
            }
        }

        worksheet.getRow(1).values = ['Folio Solicitud','Contribuyente','Area/Dependencia', 'Tramite/Servicio','Licencia Funcionamiento','Estatus',
            'Fecha Alta','Fecha Envío',
            'Fecha Recepción', 'Fecha Entrega','Fecha Rechazo '];
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).alignment  = { horizontal: 'center'}
        worksheet.autoFilter = 'A1:K1';

        worksheet.columns = [
            { key: 'folioSolicitud', width: 30 },
            { key: 'contribuyente', width: 30 },
            { key: 'area', width: 30 },
            { key: 'servicio', width: 50 },
            { key: 'licencia', width: 30},
            { key: 'estatus', width: 30},
            { key: 'fecha_alta', width: 20 },
            { key: 'fecha_envio', width: 20 },
            { key: 'fecha_recepcion', width: 20 },
            { key: 'fecha_final', width: 20 },
            { key: 'fecha_rechazo', width: 20 },
        ]

        worksheet.getColumn('A').alignment = { horizontal: 'center'}
        worksheet.getColumn('B').alignment = { horizontal: 'center'}
        worksheet.getColumn('C').alignment = { horizontal: 'center'}
        worksheet.getColumn('D').alignment = { horizontal: 'center'}
        worksheet.getColumn('E').alignment = { horizontal: 'center'}
        worksheet.getColumn('F').alignment = { horizontal: 'center'}
        worksheet.getColumn('G').alignment = { horizontal: 'center'}
        worksheet.getColumn('H').alignment = { horizontal: 'center'}
        worksheet.getColumn('I').alignment = { horizontal: 'center'}
        worksheet.getColumn('J').alignment = { horizontal: 'center'}
        worksheet.getColumn('K').alignment = { horizontal: 'center'}

        const mapped: any[] = data.map(n => ({
            folioSolicitud: n.folioSolicitud,
            contribuyente: n.contribuyente,
            area: n.area,
            servicio: n.servicio,
            licencia: n.licencia,
            estatus: n.estatus,
            fecha_alta: n.fecha_alta,
            fecha_envio: n.fecha_envio,
            fecha_recepcion: n.fecha_recepcion,
            fecha_final: n.fecha_final,
            fecha_rechazo: n.fecha_rechazo,
        }))

        worksheet.addRows(mapped);

        return await workbook.xlsx.writeBuffer({ filename: 'Reporte de solicitudes'})

    }
}
