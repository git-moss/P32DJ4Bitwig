// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016-2017
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
    if (this.surface.isLeftPlayPressed)
    {
        // Display length for new clips
        // 1 Beat, 2 Beats, 1 Bar, 2 Bars, 4 Bars, 8 Bars, 16 Bars, 32 Bars
        var tb = this.model.getCurrentTrackBank ();
        var clipLength = tb.getNewClipLength ();
        display.setLeftDots (clipLength < 2, false);
        var code = clipLength < 2 ? (clipLength + 1) : Math.pow (2, clipLength - 2);
        code = code.toString ();
        display.setLeftDisplay (code.length < 2 ? ' ' + code : code);
    }
    else
    {
        // Display Tempo
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

AbstractView.prototype.onPlayA = function (event) {};

AbstractView.prototype.onPlayB = function (event)
{
    if (!event.isDown ())
        return;
    if (this.surface.isShiftPressed (false))
        this.model.getTransport ().toggleLoop ();
    else
        this.handlePlayOptions ();
};

AbstractView.prototype.onCueA = function (event) {};

AbstractView.prototype.onCueB = function (event)
{
    if (!event.isDown ())
        return;
    if (this.surface.isShiftPressed ())
        this.model.getApplication ().redo ();
    else
        this.model.getApplication ().undo ();
};

AbstractView.prototype.onSyncA = function (event) {};

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

AbstractView.prototype.onBrowse = function (isShifted, value)
{
    this.model.getMasterTrack ().changeVolume (value, isShifted ? Config.fractionMinValue : Config.fractionValue);
};

AbstractView.prototype.onBrowseButton = function (event)
{};

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
        if (this.surface.isLeftPlayPressed)
        {
            // Change length of new clips
            var tb = this.model.getCurrentTrackBank ();
            var newLength = tb.getNewClipLength () + (value < 64 ? 1 : -1);
            if (newLength >= 0 && newLength < 8)
                tb.setNewClipLength (newLength);
        }
        else
        {
            // Change tempo
            this.model.getTransport ().changeTempo (value < 64, isShifted);
        }
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
    this.surface.pads.light (26, this.surface.isActiveView (VIEW_DEVICE) ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_PINK);
    this.surface.pads.light (27, P32DJ_BUTTON_STATE_BLACK);

    for (var i = 28; i < 32; i++)
        this.surface.pads.light (i, P32DJ_BUTTON_STATE_BLACK);
};

AbstractView.prototype.switchView = function (index)
{
    switch (index)
    {
        case 0:
            this.surface.setActiveView (VIEW_DJ);
            displayNotification ("DJ Mode");
            break;
        case 1:
            this.surface.setActiveView (VIEW_MIX);
            displayNotification ("Mix Mode");
            break;
        case 2:
            this.surface.setActiveView (VIEW_DEVICE);
            displayNotification ("Device Mode");
            break;
    }
};

AbstractView.prototype.onMode = function (event, isDeckA, mode) 
{
    if (!event.isDown ())
        return;
    
    this.updateNoteMapping ();
    
    if (this.surface.isActiveView (VIEW_DJ))
        return;
    
    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_SLICER:
            displayNotification ("Drum Sequencer");
            break;
        
        case P32DJ.MODE_LEFT_LOOP:
            displayNotification ("Play");
            break;
        
        case P32DJ.MODE_LEFT_HOTCUE:
            displayNotification ("Program Change");
            break;
            
        case P32DJ.MODE_RIGHT_SAMPLER:
            displayNotification ("Session");
            break;
        
        default:
            displayNotification ("Mix");
            break;
    }
};
