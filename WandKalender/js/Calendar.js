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
}



class CalendarHeadline extends Row
{
    constructor(calendars)
    {
        super(calendars.length + 1);

        let index = 1;
        for(let calendar of calendars)
        {
            let name = calendar.name;
            index += 1;

            let cell = new Element("div");
            cell.SetTextContent(name);
            this.SetContent(index, cell);
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

        this.CreateDayCell();
    }



    CreateDayCell()
    {
        let cell = new Element("div");
        cell.SetInnerText(`${this.daynum} ${this.day}`);
        this.SetContent(0, cell);
    }
}



class MonthCalendar extends Table
{
    // Calendars: CalendarData objects array
    constructor(calendars)
    {
        super();
        this.calendars = calendars;
        this.element.classList.add("Calendar");

        this.CreateCalendar();
    }



    CreateHeadline()
    {
    }



    CreateCalendar()
    {
        let now      = new Date();
        let firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        let lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        window.console && console.log(`now: ${now}`);
        window.console && console.log(`first: ${firstDay}`);
        window.console && console.log(`last:  ${lastDay}`);

        let date  = new Date(firstDay);
        for(let daynum = 1; daynum <= lastDay.getDate(); daynum++)
        {
            let row = new CalendarRow(date, this.calendars.length + 1);
            window.console && console.log(row);
            this.AddRow(row);
            date.setDate(date.getDate() + 1);
        }
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

