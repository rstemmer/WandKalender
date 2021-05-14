# MusicDB,  a music manager with web-bases UI that focus on music.
# Copyright (C) 2017-2021  Ralf Stemmer <ralf.stemmer@gmx.net>
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
"""
Overview of all WebAPI Methods sorted by category (some methods appear multiple times).

Available Methods
^^^^^^^^^^^^^^^^^

"""
from lib.cfg.wkserver   import WKServerConfig
from classes.calendarclient import CalendarClientManager
from threading          import Thread
import os
import logging
import random
import traceback

class WKServerWebSocketInterface(object):
    def __init__(self):
        # The autobahn framework silently hides all exceptions - that sucks
        # So all possible exceptions must be caught here, so that they can be made visible.
        try:
            self.calendarmanager = CalendarClientManager()
        except Exception as e:
            logging.exception(e)
            raise e
        self.cfg = WKServerConfig("/etc/wkserver.ini")



    def onWSConnect(self):
        self.calendarmanager.RegisterCallback(self.onCalendarUpdate)
        return None

        

    def onWSDisconnect(self, wasClean, code, reason):
        self.calendarmanager.RemoveCallback(self.onCalendarUpdate)
        return None



    def onCalendarUpdate(self, calendardata):
        response = {}
        response["method"]      = "notification"
        response["fncname"]     = "WKServer:CalendarUpdate"
        response["fncsig"]      = "onCalendarUpdate"
        response["arguments"]   = calendardata
        response["pass"]        = None
        success = self.SendPacket(response)
        return success



    def onCall(self, packet):
        try:
            method      = packet["method"]
            fncname     = packet["fncname"]
            fncsig      = packet["fncsig"]
            arguments   = packet["arguments"]
            passthrough = packet["pass"]
            apikey      = packet["key"]
        except:
            logging.warning("Malformed request packet received! \033[0;33m(Call will be ignored)")
            logging.debug("Packet: %s", str(packet))
            return False

        logging.debug("method: %s, fncname: \033[1;37m%s\033[1;30m, fncsig: %s, arguments: %.200s, pass: %s", 
                str(method),str(fncname),str(fncsig),str(arguments),str(passthrough))

        if apikey != self.cfg.websocket.apikey:
            logging.error("Invalid WebSocket API Key! \033[1;30m(Check your configuration. If they are correct check your HTTP servers security!)\033[0m\nreceived: %s\nexpected: %s", str(apikey), str(self.cfg.websocket.apikey))
            return False

        if not method in ["call", "request", "broadcast"]:
            logging.warning("Unknown call-method: %s! \033[0;33m(Call will be ignored)", str(method))
            return False

        try:
            self.HandleCall(fncname, method, fncsig, arguments, passthrough)
        except Exception as e:
            logging.exception("Unexpected error for async. call-function: %s!", str(fncname))
            return False

        return True



    def HandleCall(self, fncname, method, fncsig, args, passthrough):
        retval = None

        # Request-Methods
        if fncname == "HelloServer":
            retval = "Hello Client"
        else:
            logging.warning("Unknown function: %s! \033[0;33m(will be ignored)", str(fncname))
            return None

        # prepare return behavior
        response    = {}
        response["fncname"]     = fncname
        response["fncsig"]      = fncsig
        response["arguments"]   = retval
        response["pass"]        = passthrough

        if method == "request":
            response["method"]  = "response"
            self.SendPacket(response)
        elif method == "broadcast":
            response["method"]  = "broadcast"
            self.BroadcastPacket(response)
        return None


# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

