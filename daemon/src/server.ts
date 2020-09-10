#!/usr/bin/env node

import chalk from "chalk";
import {createServerFromArgs, parseArgs} from "./ciclient/Cli";

const server = createServerFromArgs(parseArgs());

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
