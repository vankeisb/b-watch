#!/bin/bash
if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  docker run --rm \
    --env-file bwatch.env \
    -v ${PWD}:/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "cd electron-app && yarn dist --linux --win"
else
  /bin/bash -c "cd electron-app && yarn dist --mac"
fi
