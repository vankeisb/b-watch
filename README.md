**INCEPTION STAGE !**

`b-watch` observes builds from various C.I. servers, allowing you to monitor multiple builds without pain.

Never miss a failed build again !

Features :
* polls your builds in the background
    * daemon and local http server
* GUI with live build statuses
    * tray integration
    * notifications
* supports multiple C.I. vendors 
    * Travis and Bamboo for now, but easy to add some
    
# Build / Test

Project uses yarn workspaces. A convenience script can be used to build everything :

    ./build.sh
           
Start the daemon :

    cd daemon
    yarn start -b ../bwatch.sample.json    

Start the webapp :

    cd frontend
    yarn start
    
Start the desktop app :
    
    cd electron-app
    yarn start
    
> desktop app starts the daemon : careful if you already have the daemon running
