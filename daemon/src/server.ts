#!/usr/bin/env node

import chalk from "chalk";
import {createServerFromArgs, parseArgs} from "./ciclient/Cli";

const mf = {
    name: "bwatch-server",
    description: "bwatch daemon + http server",
    version: "0.0.1",
};

const server = createServerFromArgs(parseArgs(mf));

switch (server.tag) {
    case "Ok": {
        server.value.start();
        break;
    }
    case "Err": {
        console.log(chalk.red(server.err));
        process.exit(1);
        break;
    }
}
