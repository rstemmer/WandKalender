
if(typeof window.WandKalender === "undefined")
    window.WandKalender = new Object();

if(typeof window.WandKalender.config === "undefined")
    window.WandKalender.config = new Object();

window.WandKalender.config.caldavurl = "https://localhost/nextcloud/remote.php/dav/calendars/";

window.WandKalender.config.users = 
    {
        "user1": "Test User 1",
        "user2": "Test User 2"
    };

window.WandKalender.config.holidaycalendars = 
    [
        "Holidays Calendar 1",
        "Holidays Calendar 2"
    ];

// in seconds, 0: no update/reload
window.WandKalender.config.updateinterval = 60 /*s*/;
window.WandKalender.config.reloadinterval = 60*60 /*s*/;

