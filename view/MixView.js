// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function MixView (model)
{
    if (model == null)
        return;
    
    AbstractView.call (this, model);
    
    this.rows = model.numScenes;
}
MixView.prototype = new AbstractView ();

MixView.prototype.onLoad = function (event, isDeckA)
{
    if (!event.isDown ())
        return;
    if (isDeckA)
        this.model.getApplication ().addInstrumentTrack ();
    else
        this.model.getApplication ().addAudioTrack ();
};

MixView.prototype.onEQ = function (isDeckA, isShifted, param, value)
{
    if (isShifted)
        return;

    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    var sendIndex = param + (isDeckA ? 2 : 5);
    tb.setSend (selectedTrack.index, sendIndex, value);
};

MixView.prototype.onFilterOn = function (event, isDeckA, isShifted)
{
    if (!event.isDown () || isShifted)
        return;
    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    var sendIndex = isDeckA ? 0 : 1;
    tb.resetSend (selectedTrack.index, sendIndex);
};

MixView.prototype.onRecord = function (event)
{
    if (event.isDown ())
        this.model.getTransport ().record ();
};

MixView.prototype.onSlip = function (event)
{
    if (event.isDown ())
        this.model.getTransport ().toggleLauncherOverdub ();
};

MixView.prototype.onHeadphoneVolume = function (event, isUp)
{
// No function
};

MixView.prototype.onPreFaderListen = function (event, isDeckA)
{
    if (!event.isDown ())
        return;
    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    if (isDeckA)
        tb.toggleSolo (selectedTrack.index);
    else
        tb.toggleMute (selectedTrack.index);
};

MixView.prototype.onVolumeKnob = function (isDeckA, isShifted, value)
{
    if (isShifted)
        return;
    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    if (isDeckA)
        tb.setVolume (selectedTrack.index, value);
    else
        tb.setPan (selectedTrack.index, value);
};

MixView.prototype.onFilterKnob = function (isDeckA, isShifted, value)
{
    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    var sendIndex = isDeckA ? 0 : 1;
    tb.changeSend (selectedTrack.index, sendIndex, value, isShifted ? Config.fractionMinValue : Config.fractionValue);
};

MixView.prototype.onEffectKnob = function (isDeckA, isShifted, fxNumber, value)
{
    var tb = this.model.getCurrentTrackBank ();
    var index = (isDeckA ? 0 : 4) + fxNumber;
    if (isShifted)
        tb.setPan (index, value);
    else
        tb.setVolume (index, value);
};

MixView.prototype.onEffectOn = function (event, isDeckA, isShifted, fxNumber)
{
    if (!event.isDown ())
        return;

    var tb = this.model.getCurrentTrackBank ();
    var index = (isDeckA ? 0 : 4) + fxNumber;
    if (isShifted)
        tb.toggleMonitor (index);
    else
        tb.toggleIsActivated (index);
};

MixView.prototype.onPlayA = function (event)
{
    if (!event.isDown ())
        return;
    var tb = this.model.getCurrentTrackBank ();
    var track = tb.getSelectedTrack ();
    if (track == null)
    {
        displayNotification ("Please select an Instrument track first.");
        return;
    }

    var selectedSlot = tb.getSelectedSlot (track.index);
    var slotIndex = selectedSlot == null ? 0 : selectedSlot.index;
    var slot = tb.getEmptySlot (track.index, slotIndex);
    if (slot == null)
    {
        displayNotification ("In the current selected grid view there is no empty slot. Please scroll down.");
        return;
    }

    tb.createClip (track.index, slot.index, this.model.getQuartersPerMeasure ());
    var slots = tb.getClipLauncherSlots (track.index);
    if (slotIndex != slot.index)
        slots.select (slot.index);
    slots.launch (slot.index);
    this.model.getTransport ().setLauncherOverdub (true);
};

MixView.prototype.updateButtons = function ()
{
    var tb = this.model.getCurrentTrackBank ();
    var track = null;
    for (var i = 0; i < 4; i++)
    {
        track = tb.getTrack (i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 1, track.exists && track.activated ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 4, track.exists && track.monitor ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        track = tb.getTrack (4 + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 2, track.exists && track.activated ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 5, track.exists && track.monitor ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    }

    var selectedTrack = tb.getSelectedTrack ();

    this.surface.updateButtonEx (P32DJ_PFL, 1, selectedTrack != null && selectedTrack.solo ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_PFL, 2, selectedTrack != null && selectedTrack.mute ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);

    var transport = this.model.getTransport ();
    this.surface.updateButtonEx (P32DJ_REC, 0, transport.isRecording ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_SLIP, 0, transport.isLauncherOverdub ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
};

MixView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (velocity == 0)
        return;

    var cols = 4;
    var index = note - 36;
    var col = index % cols;

    var tb = this.model.getCurrentTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var s = (this.rows - 1) - Math.floor (index / cols);
        var pad = col + s * 4 + (isDeckA ? 0 : 16);
        tb.scrollToChannel (8 * pad);
        return;
    }

    if (this.surface.isShiftPressed (false))
    {
        this.switchView (index);
        return;
    }

    var trackIndex = col + (isDeckA ? 0 : 4);
    var row = Math.floor (index / cols);
    switch (row)
    {
        case 0:
            tb.toggleArm (trackIndex);
            break;
        case 1:
            tb.toggleMute (trackIndex);
            break;
        case 2:
            tb.toggleSolo (trackIndex);
            break;
        case 3:
            tb.select (trackIndex);
            var track = tb.getTrack (trackIndex);
            displayNotification ("Track " + (track.position + 1) + ": " + track.name);
            break;
    }
};

MixView.prototype.drawGrid = function ()
{
    if (this.surface.isShiftPressed (false))
    {
        this.drawViewSelection ();
        return;
    }

    var tb = this.model.getCurrentTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var trackPosition = Math.floor (tb.getTrack (0).position / 8);
        // Track bank selection mode
        for (var i = 0; i < 16; i++)
        {
            var x = i % 4;
            var y = Math.floor (i / 4);
            this.surface.pads.lightEx (x, y, i == trackPosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
            this.surface.pads.lightEx (4 + x, y, (16 + i) == trackPosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        }
        return;
    }

    // Track select, Solo, Mute, Rec Arm
    for (var i = 0; i < 8; i++)
    {
        var track = tb.getTrack (i);
        this.surface.pads.lightEx (i, 0, track.selected ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        this.surface.pads.lightEx (i, 1, track.solo ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_BLACK);
        this.surface.pads.lightEx (i, 2, track.mute ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        this.surface.pads.lightEx (i, 3, track.recarm ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_BLACK);
    }
};
