#!/usr/bin/env node

import {BuildConfigDecoder} from "./ciclient/CIClient";
import {Server} from "./ciclient/Server";
import {Command} from "commander";
import os from "os";
import fs from "fs";
import {Decode as D} from "tea-cup-core"

const defaultPort = 4000;

const program = new Command();
program
    .name("bwatch-server")
    .description("bwatch daemon + http server")
    .version("0.0.1")
    .option("-b, --builds <path>", 'Path to the builds JSON file (defaults to ~/.bwatch.json)')
    .option("-p, --port <port>", `Web server port (defaults to ${defaultPort})`)
program.parse(process.argv);

const port: number = program.port || defaultPort;
const buildsPath = program.builds || os.homedir() + "/.bwatch.json";

console.log("HTTP server port", port)
console.log("Using builds from", buildsPath);

// @ts-ignore
const evalTemplate = function(templateString: string){
    return new Function("return `"+templateString +"`;").call(process.env);
}

if (fs.existsSync(buildsPath)) {

    console.log("loading builds file and performing substitutions")
    const text: string = evalTemplate(fs.readFileSync(buildsPath, 'utf-8'));

    console.log("DDD", text)

    const configDecoder =
        D.map(
            builds => builds,
            D.field("builds", D.array(BuildConfigDecoder))
        );

    const configs = configDecoder.decodeString(text);

    switch (configs.tag) {
        case "Ok": {
            const server = new Server(port, configs.value)
            server.start();
            break;
        }
        case "Err": {
            console.error("Unable to parse config file", configs.err);
            process.exit(1);
            break;
        }
    }
} else {
    console.error("No builds file found at " + buildsPath);
    process.exit(1);
}





//startServer([ intellirule, diesel2, dtx ]);

