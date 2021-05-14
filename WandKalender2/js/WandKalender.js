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


window.onload = function ()
{
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
    if(document.readyState === 'loading')
    {
        // Loading hasn't finished yet
        document.addEventListener('DOMContentLoaded', Initialize());
    }
    else
    {
        // `DOMContentLoaded` has already fired
        Initialize();
    }
}


function Initialize()
{
    ConnectToWKServer();
    let screen           = document.getElementById("Screen");
    let users            = window.WandKalender.config.users;
    let holidaycalendars = window.WandKalender.config.holidaycalendars;

    window.WandKalender.webui = new MonthCalendar(users, holidaycalendars);
    let webuielement     = window.WandKalender.webui.GetHTMLElement();

    screen.appendChild(webuielement);
}


function onWKServerConnectionOpen()
{
    window.console?.log("[WKS] Open");
    //WKServer_Request("GetAllEvents", "UpdateAllEvents");
}
function onWKServerConnectionError()
{
    window.console?.log("[WKS] Error");
}
function onWKServerWatchdogBarks()
{
    window.console?.log("[WKS] Watchdog");
}
function onWKServerConnectionClosed()
{
    window.console?.log("[WKS] Closed");
    let timeout = window.WandKalender.config.reconnectinterval * 1000;
    window.setTimeout(()=>{ConnectToWKServer();}, timeout);
}

function onWKServerNotification(fnc, sig, data)
{
    window.console?.log("[WKS] Notification");
    window.console?.log(" >> fnc: "+fnc+"; sig: "+sig);
    window.console?.log(data);
    window.WandKalender.webui.Update(data);
}

function onWKServerMessage(fnc, sig, args, pass)
{
    window.console?.log("%c >> fnc: "+fnc+"; sig: "+sig, "color:#7a90c8");
}


// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

