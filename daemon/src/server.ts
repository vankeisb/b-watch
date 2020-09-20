#!/usr/bin/env node

import chalk from "chalk";
import {createServerFromArgs, parseArgs} from "./ciclient/Cli";

const server = createServerFromArgs(parseArgs());

switch (server.tag) {
    case "Ok": {
        server.value.start(e => {
            if (e) {
                console.log(chalk.red(e.message))
            }
        });
        break;
    }
    case "Err": {
        console.log(chalk.red(server.err));
        process.exit(1);
        break;
    }
}
