#!/usr/bin/env bash

set -e

current_branch=$(git rev-parse --abbrev-ref HEAD)

docker volume create dontyoufillit-ci-cache
docker build -t dontyoufillit-ci -f docker/Dockerfile docker/

docker run --rm -v $PWD:/repo:ro --mount source=dontyoufillit-ci-cache,target=/cache dontyoufillit-ci bash -c "
set -e
git config --global --add safe.directory /repo/.git
git clone --depth 1 -b ${current_branch} /repo /src
cd /src
mkdir -p /cache/node_modules
rsync -a /cache/node_modules/ /src/node_modules/
npm i --prefer-offline --no-audit --progress=false
rsync -a /src/node_modules/ /cache/node_modules/
make
tree dist/
" && echo SUCCESS || echo FAILURE
