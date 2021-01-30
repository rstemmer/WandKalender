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
        window.console && console.log(`update`);
        this.valid = false;
        this.events = new Array();
        this.caldav.Report(this.calurl, ["c:calendar-data"], (ical)=>{this.onCalendarUpdate(ical);}, ()=>{this.onUpdateComplete();});
    }

    onCalendarUpdate(caleventdata)
    {
        //window.console && console.log(calevent);
        let calevent = new Event(caleventdata["cal:calendar-data"]);
        this.events.push(calevent);
    }

    onUpdateComplete()
    {
        window.console && console.log(`complete`);
        this.valid = true;
    }
}


/*
 * State Machine:
 *  - Initializing
 *  - LoadingCalendars
 *  - RenderingCalendars
 *  - Idle
 */
class CalendarManager
{
    constructor(servername, webdavinterface, username, password)
    {
        this.userslist = ["testuser"]; // List of allowed users
        this.holidaycalendars = ["FakeFeiertage"]; // List of holiday calendars
        this.usersdata     = null; // List of users data
        this.caldav = new CalDAV(servername, webdavinterface, username, password);
        this.calui  = new MonthCalendar(this.userslist, this.holidaycalendars);

        this.nextstate  = "Idle";
        this.updatetick = setTimeout(()=>{this.Tick();}, 1000/*ms*/);

        let screen = document.getElementById("Screen");
        screen.appendChild(this.calui.GetHTMLElement());
        this.UpdateState("Initializing");
    }



    Tick()
    {
        this.state = this.nextstate;
        switch(this.state)
        {
            case "Initializing":
                this.UpdateState("LoadingCalendars");
                break;

            case "LoadingCalendars":
                this.FindAllCalendars();
                break;

            case "RenderingCalendars":
                this.calui.Update(this.usersdata);
                this.UpdateState("Idle");
                break;
        }

        // Set next tick
        this.updatetick = setTimeout(()=>{this.Tick();}, 1000/*ms*/);
    }



    UpdateState(nextstate)
    {
        this.nextstate = nextstate;
    }



    FindAllCalendars()
    {
        //this.calendars = new Array()
        this.usersdata = new Object();
        this.caldav.PropFind(["d:displayname", "d:owner"], (calprops)=>{this.onCalendarFound(calprops);}, ()=>{this.onAllCalendarsFound();});
        return;
    }

    onCalendarFound(calprops)
    {
        if(!calprops.hasOwnProperty("d:displayname"))
            return;

        //window.console && console.log(calprops);
        let calurl     = calprops["d:href"];
        let calname    = calprops["d:displayname"];
        let calowner   = calprops["d:owner"];
        let ownerparts = calowner.split("/");
        let username   = ownerparts[ownerparts.length - 2]
        //window.console && console.log(`${username} - ${calname}: ${calurl}`);

        // Check if calendars of this user shall be visible
        if(!username in this.userslist)
        {
            window.console && console.info(`User ${username} not in list of users whos calenders shall be shown. - Will be ignored.`);
            return;
        }

        // If this is the first calendar of a user, create the calendars array
        if(!this.usersdata.hasOwnProperty(username))
        {
            this.usersdata[username]           = new Object();
            this.usersdata[username].calendars = new Array();
        }

        // Add this calendar to the users calendar array
        let calendar = new CalendarData(this.caldav, calurl, calname);
        this.usersdata[username].calendars.push(calendar);
        return;
    }

    onAllCalendarsFound()
    {
        this.UpdateState("RenderingCalendars");
    }



}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

