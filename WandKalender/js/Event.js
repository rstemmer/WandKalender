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


// One event can have multiple dates in case an event is periodic!
class Event extends iCalParser
{
    constructor(icaldata)
    {
        super(icaldata);
        this.GetDates();
    }
    // start, end, frequency, count, interval, name



    // returns an array with objects that have the following information:
    //  · name
    //  · day
    //  · all-day
    //  · begin
    //  · end
    GetDates()
    {
        let eventinfos = super.GetEventInformation();
        window.console && console.log(eventinfos);
        if(eventinfos.hasOwnProperty("repeats"))
        {
        }
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

