#!/usr/bin/env bash

set -e

if ! type rsync 2> /dev/null > /dev/null ; then
    echo -e "\e[1;31mThe mandatory tool \e[1;35mrsync\e[1;31m is missing!\e[0m"
    exit 1
fi

SOURCEDIR=./WandKalender
DESTINATION=/srv/WandKalender
rsync -uav  \
    --exclude '*.swp' \
    --exclude '*.swo' \
    --exclude '*~' \
    --exclude 'config.js' \
    --delete \
    $SOURCEDIR/ $DESTINATION/. > /dev/null

SOURCEDIR=./WandKalender2
DESTINATION=/srv/WandKalender2
WSCONFIG=$DESTINATION/config.js
if [ -f "$WSCONFIG" ] ; then
    cp "$WSCONFIG" "/tmp/wkswebuicfg.bak"
fi
rsync -uav  \
    --exclude '*.swp' \
    --exclude '*.swo' \
    --exclude '*~' \
    --exclude 'config.js' \
    --delete \
    $SOURCEDIR/ $DESTINATION/. > /dev/null
if [ -f "/tmp/wkswebuicfg.bak" ] ; then
    mv "/tmp/wkswebuicfg.bak" "$WSCONFIG"
fi

echo -e "\e[1;32mdone\e[0m"


# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

