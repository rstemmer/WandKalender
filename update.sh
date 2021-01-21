#!/usr/bin/env bash

SOURCEDIR=./WandKalender
DESTINATION=/srv/WandKalender

set -e

if ! type rsync 2> /dev/null > /dev/null ; then
    echo -e "\e[1;31mThe mandatory tool \e[1;35mrsync\e[1;31m is missing!\e[0m"
    exit 1
fi

rsync -uav  \
    --exclude '*.swp' \
    --exclude '*.swo' \
    --exclude '*~' \
    --delete \
    $SOURCEDIR/ $DESTINATION/. > /dev/null

echo -e "\e[1;32mdone\e[0m"


# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

