// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var P32DJ_BUTTON_STATE_INVALID = -1;
var P32DJ_BUTTON_STATE_OFF     = 0;
var P32DJ_BUTTON_STATE_ON      = 0x7F;

//CC - Channel 0
var P32DJ_XFADER           = 1;       // 00 > 7F : Full Left > Full Right
var P32DJ_BROWSE_ENC       = 2;       // 7F > 40 : CCW Slow > Fast, 01 > 3F : CW Slow > Fast

// CC - Channel 1 & 2
var P32DJ_VOL              = 1;
var P32DJ_LOW              = 2;
var P32DJ_MID              = 3;
var P32DJ_HIGH             = 4;
var P32DJ_FILTER           = 5;
var P32DJ_FX1_LVL          = 6;
var P32DJ_FX2_LVL          = 7;
var P32DJ_FX3_LVL          = 8;
var P32DJ_DRY_WET          = 9;
var P32DJ_LOOP_ENC         = 10;

// CC - Channel 3
var P32DJ_SHIFT_BROWSE_ENC = 2;       // 7F > 40 : CCW Slow > Fast, 01 > 3F : CW Slow > Fast

// Note controls - Channel 0
var P32DJ_BROWSE_BTN       = 1;      // 7F : Pressed - 00: Released
var P32DJ_REC              = 2;      // -> Receives LED
var P32DJ_SLIP             = 3;      // -> Receives LED
var P32DJ_VOL_UP           = 4;
var P32DJ_VOL_DOWN         = 5;

// Note controls - Channel 1
var P32DJ_LOOP_BTN         = 0x01;
var P32DJ_FILTER_ON        = 0x02;
var P32DJ_FX1_ON           = 0x03;   // -> Receives LED
var P32DJ_FX2_ON           = 0x04;   // -> Receives LED
var P32DJ_FX3_ON           = 0x05;   // -> Receives LED
var P32DJ_MACROFX_ON       = 0x06;   // -> Receives LED
var P32DJ_SHIFT            = 0x07;   // -> Receives LED
var P32DJ_SYNC             = 0x08;   // -> Receives LED
var P32DJ_CUE              = 0x09;   // -> Receives LED
var P32DJ_PLAY             = 0x0A;   // -> Receives LED
var P32DJ_MODE1            = 0x0B;   // -> LED Controlled by Firmware
var P32DJ_MODE2            = 0x0C;   // -> LED Controlled by Firmware
var P32DJ_MODE3            = 0x0D;   // -> LED Controlled by Firmware
var P32DJ_MODE4            = 0x0E;   // -> LED Controlled by Firmware
var P32DJ_LOAD             = 0x0F;
var P32DJ_PFL              = 0x10;   // -> Receives LED

// Note controls - Channel 3
var P32DJ_SHIFT_BROWSE_BTN = 1;      // 7F : Pressed - 00: Released


// Note controls on channel 2 (91)
var P32DJ_SHIFT      = 7;


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


//Display_Both_A  B1 1B Value "0..11 = loop size 1/32 to 64 
//12…14 = “. “, “ .”, “. .”
//15…127  custom to be defined"
//Display_DG1_A   B1 1C   1 bit for each segment from 0 to 7F
//Display_DG2_A   B1 1D   1 bit for each segment from 0 to 7F

//Display_Both_B  B2 1B Value "0..11 = loop size 1/32 to 64 
//12…14 = “. “, “ .”, “. .”
//15…127  custom to be defined"
//Display_DG1_B   B2 1C   1 bit for each segment from 0 to 7F
//Display_DG2_B   B2 1D   1 bit for each segment from 0 to 7F

var P32DJ_DIGIT_CODES = new Array ();

P32DJ_DIGIT_CODES[' '.charCodeAt (0)] = 0;
P32DJ_DIGIT_CODES['-'.charCodeAt (0)] = 1;
P32DJ_DIGIT_CODES['_'.charCodeAt (0)] = 8;
P32DJ_DIGIT_CODES["'".charCodeAt (0)] = 32;

P32DJ_DIGIT_CODES['A'.charCodeAt (0)] = 119;
P32DJ_DIGIT_CODES['b'.charCodeAt (0)] = 31;
P32DJ_DIGIT_CODES['C'.charCodeAt (0)] = 78;
P32DJ_DIGIT_CODES['c'.charCodeAt (0)] = 13;
P32DJ_DIGIT_CODES['d'.charCodeAt (0)] = 61;
P32DJ_DIGIT_CODES['E'.charCodeAt (0)] = 79;
P32DJ_DIGIT_CODES['F'.charCodeAt (0)] = 71;
P32DJ_DIGIT_CODES['G'.charCodeAt (0)] = 94;
P32DJ_DIGIT_CODES['H'.charCodeAt (0)] = 55;
P32DJ_DIGIT_CODES['h'.charCodeAt (0)] = 23;
P32DJ_DIGIT_CODES['I'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['i'.charCodeAt (0)] = 16;
P32DJ_DIGIT_CODES['r'.charCodeAt (0)] = 5;
P32DJ_DIGIT_CODES['L'.charCodeAt (0)] = 14;
P32DJ_DIGIT_CODES['l'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['n'.charCodeAt (0)] = 21;
P32DJ_DIGIT_CODES['o'.charCodeAt (0)] = 29;
P32DJ_DIGIT_CODES['P'.charCodeAt (0)] = 103;
P32DJ_DIGIT_CODES['S'.charCodeAt (0)] = 91;
P32DJ_DIGIT_CODES['U'.charCodeAt (0)] = 62;
P32DJ_DIGIT_CODES['u'.charCodeAt (0)] = 28;

P32DJ_DIGIT_CODES['0'.charCodeAt (0)] = 126;
P32DJ_DIGIT_CODES['1'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['2'.charCodeAt (0)] = 109;
P32DJ_DIGIT_CODES['3'.charCodeAt (0)] = 121;
P32DJ_DIGIT_CODES['4'.charCodeAt (0)] = 51;
P32DJ_DIGIT_CODES['5'.charCodeAt (0)] = 91;
P32DJ_DIGIT_CODES['6'.charCodeAt (0)] = 95;
P32DJ_DIGIT_CODES['7'.charCodeAt (0)] = 112;
P32DJ_DIGIT_CODES['8'.charCodeAt (0)] = 127;
P32DJ_DIGIT_CODES['9'.charCodeAt (0)] = 123;


function P32DJ (output, input)
{
    AbstractControlSurface.call (this, output, input, P32DJ_BUTTONS_ALL);

    // TODO
    for (var i = 36; i < 52; i++)
        this.gridNotes.push (i);
    
    this.shiftButtonId  = -1;
    
    this.isShift = [ false, false ];
    
    this.pads = new Grid (output);
}
P32DJ.prototype = new AbstractControlSurface ();

P32DJ.prototype.handleGridNote = function (note, velocity)
{
    AbstractControlSurface.prototype.handleGridNote.call (this, note, velocity);

    if (note < 36 || note > 51)
        return;
    
    // Force a redraw on button up because the light was also modified on the controller
    scheduleTask (doObject (this, function ()
    {
        this.pads.invalidate (note - 36);
    }), null, 100);
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

P32DJ.prototype.setLeftDots = function (first, second)
{
    var code = 5;
    if (first)
        code = second ? 14 : 12;
    else if (second)
        code = 13;
    this.output.sendCCEx (1, 0x1B, code);
};

P32DJ.prototype.setRightDots = function (first, second)
{
    var code = 5;
    if (first)
        code = second ? 14 : 12;
    else if (second)
        code = 13;
    this.output.sendCCEx (2, 0x1B, code);
};

P32DJ.prototype.setLeftDisplay = function (code)
{
    var letter1 = P32DJ_DIGIT_CODES[code.charCodeAt (0)];
    if (typeof (letter1) == 'undefined')
        letter1 = 0;
    var letter2 = P32DJ_DIGIT_CODES[code.charCodeAt (1)];
    if (typeof (letter2) == 'undefined')
        letter2 = 0;
    this.output.sendCCEx (1, 0x1C, letter1);
    this.output.sendCCEx (1, 0x1D, letter2);
};

P32DJ.prototype.setRightDisplay = function (code)
{
    var letter1 = P32DJ_DIGIT_CODES[code.charCodeAt (0)];
    if (typeof (letter1) == 'undefined')
        letter1 = 0;
    var letter2 = P32DJ_DIGIT_CODES[code.charCodeAt (1)];
    if (typeof (letter2) == 'undefined')
        letter2 = 0;
    this.output.sendCCEx (2, 0x1C, letter1);
    this.output.sendCCEx (2, 0x1D, letter2);
};

//--------------------------------------
// Handlers
//--------------------------------------

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
            scheduleTask (function (object, buttonID)
            {
                object.checkButtonState (buttonID);
            }, [this, note], AbstractControlSurface.buttonStateInterval);
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
            case  P32DJ_BROWSE_BTN:
                // TODO
                println ("P32DJ_BROWSE_BTN");
                break;
                
            case  P32DJ_REC:
                // TODO
                println ("P32DJ_REC");
                break;
            
            case  P32DJ_SLIP:
                // TODO
                println ("P32DJ_SLIP");
                break;
            
            case  P32DJ_VOL_UP:
                view.onHeadphoneVolume (event, true);
                break;
            
            case  P32DJ_VOL_DOWN:
                view.onHeadphoneVolume (event, false);
                break;
        }
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
            view.onSync (event, isDeckA);
            break;

        case P32DJ_CUE:
            view.onCue (event, isDeckA);
            break;

        case P32DJ_PLAY:
            view.onPlay (event, isDeckA);
            break;

        case P32DJ_MODE1:
        case P32DJ_MODE2:
        case P32DJ_MODE3:
        case P32DJ_MODE4:
            view.onMode (event, isDeckA, note - P32DJ_MODE1);
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
            
            println ("Unused note: " + note);
            break;
    }
};

P32DJ.prototype.setButtonEx = function (button, channel, state)
{
    this.output.sendNoteEx (channel, button, state);
};
