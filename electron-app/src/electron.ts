import {app, BrowserWindow, Menu, Tray} from 'electron';
import {createServerFromArgs} from "bwatch-daemon";
import chalk from "chalk";
import * as path from "path";

//import css from "index.css"

function createWindow() {
    const icons = {
        'linux': 'iconTemplateWhite.png',
        'win32': 'windows-icon.png'
    }
    const iconName = icons[process.platform] || 'iconTemplate.png'
    const icon = path.join('assets', 'tray-icon', iconName)

    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        title: "bwatch",
        icon,
    });

    const dev = process.env.BW_ENV === "dev";

    win.removeMenu();
    win.webContents.openDevTools();

    // and load the index.html of the app.
    // TODO file not at the same location when app is packaged
    const filePath = dev
        ? "index.html"
        : "build/index.html";
    win.loadFile(filePath);

    win.on('minimize', event => {
        event.preventDefault();
        win.hide();
    });

    win.on("close", () => {
        console.log("App closed");
    });

    app.dock && app.dock.hide();
    const tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Builds'
                , click: () => {
                    win.show();
                }
            },
            {
                label: 'Quit'
                , click: () => {
                    app.quit();
                }
            }
        ]
    )
    tray.setToolTip('build-watcher')
    tray.setContextMenu(contextMenu)
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

