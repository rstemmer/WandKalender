#!/usr/bin/env python3

# WKServer,  Web-Socket server for the WandKalendar project
# Copyright (C) 2020 - 2022  Ralf Stemmer <ralf.stemmer@gmx.net>
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import argparse
import importlib.util
import os
import sys
import grp
import logging
import systemd.daemon
from wkserver.lib.filesystem     import Filesystem
from wkserver.lib.cfg.wkserver   import WKServerConfig
from wkserver.lib.logging        import MusicDBLogger
from wkserver.classes.server     import WKServer
import urllib3
urllib3.disable_warnings()


VERSION = "0.2.0"

DEFAULTCONFIGFILE = "/etc/wkserver.ini"

def main():
    print("\033[1;31mWKServer [\033[1;34m" + VERSION + "\033[1;31m]\033[0m")

    # Generate argument parser
    argparser = argparse.ArgumentParser(description="WandKalender Server")
    argparser.add_argument("-v", "--version", action="store_true", help="show version and exit")
    argparser.add_argument("-q", "--quiet",   action="store_true", help="be quiet - do not write into debug file")
    argparser.add_argument(      "--verbose", action="store_true", help="be verbose - write into log file (usually stdout)")
    argparser.add_argument("--config"       # allows using nondefault config file
        , action="store"
        , type=str
        , metavar="path"
        , default=DEFAULTCONFIGFILE
        , help="Path to a nondefault config file. This will also influence the database file.")
    argparser.add_argument("--logfile"
        , action="store"
        , type=str
        , metavar="dest"
        , help="Override log-setting. dest can be a path to a file or \"stdout\" or \"stderr\".")
    argparser.add_argument("--loglevel"
        , action="store"
        , choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        , type=str
        , metavar="level"
        , help="Override log-setting for the loglevel that shall be logged.")

    parserset = argparser.add_subparsers(title="Modules", metavar="module", help="module help")

    log  = MusicDBLogger()   # The MusicDBConfig moduel needs a set up logger. The setting for logging will be applied later on.
    args = argparser.parse_args()

    if args.version:
        # was already printed
        exit(0)

    fs = Filesystem("/")


    # open the config file
    args.config = os.path.abspath(args.config)
    if not fs.IsFile(args.config):
        print("\033[1;31mFATAL ERROR: Config-file does not exist!\033[0m (" + args.config + ")")
        exit(1)

    try:
        config = WKServerConfig(args.config)
    except Exception as e:
        print("\033[1;31mFATAL ERROR: Opening config-file failed!\033[0m (" + args.config + ")")
        print(e)
        exit(1)


    # reconfigure logger
    if args.quiet:
        debugfile = None
    else:
        debugfile = config.log.debugfile

    if args.logfile:
        args.logfile= os.path.abspath(args.logfile)
        logfile = args.logfile
    elif args.verbose:
        logfile = config.log.logfile
    else:
        logfile = None
        
    if args.loglevel:
        loglevel = args.loglevel
    else:
        loglevel = config.log.loglevel
    log.Reconfigure(logfile, loglevel, debugfile, config)


    # execute module
    server = WKServer(config)
    server.Initialize()
    server.StartWebSocketServer()
    logging.debug("Informing SystemD that WKServer is read")
    systemd.daemon.notify("READY=1")
    server.Run()



if __name__ == "__main__":
    main()

# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

