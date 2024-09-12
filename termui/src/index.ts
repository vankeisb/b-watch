#!/usr/bin/env node

import { BuildStatus, getBuildUrl } from "bwatch-common";
import { Build, CIClient, Configuration, loadConfigFromFile } from "bwatch-daemon";
import chalk from 'chalk';
import {Command} from "commander";

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
            return chalk.green("passed");
        }
        case "red": {
            return chalk.red("failed");
        }
        case "error": {
            return chalk.black("error!");
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

function configLoaded(c: Configuration) {
    let nbBuilds = 0;
    
    const ciClient = new CIClient(c, b => {

        const errorStr = b.status.tag === 'error'
            ? " " + b.status.err
            : "";

        const buildUrl = getBuildUrl(b.status)
            .map(u => " " + u)
            .withDefault("");

        console.log(chalk.inverse(coloredStatus(b.status)) + " " + displayName(b) + errorStr + buildUrl);

        nbBuilds--;
        if (nbBuilds === 0) {
            process.exit(0);
        }
    });
    const builds = ciClient.list();
    ciClient.list()
        .filter(acceptFilter)    
        .forEach(b => b.fetch());
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
