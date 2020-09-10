import {app, BrowserWindow} from 'electron';
import {createServerFromArgs} from "bwatch-daemon";
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

const server = createServerFromArgs({
    port: 4000,
    buildsPath: "../bwatch.sample.json"
});

switch (server.tag) {
    case "Ok": {
        server.value.start();
        break;
    }
    case "Err": {
        console.log(chalk.red(server.err));
        app.exit(1);
        break;
    }
}

//
// const ciClient: CIClient = new CIClient()
