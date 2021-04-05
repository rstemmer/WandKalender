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
        {
            // all-day events for multiple days have a begin-end range, not a FREQ rule and not a repeats property
            let date = begin;
            while(date < end)
            {
                entry = new CalendarEntry(name, new Date(begin));
                date.setDate(date.getDate() + 1);
                this.entries.push(entry);
            }
        }
        else
        {
            entry = new CalendarEntry(name, new Date(begin), new Date(end));
            this.entries.push(entry);
        }

        // Create further entries if the event repeats
        if(eventinfos.hasOwnProperty("repeats"))
        {
            let date  = begin;
            let rules = eventinfos["repeats"];

            let interval;
            if("INTERVAL" in rules)
                interval = parseInt(rules["INTERVAL"]);
            else
                interval = 1;
            let frequency = rules["FREQ"];

            // Repeat N times
            if("COUNT" in rules)
            {
                let count = parseInt(rules["COUNT"]);
                this.RepeatNTimes(name, frequency, interval, begin, end, allday, count);
            }
            // Repeat infinite times
            else if("BYDAY" in rules)
            {
                let byday    = rules["BYDAY"];
                let bysetpos = parseInt(rules["BYSETPOS"]);
                this.RepeatByDay(name, frequency, interval, begin, end, allday, byday, bysetpos);
            }
        }

        return this.entries;
    }



    RepeatNTimes(name, frequency, interval, begin, end, allday, count)
    {
        //window.console?.log(`REPEAD ${name} N times`);
        let date = begin;
        for(let i=1; i<count; i++) // Start with 1, because 0 has already been processed
        {
            switch(frequency)
            {
                case "DAILY":   date.setDate(date.getDate() + interval  ); break;
                case "WEEKLY":  date.setDate(date.getDate() + interval*7); break;
                case "MONTHLY": date.setMonth(date.getMonth() + interval); break;
            }

            this.AddEntry(name, allday, date, end);
        }
        return;
    }



    RepeatByDay(name, frequency, interval, begin, end, allday, byday, bysetpos)
    {
        // window.console?.log(`REPEAD ${name} by Day: f=${frequency}, i=${interval}, byday=${byday}, bysetpos=${bysetpos}`);
        // Repeat until end of month
        let now        = new Date();
        let endofmonth = new Date();
        endofmonth.setMonth(now.getMonth() + 1);

        let offset;
        if(typeof(bysetpos) === "number" && isNaN(bysetpos) == false)
            offset = (bysetpos-1) * 7; // bysetpos defines the week of the month
        else
            offset = 0;

        let daylut = {"SO":0, "MO":1, "TU":2, "WE":3, "TH":4, "FR":5, "SA":6};
        let date   = begin;
        while(date <= endofmonth)
        {
            if(frequency === "MONTHLY")
            {
                date.setMonth(date.getMonth() + interval);
                date.setDate(1); // start at the begin of the month, then apply ByDay rule

                // Apply  ByDay rule
                let dayofweek = date.getDay();
                let daytoset  = daylut[byday];
                let distance  = daytoset - dayofweek;
                if(distance < 0) distance += 7;
                date.setDate(date.getDate() + distance + offset);
            }
            else if(frequency === "WEEKLY")
            {
                date.setDate(date.getDate() + interval*7);
            }
            else
            {
                window.console?.error(`a frequency of ${frequency} is not supported`);
            }


            this.AddEntry(name, allday, date, end);
        }
        return;
    }



    AddEntry(name, allday, date, end)
    {
        let entry;
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
        return;
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

