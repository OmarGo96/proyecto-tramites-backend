// tslint:disable-next-line:no-var-requires
//require('dotenv').config()
require('dotenv').config({ path: '/root/envs/proyecto-tramites-backend/.env' })
import express, { Application } from 'express';
import https from 'https'
import http from 'http'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import fs from 'fs'
import fileUpload from 'express-fileupload'
import useragent from 'express-useragent'
import Relationship from './relationships'
import { Routes } from '../routes/routes'
import { Database } from './database'

class App {
    public app: Application;
    public port: string;
    public server: https.Server | http.Server
    public routes: Routes = new Routes();
    static database: Database = new Database()

    constructor() {
        this.app = express();
        this.securityProtocol();
        this.config();
        this.database();
        //this.server = https.createServer(this.app);
        this.port = process.env.LISTEN_PORT || '8001';
        this.routes.routes(this.app);
    }

    private config(): void { // configuración inicial del servidor
        Relationship.init();

        this.app.use(cors())

        this.app.use(useragent.express())
        this.app.use(fileUpload())
        this.app.use(helmet())
        /** Denega el control de "X-Permitted-Cross-Domain-Policies" */
        this.app.use(helmet.permittedCrossDomainPolicies())
        /** Establecemos nuestras "Referrer Policy" */
        this.app.use(helmet.referrerPolicy({ policy: 'strict-origin' }))
        this.app.use(bodyParser.json({ limit: '50mb' }))
        this.app.use(bodyParser.urlencoded({ extended: false }))
    }

    private securityProtocol() {
        if (process.env.MODE === 'dev') {
            this.server = http.createServer(this.app);
        } else {
            var privateKey = fs.readFileSync(process.env.PRIVATE_SSL, 'utf8')
            var certificate = fs.readFileSync(process.env.CERTIFICATE_SSL, 'utf8')
            //var cabundle = fs.readFileSync(process.env.CABUNDLE_SSL, 'utf8')

            //var credentials = { key: privateKey, cert: certificate, ca: cabundle }
            var credentials = { key: privateKey, cert: certificate }
            this.server = https.createServer(credentials, this.app)
        }
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('API is running in port: ' + this.port);
        });
    }

    private async database() {
        const connection = await App.database.connection()
        console.log(connection.message)
    }
}

export default new App().server
