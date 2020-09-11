import {Command} from "commander";
import {Server} from "./Server";
import * as os from "os";
import {Result} from "tea-cup-core";
import {loadConfigFromFile} from "./Configuration";

const defaultPort = 4000;
const defaultFile = os.homedir() + "/.bwatch.json";

export interface Args {
    buildsPath: string
    port: number
}

export interface ProgramManifest {
    name: string;
    description: string;
    version: string;
}

export function parseArgs(mf: ProgramManifest): Args {
    const program = new Command();
    const { name, description, version } = mf;
    program
        .name(name)
        .description(description)
        .version(version)
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

