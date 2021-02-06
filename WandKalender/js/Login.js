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
        this.username        = window.localStorage.getItem("username") || "";
        this.password        = window.localStorage.getItem("password") || "";
        // If there is a password and user name, directly log in and do not ask for.
        if(this.username.length != 0 && this.password.length != 0)
        {
            if(typeof this.onlogin === "function")
            {
                this.onlogin(this.username, this.password);
                return;
            }
        }
        this.usernameinput   = new Input("text", null, this.username);
        this.passwordinput   = new Input("text", null, this.password);
        this.loginbutton     = new Element("button");
        this.loginbutton.GetHTMLElement().onclick   = ()=>{this.onLogin();};
        this.loginbutton.GetHTMLElement().type      = "button";
        this.loginbutton.GetHTMLElement().innerText = "login";

        this.AppendChild(this.usernameinput);
        this.AppendChild(this.passwordinput);
        this.AppendChild(this.loginbutton  );
    }



    onLogin()
    {
        this.username = this.usernameinput.GetValue();
        this.password = this.passwordinput.GetValue();

        window.localStorage.setItem("username", this.username);
        window.localStorage.setItem("password", this.password);

        if(typeof this.onlogin === "function")
        {
            this.onlogin(this.username, this.password);
        }
        return;
    }
}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

