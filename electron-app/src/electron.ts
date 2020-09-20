import {app, BrowserWindow, Menu, Tray, ipcMain, shell} from 'electron';
import {Args, createServerFromArgs, defaultFile, defaultPort} from "bwatch-daemon";
import chalk from "chalk";
import * as path from "path";
import {Command} from "commander";
import { autoUpdater} from "electron-updater";

export interface ElectronArgs extends Args {
    remoteHost?: string;
    version: string;
}

let argv = process.argv;

if (app.isPackaged) {
    argv = ["dummy_arg", ...process.argv];
}

export function parseElectronArgs(): ElectronArgs {
    const program = new Command();
    const version = require("../package.json").version;

    console.log("┌┐    ┬ ┬┌─┐┌┬┐┌─┐┬ ┬\n" +
        "├┴┐───│││├─┤ │ │  ├─┤\n" +
        "└─┘   └┴┘┴ ┴ ┴ └─┘┴ ┴ v" + version)

    program
        .name(app.getName())
        .description("the b-watch app")
        .version(version)
        .option("-b, --builds <path>", `Path to the builds JSON file (defaults to ~/${defaultFile})`)
        .option("-p, --port <port>", `Web server port (defaults to ${defaultPort})`)
        .option("-r, --remote <host>", "Do not start daemon, instead use a remote one")
    program.parse(argv);
    return {
        buildsPath: program.builds || defaultFile,
        port: program.port || defaultPort,
        remoteHost: program.remote,
        version
    }
}


const args: ElectronArgs = parseElectronArgs();

console.log("PARSED ARGS", args);

ipcMain.on("open-build", (event, args) => {
    const url = args[0];
    shell.openExternal(url);
});


// need to keep this as a global to avoid garbaging
let tray = null;

let quitting = false;

const serverRes = createServerFromArgs(args);

let server;

switch (serverRes.tag) {
    case "Ok":
        server = serverRes.value;
        break;
    case "Err": {
        console.log(chalk.red(serverRes.err));
        app.exit(1);
        break;
    }
}

function createWindow() {

    const trayIcon = app.isPackaged
        ? process.resourcesPath + "/app.asar/assets/tray-icon.png"
        : "assets/tray-icon.png"

    tray = new Tray(trayIcon)
    const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Builds',
                click: () => {
                    console.log("clicked show builds")
                    win.show();
                    app.dock && app.dock.show();
                }
            },
            {
                label: 'Quit',
                click: () => {
                    quitting = true;
                    console.log("closing")
                    server.close(() =>
                        app.quit()
                    );
                }
            }
        ]
    )
    tray.setToolTip('build-watcher')
    tray.setContextMenu(contextMenu)

    // Create the browser window.

    const windowIcon = "assets/tray-icon.png";

    const icon = app.isPackaged
        ? process.resourcesPath + "/app.asar/" + windowIcon
        : windowIcon

    const win = new BrowserWindow({
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        title: "bwatch",
        icon
    });

    win.on("close", e => {
        if (!quitting) {
            console.log("Minimizing to tray");
            e.preventDefault();
            win.hide();
            app.dock && app.dock.hide();
        }
    });

    ipcMain.once("app-ready", () => {

        console.log("checking for updates...");
        autoUpdater.checkForUpdatesAndNotify()
            .then(r => {
                if (r) {
                    console.warn("update available", app.getVersion(), "=>", r.updateInfo.version, r);
                    if (r.updateInfo.version !== app.getVersion()) {
                        win.webContents.send('update-available', r.updateInfo.version);
                    }
                } else {
                    console.warn("update check returned null")
                }
            })
            .catch(e =>
                console.warn("error while trying to update", e)
            );

        if (args.remoteHost) {
            console.log("remote host provided", chalk.green(args.remoteHost), chalk.yellow("will not start local daemon"));
            win.webContents.send("server-ready", args);
        } else {
            console.log("app ready, starting server");
            server.start(() => {
                console.log("server started, notifying app");
                win.webContents.send("server-ready", args);
            });
        }
    });

    ipcMain.on("renderer-ready", () => {
        win.webContents.send("get-args", args);
    });

    ipcMain.on("update-install", () => {
        autoUpdater.quitAndInstall();
    })

    const dev = process.env.BW_ENV === "dev";

    win.removeMenu();
    if (dev) {
        win.webContents.openDevTools();
    }

    // and load the index.html of the app.
    // TODO file not at the same location when app is packaged
    const filePath = dev
        ? "index.html"
        : "build/index.html";
    win.loadFile(filePath);

    autoUpdater.on('update-downloaded', args => {
        console.log("update downloaded", args)
        win.webContents.send('update-downloaded');
    });

}

app.on('ready', createWindow);





