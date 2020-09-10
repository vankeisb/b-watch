#!/usr/bin/env node

import {Server} from "./ciclient/Server";
import {Command} from "commander";
import {loadConfigsFromFile} from "./ciclient/LoadConfig";
import chalk from "chalk";

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

console.log("Starting bwatch daemon...")

console.log("HTTP server port", chalk.green(port))
console.log("Using builds from", chalk.green(program.builds || ''));

const configs = loadConfigsFromFile(program.builds);

switch (configs.tag) {
    case "Ok": {
        const server = new Server(port, configs.value)
        server.start();
        break;
    }
    case "Err": {
        console.log(chalk.red(configs.err));
        process.exit(1);
        break;
    }
}




//startServer([ intellirule, diesel2, dtx ]);

