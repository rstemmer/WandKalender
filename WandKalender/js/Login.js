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



class Login extends Element
{
    constructor(onlogin)
    {
        super("div", ["Login"]);
        this.onlogin   = onlogin;
        this.servername      = window.localStorage.getItem("servername"     ) || "";
        this.webdavinterface = window.localStorage.getItem("webdavinterface") || "";
        this.username        = window.localStorage.getItem("username"       ) || "";
        this.password        = window.localStorage.getItem("password"       ) || "";
        this.servernameinput      = new Input("text", null, this.servername);
        this.webdavinterfaceinput = new Input("text", null, this.webdavinterface);
        this.usernameinput        = new Input("text", null, this.username);
        this.passwordinput        = new Input("text", null, this.password);
        this.loginbutton          = new Element("button");
        this.loginbutton.GetHTMLElement().onclick   = ()=>{this.onLogin();};
        this.loginbutton.GetHTMLElement().type      = "button";
        this.loginbutton.GetHTMLElement().innerText = "login";

        this.AppendChild(this.servernameinput     );
        this.AppendChild(this.webdavinterfaceinput);
        this.AppendChild(this.usernameinput       );
        this.AppendChild(this.passwordinput       );
        this.AppendChild(this.loginbutton         );
    }



    onLogin()
    {
        this.servername      = this.servernameinput.GetValue();
        this.webdavinterface = this.webdavinterfaceinput.GetValue();
        this.username        = this.usernameinput.GetValue();
        this.password        = this.passwordinput.GetValue();

        window.localStorage.setItem("servername",      this.servername     );
        window.localStorage.setItem("webdavinterface", this.webdavinterface);
        window.localStorage.setItem("username" ,       this.username       );
        window.localStorage.setItem("password" ,       this.password       );

        if(typeof this.onlogin === "function")
        {
            this.onlogin(this.servername, this.webdavinterface, this.username, this.password);
        }
        return;
    }
}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

