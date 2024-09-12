#!/usr/bin/env node

import { BuildStatus, getBuildUrl } from "bwatch-common";
import { Build, CIClient, Configuration, loadConfigFromFile } from "bwatch-daemon";
import chalk from 'chalk';
import { Command } from "commander";

const pkgJson = require("../package.json");
const version = pkgJson.version;
const program = new Command();
program
    .name("bwatch")
    .description("The b-watch terminal command")
    .version(version)
    .option("-f, --filter <string>", "Filter builds");

program.parse(process.argv);

const filter = !program.filter
    ? undefined
    : program.filter.toLowerCase();

loadConfigFromFile().match(
    configLoaded,
    err => {
        console.log(err);
        process.exit(1);
    }
)

function coloredStatus(s: BuildStatus): string {
    switch (s.tag) {
        case 'none': {
            return "none";
        }
        case "green": {
            return chalk.bgGreen("passed");
        }
        case "red": {
            return chalk.bgRed("failed");
        }
        case "error": {
            return chalk.bgBlack("error!");
        }
    }
}


function displayName(b: Build): string {
    switch (b.config.tag) {
        case "bamboo": {
            return b.config.conf.plan;
        }
        case "travis": {
            return b.config.conf.repository + "/" + b.config.conf.branch;
        }
        case "circleci": {
            return b.config.conf.org + "/" + b.config.conf.repo + "/" + b.config.conf.branch;
        }
    }
}

interface RowData {
    readonly status: string;
    readonly label: string;
    readonly url: string;
}

function configLoaded(c: Configuration) {
    
    let nbBuilds = 0;
    const buildResults = new Array<Build>();

    const ciClient = new CIClient(c, b => {
        buildResults.push(b);

        nbBuilds--;
        if (nbBuilds === 0) {

            const rows: ReadonlyArray<RowData> = buildResults.map(b => {
                const status = coloredStatus(b.status);
                const label = chalk.bold(displayName(b));
                const errorStr = b.status.tag === 'error'
                    ? " " + b.status.err
                    : "";
                const url = getBuildUrl(b.status)
                    .map(u => " " + u)
                    .withDefault("");
                return {
                    status,
                    label: label + errorStr,
                    url
                }                
            });

            const rowWidths: number[] = rows.reduce((acc, row) => {
                const w0 = row.status.length;
                const w1 = row.label.length;
                const a0 = acc[0] || 0;
                const a1 = acc[1] || 0;
                return [
                    Math.max(w0, a0),
                    Math.max(w1, a1)
                ];
            }, new Array<number>());

            rows.forEach(r => {
                const line = withTrailing(r.status, rowWidths[0])
                    + withTrailing(r.label, rowWidths[1])
                    + r.url
                console.log(line)
            });
            setTimeout(() => {
                process.exit(0);
            }, 100);
        }
    });
    const builds = ciClient.list().filter(acceptFilter);
    nbBuilds = builds.length;    
    builds.forEach(b => b.fetch());
}

function withTrailing(s: string, maxLen: number): string {
    const nbMissing = maxLen - s.length;
    if (nbMissing > 0) {
        const trailing = " ".repeat(nbMissing + 1);
        return s + trailing;
    }
    return s + " ";
}

function acceptFilter(b: Build): boolean {
    if (filter) {
        const dn = displayName(b);
        return dn.toLowerCase().indexOf(filter) != -1;    
    } else {
        return true;
    }
}

interface LineData {
    readonly ciServer: string;
    readonly displayName: string;
    readonly status: BuildStatus;
}
