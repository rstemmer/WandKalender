# MusicDB,  a music manager with web-bases UI that focus on music.
# Copyright (C) 2017-2020  Ralf Stemmer <ralf.stemmer@gmx.net>
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""
This is the main module to run the MusicDB Server.

To start and run the server, the following sequence of function calls is necessary:

    .. code-block:: python

        Initialize(mdbconfig, musicdatabase)
        StartWebSocketServer()
        Run()

When starting the server, a named pipe gets created at the path set in the configuration file.
MusicDB Server handles the following commands when written into its named pipe:

    * refresh:  :meth:`~mdbapi.server.UpdateCaches` - Update server caches and inform clients to update their caches
    * shutdown: :meth:`~mdbapi.server.Shutdown` - Shut down the server

Further more does this module maintain global instances of the following classes.
Those objects can be used inside the thread the server runs. 
Usually the main thread.
Using these objects saves a lot of memory.
If the server is not started, the objects are all ``None``.

    * :class:`lib.db.musicdb.MusicDatabase` as ``database``
    * :class:`mdbapi.mise.MusicDBMicroSearchEngine` as ``mise``
    * :class:`lib.cfg.musicdb.MusicDBConfig` as ``cfg``

The following example shows how to use the pipe interface:

    .. code-block:: bash

        # Update caches
        echo "refresh" > /data/musicdb/musicdb.fifo

        # Terminate server
        echo "shutdown" > /data/musicdb/musicdb.fifo

"""

import traceback
import random
import time
import signal
import logging
from lib.ws.server      import WKServerWebSocketServer


class WKServer(object):
    def __init__(self, config):
        self.tlswsserver = None
        self.shutdown    = False
        self.config      = config



    def SignalHandler(self, signum, stack):
        """
        This is the general signal handle for the MusicDB Server.
        This function reacts on system signals and calls the handler of a specific signal.

        Args:
            signum: signal number
            stack: current stack frame
        
        Returns: Nothing
        """
        if signum == signal.SIGTERM:
            logging.debug("Got signal TERM")
            self.SIGTERM_Handler()
        else:
            logging.warning("Got unexpected signal %s"%str(signum))


    # Initiate Shutdown
    def SIGTERM_Handler(self):
        """
        This function is the handler for the system signal TERM.
        It signals the server to shut down.
        """
        logging.info("\033[1;36mSIGTERM:\033[1;34m Initiate Shutdown …\033[0m")
        self.shutdown = True



    def Initialize(self):
        """
        This function initializes the whole server.
        It initializes lots of global objects that get shared between multiple connections.
        """

        random.seed()
        
        # Signal Handler
        # The user shall use the FIFO
        signal.signal(signal.SIGTERM, self.SignalHandler)
        return None



    def StartWebSocketServer(self):
        """
        This function creates and starts the actual MusicDB Websocket Server.

        Returns:
            ``True`` on success, otherwise ``False``
        """
        self.tlswsserver = WKServerWebSocketServer()
        
        retval = self.tlswsserver.Setup(
                self.config.websocket.address,
                self.config.websocket.port,
                self.config.tls.cert,
                self.config.tls.key)
        if retval == False:
            logging.critical("Setup for websocket server failed!")
            return False

        retval = self.tlswsserver.Start()
        if retval == False:
            logging.critical("Starting websocket server failed!")
            return False

        return True



    def Shutdown(self):
        """
        This function stops the server and all its dependent threads.
        """
        logging.info("Shutting down MusicDB-Server")

        if self.tlswsserver:
            logging.debug("Disconnect from clients…")
            self.tlswsserver.factory.CloseConnections()
        
        if self.tlswsserver:
            logging.debug("Stopping TLS WS Server…")
            self.tlswsserver.Stop()

        # dead end
        if self.shutdown:
            exit(0)
        else:
            exit(1)



    def Run(self):
        """
        This is the servers main loop.
        """
        logging.info("Setup complete. \033[1;37mExecuting server.\033[1;34m")
        # enter event loop
        if not self.tlswsserver:
            logging.critical("TLS Websocket Server was not started!")
            return

        try:

            while True:
                self.tlswsserver.HandleEvents()
                
                if self.shutdown:
                    self.Shutdown()

                time.sleep(.1)  # Avoid high CPU load

        except KeyboardInterrupt:
            logging.warning("user initiated server shutdown");
            self.shutdown = True     # signal that this is a correct shutdown and no crash
            self.Shutdown()

        except Exception as e:
            logging.critical("FATAL ERROR (shutting down server!!):");
            logging.critical(e)
            traceback.print_exc()
            self.Shutdown()

# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

