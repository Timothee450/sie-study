#!/bin/sh
# Copy the site to the preview folder served by the "sie-study" launch config.
cd "$(dirname "$0")/.." || exit 1
mkdir -p /private/tmp/sie-study-preview
rsync -a --delete --exclude source --exclude docs --exclude tests --exclude tools --exclude .superpowers --exclude .claude ./ /private/tmp/sie-study-preview/
cp tools/nocache_server.py /private/tmp/sie-study-server.py
