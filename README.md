**INCEPTION STAGE !**

`b-watch` observes various C.I. servers, allowing you to monitor multiple builds without pain. 

Never miss a failed build again !

# Features

* Polls C.I. servers for configured builds
* GUI showing build statuses
* Group builds 
* Desktop notifications

# Installation

Download the latest release for your platform [here](https://github.com/vankeisb/b-watch/releases).

The application will look for a `~/.bwatch.json` configuration file by default, unless you pass it via command line argument. An example config can be found in [./bwatch.sample.json](./bwatch.sample.json)
    
# Build / Test


Project uses yarn workspaces. A convenience script can be used to build everything :

    ./build.sh

> following instructions will use the `bwatch.sample.json` file
           
Start the daemon :

    cd daemon
    yarn start -b ../bwatch.sample.json    

Start the webapp :

    cd frontend
    yarn start
    
Start the desktop app :
    
    cd electron-app
    yarn start -b ../bwatch.sample.json    
    
> desktop app starts the daemon : careful if you already have the daemon running

# Build executable

    cd electron-app
    yarn build # if not compiled already
    yarn dist
    
# RHEL

The tray icon isn't shown by default on RHEL8, you need to install the AppIndicator Support GNOME shell extension.
