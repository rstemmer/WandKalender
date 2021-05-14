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
    constructor(calendarentry, isholiday)
    {
        super("div");

        let allday = calendarentry.allday;
        if(allday === false)
        {
            let begin = this.DateToTime(new Date(calendarentry.start));
            let end   = this.DateToTime(new Date(calendarentry.end));
            let prefix = new Element("span", ["timespan"]);
            prefix.SetInnerText(`${begin} - ${end}`);
            this.AppendChild(prefix);
        }

        if(isholiday === true)
        {
            this.element.classList.add("holiday");
        }

        let name        = calendarentry.summary;
        let nameelement = new Element("span", ["eventname"]);
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
        this.ClearTable();
    }



    ClearTable()
    {
        this.RemoveChilds();
        this.rows = new Object();
    }



    AddRow(rowid, tablerow)
    {
        this.rows[rowid] = tablerow;
        this.AppendChild(tablerow);
    }



    GetRowById(rowid)
    {
        return this.rows[rowid];
    }
}



class Row extends Element
{
    constructor(columns, classes=[])
    {
        super("tr", ["Row", ...classes]);
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

    AddContentOnTop(cellnum, cellcontent)
    {
        let cell = this.cells[cellnum];
        let element = cell.GetHTMLElement();
        element.insertBefore(cellcontent.GetHTMLElement(), element.firstChild);
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
        //let users = window.WandKalender.config.users;
        super(Object.keys(users).length + 1, ["headline"]);

        // Add Month Name
        let monthcell = new Element("div", ["monthname"]);
        let date      = new Date();
        let month     = date.toLocaleString("default", { month: "long" });
        monthcell.SetInnerText(month);
        this.SetContent(0, monthcell);

        // Add User names
        let index = 1;
        for(let [user, username] of Object.entries(users))
        {
            let cell = new Element("div");
            cell.SetInnerText(username);
            this.SetContent(index, cell);

            index += 1;
        }
    }
}




function CalcCalendarRowId(date)
{
    return date.getMonth() * 100 + date.getDate()
}



class CalendarRow extends Row
{
    // date will not be changed. It is safe to pass a reference
    constructor(date, numcalendars, istoday=false)
    {
        super(numcalendars + 1);
        this.daynum  = date.getDate();
        this.dayid   = date.getDay();
        this.day     = DAYS[this.dayid];

        if(this.dayid === 0 || this.dayid === 6)
            this.element.classList.add("weekend");
        if(istoday === true)
            this.element.classList.add("today");

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



    UpdateCell(column, entry, isholiday)
    {
        let cell = new CalendarCellEntry(entry, isholiday);
        let allday = entry.allday;
        if(allday && column != 0)   // Column 0 is the day. So entry is a holiday and shall be placed below the day-info
            this.AddContentOnTop(column, cell, isholiday);
        else
            this.AddContent(column, cell);

        // Mark this row as holiday row if a holiday was added
        if(isholiday === true)
            this.element.classList.add("holiday");
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
        this.cache    = new Object();
    }



    CreateHeadline()
    {
    }



    CreateCalendar(firstDay, lastDay)
    {
        this.now      = new Date();
        this.firstDay = firstDay;
        this.lastDay  = lastDay;

        this.ClearTable();

        // Add Headline
        let headline = new CalendarHeadline(this.users);
        this.AddRow(0, headline);

        // Create Rows
        let date      = new Date(this.firstDay);

        let endtimestamp  = this.lastDay.valueOf();
        let datetimestamp = date.valueOf();
        while(datetimestamp < endtimestamp)
        {
            let istoday = false;
            if(date.getDate() == this.now.getDate() && date.getMonth() == this.now.getMonth())
                istoday = true;

            let row   = new CalendarRow(date, this.users.length, istoday);
            let rowid = CalcCalendarRowId(date);
            this.AddRow(rowid, row);

            date.setDate(date.getDate() + 1);
            datetimestamp = date.valueOf();
        }

        return;
    }



    UpdateCell(username, isholiday, entry)
    {
        let start   = new Date(entry.start);
        // HACK: Holiday calendars are no users.
        // So indexOf returns -1.
        // -1 + 1 = 0 | +1 because column 0 is for day and holidays.
        // So Holiday calendar entries get an index of 0
        // because they are not in users. This is just accidentally the right column number.
        let column  = this.users.indexOf(username) + 1;
        let rowid   = CalcCalendarRowId(start);
        let row     = this.GetRowById(rowid);

        row?.UpdateCell(column, entry, isholiday);  // Row may be not available if date is not in range
    }



    Update(calendardata)
    {
        // Update cache
        this.cache[calendardata.name] = calendardata;

        // Update table
        let start = new Date(calendardata.range.start);
        let end   = new Date(calendardata.range.end);
        this.CreateCalendar(start, end);

        // Update cells
        // For each user …
        for(let name in this.cache)
        {
            let data      = this.cache[name];
            let isholiday = data.isholiday;
            let events    = data.events;
            // … and each event
            for(let entry of events)
            {
                this.UpdateCell(name, isholiday, entry);
            }
        }
        return;
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

