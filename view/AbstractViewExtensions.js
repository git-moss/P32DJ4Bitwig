// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

AbstractView.prototype.updateDevice = function ()
{
    this.updateDisplay ();
    this.surface.display.flush ();
    this.updateButtons ();
    this.updateArrows ();
};

AbstractView.prototype.onActivate = function ()
{
    this.updateNoteMapping ();
    
    scheduleTask (doObject (this, this.updateDisplay), [], 200);
};

AbstractView.prototype.updateDisplay = function ()
{
    var display = this.surface.display;

    var tempoString = this.model.getTransport ().getTempo ();
    if (!tempoString)
        return;

    var parts = tempoString.toString ().split ('.');
    var tempo = parts[0];
    
    // Left display
    if (tempo.length > 2)
    {
        digit = parseInt (tempo.substr (0, 1));
        display.setLeftDots (true, digit != 1);
        display.setLeftDisplay (tempo.substr (1, 2));
    }
    else
    {
        display.setLeftDots (false, false);
        display.setLeftDisplay (tempo);
    }

    // Right display
    var tempoFraction = '00';
    if (parts.length > 1)
    {
        tempoFraction = parts[1];
        if (tempoFraction.length == 1)
            tempoFraction += '0';
        else if (tempoFraction.length > 2)
            tempoFraction = tempoFraction.substr (0, 2);
    }
    display.setRightDisplay (tempoFraction);
};

AbstractView.prototype.onPlayB = function (event)
{
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

AbstractView.prototype.onCueB = function (event)
{
    if (!event.isDown ())
        return;
    if (this.surface.isShiftPressed ())
        this.model.getApplication ().redo ();
    else
        this.model.getApplication ().undo ();
};

AbstractView.prototype.onSyncB = function (event)
{
    if (!event.isDown ())
        return;
    if (this.surface.isShiftPressed (false))
        this.model.getTransport ().toggleWriteClipLauncherAutomation ();
    else
        this.model.getTransport ().toggleWriteArrangerAutomation ();
};

AbstractView.prototype.onCrossfader = function (value)
{
    this.model.getTransport ().setCrossfade (value);
};

AbstractView.prototype.onLoopButton = function (event, isDeckA)
{
    if (!event.isDown ())
        return;
    if (isDeckA)
        this.model.getTransport ().tapTempo ();
    else
        this.model.getTransport ().toggleClick ();
};

AbstractView.prototype.onLoopEncKnob = function (isDeckA, isShifted, value)
{
    if (isDeckA)
    {
        this.model.getTransport ().changeTempo (value < 64, isShifted);
        return;
    }

    this.model.getTransport ().changePosition (value < 64, isShifted);
};

AbstractView.prototype.drawViewSelection = function ()
{
    // Scene selection mode
    for (var i = 0; i < 24; i++)
        this.surface.pads.light (i, P32DJ_BUTTON_STATE_BLACK);
    
    this.surface.pads.light (24, this.surface.isActiveView (VIEW_DJ) ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_PINK);
    this.surface.pads.light (25, this.surface.isActiveView (VIEW_MIX) ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_PINK);
    this.surface.pads.light (26, P32DJ_BUTTON_STATE_BLACK);
    this.surface.pads.light (27, P32DJ_BUTTON_STATE_BLACK);
        
    for (var i = 28; i < 32; i++)
        this.surface.pads.light (i, P32DJ_BUTTON_STATE_BLACK);
};

AbstractView.prototype.drawSceneButtons = function () {};
