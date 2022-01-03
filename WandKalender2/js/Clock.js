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


class Clock extends Element
{
    constructor()
    {
        super("div", ["Clock"]);
        this.dateelement = new Element("div", ["date"]);
        this.timeelement = new Element("div", ["time"]);

        this.timeelement.SetInnerText("13:37");
        this.dateelement.SetInnerText("Freitag, 13. Februar");

        this.AppendChild(this.timeelement);
        this.AppendChild(this.dateelement);
    }



    Update()
    {
        let date  = new Date();
        let dateoptions = { weekday: "long", month: "long", day: "numeric" };
        let timeoptions = { hour: "2-digit", minute: "2-digit" };

        let today = date.toLocaleDateString("de-DE", dateoptions);
        let now   = date.toLocaleTimeString("de-DE", timeoptions);

        this.dateelement.SetInnerText(today);
        this.timeelement.SetInnerText(now);

        window.setTimeout(()=>{this.Update();}, 10 * 1000); // Update all 10 seconds
    }
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

