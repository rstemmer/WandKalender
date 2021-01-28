// WandKalender,  a caldav front end for a simple event overview
// Copyright (C) 2021-2021  Ralf Stemmer <ralf.stemmer@gmx.net>
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";


class CalendarData
{
    constructor(caldavclient, calurl, name)
    {
        this.caldav = caldavclient;
        this.calurl = calurl;
        this.name   = name;
        this.UpdateCalendar();
    }



    UpdateCalendar()
    {
        this.events = new Array();
        this.caldav.Report(this.calurl, ["c:calendar-data"], (ical)=>{this.onCalendarUpdate(ical);});
    }

    onCalendarUpdate(caleventdata)
    {
        //window.console && console.log(calevent);
        let calevent = new Event(caleventdata["cal:calendar-data"]);
        this.events.push(calevent);
    }
}


class CalendarManager
{
    constructor(servername, webdavinterface, username, password)
    {
        this.caldav = new CalDAV(servername, webdavinterface, username, password);
        this.FindAllCalendars();
    }



    FindAllCalendars()
    {
        this.calendars = new Array()
        this.caldav.PropFind(["d:displayname"], (calprops)=>{this.onCalendarFound(calprops);});
        return;
    }

    onCalendarFound(calprops)
    {
        if(!calprops.hasOwnProperty("d:displayname"))
            return;

        let calurl   = calprops["d:href"];
        let calname  = calprops["d:displayname"];

        let calendar = new CalendarData(this.caldav, calurl, calname);
        this.calendars.push(calendar);
        return;
    }



}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

