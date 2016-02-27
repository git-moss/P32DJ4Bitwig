// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

AbstractView.prototype.onPlay = function (event, isDeckA)
{
    if (isDeckA)
    {
        this.onPlayA (event);
        return;
    }
        
    if (!event.isDown ())
        return;
    if (this.surface.isShiftPressed (false))
        this.model.getTransport ().toggleLoop ();
    else
    {
        if (!this.restartFlag)
        {
            this.model.getTransport ().play ();
            this.doubleClickTest ();
        }
        else
        {
            this.model.getTransport ().stopAndRewind ();
            this.restartFlag = false;
        }
    }
};

AbstractView.prototype.onCrossfader = function (value)
{
    this.model.getTransport ().setCrossfade (value);
};
