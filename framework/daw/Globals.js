// Written by J�rgen Mo�graber - mossgrabers.de
//            Michael Schmalle - teotigraphix.com
// (c) 2014-2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function scheduleTask (f, params, delay)
{
    host.scheduleTask (f, params, delay);
}

function displayNotification (message)
{
    host.showPopupNotification (message);
}
