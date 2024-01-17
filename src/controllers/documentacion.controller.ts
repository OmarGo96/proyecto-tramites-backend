import validator from 'validator';
import moment from 'moment'
import { Request, Response } from 'express'
import { SolicitudQueries } from '../queries/solicitud.query'
import { ServicioQueries } from '../queries/servicio.query'
import { RequerimientoQueries } from '../queries/requerimiento.query'
import { DocumentacionQueries } from '../queries/documentacion.query'
import { DocumentoSolicitudRequisitoQueries } from '../queries/documento-solicitud-requisito.query'
import { Log } from '../helpers/logs'
import { File } from '../helpers/files'
import {DocumentacionPagoQueries} from "../queries/documentacion-pago.query";
import {DocumentacionAnuenciaQueries} from "../queries/documentacion_anuencia.query";
import {DocumentacionComplementariaQueries} from "../queries/documentacion_complementaria.query";
import fs from "fs";
import AdmZip from "adm-zip";
import {HtmlPDF} from '../helpers/html-pdf.helper'
import QRCode from 'qrcode'
import * as process from "process";

export class DocumentacionController {
    static servicioQueries: ServicioQueries = new ServicioQueries()
    static solicitudQueries: SolicitudQueries = new SolicitudQueries()
    static documentacionQueries: DocumentacionQueries = new DocumentacionQueries()
    static requerimientoQueries: RequerimientoQueries = new RequerimientoQueries()
    static documentoSolicitudRequisitoQueries: DocumentoSolicitudRequisitoQueries = new DocumentoSolicitudRequisitoQueries()
    static documentacionPagoQueries: DocumentacionPagoQueries = new DocumentacionPagoQueries()
    static documentacionAnuenciaQueries: DocumentacionAnuenciaQueries = new DocumentacionAnuenciaQueries()
    static documentacionComplementariaQueries: DocumentacionComplementariaQueries = new DocumentacionComplementariaQueries()
    static log: Log = new Log()
    static file: File = new File()

    /** Tipos de documentos
     * 0 = anexo,
     * 1 = pase a caja
     */

    /** Función que permite adjuntar un archivo a la documentación */

    public async index(req: Request, res: Response) {
        const contribuyente_id: number = req.body.contribuyente_id
        const auth = req.body.auth;
        const errors = [];

        const findRequerimientosByContribuyente = await DocumentacionController.documentacionQueries.findDocumentosByContribuyente({
            auth,
            contribuyente_id
        });

        if (!findRequerimientosByContribuyente.ok) {
            errors.push({message: 'Existen problemas al momento de obtener los documentos.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            documentacion: findRequerimientosByContribuyente.documentacion
        })
    }

    public async attachFile(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const tiposDocumentoId: string = body.tipos_documentos_id == null || validator.isEmpty(body.tipos_documentos_id) ?
            errors.push({ message: 'Favor de proporcionar el id del documento' }) : body.tipos_documentos_id;

        /*const contribuyentesId: string = body.contribuyentes_id == null || validator.isEmpty(body.contribuyentes_id) ?
            errors.push({ message: 'Favor de proporcionar el contribuy' }) : body.contribuyentes_id;*/

        const tipoDocumento: string = body.tipo_documento == null || validator.isEmpty(body.tipo_documento) ?
            errors.push({ message: 'Favor de proporcionar el tipo de documento' }) : body.tipo_documento;

        /*const vigenciaInicial: string = body.vigencia_inicial == null || validator.isEmpty(body.vigencia_inicial) ?
            errors.push({ message: 'Favor de proporcionar la vigencia inicial' }) : body.vigencia_inicial;*/

        const vigenciaFinal: string = body.vigencia_final == null || validator.isEmpty(body.vigencia_final + '') ?
            null : body.vigencia_final;

        const nombreDocumento: string = !body.nombre_documento || validator.isEmpty(body.nombre_documento) ?
            null: body.nombre_documento;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*if (tipoDocumento !== '0' && tipoDocumento !== '1') {
            errors.push({ message: 'Favor de proporcionar un tipo de documento valido' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        /*const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({
            id: documentacionId
        })

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar el id de la documentacion proporcionada.' })
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'Actualmente no existe el registro de la documentacion proporcionada' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        const uploadFile = await DocumentacionController.file.upload(req, null, 'documentacion')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: uploadFile.message }]
            })
        }

        const updateDocumentacion = await DocumentacionController.documentacionQueries.attachFile({
            tipos_documentos_id: Number(tiposDocumentoId),
            contribuyente_id,
            url: uploadFile.nameFile,
            nombre_otro: nombreDocumento,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            tipo_documento: tipoDocumento,
            vigencia_final: (vigenciaFinal) ? moment(vigenciaFinal).format('YYYY-MM-DD HH:mm:ss') : null,
            aprobado: 1,
            status: 1
        })

        if (!updateDocumentacion.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.' }]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentacionController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a adjuntado un nuevo documento a su cuenta',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async attachExpedienteFile(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const tiposDocumentoId: string = body.tipos_documentos_id == null || validator.isEmpty(body.tipos_documentos_id) ?
            errors.push({ message: 'Favor de proporcionar el id del documento' }) : body.tipos_documentos_id;

        /*const contribuyentesId: string = body.contribuyentes_id == null || validator.isEmpty(body.contribuyentes_id) ?
            errors.push({ message: 'Favor de proporcionar el contribuy' }) : body.contribuyentes_id;*/

        const tipoDocumento: string = body.tipo_documento == null || validator.isEmpty(body.tipo_documento) ?
            errors.push({ message: 'Favor de proporcionar el tipo de documento' }) : body.tipo_documento;

        /*const vigenciaInicial: string = body.vigencia_inicial == null || validator.isEmpty(body.vigencia_inicial) ?
            errors.push({ message: 'Favor de proporcionar la vigencia inicial' }) : body.vigencia_inicial;*/

        const vigenciaFinal: string = body.vigencia_final == null || validator.isEmpty(body.vigencia_final + '') ?
            null : body.vigencia_final;

        const nombreDocumento: string = !body.nombre_documento || validator.isEmpty(body.nombre_documento) ?
            null: body.nombre_documento;

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        /*if (tipoDocumento !== '0' && tipoDocumento !== '1') {
            errors.push({ message: 'Favor de proporcionar un tipo de documento valido' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        /*const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({
            id: documentacionId
        })

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar el id de la documentacion proporcionada.' })
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'Actualmente no existe el registro de la documentacion proporcionada' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }*/

        const uploadFile = await DocumentacionController.file.upload(req, null, 'documentacion')

        if (!uploadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: uploadFile.message }]
            })
        }

        const updateDocumentacion = await DocumentacionController.documentacionQueries.attachFile({
            tipos_documentos_id: Number(tiposDocumentoId),
            contribuyente_id,
            url: uploadFile.nameFile,
            nombre_otro: nombreDocumento,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss'),
            tipo_documento: tipoDocumento,
            vigencia_final: (vigenciaFinal) ? moment(vigenciaFinal).format('YYYY-MM-DD HH:mm:ss') : null,
            aprobado: 1,
            status: 1
        })

        if (!updateDocumentacion.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de adjuntar el archivo y actualizar la información.' }]
            })
        }

        /** Creamos el log del usuario */
        const createLogContribuyente = await DocumentacionController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente a adjuntado un nuevo documento a su cuenta',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha guardado el documento de forma exitosa'
        })
    }

    public async getFile(req: Request, res: Response) {
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        if (req.body.auth === false) {
            errors.push({ message: 'Es neecsario la cabecera de autenticacion' })
        }

        const documentacionId = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
            errors.push({ message: 'Favor de proporcionar la documentación' }) :
            req.params.documentacion_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }
        /** Buscamos en la base de datos si existe un contrato con el nombre proporcionado */
        const findDocumentacionById = await DocumentacionController.documentacionQueries.findDocumentacionById({ id: documentacionId })

        if (!findDocumentacionById.ok) {
            errors.push({ message: 'Existen problemas al momento de validar la documentación proporcionada.' })
        } else if (findDocumentacionById.documentacion == null) {
            errors.push({ message: 'La documentación proporcionada no existe.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const downloadFile = await DocumentacionController.file.download(findDocumentacionById.documentacion ? findDocumentacionById.documentacion.url : false, 'documentacion')

        if (!downloadFile.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: downloadFile.message }]
            })
        }

        let ext = downloadFile.name.split(".").pop()

        if (ext == 'dwg') {
            return res.status(200).contentType('application/dwg').send(downloadFile.file)

        } else if (ext == 'dxf') {
            return res.status(200).contentType('application/dxf').send(downloadFile.file)

        } else {
            return res.status(200).contentType('application/pdf').send(downloadFile.file)
        }


    }

    public async deleteDocument(req: Request, res: Response) {
        /* Get info from validateJWT middleware */
        const contribuyente_id: number = req.body.contribuyente_id
        /** Obtenemos toda la información que nos envia el cliente */
        const body = req.body
        /** Creamos un array que nos almacenará los errores que surjan en la función */
        const errors = []

        const documentacionId = req.params.documentacion_id == null ? null : validator.isEmpty(req.params.documentacion_id) ?
            errors.push({ message: 'Favor de proporcionar el documento' }) :
            req.params.documentacion_id

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const deleteDoc = await DocumentacionController.documentacionQueries.changeStatus({
            id: documentacionId,
            status: 0
        })

        if (!deleteDoc.ok) {
            errors.push({ message: 'Existen problemas al momento de cambiar el estatus del documento.' })
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const createLogContribuyente = await DocumentacionController.log.contribuyente({
            contribuyente_id,
            navegador: req.headers['user-agent'],
            accion: 'El contribuyente elimino un documento de su cuenta',
            ip: req.socket.remoteAddress,
            fecha_alta: moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return res.status(200).json({
            ok: true,
            message: 'Se ha eliminado el documento correctamente'
        })

    }

    public async getExpedienteDocs(req: Request, res: Response) {
        const contribuyenteId: number = req.body.contribuyente.id
        const contribuyente = req.body.contribuyente

        let errors = [];

        let findExpedienteDocs: any

        if (contribuyente.tipo_persona == 1){
            findExpedienteDocs = await DocumentacionController.documentacionQueries.findExpedienteByContribuyenteFisica({
                contribuyente_id: contribuyenteId,
            });
        } else {
            findExpedienteDocs = await DocumentacionController.documentacionQueries.findExpedienteByContribuyenteMoral({
                contribuyente_id: contribuyenteId,
            });
        }

        if (!findExpedienteDocs.ok) {
            errors.push({message: 'Existen problemas al momento de buscar los documentos del expediente'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        return res.status(200).json({
            ok: true,
            documentacionExpediente: findExpedienteDocs.documentacion
        })

    }

    public async generateAcuseExpediente(req: Request, res: Response) {
        const contribuyente = req.body.contribuyente

        if (!contribuyente) {
            return res.status(400).json({
                ok: false,
                message: [{ message: 'El contribuyente no tiene documentación para generar archivo.' }]
            })
        }

        try {
            const qr = await QRCode.toBuffer(process.env.URL+'api/contribuyente/acuse_expediente/'+contribuyente.uuid)
            let qr64 = Buffer.from(qr).toString('base64')

            let dataPDF = {
                data: {
                    nombre: (contribuyente.tipo_persona == 1) ? contribuyente.nombre + ' ' + contribuyente.apellidos : contribuyente.razon_social,
                    rfc: contribuyente.rfc,
                    representante: contribuyente.representante_legal,
                    persona: (contribuyente.tipo_persona == 1) ? 'PERSONA FÍSICA': 'PERSONA MORAL',
                    tipo_persona: (contribuyente.tipo_persona == 1),
                    fecha_recepcion: moment().format('DD/MM/YYYY'),
                    hora_recepcion: moment().format('LTS'),
                    folio: contribuyente.id,
                    qr: 'data:image/png;base64,'+qr64
                }
            }

            let createResponsivePDF: any = await HtmlPDF.createAcusePdf(
                dataPDF,
                'acuse.hbs'
            );

            return res.status(200).contentType('application/pdf').send(createResponsivePDF.pdf)

        } catch (e) {
            console.log(e)
            return res.status(400).json({
                ok: false,
                message: [{ message: 'Existen problemas para generar acuse, intente más tarde.' }]
            })
        }

    }

    public async getExpedienteDocsZip(req: Request, res: Response) {
        const administradorId = req.body.administrador_id
        const contribuyenteId: number = req.body.contribuyente.id

        let errors = [];

        const findExpedienteDocs = await DocumentacionController.documentacionQueries.findExpedienteDocsByContribuyente({
            contribuyente_id: contribuyenteId,
        });

        if (!findExpedienteDocs.ok) {
            errors.push({message: 'Existen problemas al momento de buscar los documentos del expediente'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        try {
            // @ts-ignore
            const documentation = (findExpedienteDocs.documentacion.length > 0) ? findExpedienteDocs.documentacion : null;
            const zip = new AdmZip();

            if(documentation) {
                for (const documento of documentation) {
                    const path = process.env.DOCUMENTATION_PATH + documento.url
                    zip.addLocalFile(path);
                }
                const outputFile =  'Documentos' + '_Expediente_' + contribuyenteId + '.zip'

                fs.writeFileSync(outputFile, zip.toBuffer());

                return res.download(outputFile, (err) => {
                    if(err) {
                        return res.status(500).json({
                            ok: false,
                            message: [{ message: 'No es posible generar zip en estos momentos.' }]
                        })
                    }
                    fs.unlinkSync(outputFile)
                });

            } else {
                return res.status(400).json({
                    ok: false,
                    message: [{ message: 'El contribuyente no tiene documentación para generar archivo.' }]
                })
            }

        } catch (e) {
            console.log(e)
            return res.status(400).json({
                ok: false,
                message: [{ message: 'No es posible generar zip en estos momentos.' }]
            })
        }
    }

}
