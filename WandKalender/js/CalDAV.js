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

/*
 * Notes:
 * https://sabre.io/dav/building-a-caldav-client/
 * https://github.com/owncloud/davclient.js/blob/master/lib/client.js
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
 */


class CalDAV
{
    constructor(serverurl, webdavinterface, username, password)
    {
        this.username        = username;
        this.password        = password;
        this.serverurl       = serverurl;
        this.webdavinterface = webdavinterface;
    }



    // Get all properties (Array of strings): new Array("d:displayname"); for <d:displayname/>
    PropFind(properties)
    {
        let header = new Object();
        header["Content-Type"] = "application/xml; charset=utf-8";

        let body = "";
        body += `<?xml version="1.0"?>\n`;
        body += `<d:propfind xmlns:d="DAV:" xmlns:cs="${this.servername}">\n`;
        body += `<d:prop>\n`;
        for(let property of properties)
        {
            body += `<${property} />\n`;
        }
        body += `<cs:getctag />\n`;
        body += `</d:prop>\n`;
        body += `</d:propfind>\n`;

        this.Request("PROPFIND", header, body);
    }



    Report()
    {
    }



    Request(method, header, body)
    {
        let auth = btoa(`${this.username}:${this.password}`);

        header["Authorization"] = `Basic ${auth}`;
        //header["OCS-APIRequest"] = "true";

        let xmlrequest = new XMLHttpRequest();
        // TODO: Check if the / characters are set correct
        xmlrequest.open(method, `${this.serverurl}${this.webdavinterface}`, true /*Async*/);

        for(let entry in header)
        {
            xmlrequest.setRequestHeader(entry, header[entry]);
        }
        //xmlrequest.withCredentials=true;

        xmlrequest.send(body);
        xmlrequest.onreadystatechange = ()=>
            {
                window.console && console.log(xmlrequest.responseText);
                if(xmlrequest.readyState !== 4 || xmlrequest.status !== 200)
                    return;
            }
        return;
    }
}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

