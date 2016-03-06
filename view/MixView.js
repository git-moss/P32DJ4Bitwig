// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

MixView.NUM_DISPLAY_COLS = 32;
MixView.DRUM_START_KEY = 36;


function MixView (model)
{
    if (model == null)
        return;
    
    AbstractView.call (this, model);
    
    this.rows = model.numScenes;
    
    this.resolutions = [ 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8, 1/12 ];
    this.resolutionsStr = [ "1/4", "1/4t", "1/8", "1/8t", "1/16", "1/16t", "1/32", "1/32t" ];
    this.selectedIndex = 4;
    this.loopPadPressed = -1;
    this.selectedPad = 0;
    
    this.offsetX = 0;
    this.offsetY = MixView.DRUM_START_KEY;
    
    this.pressedKeys = initArray (0, 128);

    this.scales = this.model.getScales ();
    this.noteMap = this.scales.getEmptyMatrix ();

    this.clip = this.model.createCursorClip (32, 128);
    this.clip.setStepLength (this.resolutions[this.selectedIndex]);    
    this.clip.scrollTo (0, MixView.DRUM_START_KEY);   
    
    var tb = model.getTrackBank ();
    tb.addNoteListener (doObject (this, function (pressed, note, velocity)
    {
        // Light notes send from the sequencer
        this.pressedKeys[note] = pressed ? velocity : 0;
    }));
    tb.addTrackSelectionListener (doObject (this, function (index, isSelected)
    {
        this.clearPressedKeys ();
    }));
}
MixView.prototype = new AbstractView ();

MixView.prototype.updateNoteMapping = function ()
{
    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_SLICER:
            this.noteMap = this.canSelectedTrackHoldNotes () ? this.scales.getDrumMatrix () : this.scales.getEmptyMatrix ();
            break;
        
        default:
            this.noteMap = this.scales.getEmptyMatrix ();
            break;
    }

    this.surface.setKeyTranslationTable (this.noteMap);
};

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

MixView.prototype.onSyncA = function (event)
{
    if (!event.isDown ())
        return;
    if (this.surface.getMode () != P32DJ.MODE_LEFT_SAMPLER)
        return;
    var device = this.model.getDevice ();
    if (device.hasSelectedDevice ())
        device.toggleWindowOpen ();
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
    if (this.surface.isShiftPressed (false))
    {
        var index = note - 36;
        this.switchView (index);
        return;
    }

    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_SLICER:
            this.onDrumGridNote (event, isDeckA, isShifted, note, velocity);
            break;
        
        default:
            this.onMixerGridNote (event, isDeckA, isShifted, note, velocity);
            break;
    }
};

MixView.prototype.onMixerGridNote = function (event, isDeckA, isShifted, note, velocity)
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

MixView.prototype.onDrumGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (!this.canSelectedTrackHoldNotes ())
        return;

    var index = note - 36;
    var x = index % 4;
    var y = Math.floor (index / 4);
    
    if (this.surface.isLeftCuePressed)
    {
        if (velocity == 0)
            return;
        
        if (isDeckA)
        {
            if (index < 8)
            {
                this.selectedIndex = index;
                this.clip.setStepLength (this.resolutions[this.selectedIndex]);
                displayNotification (this.resolutionsStr[this.selectedIndex]);
            }
        }
        else
        {
            switch (index)
            {
                case 2:
                    this.clearPressedKeys ();
                    this.scales.decDrumOctave ();
                    this.offsetY = MixView.DRUM_START_KEY + this.scales.getDrumOctave () * 16;
                    displayNotification (this.scales.getDrumRangeText ());
                    this.model.getTrackBank ().primaryDevice.scrollDrumPadsPageUp ();
                    break;
                case 5:
                    var newOffset = this.offsetX - this.clip.getStepSize ();
                    if (newOffset < 0)
                        this.offsetX = 0;
                    else
                    {
                        this.offsetX = newOffset;
                        this.clip.scrollStepsPageBackwards ();
                    }
                    break;
                case 7:
                    this.offsetX = this.offsetX + this.clip.getStepSize ();
                    this.clip.scrollStepsPageForward ();
                    break;
                case 10:
                    this.clearPressedKeys ();
                    this.scales.incDrumOctave ();
                    this.offsetY = MixView.DRUM_START_KEY + this.scales.getDrumOctave () * 16;
                    displayNotification (this.scales.getDrumRangeText ());
                    this.model.getTrackBank ().primaryDevice.scrollDrumPadsPageDown ();
                    break;
            }
        }
        return;
    }

    // Sequencer steps
    if (this.surface.isShiftPressed (true))
    {
        if (velocity != 0)
        {
            var col = 8 * (3 - y) + x + (isDeckA ? 0 : 4);
            this.clip.toggleStep (col, this.offsetY + this.selectedPad, Config.accentActive ? Config.fixedAccentValue : velocity);
        }
        return;
    }
    
    if (isDeckA)
    {
        // 4x4 Drum Pad Grid

        this.selectedPad = 4 * y + x;   // 0-16

        // Mark selected note
        this.pressedKeys[this.offsetY + this.selectedPad] = velocity;
        
        if (!this.surface.isLeftSyncPressed)
            this.surface.sendMidiEvent (0x90, this.offsetY + this.selectedPad, velocity);

        return;
    }

    // Clip length/loop area
    var pad = (3 - y) * 4 + x - 4;
    if (velocity > 0)   // Button pressed
    {
        if (this.loopPadPressed == -1)  // Not yet a button pressed, store it
            this.loopPadPressed = pad;
    }
    else if (this.loopPadPressed != -1)
    {
        var start = this.loopPadPressed < pad ? this.loopPadPressed : pad;
        var end   = (this.loopPadPressed < pad ? pad : this.loopPadPressed) + 1;
        var quartersPerPad = this.model.getQuartersPerMeasure ();

        // Set a new loop between the 2 selected pads
        var newStart = start * quartersPerPad;
        this.clip.setLoopStart (newStart);
        this.clip.setLoopLength ((end - start) * quartersPerPad);
        this.clip.setPlayRange (newStart, end * quartersPerPad);

        this.loopPadPressed = -1;
    }
};

MixView.prototype.drawGrid = function ()
{
    if (this.surface.isShiftPressed (false))
    {
        this.drawViewSelection ();
        return;
    }
    
    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_SLICER:
            this.drawDrumGrid ();
            break;
        
        default:
            this.drawMixerGrid ();
            break;
    }
};

MixView.prototype.drawMixerGrid = function ()
{
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

MixView.prototype.drawDrumGrid = function ()
{
    if (!this.canSelectedTrackHoldNotes ())
    {
        this.surface.pads.turnOff ();
        return;
    }
    
    if (this.surface.isLeftCuePressed)
    {
        for (var x = 0; x < 4; x++)
        {
            for (var y = 0; y < 4; y++)
            {
                // Resolution selection
                var pad = x + (3 - y) * 4;
                var hilite = this.selectedIndex == pad;
                this.surface.pads.lightEx (x, y, y >= 2 ? (hilite ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_RED) : P32DJ_BUTTON_STATE_BLACK, null, false);
                
                // Cursor navigation
                var isOn = pad == 2 || pad == 5 || pad == 7 || pad == 10;
                this.surface.pads.lightEx (4 + x, y, isOn ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK, null, false);
            }
        }
        return;
    }

    var step = this.clip.getCurrentStep ();
    
    if (this.surface.isShiftPressed (true))
    {
        // Paint the sequencer steps
        var hiStep = this.isInXRange (step) ? step % MixView.NUM_DISPLAY_COLS : -1;
        for (var col = 0; col < MixView.NUM_DISPLAY_COLS; col++)
        {
            var isSet = this.clip.getStep (col, this.offsetY + this.selectedPad);
            var hilite = col == hiStep;
            var x = col % 8;
            var y = 3 - Math.floor (col / 8);
            this.surface.pads.lightEx (x, 3 - y, isSet ? (hilite ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_BLUE) : hilite ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK, null, false);
        }
        return;
    }    

    // 4x4 Drum Pad Grid
    var primary = this.model.getTrackBank ().primaryDevice;
    var hasDrumPads = primary.hasDrumPads ();
    var isSoloed = false;
    if (hasDrumPads)
    {
        for (var i = 0; i < 16; i++)
        {
            if (primary.getDrumPad (i).solo)
            {
                isSoloed = true;
                break;
            }
        }
    }
    var isRecording = this.model.hasRecordingState ();
    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            var index = 4 * y + x;
            this.surface.pads.lightEx (x, 3 - y, this.getPadColor (index, primary, hasDrumPads, isSoloed, isRecording), null, false);
        }
    }

    // Clip length/loop area
    var quartersPerPad = this.model.getQuartersPerMeasure ();
    var stepsPerMeasure = Math.round (quartersPerPad / this.resolutions[this.selectedIndex]);
    var currentMeasure = Math.floor (step / stepsPerMeasure);
    var maxQuarters = quartersPerPad * 16;
    var start = this.clip.getLoopStart ();
    var loopStartPad = Math.floor (Math.max (0, start) / quartersPerPad);
    var loopEndPad   = Math.ceil (Math.min (maxQuarters, start + this.clip.getLoopLength ()) / quartersPerPad);
    for (var pad = 0; pad < 16; pad++)
        this.surface.pads.lightEx (4 + pad % 4, Math.floor (pad / 4), pad >= loopStartPad && pad < loopEndPad ? (pad == currentMeasure ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_PINK) : P32DJ_BUTTON_STATE_BLACK, null, false);
};

MixView.prototype.getPadColor = function (index, primary, hasDrumPads, isSoloed, isRecording)
{
    // Playing note?
    if (this.pressedKeys[this.offsetY + index] > 0)
        return isRecording ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_RED;
    // Selected?
    if (this.selectedPad == index)
        return P32DJ_BUTTON_STATE_BLUE;
    // Exists and active?
    var drumPad = primary.getDrumPad (index);
    if (!drumPad.exists || !drumPad.activated)
        return P32DJ_BUTTON_STATE_BLACK;
    // Muted or soloed?
    if (drumPad.mute || (isSoloed && !drumPad.solo))
        return P32DJ_BUTTON_STATE_PINK;
    return P32DJ_BUTTON_STATE_PINK;
};

MixView.prototype.isInXRange = function (x)
{
    return x >= this.offsetX && x < this.offsetX + this.clip.getStepSize ();
};

MixView.prototype.clearPressedKeys = function ()
{
    for (var i = 0; i < 128; i++)
        this.pressedKeys[i] = 0;
};