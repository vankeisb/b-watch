import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {Build, BuildConfig, CIClient} from "./ciclient/CIClient";
import {BuildInfo} from "bwatch-common/dist/BuildInfo";

export function startServer(configs: ReadonlyArray<BuildConfig>) {

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

    const ciClient = new CIClient(configs, build => {
        const bi = JSON.stringify(toBuildInfo(build))
        sockets.forEach(ws => {
            ws.send(bi);
        })
    });
    ciClient.list().forEach(b => b.start());


    function allBuildsToMsg(): any {
        return {
            builds: ciClient.list().map(toBuildInfo)
        }
    }

    app.use("/api", (req, res) => {
        res.send(JSON.stringify(allBuildsToMsg(), null, "  "));
    })

    server.listen(4000, () => {
        console.log("server started")
    })
}


function toBuildInfo(build: Build): BuildInfo {
    const { config, uuid, status } = build;
    switch (config.tag) {
        case "travis": {
            return {
                uuid,
                status,
                info: {
                    tag: "travis",
                    branch: config.conf.branch,
                    repository: config.conf.repository,
                }
            }
        }
        case "bamboo": {
            return {
                uuid,
                status,
                info: {
                    tag: "bamboo",
                    plan: config.conf.plan,
                }
            }
        }
    }
}
