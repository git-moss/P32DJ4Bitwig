// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

loadAPI (1);

load ("Config.js");
load ("framework/ClassLoader.js");
load ("p32dj/ClassLoader.js");
load ("view/ClassLoader.js");
load ("Controller.js");

// This is the only global variable, do not use it.
var controller = null;

host.defineController ("Hercules", "P32DJ4Bitwig", "1.22", "D451C660-D668-11E5-A837-0800200C9A66", "Jürgen Moßgraber");
host.defineMidiPorts (1, 1);

host.defineSysexIdentityReply ("F0 7E 7F 06 02 00 01 4E 02 00 17 00 ?? ?? ?? ?? F7");

createDeviceDiscoveryPairs ("Hercules P32 DJ");

function init ()
{
    setP32Colors ();
    controller = new Controller (false);
    println ("Initialized.");
}

function exit ()
{
    if (controller)
        controller.shutdown ();
}

function flush ()
{
    if (controller)
        controller.flush ();
}
