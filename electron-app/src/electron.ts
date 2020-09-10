import { app, BrowserWindow } from 'electron';
import {loadConfigsFromFile} from "bwatch-daemon";
import chalk from "chalk";

function createWindow () {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    win.loadFile('index.html');
}

app.on('ready', createWindow);

console.log(chalk.green("Starting bwatch app"));

// TODO
//const configs = loadConfigsFromFile("../../bwatch.sample.json");

//
// const ciClient: CIClient = new CIClient()
