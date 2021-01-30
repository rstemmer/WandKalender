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

const DAYS = new Array("Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag");



class CalendarCellEntry extends Element
{
    constructor(calendarentry)
    {
        super("div");

        let allday = calendarentry.allday;
        if(allday === false)
        {
            let begin = this.DateToTime(calendarentry.date);
            let end   = this.DateToTime(calendarentry.end);
            let prefix = new Element("span");
            prefix.SetInnerText(`${begin} - ${end}`);
            this.AppendChild(prefix);
        }

        let name        = calendarentry.name;
        let nameelement = new Element("span");
        nameelement.SetInnerText(name);
        this.AppendChild(nameelement);
    }


    DateToTime(date)
    {
        let h  = date.getHours();
        let m  = date.getMinutes();
        let ms = ("00"+m).substr(-2);
        let hs = ("00"+h).substr(-2);
        return hs + ":" + ms;
    }
}


class Table extends Element
{
    constructor()
    {
        super("table", ["Table"]);
        this.rows        = new Array();
    }



    AddRow(tablerow)
    {
        this.rows.push(tablerow);
        this.AppendChild(tablerow);
    }
}



class Row extends Element
{
    constructor(columns)
    {
        super("tr", ["Row"]);
        this.columncount = columns;

        this.cells = new Array();
        for(let i=0; i<this.columncount; i++)
        {
            let cell = new Element("td");
            this.cells.push(cell);
            this.AppendChild(cell);
        }
    }



    SetContent(cellnum, cell)
    {
        this.cells[cellnum].RemoveChilds();
        this.cells[cellnum].AppendChild(cell);
    }



    AddContent(cellnum, cell)
    {
        this.cells[cellnum].AppendChild(cell);
    }



    Clear()
    {
        for(let cell of this.cells)
        {
            cell.RemoveChilds();
        }
    }
}



class CalendarHeadline extends Row
{
    constructor(users)
    {
        super(users.length + 1);

        let index = 1;
        for(let user of users)
        {
            let name = user;

            let cell = new Element("div");
            cell.SetInnerText(name);
            this.SetContent(index, cell);

            index += 1;
        }
    }
}



class CalendarRow extends Row
{
    // date will not be changed. It is safe to pass a reference
    constructor(date, numcalendars)
    {
        super(numcalendars + 1);
        //this.monthid = date.getMonth();
        //this.month   = MONTHS[this.monthid];
        this.daynum  = date.getDate();
        this.dayid   = date.getDay();
        this.day     = DAYS[this.dayid];

        if(this.dayid === 0 || this.dayid === 6)
            this.element.classList.add("weekend");

        this.CreateDayCell();
    }


    SetHoliday()
    {
        this.element.classList.add("weekend");
    }



    Clear()
    {
        super.Clear();
        this.CreateDayCell();
    }



    CreateDayCell()
    {
        let cell = new Element("div");
        cell.SetInnerText(`${this.daynum} ${this.day}`);
        this.SetContent(0, cell);
    }



    UpdateCell(column, entry)
    {
        let cell = new CalendarCellEntry(entry);
        //cell.SetInnerText(`${entry.name}`);
        this.AddContent(column, cell);
    }
}



class MonthCalendar extends Table
{
    // Calendars: CalendarData objects array
    constructor(users, holidaycalendars)
    {
        super();
        this.users = users;
        this.holidaycalendars = holidaycalendars;
        this.element.classList.add("Calendar");

        this.now      = null;
        this.firstDay = null;
        this.lastDay  = null;
        this.dayrow   = new Object();
        this.CreateCalendar();
    }



    CreateHeadline()
    {
    }



    CreateCalendar()
    {
        this.now      = new Date();
        this.firstDay = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
        this.lastDay  = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0);
        window.console && console.log(`now: ${this.now}`);
        window.console && console.log(`first: ${this.firstDay}`);
        window.console && console.log(`last:  ${this.lastDay}`);

        let headline = new CalendarHeadline(this.users);
        this.AddRow(headline);

        let date    = new Date(this.firstDay);
        this.dayrow = new Object();
        for(let daynum = 1; daynum <= this.lastDay.getDate(); daynum++)
        {
            let row = new CalendarRow(date, this.users.length + 1);
            //window.console && console.log(row);
            this.AddRow(row);

            this.dayrow[daynum] = row;
            date.setDate(date.getDate() + 1);
        }
    }



    Update(usersdata)
    {
        this.ClearCalendar();

        for(let user of this.users)
        {
            // Check if this users calendar shall be displayed
            let username  = user;
            if(!usersdata.hasOwnProperty(user))
                continue;

            let calendars = usersdata[user].calendars;
            window.console && console.log(username);
            for(let calendar of calendars)
            {
                // Data not yet ready? Skip this calendar for now.
                if(calendar.valid !== true)
                    continue;

                window.console && console.log(calendar);

                // Check if this is a holiday entry
                let isholiday = false;
                window.console && console.log(this.holidaycalendars.indexOf(calendar.name));
                if(this.holidaycalendars.indexOf(calendar.name) >= 0)
                    isholiday = true;
                window.console && console.log(`Is Holiday: ${isholiday}`);

                //window.console && console.log(calendar.events);
                for(let calevent of calendar.events) // keep in mind that an event can be repetitive
                {
                    for(let calentry of calevent.entries)
                    {
                        //window.console && console.log(calentry);
                        let date = calentry.date;
                        this.UpdateCell(user, date, calentry, isholiday);
                    }
                }
            }
        }
    }



    ClearCalendar()
    {
    }



    UpdateCell(user, date, entry, isholiday)
    {
        if(date.getMonth() != this.now.getMonth())
            return;
        let daynum = date.getDate();
        let column;
        if(isholiday == true)
        {
            this.dayrow[daynum].SetHoliday();
            column = 0;
        }
        else 
        {
            column = this.users.indexOf(user) + 1;
        }
        this.dayrow[daynum].UpdateCell(column, entry);
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

