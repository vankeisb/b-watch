import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {Build, BuildConfig, CIClient} from "./ciclient/CIClient";

// const DTX: BuildConfig = {
//     tag: "bamboo",
//     conf: {
//         serverUrl: "http://sfactory.francelab.fr.ibm.com:8085",
//         plan: "TRUNK-DTXCRIT"
//     }
// };

const intellirule: BuildConfig = {
    tag: "travis",
    conf: {
        serverUrl: "https://travis.ibm.com",
        repository: "VANKEISB/diesel2",
        branch: "feature/json-providers",
        githubToken: process.env.GITHUB_TOKEN || ''
    }
};

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

const ciClient = new CIClient([ intellirule ], build => {
    console.log("====>>>> build updated, notifying " + sockets.length + " client(s)", build.uuid, build.status)
    sockets.forEach(ws => {
        ws.send(JSON.stringify(buildToMsg(build)));
    })
});
ciClient.list().forEach(b => b.start());


function buildToMsg(build: Build): any {
    const { uuid, status } = build;
    return {
        uuid,
        status
    }
}

function allBuildsToMsg(): any {
    return {
        builds: ciClient.list().map(buildToMsg)
    }
}

app.use("/", (req, res) => {
    res.send(JSON.stringify(allBuildsToMsg(), null, "  "));
})

server.listen(3000, () => {
    console.log("server started")
})
