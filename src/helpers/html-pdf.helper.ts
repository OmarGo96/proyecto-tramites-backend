import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import moment from 'moment';
import htmlPDF from 'html-pdf';

export class HtmlPDF 
{
    static async createAcusePdf(params, template, docOptions?) {
       
        let template_path = path.join(__dirname, '../../files/templates/');
        let templateHTML =  fs.readFileSync(template_path + template, 'utf8');
      
        
        let compileHTML = handlebars.compile(templateHTML);

        let html = compileHTML(params);

        
        let filePath = process.env.ACUSES_DOCS_PATH;
        let fileName: string =  moment().unix()+'_'+params.data.folio+'.pdf'

        const opt = {
            format: 'Letter',
            type: 'pdf',
        }

        try {
            let createPDFHTML = await new Promise((resolve, reject) => {
                // @ts-ignore
                htmlPDF.create(html, opt).toFile(filePath+fileName, (err, res) => {
                    if (!err) {
                        resolve({ok: true, res})
                    } else {
                        console.log(err)
                        reject ({ok: false, err})
                    }
                })
            })
            let file = fs.readFileSync(createPDFHTML['res'].filename)
            fs.unlinkSync(createPDFHTML['res'].filename);
            return {
                ok: true,
                pdf: file
            }

        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }

    // static async createTFEEBreakDown(params: any, docOptions?, directory?, lang?: 'en' | 'es') {
       
    //     let template_path = path.join(__dirname, '../../files/templates/');
    //     let templateHTML =  fs.readFileSync(template_path + 'tfee-breakdown_en.hbs', 'utf8');
    //     // if (lang && lang == 'es') {
    //     //     templateHTML =  fs.readFileSync(template_path + 'vtw-voucher_es.hbs', 'utf8');
    //     // }
        
    //     let compileHTML = handlebars.compile(templateHTML);        

    //     let html = await compileHTML(params);

    //     if(!fs.existsSync( `${process.env.FILE_PATH}/${directory}`)){
    //         fs.mkdirSync(`${process.env.FILE_PATH}/${directory}`);
    //     }
    //     let filePath = process.env.FILE_PATH + directory + '/';
    //     let fileName: string = moment().unix().toString()+'.pdf';
    //     //let fileName = moment().unix() + '.pdf';        
    //     let _opt: {
    //         format: 'Letter',
    //         type: 'pdf'
    //     }
    //     try {
    //         let createPDFHTML = await new Promise((resolve, reject) => {
    //             htmlPDF.create(html, _opt).toFile(filePath+fileName, (err, res) => {
    //                 if (!err) {
    //                     resolve({ok: true, fileName})
    //                 } else {
    //                     ErrorsHelper.printConsoleErr(err);
    //                     reject ({ok: false, err})
    //                 }
    //             })
    //         })
    //         return createPDFHTML;
    //     } catch (e) {
    //         ErrorsHelper.printConsoleErr(e);
    //         return {ok: false}
    //     }   

    // }
}
