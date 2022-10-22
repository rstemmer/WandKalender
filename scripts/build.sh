#!/usr/bin/env bash


set -e
SCRIPTVERSION="2.1.0" # Based on the MusicDB build script
PROJECTNAME="WandKalender"
echo -e "\e[1;31m$PROJECTNAME Package Builder Script [\e[1;34m$SCRIPTVERSION\e[1;31m]\e[0m"

repository="$(dirname "$(pwd)")"
if [ ! -d "$repository/.git" ] ; then
    echo -e "\t\e[1;31mThe script must be executed from the \e[1;37mscripts\e[1;31m directory inside the $PROJECTNAME repository!"
    echo -e "\t\e[1;30m($repository/.git directory missing)\e[0m"
    exit 1
fi

VersionSourceFile="../WKServer/wkserver"
version=$(grep VERSION $VersionSourceFile | head -n 1 | cut -d "=" -f 2 | tr -d "\" ")
name="wkserver"

mkdir -p "$repository/pkg"



function PrintHelp {
    echo "./build.sh [--help] [src] [pkg]"
}




function BuildSource {
    pkgname="${name}-${version}-src"
    oldwd=$(pwd)
    cd $repository
    echo -e "\e[1;35m - \e[1;34mCreating Source Archive…"

    tmp="/tmp/${pkgname}"
    mkdir -p $tmp
    rm -f "../pkg/${pkgname}.tar.zst"

    cp -r WKServer             $tmp
    cp -r share                $tmp
    cp    README.md            $tmp
    cp    LICENSE              $tmp
    cp    CHANGELOG            $tmp
    cp    dist/setup.py        $tmp
    cp    dist/pyproject.toml  $tmp
    echo  "$version"          >$tmp/VERSION

    tar -c --zstd --exclude='*.bak' --exclude="__pycache__" -C "${tmp}/.." -f "pkg/${pkgname}.tar.zst" "$pkgname"

    rm -r "$tmp"
    echo -e "\e[1;32mdone"

    cd $oldwd
}



function BuildPKG {
    oldwd=$(pwd)
    cd $repository/dist

    tmp=/tmp/mkpkg
    if [[ -d $tmp ]] ; then
        rm -r $tmp
    fi
    rm -f "../pkg/${name}-${version}-1-any.pkg.tar.zst"

    SRCDEST=$tmp BUILDDIR=$tmp PKGDEST=../pkg makepkg
    rm -r $tmp

    echo -e "\e[1;32mdone"

    cd $oldwd
}



if [[ $# -eq 0 ]] ; then
    PrintHelp
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            PrintHelp
            exit 0
            ;;
        src)
            BuildSource
            ;;
        pkg)
            BuildPKG
            ;;
        *)
            echo -e "\e[1;31mUnknown parameter $1!\e[0m"
            PrintHelp
            exit 1
            ;;
    esac

    shift
done
