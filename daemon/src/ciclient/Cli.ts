import {Command} from "commander";
import {loadConfigsFromFile} from "./LoadConfig";
import {Server} from "./Server";
import * as os from "os";
import {Result} from "tea-cup-core";

const defaultPort = 4000;
const defaultFile = os.homedir() + "/.bwatch.json";

export interface Args {
    buildsPath: string
    port: number
}

export function parseArgs(): Args {
    const program = new Command();
    program
        .name("bwatch-server")
        .description("bwatch daemon + http server")
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
    return loadConfigsFromFile(args.buildsPath)
        .map(configs => new Server(args.port, configs));
}

