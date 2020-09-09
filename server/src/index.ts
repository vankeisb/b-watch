import {BuildConfig} from "./ciclient/CIClient";
import {startServer} from "./server";

const dtx: BuildConfig = {
    tag: "bamboo",
    conf: {
        serverUrl: "http://sfactory.francelab.fr.ibm.com:8085",
        plan: "TRUNK-DTXCRIT"
    }
};

const diesel2: BuildConfig = {
    tag: "travis",
    conf: {
        serverUrl: "https://travis.ibm.com",
        repository: "VANKEISB/diesel2",
        branch: "develop",
        githubToken: process.env.GITHUB_TOKEN || ''
    }
};

const intellirule: BuildConfig = {
    tag: "travis",
    conf: {
        serverUrl: "https://travis.ibm.com",
        repository: "dba/intellirule",
        branch: "develop",
        githubToken: process.env.GITHUB_TOKEN || ''
    }
};

startServer([ intellirule, diesel2, dtx ]);

