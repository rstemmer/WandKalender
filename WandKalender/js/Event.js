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


class CalendarEntry
{
    // Date can be the begin of an entry or the whole entry if all-day is true
    constructor(name, date, end=null)
    {
        this.name   = name;
        this.date   = date;
        if(end === null)
        {
            this.allday = true;
            this.end    = null;
        }
        else
        {
            this.allday = false;
            this.end    = end;
        }
    }
}


// One event can have multiple dates in case an event is periodic!
class Event extends iCalParser
{
    constructor(icaldata)
    {
        super(icaldata);
        this.GetDates();
    }
    // start, end, frequency, count, interval, name



    // returns an array with objects of type CalendarEntry
    GetDates()
    {
        this.entries    = new Array();
        let eventinfos = super.GetEventInformation();

        let name   = eventinfos["name"];
        let allday = eventinfos["all-day"];
        let begin  = eventinfos["begin"];
        let end    = eventinfos["end"];

        // Create first entry
        let entry;
        if(allday)
            entry = new CalendarEntry(name, new Date(begin));
        else
            entry = new CalendarEntry(name, new Date(begin), new Date(end));
        this.entries.push(entry);

        // Create further entries if the event repeats
        if(eventinfos.hasOwnProperty("repeats"))
        {
            // FREQ=DAILY;COUNT=5;INTERVAL=2
            let rules     = eventinfos["repeats"];
            let count     = parseInt(rules["COUNT"]);
            let interval;
            if(rules["INTERVAL"] != undefined)
                interval = parseInt(rules["INTERVAL"]);
            else
                interval = 1;
            let frequency = rules["FREQ"];
            let date      = begin;

            for(let i=1; i<count; i++) // Start with 1, because 0 has already been processed
            {
                switch(frequency)
                {
                    case "DAILY":   date.setDate(date.getDate() + interval  ); break;
                    case "WEEKLY":  date.setDate(date.getDate() + interval*7); break;
                    case "MONTHLY": date.setMonth(date.getMonth() + interval); break;
                }

                if(allday)
                    entry = new CalendarEntry(name, new Date(date));
                else
                {
                    end.setFullYear(date.getFullYear());
                    end.setMonth(date.getMonth());
                    end.setDate(date.getDate());
                    entry = new CalendarEntry(name, new Date(date), new Date(end));
                }

                this.entries.push(entry);
            }
        }

        //window.console && console.log(entries);
        return this.entries;
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

