#!/usr/bin/env node

import { BuildStatus } from "bwatch-common";
import { Build, CIClient, Configuration, loadConfigFromFile } from "bwatch-daemon";
import chalk from 'chalk';

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
            return b.config.conf.plan + " (Bamboo)";
        }
        case "travis": {
            return b.config.conf.repository + "/" + b.config.conf.branch + " (Travis)";
        }
        case "circleci": {
            return b.config.conf.org + "/" + b.config.conf.repo + "/" + b.config.conf.branch + " (Circle CI)";
        }
    }
}

function configLoaded(c: Configuration) {
    let nbBuilds = 0;
    
    const ciClient = new CIClient(c, b => {

        const errorStr = b.status.tag === 'error'
            ? " " + b.status.err
            : "";

        console.log(chalk.inverse(coloredStatus(b.status)) + " " + chalk.bold(displayName(b)) + errorStr);

        nbBuilds--;
        if (nbBuilds === 0) {
            process.exit(0);
        }
    });
    const builds = ciClient.list();
    ciClient.list().forEach(b => b.fetch());
}

interface LineData {
    readonly ciServer: string;
    readonly displayName: string;
    readonly status: BuildStatus;
}
