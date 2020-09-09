import express from "express";

import {BuildConfig, CIClient} from "./ciclient/CIClient";

const DTX: BuildConfig = {
    tag: "bamboo",
    conf: {
        serverUrl: "http://sfactory.francelab.fr.ibm.com:8085",
        plan: "TRUNK-DTXCRIT"
    }
};

const ciClient = new CIClient([ DTX ] );

ciClient.list().forEach(b => b.start());

const app = express();

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

app.listen(3000, () => {
    console.log("server started")
})
