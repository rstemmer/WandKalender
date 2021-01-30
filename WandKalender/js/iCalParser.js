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


class iCalParser
{
    constructor(icaldata)
    {
        this.icaldata = icaldata.split("\n");
        this.icalevent = this.GetSection("VEVENT");
    }


    GetSection(sectionname)
    {
        let section   = new Array();
        let insection = false;

        for(let line of this.icaldata)
        {
            if(insection == false && line.startsWith("BEGIN:"))
            {
                if(line.split(":")[1] == sectionname)
                    insection = true;
            }
            else if(insection == true && line.startsWith("END:"))
            {
                if(line.split(":")[1] == sectionname)
                    insection = false;
            }
            else if(insection == true)
            {
                section.push(line);
            }
        }

        let sectionobject = this.LinesToObject(section);
        return sectionobject;
    }



    LinesToObject(lines)
    {
        let object = new Object();
        for(let line of lines)
        {
            let key, value;
            [key, value] = line.split(":");
            object[key]  = value;
        }
        return object;
    }



    // !! Even if it looks like, this method does not handle different time zones correct
    CreateDateObject(icaldate)
    {
        let YYYY, MM, DD, hh, mm, ss;
        let date;

        // caldate: "YYYYMMDDThhmmss"
        // caldate: "YYYYMMDD"
        YYYY = parseInt(icaldate.substr(0, 4));
        MM   = parseInt(icaldate.substr(4, 2)) - 1; // because JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
        DD   = parseInt(icaldate.substr(6, 2));
        if(icaldate[8] === "T")
        {
            hh = parseInt(icaldate.substr( 9, 2));
            mm = parseInt(icaldate.substr(11, 2));
            ss = parseInt(icaldate.substr(13, 2));
            if(icaldate[15] === "Z")
                date = new Date(Date.UTC(YYYY, MM, DD, hh, mm, ss));
            else
                date = new Date(YYYY, MM, DD, hh, mm, ss);
        }
        else
        {
            date = new Date(YYYY, MM, DD);
        }

        return date;
    }



    ParseRRULE(rrulestring)
    {
        let rrule = new Object();

            // FREQ=DAILY;COUNT=5;INTERVAL=2
        let props = rrulestring.split(";");
        for(let prop of props)
        {
            let key, value;
            [key, value] = prop.split("=");
            rrule[key] = value;
        }
        return rrule;
    }



    // Returns an object with the following information
    //  · name as string
    //  · all-day as Boolean
    //  · begin as Date
    //  · end as Date
    //  · repeats as String (iCal RRULE)
    GetEventInformation()
    {
        //window.console && console.log(this.icalevent);
        let eventinfo = new Object();

        for(let key in this.icalevent)
        {
            if(key.startsWith("SUMMARY"))
            {
                eventinfo["name"] = this.icalevent[key];
            }
            else if(key.startsWith("RRULE"))
            {
                eventinfo["repeats"] = this.ParseRRULE(this.icalevent[key]);
            }
            else if(key.startsWith("DTSTART"))
            {
                let modifier;
                [, modifier]   = key.split(";");
                let datestring = this.icalevent[key];
                let date       = this.CreateDateObject(datestring);

                // FIXME: this is full of potential fails
                if(modifier.startsWith("TZID="))
                {
                    // Good luck, different time zones are not supported
                }
                else if(modifier.startsWith("VALUE"))
                {
                    let value = modifier.split("=")[1];
                    if(value == "DATE")
                        eventinfo["all-day"] = true;
                    else
                        eventinfo["all-day"] = false;
                }

                eventinfo["begin"] = date;
            }
            else if(key.startsWith("DTEND"))
            {
                let datestring = this.icalevent[key];
                let date       = this.CreateDateObject(datestring);
                eventinfo["end"] = date;
            }
        }

        return eventinfo;
    }

}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

