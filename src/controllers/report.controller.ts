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

        if (getSolicitudes.solicitudes.length === 0) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{message: 'No se encontraron registros'}]
            })
        }

        const solicitudesData = []

        for (const solicitud of getSolicitudes.solicitudes) {



            // @ts-ignore
            let data = {
                folioSolicitud: solicitud.folio,
                contribuyente: solicitud.Contribuyente.nombre + ' ' + solicitud.Contribuyente.apellidos,
                area: solicitud.Servicio['Area'].nombre,
                servicio: solicitud.Servicio.nombre,
                licencia: (solicitud.LicenciaFuncionamiento) ? solicitud.LicenciaFuncionamiento.licencia_funcionamiento_id : 'N/A',
                estatus: solicitud.Estatus.nombre,
                fecha_alta: (solicitud.fecha_alta) ? moment(solicitud.fecha_alta).format('DD/MM/YYYY') : '',
                fecha_envio: (solicitud.fecha_envio) ? moment(solicitud.fecha_envio).format('DD/MM/YYYY') : '',
                fecha_recepcion: (solicitud.fecha_recepcion) ? moment(solicitud.fecha_recepcion).format('DD/MM/YYYY') : '',
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

        worksheet.getRow(1).values = ['Folio Solicitud','Contribuyentes','Area/Dependencia','Licencia Funcionamiento','Estatus','Fecha Alta','Fecha Envío',
            'Fecha Recepción','Fecha Rechazo '];
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).alignment  = { horizontal: 'center'}
        worksheet.autoFilter = 'A1:V1';

        worksheet.columns = [
            { key: 'folioSolicitud', width: 16 },
            { key: 'contribuyente', width: 16 },
            { key: 'area', width: 22 },
            { key: 'servicio', width: 30 },
            { key: 'licencia', width: 16},
            { key: 'estatus', width: 20},
            { key: 'fecha_alta', width: 16 },
            { key: 'fecha_envio', width: 16 },
            { key: 'fecha_recepcion', width: 16 },
            { key: 'fecha_rechazo', width: 16 },
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

        const mapped: any[] = data.map(n => ({
            ventas: n.ventas,
            flyback: n.flyback,
            mesa: n.mesa,
            sala: n.sala,
            contrato: n.contrato,
            cliente: n.cliente,
            totalCert: n.totalCert,
            token: n.token,
            noToken: n.noToken,
            packed: n.packed,
            fechaVenta: n.fechaVenta,
            fechaCobro: n.fechaCobro,
            observaciones: n.observaciones,
            membresia: n.membresia,
            adp: n.adp,
            agente: n.agente,
            closingTool: n.closingTool,
            status: n.status,
            cerrador: n.cerrador,
            liner: n.liner,
            pending: n.pending,
            invPrem: n.invPrem,
            invReales: n.invReales
        }))

        worksheet.addRows(mapped);

        return await workbook.xlsx.writeBuffer()

    }
}