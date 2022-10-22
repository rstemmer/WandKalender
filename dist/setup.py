#!/usr/bin/env python3
# The line above is necessary so that debmake can identify setup.py packages python 3 software

import setuptools
import os
import sys

#SOURCEDIR=setuptools.convert_path(".")
SOURCEDIR=os.path.dirname(__file__)
if not SOURCEDIR:
    SOURCEDIR = "."

def ReadVersion():
    versionpath = SOURCEDIR + "/VERSION"
    with open(versionpath, "r") as versionfile:
        firstline = versionfile.readline()

    version = firstline.split(":")[1].strip()
    return version


def ReadReadme():
    path = os.path.join(SOURCEDIR, "README.md")
    with open(path, "r") as fh:
        readme = fh.read()

    return readme


setuptools.setup(
        name            = "musicdb",
        version         = ReadVersion(),
        author          = "Ralf Stemmer",
        author_email    = "ralf.stemmer@gmx.net",
        description     = "An interface between the WandKalender web application and an ICS server",
        long_description= ReadReadme(),
        long_description_content_type   = "text/markdown",
        url             = "https://github.com/rstemmer/WandKalender",
        project_urls    = {
                "Source":  "https://github.com/rstemmer/WandKalender",
                "Tracker": "https://github.com/rstemmer/WandKalender/issues",
            },
        packages        = setuptools.find_packages(),
        entry_points={
                "console_scripts": [
                    "wkserver=WKServer.wkserver:main",
                    ],
                },
        package_data={
            },
        install_requires= [
            "autobahn",
            ],
        python_requires = ">=3.9",
        keywords        = "", # TODO
        license         = "GPL",
        classifiers     = [
            "Programming Language :: Python :: 3",
            "Programming Language :: Python :: 3.9",
            "Programming Language :: Python :: 3.10",
            "Development Status :: 3 - Alpha",
            "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
            "Operating System :: POSIX :: Linux",
            "Environment :: Console",
            "Intended Audience :: System Administrators",
            "Intended Audience :: Information Technology",
            "Topic :: Communications",
            "Topic :: Database",
            "Topic :: Internet",
            "Topic :: Utilities",
            ],
        )

# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

