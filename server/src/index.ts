import express from "express";
import * as WebSocket from "ws";
import * as http from 'http';

import {BuildConfig, CIClient} from "./ciclient/CIClient";

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

const ciClient = new CIClient([ intellirule ], build => {
    console.log("====>>>> build updated", build.uuid, build.status)
});
ciClient.list().forEach(b => b.start());

const app = express();

const server = http.createServer(app);

// const wss = new WebSocket.Server({server});
//
// wss.on('connection', ws => {
//
//     console.log("XXXXXXXXXXXXXXXx")
//
//     //connection is up, let's add a simple simple event
//     ws.on('message', (message: string) => {
//
//         //log the received message and send it back to the client
//         console.log('received: %s', message);
//         ws.send(`Hello, you sent -> ${message}`);
//     });
//
//     //send immediatly a feedback to the incoming connection
//     ws.send('Hi there, I am a WebSocket server');
// })

app.use("/", (req, res) => {
    const builds = ciClient.list().map(b => ({
      uuid: b.uuid,
      status: b.status,
    }))
    const o = {
        builds
    }
    res.send(JSON.stringify({builds}, null, "  "));
})

server.listen(3000, () => {
    console.log("server started")
})
