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
        window.console && console.log(`Starting synchronizing ${this.name} with the server…`);
        this.valid  = false;
        this.events = new Array();

        let from    = new Date();
        from.setDate(1);

        let to      = new Date(from);
        to.setMonth(to.getMonth() + 1);

        this.caldav.Report(this.calurl, from, to, ["c:calendar-data"], (ical)=>{this.onCalendarUpdate(ical);}, ()=>{this.onUpdateComplete();});
    }

    onCalendarUpdate(caleventdata)
    {
        //window.console && console.log(calevent);
        let calevent = new Event(caleventdata["cal:calendar-data"]);
        this.events.push(calevent);
    }

    onUpdateComplete()
    {
        this.valid = true;
        window.console && console.log(`Synchronization of ${this.name} complete.`);
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
    constructor(username, password)
    {
        this.userslist        = Object.keys(window.WandKalender.config.users);
        this.holidaycalendars = window.WandKalender.config.holidaycalendars;
        this.caldavurl        = window.WandKalender.config.caldavurl;
        this.usersdata        = null; // List of users data will be set by FindAllCalendars
        this.caldav = new CalDAV(this.caldavurl, username, password);
        this.calui  = new MonthCalendar(this.userslist, this.holidaycalendars);

        this.nextstate  = "Idle";
        this.tickcount  = 0;
        this.updatetick = setTimeout(()=>{this.Tick();}, 1000/*ms*/);

        let screen = document.getElementById("Screen");
        screen.appendChild(this.calui.GetHTMLElement());
        this.UpdateState("Initializing");
    }



    Tick()
    {
        const UPDATEINTERVAL = window.WandKalender.config.updateinterval;
        const RELOADINTERVAL = window.WandKalender.config.reloadinterval;
        this.tickcount++;
        this.state = this.nextstate;
        switch(this.state)
        {
            case "Initializing":
                this.UpdateState("LoadingCalendars");
                break;

            case "LoadingCalendars":
                this.FindAllCalendars();
                break;
            case "WaitingForLoadingComplete":
                break;

            case "RenderingCalendars":
                // window?.console?.log(this.usersdata); // DEBUG: List all found calendars
                this.calui.Update(this.usersdata);
                this.UpdateState("Idle");
                break;

            case "Idle":
                if(UPDATEINTERVAL > 0 && (this.tickcount % UPDATEINTERVAL) == 0)
                {
                    this.UpdateState("LoadingCalendars");
                }
                if(RELOADINTERVAL > 0 && (this.tickcount % RELOADINTERVAL) == 0)
                {
                    this.ReloadPage();
                }
        }

        // Set next tick
        this.updatetick = setTimeout(()=>{this.Tick();}, 1000/*ms*/);
    }



    UpdateState(nextstate)
    {
        window.console && console.log(`Transitioning from state ${this.state} to ${nextstate}`);
        this.nextstate = nextstate;
    }
    

    ReloadPage()
    {
        // Only reload if server is available!
        let checkurl   = window.location.origin + "/?rand=" + Math.random(); // random: avoid checking the cache!
        let xmlrequest = new XMLHttpRequest();
        
        xmlrequest.open("HEAD", checkurl, true /*Async*/);
        xmlrequest.timeout = 2000 /*ms*/;
        xmlrequest.onload    = ()=>{window.location.reload(true);};
        xmlrequest.onerror   = ()=>{window.console?.warn("WARNING: onerror   - server not online");};
        xmlrequest.ontimeout = ()=>{window.console?.warn("WARNING: ontimeout - server not online");};
        xmlrequest.onabort   = ()=>{window.console?.warn("WARNING: onabort   - server not online");};

        window.console?.log(`Checking if ${checkurl} is accessible`);
        xmlrequest.send();
        return;
    }


    FindAllCalendars()
    {
        this.UpdateState("WaitingForLoadingComplete");
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
        window.console && console.log(`${username} - ${calname}: ${calurl}`);

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
        // IMPORTANT! There can be a race condition!
        // Just because all calendars have been found,
        // it does not mean that they are also downloaded yet!
        // So give it some time to finish loading.
        const WAITFORLOADING = 10*1000; /*ms*/
        setTimeout(()=>{this.UpdateState("RenderingCalendars");}, WAITFORLOADING);
        //this.UpdateState("RenderingCalendars");
    }



}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

