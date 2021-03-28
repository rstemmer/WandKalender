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
    constructor(caldavurl, username, password)
    {
        this.username        = username;
        this.password        = password;
        this.caldavurl       = caldavurl;
        if(this.caldavurl.slice(-1) !== "/")
            this.caldavurl  += "/"
        this.caldavurl      += username;
        this.namespaces      = `xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns" xmlns:c="urn:ietf:params:xml:ns:caldav"`; // TODO: build interface for namespaces
        this.xmlparser       = new DOMParser();
    }



    // Get all properties (Array of strings): new Array("d:displayname"); for <d:displayname/>
    PropFind(properties, onresponse, oncomplete)
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
        //body += `<d:allprop />\n`; // not working
        body += `<d:owner-displayname />\n`;
        //body += `<d:getetag />\n`; // not working
        //body += `<d:acl />\n`;
        //body += `<cs:getctag />\n`;
        body += `</d:prop>\n`;
        body += `</d:propfind>\n`;

        let url = `${this.caldavurl}`;
        this.Request(url, "PROPFIND", header, body, (responsetext)=>{this.onPropFindResponse(responsetext, onresponse, oncomplete);});
    }



    onPropFindResponse(responsetext, onresponse, oncomplete)
    {
        let xml = this.xmlparser.parseFromString(responsetext, "application/xml");

        let responses = xml.getElementsByTagName("d:response");
        for(let response of responses)
        {
            let href      = response.getElementsByTagName("d:href")[0];
            let propstats = response.getElementsByTagName("d:propstat");
            let calendar  = new Object();
            calendar["d:href"] = href.textContent;

            for(let propstat of propstats)
            {
                let pstatus = propstat.getElementsByTagName("d:status")[0];
                if(pstatus.textContent !== "HTTP/1.1 200 OK")
                    continue;

                let props = propstat.getElementsByTagName("d:prop")[0].childNodes;
                for(let prop of props)
                    calendar[prop.nodeName] = prop.textContent;
            }

            onresponse(calendar);
        }

        oncomplete();
        return;
    }



    ToCalDAVDate(jsdate)
    {
        let Y  = jsdate.getFullYear();
        let M  = jsdate.getMonth();
        let D  = jsdate.getDate();
        let YYYY = Y;
        let MM   = ("00" + (M+1)).substr(-2);
        let DD   = ("00" +  D   ).substr(-2);
        return YYYY+MM+DD+"T000000";
    }



    Report(calurl, from, to, properties, onresponse, oncomplete)
    {
        let header = new Object();
        header["Content-Type"] = "application/xml; charset=utf-8";
        header["Depth"]        = "1";
        header["Prefer"]       = "return-minimal";

        from  = this.ToCalDAVDate(from);
        to    = this.ToCalDAVDate(to);

        let body = "";
        body += `<?xml version="1.0"?>\n`;
        body += `<c:calendar-query ${this.namespaces}>\n`;
        body += `<d:prop>\n`;
        for(let property of properties)
        {
            body += `<${property} />\n`;
        }
        body += `</d:prop>\n`;
        body += `<c:filter>\n`;
        body +=     `<c:comp-filter name="VCALENDAR">\n`;
        body +=         `<c:comp-filter name="VEVENT">\n`;
        body +=             `<c:time-range  start="${from}" end="${to}"/>\n`;
        body +=         `</c:comp-filter>\n`;
        body +=     `</c:comp-filter>\n`;
        body += `</c:filter>\n`;
        body += `</c:calendar-query>\n`;

        let url = location.origin + calurl;
        this.Request(url, "REPORT", header, body, (responsetext)=>{this.onReportResponse(responsetext, onresponse, oncomplete);});
    }



    onReportResponse(responsetext, onresponse, oncomplete)
    {
        let xml = this.xmlparser.parseFromString(responsetext, "application/xml");
        let responses = xml.getElementsByTagName("d:response");
        for(let response of responses)
        {
            let href      = response.getElementsByTagName("d:href")[0];
            let propstats = response.getElementsByTagName("d:propstat");
            let calevent  = new Object();
            calevent["d:href"] = href.textContent;

            for(let propstat of propstats)
            {
                let pstatus = propstat.getElementsByTagName("d:status")[0];
                if(pstatus.textContent !== "HTTP/1.1 200 OK")
                    continue;

                let props = propstat.getElementsByTagName("d:prop")[0].childNodes;
                for(let prop of props)
                    calevent[prop.nodeName] = prop.textContent;
            }

            onresponse(calevent);
        }

        oncomplete();
    }



    Request(url, method, header, body, onresponse)
    {
        let auth = btoa(`${this.username}:${this.password}`);

        header["Authorization"] = `Basic ${auth}`;
        //header["OCS-APIRequest"] = "true";

        let xmlrequest = new XMLHttpRequest();
        xmlrequest.open(method, url, true /*Async*/);
        xmlrequest.timeout = 10000 /*ms*/;

        for(let entry in header)
        {
            xmlrequest.setRequestHeader(entry, header[entry]);
        }
        //xmlrequest.withCredentials=true;

        xmlrequest.send(body);
        xmlrequest.onload    = ()=>{onresponse(xmlrequest.responseText);};
        xmlrequest.onerror   = ()=>{window.console?.error("ERROR: onerror  ");};
        xmlrequest.ontimeout = ()=>{window.console?.error("ERROR: ontimeout");};
        xmlrequest.onabort   = ()=>{window.console?.error("ERROR: onabort  ");};
        //xmlrequest.onerror   = ()=>{window.console && console.log(xmlrequest);};
        //xmlrequest.ontimeout = ()=>{window.console && console.log(xmlrequest);};
        //xmlrequest.onabort   = ()=>{window.console && console.log(xmlrequest);};
        return;
    }
}

// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

