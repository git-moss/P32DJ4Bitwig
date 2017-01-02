// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2014-2017
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var P32DJ_BUTTON_STATE_BLACK = 0;
var P32DJ_BUTTON_STATE_RED   = 125;
var P32DJ_BUTTON_STATE_BLUE  = 126;
var P32DJ_BUTTON_STATE_PINK  = 127;

function setP32Colors ()
{
    Scales.SCALE_COLOR_OFF          = P32DJ_BUTTON_STATE_BLACK;
    Scales.SCALE_COLOR_OCTAVE       = P32DJ_BUTTON_STATE_BLUE;
    Scales.SCALE_COLOR_NOTE         = P32DJ_BUTTON_STATE_PINK;
    Scales.SCALE_COLOR_OUT_OF_SCALE = P32DJ_BUTTON_STATE_BLACK;
    
    AbstractView.VIEW_SELECTED   = P32DJ_BUTTON_STATE_BLUE;
    AbstractView.VIEW_UNSELECTED = P32DJ_BUTTON_STATE_BLACK;
    AbstractView.VIEW_OFF        = P32DJ_BUTTON_STATE_BLACK;
    AbstractView.KEY_WHITE       = P32DJ_BUTTON_STATE_BLUE;
    AbstractView.KEY_BLACK       = P32DJ_BUTTON_STATE_RED;
    AbstractView.KEY_SELECTED    = P32DJ_BUTTON_STATE_BLUE;
    
    AbstractSessionView.CLIP_COLOR_IS_RECORDING        = { color: P32DJ_BUTTON_STATE_RED,   blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_IS_RECORDING_QUEUED = { color: P32DJ_BUTTON_STATE_RED,   blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_IS_PLAYING          = { color: P32DJ_BUTTON_STATE_RED,  blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_IS_PLAYING_QUEUED   = { color: P32DJ_BUTTON_STATE_PINK,  blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_HAS_CONTENT         = { color: P32DJ_BUTTON_STATE_BLUE,  blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_NO_CONTENT          = { color: P32DJ_BUTTON_STATE_BLACK, blink: null, fast: false };
    AbstractSessionView.CLIP_COLOR_RECORDING_ARMED     = { color: P32DJ_BUTTON_STATE_BLACK, blink: null, fast: false };
    AbstractSessionView.USE_CLIP_COLOR                 = false;

    // TODO
//    AbstractSequencerView.COLOR_STEP_HILITE_NO_CONTENT  = P32DJ_BUTTON_STATE_BLUE;
//    AbstractSequencerView.COLOR_STEP_HILITE_CONTENT     = P32DJ_BUTTON_STATE_BLUE;
//    AbstractSequencerView.COLOR_NO_CONTENT              = P32DJ_BUTTON_STATE_BLACK;
//    AbstractSequencerView.COLOR_CONTENT                 = P32DJ_BUTTON_STATE_RED;
//    AbstractSequencerView.COLOR_CONTENT_CONT            = P32DJ_BUTTON_STATE_RED;
    
//    DrumView.COLOR_RECORD         = P32DJ_BUTTON_STATE_RED;
//    DrumView.COLOR_PLAY           = P32DJ_BUTTON_STATE_BLUE;
//    DrumView.COLOR_SELECTED       = P32DJ_BUTTON_STATE_PINK_BLINK;
//    DrumView.COLOR_MUTED          = P32DJ_BUTTON_STATE_BLACK;
//    DrumView.COLOR_SOLO           = P32DJ_BUTTON_STATE_PINK;
//    DrumView.COLOR_HAS_CONTENT    = P32DJ_BUTTON_STATE_PINK;
//    DrumView.COLOR_NO_CONTENT     = P32DJ_BUTTON_STATE_BLACK;
//    DrumView.COLOR_MEASURE        = P32DJ_BUTTON_STATE_BLUE;
//    DrumView.COLOR_ACTIVE_MEASURE = P32DJ_BUTTON_STATE_PINK;
}