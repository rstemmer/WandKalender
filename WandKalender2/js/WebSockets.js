// MusicDB,  a music manager with web-bases UI that focus on music.
// Copyright (C) 2017-2021  Ralf Stemmer <ralf.stemmer@gmx.net>
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

var socket              = null;


///////////////////////////////////////////////////////////////////////////////
// Connect to the MDB Websochet server ////////////////////////////////////////

/**
 * This function established a connection to the server.
 * If there is already a connection, it will be closed first.
 *
 * This function also implements the following methods of the WebSocket class as also shown in the picture above:
 *  
 *  * onopen
 *  * onclose
 *  * onerror
 *  * onmessage
 *
 * @returns *nothing*
 */
function ConnectToWKServer()
{
    window.console?.log("[WKS] Connecting …");
    // ! socket is global !
    // if there is an open connecten, close it first
    if(socket !== null)
        socket.close();

    // Create websocket interface
    socket = new WebSocket(WEBSOCKET_URL);
    socket.onopen = function()
    {
        if(typeof onWKServerConnectionOpen === "function")
            onWKServerConnectionOpen();
    };
    socket.onclose = function(e)
    {
        MDB_StopWebsocketWatchdog();
        if(this.readyState != this.CLOSING && this.readyState != this.CLOSED)
        {
            // some shit happend… Lets clean it up 
            // ( http://www.w3.org/TR/2011/WD-websockets-20110419/ )
            this.readyState = this.CLOSING;
            if(typeof onWKServerConnectionError === "function")
                onWKServerConnectionError();
        }
        else
        {
            if(typeof onWKServerConnectionClosed === "function")
                onWKServerConnectionClosed();
        }
    };
    socket.onerror = function(e)
    {
        MDB_StopWebsocketWatchdog();
        if(typeof onWKServerConnectionError === "function")
            onWKServerConnectionError();
    };
    socket.onmessage = function(e)
    {
        // reset WD every time a packet comes
        MDB_ResetWebsocketWatchdog();

        var packet = JSON.parse(e.data);

        var fnc  = packet.fncname;
        var sig  = packet.fncsig;
        var args = packet.arguments;
        var pass = packet.pass;

        if(packet.method === "notification")
        {
            if(typeof onWKServerNotification === "function")
                onWKServerNotification(fnc, sig, args);
        }
        else
        {
            onWKServerMessage(fnc, sig, args, pass);
        }
    };
}



function DisconnectFromWKServer()
{
    MDB_StopWebsocketWatchdog();
    socket.close();
}


///////////////////////////////////////////////////////////////////////////////
// Websocket Watchdog /////////////////////////////////////////////////////////

let timeouthandler = null;
let disablewd      = false; // To temporary disable the watchdog (for example when MPD is not running)

/**
 * This function can be used to temporary disable the watchdog.
 * For example when MPD is disconnected and cannot provide the clients with the current state every second.
 */
function MDB_DisableWatchdog()
{
    disablewd = true;
    MDB_ResetWebsocketWatchdog();
}


/**
 * This function can be used to enable the watchdog after it was disabled.
 */
function MDB_EnableWatchdog()
{
    disablewd = true;
    MDB_StopWebsocketWatchdog();
}

/**
 * This is the callback funtion of the timer.
 * On timeout, this function gets called.
 * It first calles the ``onMusicDBWatchdogBarks`` function that must be implemented by the user.
 * Next a reconnection gets triggerd calling :js:func:`ConnectToMusicDB`.
 *
 * @returns *nothing*
 */
function MDB_WebsocketWatchdog()
{
    // call an optional callback
    if(typeof onWKServerWatchdogBarks === "function")
        onWKServerWatchdogBarks();

    // reconnect
    ConnectToWKServer();

    // no restart of the timer necessary 
    // it will be done by the server with each event including a heatbeat
}

/**
 * This method stops the watchdog timer.
 *
 * @returns *nothing*
 */
function MDB_StopWebsocketWatchdog()
{
    if(timeouthandler !== null)
        clearTimeout(timeouthandler);
}

/**
 * This method starts and resets the watchdog timer if ``WATCHDOG_RUN`` is ``true``.
 * The interval is determined by ``WATCHDOG_INTERVAL``.
 * When the timer gets not reset until the interval is over, the :js:func:`MDB_WebsocketWatchdog` function gets called.
 *
 * @returns *nothing*
 */
function MDB_ResetWebsocketWatchdog()
{
    if(WATCHDOG_RUN === true && disablewd === false)
    {
        MDB_StopWebsocketWatchdog();
        timeouthandler = setTimeout("MDB_WebsocketWatchdog()", WATCHDOG_INTERVAL);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Protocol ///////////////////////////////////////////////////////////////////

/**
 * This function calls a function on the MusicDB server using the MusicDB WebSocket API.
 * It uses the method *call*, so *fncsig* and *pass* are ``null`` by default.
 *
 * @param {string} fncname - Name of the function that shall be called
 * @param {object} args - optional object with all argumens for the called function
 * @returns *nothing*
 */
function WKServer_Call(fncname, args)
{
    args = args || null;
    var packet = {
        method:     "call",
        fncname:    fncname,
        fncsig:     null,
        arguments:  args,
        pass:       null
    }
    MDB_SendPacket(packet);
}

/**
 * This function calls a function on the MusicDB server using the MusicDB WebSocket API.
 * It uses the *request* method so that the server responses to this call.
 *
 * The *fncsig* helps to associate the response with the call.
 * It furthermore can be used to define how the response shall be processed.
 *
 * The *pass* argument can be used to pass data through the server back to the response handler.
 * For example an element ID of the DOM, in that a result shall be printed.
 *
 * If *fncsig* or *pass* are not set (undefined) they will be set to the valid value ``null``.
 *
 * @param {string} fncname - Name of the function that shall be called
 * @param {string} fncsig - signature string of the function that made the request
 * @param {object} args - optional object with all argumens for the called function
 * @param {object} pass - optional object with data hat will be passed throug the server and will be part of the response.
 * @returns *nothing*
 */
function WKServer_Request(fncname, fncsig, args, pass)
{
    pass = pass || null;
    args = args || null;
    var packet = {
        method:     "request",
        fncname:    fncname,
        fncsig:     fncsig,
        arguments:  args,
        pass:       pass
    }
    MDB_SendPacket(packet);
}

/**
 * Similar to :js:func:`MusicDB_Request`.
 * The response will be send to all connected clients, not just to the caller.
 */
function WKServer_Broadcast(fncname, fncsig, args, pass)
{
    pass = pass || null;
    args = args || null;
    var packet = {
        method:     "broadcast",
        fncname:    fncname,
        fncsig:     fncsig,
        arguments:  args,
        pass:       pass
    }
    MDB_SendPacket(packet);
}

///////////////////////////////////////////////////////////////////////////////
// Send Packets via Websockets ////////////////////////////////////////////////

/**
 * This is an internal function used by :js:func:`MusicDB_Call`, :js:func:`MusicDB_Request` and :js:func:`MusicDB_Broadcast`.
 * It implements the low level send function that creates a JSON string which will be send to the MusicDB server using WebSockets.
 *
 * @returns {boolean} ``true`` on success, otherwise ``false``
 */
function MDB_SendPacket(packet)
{
    let buffer;
    window.console && console.log("%c << fnc:"+packet.fncname+"; sig: "+packet.fncsig, "color:#9cc87a");

    packet.key = WEBSOCKET_APIKEY;
    buffer     = JSON.stringify(packet);

    try
    {
        socket.send(buffer);
    }
    catch(error)
    {
        return false;
    }
    return true;
}



// vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

