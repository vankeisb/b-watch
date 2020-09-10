import {BambooConfig, BambooConfigDecoder} from "./Bamboo";
import {Decoder, err, Result} from "tea-cup-core";
import {Decode as D} from "tea-cup-core/dist/Decode";
import {TravisConfig, TravisConfigDecoder} from "./Travis";
import os from "os";
import fs from "fs";

export type BuildConfig
    = BambooBuildConfig
    | TravisBuildConfig


export interface BambooBuildConfig {
    tag: "bamboo"
    conf: BambooConfig
}

export const BambooBuildConfigDecoder: Decoder<BambooBuildConfig> =
    D.map(
        conf => ({tag: "bamboo", conf}),
        BambooConfigDecoder
    );

export const TravisBuildConfigDecoder: Decoder<TravisBuildConfig> =
    D.map(
        conf => ({tag: "travis", conf}),
        TravisConfigDecoder
    );


export const BuildConfigDecoder: Decoder<BuildConfig> =
    D.andThen(
        tag => {
            switch (tag) {
                case "bamboo":
                    return BambooBuildConfigDecoder;
                case "travis":
                    return TravisBuildConfigDecoder;
                default:
                    return D.fail("unhandled tag " + tag);
            }
        },
        D.field("tag", D.str)
    );


export const ConfigurationDecoder: Decoder<Configuration> =
    D.map(
        (builds) => ({builds}),
        D.field("builds", D.array(BuildConfigDecoder))
    );


export interface TravisBuildConfig {
    tag: "travis"
    conf: TravisConfig
}


export interface Configuration {
    readonly builds: ReadonlyArray<BuildConfig>;
}

// @ts-ignore
const evalTemplate = function(templateString: string){
    return new Function("return `"+templateString +"`;").call(process.env);
}

export function loadConfigFromFile(path?: string): Result<string,Configuration> {
    const buildsPath = path || os.homedir() + "/.bwatch.json";
    if (!fs.existsSync(buildsPath)) {
        return err("bwatch file not found at " + buildsPath);
    }

    try {
        const text: string = evalTemplate(fs.readFileSync(buildsPath, 'utf-8'));
        return ConfigurationDecoder.decodeString(text);
    } catch (e) {
        return err(e.message);
    }
}
