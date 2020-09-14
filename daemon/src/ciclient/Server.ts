import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {CIClient} from "./CIClient";
import {LocalApi, toBuildInfo} from "./LocalApi";
import {Configuration} from "./Configuration";

export class Server {

    private readonly ciClient: CIClient;
    private sockets: WebSocket[] = [];

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
    }

    start(onStarted?: () => void) {
        const app = express();
        const server = http.createServer(app);
        const wss = new WebSocket.Server({server});
        const api = new LocalApi(this.ciClient);


        wss.on('connection', (ws: WebSocket) => {
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

        const host = "0.0.0.0";
        server.listen(this.port, host, () => {
            console.log(`server started on http://${host}:${this.port}`)
            onStarted?.();
        });

    }


}
