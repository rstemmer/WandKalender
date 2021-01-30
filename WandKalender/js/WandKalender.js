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



window.onload = function ()
{
    window.console && console.log("Hello World");

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
    let login  = new Login((servername, webdavinterface, username, password)=>
        {
            onLogin(servername, webdavinterface, username, password);
        });

    let screen = document.getElementById("Screen");
    screen.appendChild(login.GetHTMLElement());
}



function onLogin(servername, webdavinterface, username, password)
{
    window.WandKalender.manager = new CalendarManager(servername, webdavinterface, username, password);
}


// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

