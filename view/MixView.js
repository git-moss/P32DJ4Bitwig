// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016-2017
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

MixView.NUM_DISPLAY_COLS = 32;
MixView.DRUM_START_KEY = 36;


function MixView (model)
{
    if (model == null)
        return;
    
    AbstractView.call (this, model);
    
    this.columns = 4;
    this.rows = model.numScenes;
    
    this.resolutions = [ 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8, 1/12 ];
    this.resolutionsStr = [ "1/4", "1/4t", "1/8", "1/8t", "1/16", "1/16t", "1/32", "1/32t" ];
    this.selectedIndex = 4;
    this.loopPadPressed = -1;
    this.selectedPad = 0;
    
    this.offsetX = 0;
    this.offsetY = MixView.DRUM_START_KEY;
    
    this.pressedKeys = initArray (0, 128);
    this.drumPressedKeys = initArray (0, 128);

    this.scales = this.model.getScales ();
    this.noteMap = this.scales.getEmptyMatrix ();
    
    this.programNumber = -1;
    this.prgOffset = 0;
    this.bankNumber = 0;

    this.clip = this.model.createCursorClip (32, 128);
    this.clip.setStepLength (this.resolutions[this.selectedIndex]);    
    this.clip.scrollTo (0, MixView.DRUM_START_KEY);   
    
    var tb = model.getTrackBank ();
    tb.addNoteListener (doObject (this, function (pressed, note, velocity)
    {
        // Light notes send from the sequencer
        this.drumPressedKeys[note] = pressed ? velocity : 0;
        this.setPressedKeys (note, pressed, velocity);
    }));
    tb.addTrackSelectionListener (doObject (this, function (index, isSelected)
    {
        this.clearPressedKeys ();
    }));
}
MixView.prototype = new AbstractView ();

MixView.prototype.updateNoteMapping = function ()
{
    this.clearPressedKeys ();
    
    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_LOOP:
            this.noteMap = this.model.canSelectedTrackHoldNotes () ? this.scales.getNoteMatrix () : this.scales.getEmptyMatrix ();
            break;
        
        default:
            this.noteMap = this.scales.getEmptyMatrix ();
            this.surface.setKeyTranslationTable (this.noteMap);
            break;
    }
    
    this.model.getCurrentTrackBank ().setIndication (this.surface.getMode () == P32DJ.MODE_RIGHT_SAMPLER);
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

MixView.prototype.onLoad = function (event, isDeckA, isShifted)
{
    if (!event.isDown ())
        return;
    
    if (isDeckA)
    {
        if (isShifted)
            this.model.getApplication ().addAudioTrack ();
        else
            this.model.getApplication ().addInstrumentTrack ();
    }
    else
    {
        var browser = this.model.getBrowser ();
        if (isShifted)
            browser.browseToInsertBeforeDevice ();
        else
            browser.browseToInsertAfterDevice ();
    }
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

MixView.prototype.onBrowseButton = function (event)
{
    if (!event.isDown ())
        return;
    
    var browser = this.model.getBrowser ();

    // Already browsing?
    if (this.isBrowserActive ())
    {
        browser.stopBrowsing (!this.surface.isShiftPressed (false) && !this.surface.isShiftPressed (true));
        return;
    }

    // Browse for presets
    browser.browseForPresets ();
};

MixView.prototype.onBrowse = function (isShifted, value)
{
    if (this.isBrowserActive ())
    {
        var browser = this.model.getBrowser ();            
        if (value < 64)
        {
            browser.selectNextResult ();
            if (browser.getSelectedResultIndex () == browser.numResults - 1)
                browser.nextResultPage ();
        }
        else
        {
            browser.selectPreviousResult ();
            if (browser.getSelectedResultIndex () == 0)
                browser.previousResultPage ();
        }
        return;
    }
    
    AbstractView.prototype.onBrowse.call (this, isShifted, value);
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
        this.setConfiguredVolume (selectedTrack.index, value);
    else
        tb.setPan (selectedTrack.index, value);
};

MixView.prototype.setConfiguredVolume = function (trackIndex, value)
{
    var tb = this.model.getCurrentTrackBank ();
    if (Config.limitVolume)
    {
        var v = value * 793 / (Config.maxParameterValue - 1);
        tb.trackBank.getChannel (trackIndex).getVolume ().set (v, 1000);
    }
    else
        tb.setVolume (trackIndex, value);
};

MixView.prototype.onFilterKnob = function (isDeckA, isShifted, value)
{
    if (this.isBrowserActive ())
    {
        this.handleBrowseKnob (isDeckA, isShifted, value);
        return;
    }
    
    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;
    var sendIndex = isDeckA ? 0 : 1;
    tb.changeSend (selectedTrack.index, sendIndex, value, isShifted ? Config.fractionMinValue : Config.fractionValue);
};

MixView.prototype.handleBrowseKnob = function (isDeckA, isShifted, value)
{
    var browser = this.model.getBrowser ();            
    filterColumn = isDeckA ? 3 : 4;
    if (value < 64)
    {
        browser.selectNextFilterItem (filterColumn);
        if (browser.getSelectedFilterItemIndex (filterColumn) == browser.numFilterColumnEntries - 1)
            browser.nextFilterItemPage (filterColumn);
    }
    else
    {
        browser.selectPreviousFilterItem (filterColumn);
        if (browser.getSelectedFilterItemIndex (filterColumn) == 0)
            browser.previousFilterItemPage (filterColumn);
    }
};

MixView.prototype.onEffectKnob = function (isDeckA, isShifted, fxNumber, value)
{
    var tb = this.model.getCurrentTrackBank ();
    var index = (isDeckA ? 0 : 4) + fxNumber;
    if (isShifted)
        tb.setPan (index, value);
    else
        this.setConfiguredVolume (index, value);
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

MixView.prototype.onCueA = function (event)
{
    if (!event.isDown ())
        return;
    switch (this.surface.getMode ())
    {
        // Drum mode
        case P32DJ.MODE_LEFT_SLICER:
            // Resolution and navigation -> onDrumGridNote
            break;
            
        // Session mode
        case P32DJ.MODE_RIGHT_SAMPLER:
        // Mix mode
        case P32DJ.MODE_LEFT_SAMPLER:
        // Play mode
        case P32DJ.MODE_LEFT_LOOP:
        // Program change mode
        case P32DJ.MODE_LEFT_HOTCUE:
        default:
            this.model.getApplication ().duplicate ();
            break;
    }
};

MixView.prototype.onSyncA = function (event)
{
    if (!event.isDown ())
        return;
    switch (this.surface.getMode ())
    {
        // Drum mode
        case P32DJ.MODE_LEFT_SLICER:
            // Select the drum pad -> onDrumGridNote
            break;
            
        // Session mode
        case P32DJ.MODE_RIGHT_SAMPLER:
            // Stop a clip -> onSessionGrid
            break;
            
        // Mix mode
        case P32DJ.MODE_LEFT_SAMPLER:
        // Play mode
        case P32DJ.MODE_LEFT_LOOP:
        // Program change mode
        case P32DJ.MODE_LEFT_HOTCUE:
        default:
            var device = this.model.getDevice ();
            if (device.hasSelectedDevice ())
                device.toggleWindowOpen ();
            break;
    }
};

MixView.prototype.onPlayA = function (event)
{
    if (!event.isUp ())
        return;

    var tb = this.model.getCurrentTrackBank ();
    var track = tb.getSelectedTrack ();
    if (track == null)
    {
        displayNotification ("Please select an Instrument track first.");
        return;
    }
    if (this.surface.isShiftPressed (true))
    {
        this.clip.quantize (1);
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

MixView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (this.surface.isShiftPressed (false))
    {
        if (velocity == 0)
            return;
        var index = note - 36;
        this.switchView (index);
        return;
    }

    switch (this.surface.getMode ())
    {
        case P32DJ.MODE_LEFT_SLICER:
            this.onDrumGridNote (event, isDeckA, isShifted, note, velocity);
            break;
        
        case P32DJ.MODE_LEFT_LOOP:
            this.onPlayGridNote (event, isDeckA, isShifted, note, velocity);
            break;
        
        case P32DJ.MODE_LEFT_HOTCUE:
            this.onPrgChangeGrid (event, isDeckA, isShifted, note, velocity);
            break;
            
        case P32DJ.MODE_RIGHT_SAMPLER:
            this.onSessionGrid (event, isDeckA, isShifted, note, velocity);
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

    var index = note - 36;
    var col = index % this.columns;

    var tb = this.model.getCurrentTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var s = (this.rows - 1) - Math.floor (index / this.columns);
        var pad = col + s * 4 + (isDeckA ? 0 : 16);
        tb.scrollToChannel (8 * pad);
        return;
    }

    var trackIndex = col + (isDeckA ? 0 : 4);
    
    var track = tb.getTrack (trackIndex);
    if (!track.exists)
        return;
    
    var row = Math.floor (index / this.columns);
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
            this.selectTrack (trackIndex);
            displayNotification ("Track " + (track.position + 1) + ": " + track.name);
            break;
    }
};

MixView.prototype.onDrumGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (!this.model.canSelectedTrackHoldNotes ())
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
        this.drumPressedKeys[this.offsetY + this.selectedPad] = velocity;
        
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

MixView.prototype.onPlayGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (!this.model.canSelectedTrackHoldNotes ())
        return;

    if (this.surface.isShiftPressed (true))
    {
        if (velocity == 0)
            return;
        if (!isDeckA)
            return;
        switch (note)
        {
            // Octave Down
            case 36:
                this.clearPressedKeys ();
                this.scales.decOctave ();
                this.updateNoteMapping ();
                displayNotification (this.scales.getRangeText ());
                break;
            // Octave Up
            case 37:
                this.clearPressedKeys ();
                this.scales.incOctave ();
                this.updateNoteMapping ();
                displayNotification (this.scales.getRangeText ());
                break;
            // Base Down
            case 40:
                this.scales.setScaleOffset (this.scales.getScaleOffset () - 1);
                var offset = this.scales.getScaleOffset ();
                Config.setScaleBase (Scales.BASES[offset]);
                displayNotification (Scales.BASES[offset]);
                break;
            // Base Up
            case 41:
                this.scales.setScaleOffset (this.scales.getScaleOffset () + 1);
                var offset = this.scales.getScaleOffset ();
                Config.setScaleBase (Scales.BASES[offset]);
                displayNotification (Scales.BASES[offset]);
                break;
            // Scale Down
            case 44:
                this.scales.prevScale ();
                Config.setScale (this.scales.getName (this.scales.getSelectedScale ()));
                displayNotification (this.scales.getName (this.scales.getSelectedScale ()));
                break;
            // Scale Up
            case 45:
                this.scales.nextScale ();
                Config.setScale (this.scales.getName (this.scales.getSelectedScale ()));
                displayNotification (this.scales.getName (this.scales.getSelectedScale ()));
                break;
            // In Key
            case 48:
                this.scales.toggleChromatic ();
                var isChromatic = this.scales.isChromatic ();
                Config.setScaleInScale (!isChromatic);
                displayNotification (isChromatic ? "Chromatic" : "In Key");
                break;
        }
        return;
    }

    var index = note - 36;
    var x = index % 4;
    var y = Math.floor (index / 4);
    note = 36 + x + (isDeckA ? 0 : 4) + y * 8;
    
    // Mark selected notes
    if (this.noteMap[note] == -1)
        return;

    this.setPressedKeys (this.noteMap[note], true, velocity);
    this.surface.sendMidiEvent (0x90, this.noteMap[note], velocity);
};

MixView.prototype.onPrgChangeGrid = function (event, isDeckA, isShifted, note, velocity)
{
    if (this.surface.isShiftPressed (true))
    {
        if (velocity == 0)
            return;
        if (isDeckA)
        {
            var prg = note - 48;
            if (prg >= 0 && prg < 4)
                this.prgOffset = prg;
        }
        else
        {
            this.bankNumber = note - 36;
            this.surface.sendMidiEvent (0xB0, 32, this.bankNumber);
            // Forces the bank change
            if (this.programNumber != -1)
                this.surface.sendMidiEvent (0xC0, this.programNumber, 0);
        }
        return;
    }
    
    var index = note - 36;
    var x = index % 4;
    var y = Math.floor (index / 4);
    this.programNumber = x + (isDeckA ? 0 : 4) + y * 8 + this.prgOffset * 32;
    this.surface.sendMidiEvent (0xC0, this.programNumber, 0);
};

MixView.prototype.onSessionGrid = function (event, isDeckA, isShifted, note, velocity)
{
    if (velocity == 0)
        return;

    var index = note - 36;
    var x = (isDeckA ? 0 : 4) + index % this.columns;
    var s = (this.rows - 1) - Math.floor (index / this.columns);

    var tb = this.model.getCurrentTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var index = note - 36;
        var y = (this.rows - 1) - Math.floor (index / this.columns);
        var tb = this.model.getCurrentTrackBank ();
        
        // Calculate page offsets
        var trackPosition = Math.floor (tb.getTrack (0).position / tb.numTracks);
        var scenePosition = Math.floor (tb.getScenePosition () / tb.numScenes);
        var offsetX = Math.floor (trackPosition / 8) * 8;
        var offsetY = Math.floor (scenePosition / this.rows) * this.rows;
        
        tb.scrollToChannel (offsetX * tb.numTracks + x * 8);
        tb.scrollToScene (offsetY * tb.numScenes + y * this.rows);
        return;
    }

    if (this.surface.isShiftPressed (false))
    {
        this.switchView (index);
        return;
    }

    var slots = tb.getClipLauncherSlots (x);

    if (this.surface.isLeftSyncPressed)
    {
        slots.stop ();
        return;
    }

    slots.select (s);
    if (Config.selectClipOnLaunch)
        slots.launch (s);
};

MixView.prototype.setPressedKeys = function (note, pressed, velocity)
{
    // Loop over all pads since the note can be present multiple time!
    for (var i = 0; i < 128; i++)
    {
        if (this.noteMap[i] == note)
            this.pressedKeys[i] = pressed ? velocity : 0;
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
        
        case P32DJ.MODE_LEFT_LOOP:
            this.drawPlayGrid ();
            break;
        
        case P32DJ.MODE_LEFT_HOTCUE:
            this.drawPrgChangeGrid ();
            break;
            
        case P32DJ.MODE_RIGHT_SAMPLER:
            this.drawSessionGrid ();
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
        this.surface.pads.lightEx (i, 0, track.selected ? P32DJ_BUTTON_STATE_BLUE : (track.exists ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK));
        this.surface.pads.lightEx (i, 1, track.solo ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_BLACK);
        this.surface.pads.lightEx (i, 2, track.mute ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        this.surface.pads.lightEx (i, 3, track.recarm ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_BLACK);
    }
};

MixView.prototype.drawDrumGrid = function ()
{
    if (!this.model.canSelectedTrackHoldNotes ())
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

MixView.prototype.drawPlayGrid = function ()
{
    if (this.surface.isShiftPressed (true))
    {
        this.surface.pads.lightEx (0, 3, P32DJ_BUTTON_STATE_BLUE, null, false);
        this.surface.pads.lightEx (1, 3, P32DJ_BUTTON_STATE_BLUE, null, false);
        this.surface.pads.lightEx (0, 2, P32DJ_BUTTON_STATE_PINK, null, false);
        this.surface.pads.lightEx (1, 2, P32DJ_BUTTON_STATE_PINK, null, false);
        this.surface.pads.lightEx (0, 1, P32DJ_BUTTON_STATE_RED, null, false);
        this.surface.pads.lightEx (1, 1, P32DJ_BUTTON_STATE_RED, null, false);
        this.surface.pads.lightEx (0, 0, P32DJ_BUTTON_STATE_RED, null, false);
        this.surface.pads.lightEx (1, 0, P32DJ_BUTTON_STATE_BLACK, null, false);
        for (var y = 0; y < 4; y++)
        {
            for (var x = 2; x < 8; x++)
                this.surface.pads.lightEx (x, y, P32DJ_BUTTON_STATE_BLACK, null, false);
        }
        return;
    }
    
    var isKeyboardEnabled = this.model.canSelectedTrackHoldNotes ();
    var isRecording = this.model.hasRecordingState ();
    for (var i = 36; i < 68; i++)
    {
        var index = i - 36;
        index = (3 - Math.floor (index / 8)) * 8 + index % 8;
        this.surface.pads.light (index, isKeyboardEnabled ? (this.pressedKeys[i] > 0 ?
            (isRecording ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_RED) :
            this.scales.getColor (this.noteMap, i)) : P32DJ_BUTTON_STATE_BLACK, null, false);
    }
};

MixView.prototype.drawPrgChangeGrid = function ()
{
    if (this.surface.isShiftPressed (true))
    {
        for (var i = 0; i < 4; i++)
            this.surface.pads.light (i, i == this.prgOffset ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_RED, null, false);
        for (var i = 8; i < 12; i++)
        {
            this.surface.pads.light (i, P32DJ_BUTTON_STATE_BLACK, null, false);
            this.surface.pads.light (i + 8, P32DJ_BUTTON_STATE_BLACK, null, false);
            this.surface.pads.light (i + 16, P32DJ_BUTTON_STATE_BLACK, null, false);
        }
        for (var i = 0; i < 16; i++)
            this.surface.pads.lightEx (4 + i % 4, 3 - Math.floor (i / 4), i == this.bankNumber ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_BLUE, null, false);
        return;
    }
    
    var prg = this.programNumber - this.prgOffset * 32;
    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 8; x++)
        {
            var isSelected = prg == (3 - y) * 8 + x;
            this.surface.pads.lightEx (x, y, isSelected ? P32DJ_BUTTON_STATE_RED : (y % 2 == 0 ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_PINK), null, false);
        }
    }
};

MixView.prototype.drawSessionGrid = function ()
{
    var tb = this.model.getTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var maxScenePads = Math.ceil (this.model.getSceneBank ().getSceneCount () / tb.numScenes);
        var maxTrackPads = Math.ceil (tb.getTrackCount () / tb.numTracks);
        var trackPosition = Math.floor (tb.getTrack (0).position / tb.numTracks);
        var scenePosition = Math.floor (tb.getScenePosition () / tb.numScenes);
        var selX = trackPosition;
        var selY = scenePosition;
        var padsX = 8; //this.columns;
        var padsY = this.rows;
        var offsetX = Math.floor (selX / padsX) * padsX;
        var offsetY = Math.floor (selY / padsY) * padsY;
        var maxX = (this.flip ? maxScenePads : maxTrackPads) - offsetX; 
        var maxY = (this.flip ? maxTrackPads : maxScenePads) - offsetY;
        selX -= offsetX;
        selY -= offsetY;
        
        var color = null;
        for (var x = 0; x < 8; x++)
        {
            var rowColor = x < maxX ? AbstractSessionView.CLIP_COLOR_HAS_CONTENT : AbstractSessionView.CLIP_COLOR_NO_CONTENT; 
            for (var y = 0; y < this.rows; y++)
            {
                color = y < maxY ? rowColor : AbstractSessionView.CLIP_COLOR_NO_CONTENT;
                if (selX == x && selY == y)
                    color = AbstractSessionView.CLIP_COLOR_IS_PLAYING;
                this.surface.pads.lightEx (x, y, color.color);
            }
        }
        
        
//        var scenePosition = Math.floor (tb.getScenePosition () / 4);
//        // Scene selection mode
//        for (var i = 0; i < 16; i++)
//        {
//            var y = i % 4;
//            var x = Math.floor (i / 4);
//            this.surface.pads.lightEx (x, y, i == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
//            this.surface.pads.lightEx (4 + x, y, (16 + i) == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
//        }
        return;
    }
    
    // Clips
    for (var x = 0; x < 8; x++)
    {
        var t = tb.getTrack (x);
        for (var y = 0; y < this.rows; y++)
            this.drawPad (t.slots[y], x, y);
    }
};

MixView.prototype.drawPad = function (slot, x, y)
{
    var color;
    if (slot.isPlaying)
        color = slot.isQueued ? AbstractSessionView.CLIP_COLOR_IS_PLAYING_QUEUED : AbstractSessionView.CLIP_COLOR_IS_PLAYING;
    else if (slot.hasContent)
        color = AbstractSessionView.CLIP_COLOR_HAS_CONTENT;
    else
        color = AbstractSessionView.CLIP_COLOR_NO_CONTENT;
    this.surface.pads.lightEx (x, y, color.color);
};

MixView.prototype.getPadColor = function (index, primary, hasDrumPads, isSoloed, isRecording)
{
    // Playing note?
    if (this.drumPressedKeys[this.offsetY + index] > 0)
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
    {
        this.pressedKeys[i] = 0;
        this.drumPressedKeys[i] = 0;
    }
};

MixView.prototype.isBrowserActive = function ()
{
    return this.model.getBrowser ().isActive ();
};
