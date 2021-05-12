# MusicDB,  a music manager with web-bases UI that focus on music.
# Copyright (C) 2017-2021  Ralf Stemmer <ralf.stemmer@gmx.net>
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
All sections and options can be accessed by their names: ``MusicDBConfig(...).section.option``.

To create a new entry for the MusicDB Configuration the following steps must be done:

    #. Set the section and option in the configuration file as well as in the template in the share directory
    #. In case a new section shall be created, create an empty class for this section inside this module
    #. Read the option in the constructor of the :class:`~lib.cfg.musicdb.MusicDBConfig` class

For example, the following option shall be added:

    .. code-block:: ini

        [newmod]
        enable = True

Then, first a new dummy class named ``NEWMOD`` must be added:

    .. code-block:: python

        class NEWMOD:
            pass

Finaly, the option must be read inside the :class:`~lib.cfg.musicdb.MusicDBConfig` ``__init__`` method.
The read value must be writen into an attribute named as the option, inside an instance of the dummy class named liked the section:

    .. code-block:: python

        self.newmod = NEWMOD()
        self.newmod.enable = self.Get(bool, "newmod", "enable", False)

Now, the new option is availabe in the configuration object created using this class:

    .. code-block:: python

        cfg = MusicDBConfig("musicdb.ini")
        if cfg.newmod.enable:
            print("newmod enabled!")

"""

import logging
import grp
import pwd
import stat
from lib.cfg.config import Config
from lib.filesystem import Filesystem

class META:
    pass
class WEBSOCKET:
    pass
class CALDAV:
    pass
class TLS:
    pass
class LOG:
    pass
class DEBUG:
    pass

class WKServerConfig(Config):
    """
    This class provides the access to the MusicDB configuration file.
    """
    def __init__(self, filename):
        Config.__init__(self, filename)
        self.fs = Filesystem("/")

        logging.info("Reading and checking WKServer Configuration")

        # [meta]
        self.meta = META()
        self.meta.version           = self.Get(int, "meta",     "version",      1)


        # [websocket]
        self.websocket = WEBSOCKET()
        self.websocket.address      = self.Get(str, "websocket","address",      "127.0.0.1")
        self.websocket.port         = self.Get(int, "websocket","port",         9000)
        self.websocket.url          = self.Get(str, "websocket","url",          "wss://localhost:9000")
        self.websocket.apikey       = self.Get(str, "websocket","apikey",       None)
        if not self.websocket.apikey:
            logging.warning("Value of [websocket]->apikey is not set!")

        self.caldav = CALDAV()
        self.caldav.username     = self.Get(str, "caldav","username",          "user")
        self.caldav.password     = self.Get(str, "caldav","password",          "password")
        self.caldav.url          = self.Get(str, "caldav","url",               "https://localhost:443")

        # [TLS]
        self.tls = TLS()
        self.tls.cert               = self.GetFile( "tls",      "cert",         "/dev/null")
        self.tls.key                = self.GetFile( "tls",      "key",          "/dev/null")
        if self.tls.cert == "/dev/null" or self.tls.key == "/dev/null":
            logging.warning("You have to set a valid TLS certificate and key!")


        # [log]
        self.log        = LOG()
        self.log.logfile            = self.Get(str, "log",      "logfile",      "stderr")
        self.log.loglevel           = self.Get(str, "log",      "loglevel",     "WARNING")
        if not self.log.loglevel in ["DEBUG", "INFO", "WARNING", "ERROR"]:
            logging.error("Invalid loglevel for [log]->loglevel. Loglevel must be one of the following: DEBUG, INFO, WARNING, ERROR")
        self.log.debugfile          = self.Get(str, "log",      "debugfile",    None)
        if self.log.debugfile == "/dev/null":
            self.log.debugfile = None
        self.log.ignore             = self.Get(str, "log",      "ignore",       None, islist=True)


        # [debug]
        self.debug      = DEBUG()     


        logging.info("\033[1;32mdone")



    def GetDirectory(self, section, option, default):
        """
        This method gets a string from the config file and checks if it is an existing directory.
        If not it prints a warning and creates the directory if possible.
        If it fails with an permission-error an additional error gets printed.
        Except printing the error nothing is done.
        The \"invalid\" path will be returned anyway, because it may be OK that the directory does not exist yet.

        The permissions of the new created directory will be ``rwxrwxr-x``
        
        Args:
            section (str): Section of an ini-file
            option (str): Option inside the section of an ini-file
            default (str): Default directory path if option is not set in the file

        Returns:
            The value of the option set in the config-file or the default value.
        """
        path = self.Get(str, section, option, default)
        if self.fs.IsDirectory(path):
            return path

        # Create Directory
        logging.warning("Value of [%s]->%s does not address an existing directory. \033[1;30m(Directory \"%s\" will be created)", section, option, path)
        try:
            self.fs.CreateSubdirectory(path)
        except Exception as e:
            logging.error("Creating directory %s failed with error: %s.", path, str(e))

        # Set mode
        mode = stat.S_IRWXU | stat.S_IRWXG | stat.S_IROTH | stat.S_IXOTH
        try:
            self.fs.SetAttributes(path, None, None, mode);
        except Exception as e:
            logging.error("Creating directory %s failed with error: %s.", path, str(e))

        return path # return path anyway, it does not matter if correct or not. Maybe it will be created later on.


    def GetFile(self, section, option, default, logger=logging.error):
        """
        This method gets a string from the config file and checks if it is an existing file.
        If not it prints an error.
        Except printing the error nothing is done.
        The \"invalid\" will be returned anyway, because it may be OK that the file does not exist yet.
        
        Args:
            section (str): Section of an ini-file
            option (str): Option inside the section of an ini-file
            default (str): Default file path if option is not set in the file
            logger: Logging-handler. Default is logging.error. logging.warning can be more appropriate in some situations.

        Returns:
            The value of the option set in the config-file or the default value.
        """
        path = self.Get(str, section, option, default)
        if not self.fs.IsFile(path):
            logger("Value of [%s]->%s does not address an existing file.", section, option)
        return path # return path anyway, it does not matter if correct or not. Maybe it will be created later on.


# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

