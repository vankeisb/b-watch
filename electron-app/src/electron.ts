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

function createWindow() {
    // const icons = {
    //     'linux': 'iconTemplateWhite.png',
    //     'win32': 'windows-icon.png'
    // }
    // const iconName = icons[process.platform] || 'iconTemplate.png'
    // const icon = path.join('assets', 'tray-icon', iconName)

    const icon = app.isPackaged
        ? process.resourcesPath + "/app.asar/assets/tray-icon/iconTemplateWhite.png"
        : "assets/tray-icon/iconTemplateWhite.png"

    // Create the browser window.
    const win = new BrowserWindow({
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        title: "bwatch",
        icon,
    });

    win.on('minimize', event => {
        event.preventDefault();
        win.hide();
    });

    win.on("close", () => {
        console.log("App closed");
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
            const server = createServerFromArgs(args);
            switch (server.tag) {
                case "Ok": {
                    server.value.start(() => {
                        console.log("server started, notifying app");
                        win.webContents.send("server-ready", args);
                    });
                    break;
                }
                case "Err": {
                    console.log(chalk.red(server.err));
                    app.exit(1);
                    break;
                }
            }
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

    autoUpdater.on('update-downloaded', args => {
        console.log("update downloaded", args)
        win.webContents.send('update-downloaded');
    });

}

app.on('ready', createWindow);





