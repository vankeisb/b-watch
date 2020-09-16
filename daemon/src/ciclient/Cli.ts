import {Command} from "commander";
import {Server} from "./Server";
import * as os from "os";
import {Result} from "tea-cup-core";
import {loadConfigFromFile} from "./Configuration";

export const defaultPort = 4000;
export const defaultFile = os.homedir() + "/.bwatch.json";

export interface Args {
    buildsPath: string
    port: number
}

export function parseArgs(): Args {
    const program = new Command();
    program
        .name("bwatchd")
        .description("the b-watch daemon")
        .version("0.0.1")
        .option("-b, --builds <path>", 'Path to the builds JSON file (defaults to ~/.bwatch.json)')
        .option("-p, --port <port>", `Web server port (defaults to ${defaultPort})`)
    program.parse(process.argv);

    return {
        buildsPath: program.builds || defaultFile,
        port: program.port || defaultPort
    }
}

export function createServerFromArgs(args: Args): Result<string,Server> {
    return loadConfigFromFile(args.buildsPath)
        .map(config => new Server(args.port, config));
}


