# WKServer,  Web-Socket server for the WandKalendar project
# Copyright (C) 2021  Ralf Stemmer <ralf.stemmer@gmx.net>
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
"""

import time
import logging
import threading
from datetime import date, datetime, timedelta
from lib.cfg.wkserver   import WKServerConfig
import caldav
from icalendar import Calendar, Event

Thread          = None
Callbacks       = []
RunThread       = False

def StartCalendarClientThread(config):
    global Thread
    global RunThread
    global Callbacks

    if Thread != None:
        logging.warning("Calendar Client Thread already running")
        return False

    Callbacks = []
    RunThread = True
    logging.debug("Starting Calendar Client Thread")
    Thread    = threading.Thread(target=CalendarClientThread, args=[config])
    Thread.start()
    return True


def CalendarClientThread(config):
    global RunThread
    global Callbacks

    calendarclient = CalendarClient(config)
    calendarclient.Connect()

    while RunThread:
        today  = datetime.today()
        today  = today.replace(hour=0, minute=0, second=0)  # begin of day
        monday = today - timedelta(days=today.weekday())    # begin of week
        start  = monday - timedelta(weeks=1)                # last week
        end    = monday + timedelta(weeks=4)                # this week + 3 next weeks

        #start = datetime(2021, 4, 28)
        #end   = datetime(2021, 5, 16)
        calendarclient.GetEvents(start, end)

        # for each calendar
        for name, calendar in calendarclient.calendars.items():

            # Wait a minute
            for t in range(30):         # TODO: Make configurable
                if not RunThread:
                    return
                else:
                    time.sleep(1)

            # Send event of one calendar
            logging.debug("Update %s", name)

            if calendar["calendartype"] == "Holiday":
                isholiday = True
            else:
                isholiday = False

            calendardata = {}
            calendardata["name"]        = name
            calendardata["events"]      = calendar["events"]
            calendardata["isholiday"]   = isholiday
            calendardata["range"]       = {}
            calendardata["range"]["start"] = str(start)
            calendardata["range"]["end"]   = str(end)

            for callback in Callbacks:
                try:
                    callback(calendardata)
                except Exception as e:
                    logging.exception("A Stream Thread event callback function crashed!")
    return




class CalendarClientManager(object):
    def __init__(self):
        pass

    def StopThread(self):
        global RunThread
        global Thread
        logging.debug("Stopping Calendar Manager…")
        RunThread = False
        Thread.join()

    def RegisterCallback(self, function):
        global Callbacks
        Callbacks.append(function)

    def RemoveCallback(self, function):
        global Callbacks

        # Not registered? Then do nothing.
        if not function in Callbacks:
            logging.warning("A Thread callback function should be removed, but did not exist in the list of callback functions!")
            return
        Callbacks.remove(function)



class CalendarClient(object):
    def __init__(self, config):
        #self.shutdown    = False
        self.config     = config
        self.username   = self.config.caldav.username
        self.password   = self.config.caldav.password
        self.url        = self.config.caldav.url
        # Initialize client - does not try to connect
        self.davclient  = caldav.DAVClient(
                url             = self.url,
                username        = self.username,
                password        = self.password,
                ssl_verify_cert = False)

        self.calendars = {} # Internal calendar representation
        calendarnames  = self.config.Get(str, "calendars", "calendars", [], islist=True)
        for calendarname in calendarnames:
            calendartype = self.config.Get(str, "calendar:"+calendarname, "type",       "User")
            remotename   = self.config.Get(str, "calendar:"+calendarname, "remotename", "")
            self.AddCalendarEntry(calendartype, calendarname, remotename)
        return



    def AddCalendarEntry(self, calendartype, name, remotename):
        """
        CalendarType: "User", "Holiday"
        """
        logging.debug("New Calendar: name=%s, type=%s, remotename=%s", name, calendartype, remotename)
        self.calendars[name] = {}
        self.calendars[name]["name"]         = name
        self.calendars[name]["calendartype"] = calendartype
        self.calendars[name]["remotename"]   = remotename
        self.calendars[name]["remotecalendar"] = None  # Gets updated inside the Connect method
        self.calendars[name]["events"]         = None  # Gets updated inside the GetEvents method
        return



    def Connect(self):
        logging.debug("Connecting to caldav server");

        principal       = self.davclient.principal()
        remotecalendars = principal.calendars()

        if not remotecalendars:
            return False

        for name, calendar in self.calendars.items():
            for remotecalendar in remotecalendars:
                if calendar["remotename"] == remotecalendar.name:
                    calendar["remotecalendar"] = remotecalendar
        return True



    def ProcessRemoteEvent(self, remoteevent):
        ical   = Calendar.from_ical(remoteevent.data)
        events = []
        for component in ical.walk():
            if component.name != "VEVENT":
                continue
            event = {}
            event["start"] = component.decoded("DTSTART")
            event["end"]   = component.decoded("DTEND")
            event["start"] = str(event["start"])
            event["end"]   = str(event["end"]  )
            if type(component.decoded("DTSTART")) == date:
                event["allday"]= True
            else:
                event["allday"]= False

            event["summary"] = component.decoded("SUMMARY").decode("utf-8")
            events.append(event)
        return events



    def GetEvents(self, start, end):
        logging.debug("Get events from %s to %s", str(start), str(end))
        for name, calendar in self.calendars.items():
            remoteevents = calendar["remotecalendar"].date_search(start=start, end=end, expand=True)
            calendar["events"] = []
            for remoteevent in remoteevents:
                events = self.ProcessRemoteEvent(remoteevent)

                for event in events:
                    # If all-day and start<end, expand
                    if event["allday"] == True and event["start"] != event["end"]:
                        startdate = datetime.strptime(event["start"], "%Y-%m-%d").date()
                        while event["start"] < event["end"]:
                            calendar["events"].append(dict(event))  # append a copy
                            startdate += timedelta(days=1)
                            event["start"] = str(startdate)
                    else:
                        calendar["events"].append(event)
        return



    def PrintEvents(self):
        for name, calendar in self.calendars.items():
            print(name)
            events = calendar["events"]
            print(events)
            print("\033[0m-----------------------------")
        return


# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

