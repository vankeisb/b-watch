[![Build Status](https://travis-ci.org/vankeisb/b-watch.svg?branch=develop)](https://travis-ci.org/vankeisb/b-watch)

`b-watch` observes various C.I. servers, allowing you to monitor multiple builds without pain. 

Never miss a failed build again !

# Features

* Polls C.I. servers for configured builds
* GUI showing build statuses
* Group builds 
* Desktop notifications

# Installation

Download the latest release for your platform [here](https://github.com/vankeisb/b-watch/releases).

# Configuration

The app is configured via a JSON file that specifies the polling interval and the list of builds to be monitored.

It will look for a `~/.bwatch.json` file by default, and you can pass it via command line (`--help` for usage). 

> The app will exit(1) at startup if the file isn't found or doesn't parse correctly.

An example config can be found in [./bwatch.sample.json](./bwatch.sample.json).

> There's no hot reload, you'll need to restart the app if you change the config.

## Authentication / tokens

The config file may use environment variables using `${process.env.MY_VAR}`. 

Here's how to use your token for Travis :

````
{
  "tag": "travis",
  "serverUrl": "https://travis.myorg.com",
  "repository": "my/repo",
  "branch": "develop",
  "token": "${process.env.TRAVIS_TOKEN}",
}
````
    
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
