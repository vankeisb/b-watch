import os from "os";
import {Err, err, Result} from "tea-cup-core";
import {BuildConfig, BuildConfigDecoder} from "./CIClient";
import fs from "fs";
import {Decode as D} from "tea-cup-core/dist/Decode";

// @ts-ignore
const evalTemplate = function(templateString: string){
    return new Function("return `"+templateString +"`;").call(process.env);
}

export function loadConfigsFromFile(path?: string): Result<string,BuildConfig[]> {
    const buildsPath = path || os.homedir() + "/.bwatch.json";
    if (!fs.existsSync(buildsPath)) {
        return err("bwatch file not found at " + buildsPath);
    }

    const buildConfigsDecoder =
        D.map(
            builds => builds,
            D.field("builds", D.array(BuildConfigDecoder))
        );

    try {
        const text: string = evalTemplate(fs.readFileSync(buildsPath, 'utf-8'));
        return buildConfigsDecoder.decodeString(text);
    } catch (e) {
        return err(e.message);
    }
}
