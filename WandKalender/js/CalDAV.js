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
    constructor(servername, webdavinterface, username, password)
    {
        this.username        = username;
        this.password        = password;
        this.servername      = servername;
        this.webdavinterface = webdavinterface;
        this.namespaces      = `xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns" xmlns:c="urn:ietf:params:xml:ns:caldav"`; // TODO: build interface for namespaces
        this.xmlparser       = new DOMParser();
    }



    // Get all properties (Array of strings): new Array("d:displayname"); for <d:displayname/>
    PropFind(properties)
    {
        let header = new Object();
        header["Content-Type"] = "application/xml; charset=utf-8";

        let body = "";
        body += `<?xml version="1.0"?>\n`;
        body += `<d:propfind ${this.namespaces}>\n`;
        body += `<d:prop>\n`;
        for(let property of properties)
        {
            body += `<${property} />\n`;
        }
        body += `<d:getetag />\n`; // not working
        //body += `<d:acl />\n`;
        //body += `<cs:getctag />\n`;
        body += `</d:prop>\n`;
        body += `</d:propfind>\n`;
        window.console && console.log(body);

        this.Request("PROPFIND", header, body, (responsetext)=>{this.onPropFindResponse(responsetext);});
    }



    onPropFindResponse(responsetext)
    {
        let xml = this.xmlparser.parseFromString(responsetext, "application/xml");
        //window.console && console.log(xml);

        let responses = xml.getElementsByTagName("d:response");
        for(let response of responses)
        {
            //window.console && console.log(response);
            let calendar  = response.getElementsByTagName("d:href")[0];
            let propstats = response.getElementsByTagName("d:propstat");
            for(let propstat of propstats)
            {
                let pstatus = propstat.getElementsByTagName("d:status")[0];
                if(pstatus.textContent !== "HTTP/1.1 200 OK")
                    continue;

                let props = propstat.getElementsByTagName("d:prop")[0].childNodes;
                window.console && console.log(`Props for: ${calendar.textContent}`);
                window.console && console.log(props);
                for(let prop of props)
                {
                    if(prop.nodeName === "d:displayname")
                        window.console && console.log(prop.textContent);
                    /*
                    if(prop.nodeName === "cs:getctag")
                        window.console && console.log(prop.textContent);
                    */
                }
            }
        }
    }



    Report(properties)   // TODO: in progress
    {
        let header = new Object();
        header["Content-Type"] = "application/xml; charset=utf-8";
        header["Depth"]        = "1";
        header["Prefer"]       = "return-minimal";

        let body = "";
        body += `<?xml version="1.0"?>\n`;
        body += `<c:calendar-query ${this.namespaces}>\n`;
        body += `<d:prop>\n`;
        body +=     `<d:getetag />\n`;
        body +=     `<d:displayname />\n`;
        body +=     `<c:calendar-data />\n`;
        //for(let property of properties)
        //{
        //    body += `<${property} />\n`;
        //}
        body += `</d:prop>\n`;
        body += `<c:filter>\n`;
        body +=     `<c:comp-filter name="VCALENDAR" />\n`;
        body += `</c:filter>\n`;
        body += `</c:calendar-query>\n`;

        this.Request("REPORT", header, body, (responsetext)=>{this.onReportResponse(responsetext);});
    }



    onReportResponse(responsetext)   // TODO: in progress
    {
        let xml = this.xmlparser.parseFromString(responsetext, "application/xml");
        window.console && console.log(xml);
        window.console && console.log(xml.childNodes[0]);
        window.console && console.log(xml.childNodes[0].childNodes);
    }



    Request(method, header, body, onresponse)
    {
        let auth = btoa(`${this.username}:${this.password}`);

        header["Authorization"] = `Basic ${auth}`;
        //header["OCS-APIRequest"] = "true";

        let xmlrequest = new XMLHttpRequest();
        // TODO: Check if the / characters are set correct
        xmlrequest.open(method, `${this.servername}${this.webdavinterface}`, true /*Async*/);
        //xmlrequest.open(method, `${this.servername}${this.webdavinterface}/personal`, true /*Async*/);

        for(let entry in header)
        {
            xmlrequest.setRequestHeader(entry, header[entry]);
        }
        //xmlrequest.withCredentials=true;

        xmlrequest.send(body);
        xmlrequest.onload    = ()=>{onresponse(xmlrequest.responseText);};
        xmlrequest.onerror   = ()=>{window.console && console.log(xmlrequest);};
        xmlrequest.ontimeout = ()=>{window.console && console.log(xmlrequest);};
        xmlrequest.onabort   = ()=>{window.console && console.log(xmlrequest);};
        return;
    }
}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

