import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {CIClient} from "./CIClient";
import {LocalApi, toBuildInfo} from "./LocalApi";
import {Configuration} from "./Configuration";

const app = express();

export class Server {

    private readonly ciClient: CIClient;
    private sockets: WebSocket[] = [];
    private server: http.Server;
    private wss: WebSocket.Server;

    constructor(
        readonly port: number,
        readonly config: Configuration
    ) {
        this.ciClient = new CIClient(config, b => {
            // notify connected sockets
            this.sockets.forEach(ws =>
                ws.send(
                    JSON.stringify(toBuildInfo(b), null, "  ")
                )
            );
        });

        this.server = http.createServer(app);
        this.wss = new WebSocket.Server({server: this.server});
        const api = new LocalApi(this.ciClient);


        this.wss.on('connection', (ws: WebSocket) => {
            // add to connected sockets
            this.sockets.push(ws);

            // remove on close
            ws.on("close", () => {
                this.sockets = this.sockets.filter(s => s !== ws);
            })
        });


        const builds = this.ciClient.list();
        console.log("Loaded builds :")
        builds.forEach(b => console.log(b.uuid, toBuildInfo(b).info));
        console.log("Starting to poll")
        builds.forEach(b => b.start());

        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        app.use("/api", (req, res) => {

            api.list().execute(r => {
                switch (r.tag) {
                    case "Err": {
                        res.status(500);
                        res.send(r.err);
                        console.error(r.err);
                        break;
                    }
                    case "Ok": {
                        res.send(JSON.stringify(r.value, null, "  "));
                        break;
                    }
                }
            })

        })
    }

    start(onStarted?: () => void) {
        const host = "0.0.0.0";
        this.server.listen(this.port, host, () => {
            console.log(`server started on http://${host}:${this.port}`)
            onStarted?.();
        });

    }

    close(callback:() => void) {
        console.log("shutting down server");
        let httpClosed = false;
        let wssClosed = false;

        let cbWrapper = () => {
            if (httpClosed && wssClosed) {
                console.log("server closed")
                callback()
            }
        }
        console.log("closing CIClient")
        this.ciClient.close()
        console.log("closing http")
        this.server.close(() => {
            console.log("http closed")
            httpClosed = true
            cbWrapper()
        })
        console.log("closing wss")
        this.wss.close(() => {
            console.log("wss closed")
            wssClosed = true
            cbWrapper()
        })
    }

}
