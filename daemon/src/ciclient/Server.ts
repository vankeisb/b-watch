import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {BuildConfig, CIClient} from "./CIClient";
import {LocalApi, toBuildInfo} from "./LocalApi";

export class Server {

    private readonly ciClient: CIClient;
    constructor(
        readonly port: number,
        readonly configs: ReadonlyArray<BuildConfig>
        ) {
        this.ciClient = new CIClient(configs, b => {
           // TODO notify websockets
        });
    }

    start() {
        const app = express();
        const server = http.createServer(app);
        const wss = new WebSocket.Server({server});

        let sockets: WebSocket[] = [];

        wss.on('connection', (ws: WebSocket) => {

            sockets.push(ws);

            //connection is up, let's add a simple simple event
            ws.on('message', (message: string) => {
                if (message === "list") {

                }

            });

            //send immediatly a feedback to the incoming connection
            ws.send('Hi there, I am a WebSocket server');

            ws.on("close", code => {
                sockets = sockets.filter(s => s !== ws);
            })
        })

        // const ciClient = new CIClient(configs, build => {
        //     const bi = JSON.stringify(toBuildInfo(build))
        //     sockets.forEach(ws => {
        //         ws.send(bi);
        //     })
        // });

        const builds = this.ciClient.list();
        console.log("Loaded builds :")
        builds.forEach(b => console.log(b.uuid, toBuildInfo(b).info));
        console.log("Starting to poll")
        builds.forEach(b => b.start());

        app.use("/api", (req, res) => {
            const api = new LocalApi(this.ciClient);
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

        server.listen(this.port, "localhost", () => {
            console.log(`server started on http://localhost:${this.port}`)
        });

    }


}

export function startServer(port: number, configs: ReadonlyArray<BuildConfig>) {

}
