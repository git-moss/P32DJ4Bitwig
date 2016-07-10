// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var P32DJ_BUTTON_STATE_INVALID = -1;
var P32DJ_BUTTON_STATE_OFF = 0;
var P32DJ_BUTTON_STATE_ON = 0x7F;

// CC - Channel 0
var P32DJ_XFADER     = 1;  // 00 > 7F : Full Left > Full Right
var P32DJ_BROWSE_ENC = 2;  // 7F > 40 : CCW Slow > Fast, 01 > 3F : CW Slow >
// Fast

// CC - Channel 1 & 2
var P32DJ_VOL      = 1;
var P32DJ_LOW      = 2;
var P32DJ_MID      = 3;
var P32DJ_HIGH     = 4;
var P32DJ_FILTER   = 5;
var P32DJ_FX1_LVL  = 6;
var P32DJ_FX2_LVL  = 7;
var P32DJ_FX3_LVL  = 8;
var P32DJ_DRY_WET  = 9;
var P32DJ_LOOP_ENC = 10;

// CC - Channel 3
var P32DJ_SHIFT_BROWSE_ENC = 2; // 7F > 40 : CCW Slow > Fast, 01 > 3F : CW Slow > Fast

// Note controls - Channel 0
var P32DJ_BROWSE_BTN = 1; // 7F : Pressed - 00: Released
var P32DJ_REC        = 2; // -> Receives LED
var P32DJ_SLIP       = 3; // -> Receives LED
var P32DJ_VOL_UP     = 4;
var P32DJ_VOL_DOWN   = 5;

// Note controls - Channel 1
var P32DJ_LOOP_BTN   = 0x01;
var P32DJ_FILTER_ON  = 0x02;
var P32DJ_FX1_ON     = 0x03; // -> Receives LED
var P32DJ_FX2_ON     = 0x04; // -> Receives LED
var P32DJ_FX3_ON     = 0x05; // -> Receives LED
var P32DJ_MACROFX_ON = 0x06; // -> Receives LED
var P32DJ_SHIFT      = 0x07; // -> Receives LED
var P32DJ_SYNC       = 0x08; // -> Receives LED
var P32DJ_CUE        = 0x09; // -> Receives LED
var P32DJ_PLAY       = 0x0A; // -> Receives LED
var P32DJ_MODE1      = 0x0B; // -> LED Controlled by Firmware
var P32DJ_MODE2      = 0x0C; // -> LED Controlled by Firmware
var P32DJ_MODE3      = 0x0D; // -> LED Controlled by Firmware
var P32DJ_MODE4      = 0x0E; // -> LED Controlled by Firmware
var P32DJ_LOAD       = 0x0F;
var P32DJ_PFL        = 0x10; // -> Receives LED

// Note controls - Channel 3
var P32DJ_SHIFT_BROWSE_BTN = 1; // 7F : Pressed - 00: Released

// Note controls on channel 2 (91)
var P32DJ_SHIFT = 7;

var P32DJ_BUTTONS_ALL = [ 
    P32DJ_LOOP_BTN, 
    P32DJ_FILTER_ON, 
    P32DJ_FX1_ON, 
    P32DJ_FX2_ON, 
    P32DJ_FX3_ON, 
    P32DJ_MACROFX_ON, 
    P32DJ_SHIFT, 
    P32DJ_SYNC, 
    P32DJ_CUE, 
    P32DJ_PLAY, 
    P32DJ_MODE1, 
    P32DJ_MODE2, 
    P32DJ_MODE3, 
    P32DJ_MODE4, 
    P32DJ_LOAD, 
    P32DJ_PFL 
];

P32DJ.MODE_LEFT_SAMPLER  = 0;
P32DJ.MODE_LEFT_SLICER   = 1;
P32DJ.MODE_LEFT_LOOP     = 2;
P32DJ.MODE_LEFT_HOTCUE   = 3;
P32DJ.MODE_RIGHT_SAMPLER = 4;
P32DJ.MODE_RIGHT_SLICE   = 5;
P32DJ.MODE_RIGHT_LOOP    = 6;
P32DJ.MODE_RIGHT_HOTCUE  = 7;


function P32DJ (output, input)
{
    AbstractControlSurface.call (this, output, input, P32DJ_BUTTONS_ALL);

    for (var i = 36; i < 52; i++)
        this.gridNotes.push (i);

    this.shiftButtonId = -1;

    this.isShift = [ false, false ];
    this.isLeftSyncPressed = false;
    this.isLeftCuePressed  = false;
    this.isLeftPlayPressed = false;

    this.pads = new Grid (output);
    this.display = new Display (output);
    
    this.mode = P32DJ.MODE_LEFT_SAMPLER;
}
P32DJ.prototype = new AbstractControlSurface ();

P32DJ.prototype.getMode = function ()
{
    return this.mode;
};

P32DJ.prototype.setButton = function (button, state)
{
    this.output.sendCC (button, state);
};

P32DJ.prototype.shutdown = function ()
{
    this.pads.turnOff ();
};

P32DJ.prototype.isSelectPressed = function ()
{
    return false;
};

P32DJ.prototype.isShiftPressed = function (isDeckA)
{
    return this.isShift[isDeckA ? 0 : 1];
};

// Note: Weird to send to the DAW via P32DJ...
P32DJ.prototype.sendMidiEvent = function (status, data1, data2)
{
    this.noteInput.sendRawMidiEvent (status, data1, data2);
};

// --------------------------------------
// Handlers
// --------------------------------------

P32DJ.prototype.handleMidi = function (status, data1, data2)
{
    var code = status & 0xF0;
    var channel = status & 0xF;

    switch (code)
    {
        // Note on
        case 0x90:
            this.handleButtons (channel, data1, data2);
            break;

        // CC
        case 0xB0:
            this.handleCC (channel, data1, data2);
            break;
    }
};

P32DJ.prototype.handleCC = function (channel, cc, value)
{
    var view = this.getActiveView ();
    if (view == null)
        return;

    switch (channel)
    {
        case 0:
            switch (cc)
            {
                case P32DJ_XFADER:
                    view.onCrossfader (value);
                    break;

                case P32DJ_BROWSE_ENC:
                    view.onBrowse (false, value);
                    break;

                default:
                    println ("Unused CC: " + cc + " on channel 0");
                    break;
            }
            break;

        case 1:
        case 2:
        case 4:
        case 5:
            var isDeckA = channel == 1 || channel == 4;
            var isShifted = channel == 4 || channel == 5;
            switch (cc)
            {
                case P32DJ_VOL:
                    view.onVolumeKnob (isDeckA, isShifted, value);
                    break;

                case P32DJ_LOW:
                    view.onEQ (isDeckA, isShifted, 0, value);
                    break;

                case P32DJ_MID:
                    view.onEQ (isDeckA, isShifted, 1, value);
                    break;

                case P32DJ_HIGH:
                    view.onEQ (isDeckA, isShifted, 2, value);
                    break;

                case P32DJ_FILTER:
                    view.onFilterKnob (isDeckA, isShifted, value);
                    break;

                case P32DJ_FX1_LVL:
                case P32DJ_FX2_LVL:
                case P32DJ_FX3_LVL:
                case P32DJ_DRY_WET:
                    view.onEffectKnob (isDeckA, isShifted, cc - P32DJ_FX1_LVL, value);
                    break;

                case P32DJ_LOOP_ENC:
                    view.onLoopEncKnob (isDeckA, isShifted, value);
                    break;

                default:
                    println ("Unused CC: " + cc + " on channel " + channel);
                    break;
            }
            break;

        case 3:
            switch (cc)
            {
                case P32DJ_SHIFT_BROWSE_ENC:
                    view.onBrowse (true, value);
                    break;

                default:
                    println ("Unused CC: " + cc + " on channel 3");
                    break;
            }
            break;

        default:
            println ("Unused Midi Channel: " + channel);
            break;
    }
};

P32DJ.prototype.handleButtons = function (channel, note, value)
{
    if (this.isButton (note))
    {
        this.buttonStates[note] = value > 0 ? ButtonEvent.DOWN : ButtonEvent.UP;
        if (this.buttonStates[note] == ButtonEvent.DOWN)
        {
            // Long press only for volume buttons so we do not need to support
            // the midi channel
            if (note == P32DJ_VOL_UP || note == P32DJ_VOL_DOWN)
            {
                scheduleTask (function (object, buttonID)
                {
                    object.checkButtonState (buttonID);
                }, [ this, note ], AbstractControlSurface.buttonStateInterval);
            }
        }

        // If consumed flag is set ignore the UP event
        if (this.buttonStates[note] == ButtonEvent.UP && this.buttonConsumed[note])
        {
            this.buttonConsumed[note] = false;
            return;
        }
    }

    this.handleEvent (note, value, channel);
};

P32DJ.prototype.checkButtonState = function (buttonID)
{
    if (this.buttonStates[buttonID] != ButtonEvent.DOWN)
        return;

    this.buttonStates[buttonID] = ButtonEvent.LONG;
    this.handleEvent (buttonID, 127, 0);
};

P32DJ.prototype.handleEvent = function (note, value, channel)
{
    var view = this.getActiveView ();
    if (view == null)
        return;

    var event = this.isButton (note) ? new ButtonEvent (this.buttonStates[note]) : null;

    if (channel == 0)
    {
        switch (note)
        {
            case P32DJ_BROWSE_BTN:
                view.onBrowseButton (event);
                break;

            case P32DJ_REC:
                view.onRecord (event);
                break;

            case P32DJ_SLIP:
                view.onSlip (event);
                break;

            case P32DJ_VOL_UP:
                view.onHeadphoneVolume (event, true);
                break;

            case P32DJ_VOL_DOWN:
                view.onHeadphoneVolume (event, false);
                break;
        }
        return;
    }

    if (channel == 3)
    {
        switch (note)
        {
            case P32DJ_BROWSE_BTN:
                view.onBrowseButton (event);
                break;
        }
        return;
    }

    var isDeckA = channel == 1 || channel == 4;
    var isShifted = channel == 4 || channel == 5;

    switch (note)
    {
        case P32DJ_LOOP_BTN:
            view.onLoopButton (event, isDeckA);
            break;

        case P32DJ_FILTER_ON:
            view.onFilterOn (event, isDeckA, isShifted);
            break;

        case P32DJ_FX1_ON:
        case P32DJ_FX2_ON:
        case P32DJ_FX3_ON:
        case P32DJ_MACROFX_ON:
            view.onEffectOn (event, isDeckA, isShifted, note - P32DJ_FX1_ON);
            break;

        case P32DJ_SHIFT:
            this.isShift[channel - 1] = event.isDown ();
            break;

        case P32DJ_SYNC:
            if (isDeckA)
            {
                this.isLeftSyncPressed = event.isDown ();
                view.onSyncA (event);
            }
            else
                view.onSyncB (event);
            break;

        case P32DJ_CUE:
            if (isDeckA)
            {
                this.isLeftCuePressed = event.isDown ();
                view.onCueA (event);
            }
            else
                view.onCueB (event);
            break;

        case P32DJ_PLAY:
            if (isDeckA)
            {
                this.isLeftPlayPressed = event.isDown ();
                view.onPlayA (event);
            }
            else
                view.onPlayB (event);
            break;

        case P32DJ_MODE1:
        case P32DJ_MODE2:
        case P32DJ_MODE3:
        case P32DJ_MODE4:
            var m = note - P32DJ_MODE1;
            this.mode = 3 - m + (isDeckA ? 0 : 4);
            view.onMode (event, isDeckA, m);
            if (isDeckA)
                this.pads.setModeLeft (m);
            else
                this.pads.setModeRight (m);
            break;

        case P32DJ_LOAD:
            view.onLoad (event, isDeckA);
            break;

        case P32DJ_PFL:
            view.onPreFaderListen (event, isDeckA);
            break;

        default:
            if (note >= 36 && note <= 51)
            {
                view.onGridNote (event, isDeckA, isShifted, note, value);
                return;
            }
            if (note >= 52 && note <= 67)
            {
                view.onGridNote (event, isDeckA, isShifted, note - 16, value);
                return;
            }
            if (note >= 68 && note <= 83)
            {
                view.onGridNote (event, isDeckA, isShifted, note - 32, value);
                return;
            }
            if (note >= 84 && note <= 99)
            {
                view.onGridNote (event, isDeckA, isShifted, note - 48, value);
                return;
            }

            println ("Unused note: " + note);
            break;
    }
};

P32DJ.prototype.setButtonEx = function (button, channel, state)
{
    this.output.sendNoteEx (channel, button, state);
};
