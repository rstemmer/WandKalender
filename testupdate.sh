
SOURCEDIR=./WandKalender2
DESTINATION=/srv/WandKalender
WSCONFIG=$DESTINATION/config.js
if [ -f "$WSCONFIG" ] ; then
    cp "$WSCONFIG" "/tmp/wkswebuicfg.bak"
fi
rsync -uav  \
    --exclude '*.swp' \
    --exclude '*.swo' \
    --exclude '*~' \
    --exclude 'config.js' \
    --delete \
    $SOURCEDIR/ $DESTINATION/. > /dev/null
if [ -f "/tmp/wkswebuicfg.bak" ] ; then
    mv "/tmp/wkswebuicfg.bak" "$WSCONFIG"
fi
