// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

DJView.TRACK_DECK_A_FX       = 1;
DJView.TRACK_DECK_A_PLAYBACK = 2;
DJView.TRACK_DECK_B_FX       = 7;
DJView.TRACK_DECK_B_PLAYBACK = 8;
DJView.TRACK_HEADPHONE       = 12;
DJView.TRACK_HEADPHONE_A     = 13;
DJView.TRACK_HEADPHONE_B     = 14;

function DJView (model)
{
    AbstractSessionView.call (this, model, model.numScenes, model.numTracks);
    
    this.deckA = this.model.getTrackBank ().trackBank.getTrack (DJView.TRACK_DECK_A_FX);
    this.deckB = this.model.getTrackBank ().trackBank.getTrack (DJView.TRACK_DECK_B_FX);
    
    this.deviceBankA = this.deckA.createDeviceBank (6);
    this.deviceBankB = this.deckB.createDeviceBank (6);
    for (var i = 1; i < 5; i++)
    {
        this.deviceBankA.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i - 1, DJView.prototype.handleIsEnabled));
        this.deviceBankB.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i + 3, DJView.prototype.handleIsEnabled));
    }
    
    this.deviceEnabled = initArray (true, 8);
}
DJView.prototype = new AbstractSessionView ();


DJView.prototype.updateButtons = function ()
{
    var tb = this.model.getTrackBank ();
    var track = null;
    for (var i = 0; i < 4; i++)
    {
        track = tb.getTrack (DJView.TRACK_DECK_A_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 1, this.deviceEnabled[i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 4, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
        track = tb.getTrack (DJView.TRACK_DECK_B_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 2, this.deviceEnabled[4 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 5, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    }
    
    track = tb.getTrack (DJView.TRACK_HEADPHONE_A);
    this.surface.updateButtonEx (P32DJ_PFL, 1, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    track = tb.getTrack (DJView.TRACK_HEADPHONE_B);
    this.surface.updateButtonEx (P32DJ_PFL, 2, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
};

DJView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (velocity == 0)
        return;
    
    var cols = 4;
    var index = note - 36;
    var col = index % cols;
    var s = (this.rows - 1) - Math.floor (index / cols);
    
    var tb = this.model.getTrackBank ();
    
    if (this.surface.isShiftPressed (true))
    {
        var pad = col + s * 4 + (isDeckA ? 0 : 16);
        tb.scrollToScene (4 * pad);
        // TODO Bugfix required - Call it twice to work around a Bitwig bug
        tb.scrollToScene (4 * pad);
        return;
    }

    var t = (isDeckA ? DJView.TRACK_DECK_A_PLAYBACK : DJView.TRACK_DECK_B_PLAYBACK) + col;
    var slots = tb.getClipLauncherSlots (t);
    slots.select (s);
    slots.launch (s);
};

DJView.prototype.drawGrid = function ()
{
    var tb = this.model.getTrackBank ();
    
    var scenePosition = Math.floor (tb.getScenePosition () / 4);
    
    if (this.surface.isShiftPressed (true))
    {
        for (var i = 0; i < 16; i++)
        {
            var x = i % 4;
            var y = Math.floor (i / 4);
            this.surface.pads.lightEx (x, y, i == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
            this.surface.pads.lightEx (4 + x, y, (16 + i) == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        }
    }
    else
    {
        for (var x = 0; x < 4; x++)
        {
            var t1 = tb.getTrack (DJView.TRACK_DECK_A_PLAYBACK + x);
            var t2 = tb.getTrack (DJView.TRACK_DECK_B_PLAYBACK + x);
            for (var y = 0; y < this.rows; y++)
            {
                this.drawPad (t1.slots[y], x, y);
                this.drawPad (t2.slots[y], 4 + x, y);
            }
        }
    }
};

DJView.prototype.drawPad = function (slot, x, y)
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

DJView.prototype.drawSceneButtons = function () {};

//
// Knobs
//

DJView.prototype.onBrowse = function (isShifted, value)
{
    this.model.getMasterTrack ().changeVolume (value, isShifted ? Config.fractionMinValue : Config.fractionValue);
};

DJView.prototype.onVolumeKnob = function (isDeckA, isShifted, value)
{
    if (isShifted)
        return;
    var tb = this.model.getTrackBank ();
    tb.setVolume (isDeckA ? DJView.TRACK_DECK_A_FX : DJView.TRACK_DECK_B_FX, value);
};

DJView.prototype.onLoopEncKnob = function (isDeckA, isShifted, value)
{
    if (isDeckA)
    {
        this.model.getTransport ().changeTempo (value < 64, isShifted);
        this.updateTempoDisplay ();
        return;
    }
    
    println("Loop Enc B");
};

DJView.prototype.updateTempoDisplay = function ()
{
    var parts = this.model.getTransport ().getTempo ().toString ().split ('.');
    var tempo = parts[0];
    
    if (tempo.length > 2)
    {
        digit = parseInt (tempo.substr (0, 1));
        if (digit == 1)
            this.surface.setLeftDots (true, false);
        else
            this.surface.setLeftDots (true, true);
        this.surface.setLeftDisplay (tempo.substr (1, 2));        
    }
    else
    {
        this.surface.setLeftDots (false, false);
        this.surface.setLeftDisplay (tempo);        
    }
    
    // TODO
    this.surface.setRightDisplay ('  ');        
};

DJView.prototype.onFilterKnob = function (isDeckA, isShifted, value)
{
    var isInc = value <= 63;
    var speed = isInc ? value : value - Config.maxParameterValue;
    speed = Config.fractionValue * speed;
    var param = isShifted ? "CONTENTS/RESONANCE" : "CONTENTS/CUTOFF";
    this.getDeviceBank (isDeckA).getDevice (0).incDirectParameterValueNormalized (param, speed, Config.maxParameterValue);
};

DJView.prototype.onEffectKnob = function (isDeckA, isShifted, fxNumber, value)
{
    // Volume control
    if (isShifted)
    {
        var tb = this.model.getTrackBank ();
        tb.setVolume (1 + fxNumber + (isDeckA ? DJView.TRACK_DECK_A_FX : DJView.TRACK_DECK_B_FX), value);
        return;
    }
    
    // Device control
    this.getDeviceBank (isDeckA).getDevice (1 + fxNumber).setDirectParameterValueNormalized ("CONTENTS/MIX", value, Config.maxParameterValue);
};


//
// Buttons
//

DJView.prototype.onHeadphoneVolume = function (event, isUp)
{
    this.handleScroller (event, isUp ? this.changeHeadphoneVolumeUp : this.changeHeadphoneVolumeDown);
};

DJView.prototype.changeHeadphoneVolumeUp = function ()
{
    this.changeHeadphoneVolume (true);
};

DJView.prototype.changeHeadphoneVolumeDown = function ()
{
    this.changeHeadphoneVolume (false);
};

DJView.prototype.changeHeadphoneVolume = function (isUp)
{
    var tb = this.model.getTrackBank ();
    tb.changeVolume (DJView.TRACK_HEADPHONE, isUp ? 1 : 126, Config.fractionValue);
};

DJView.prototype.onLoopButton = function (event, isDeckA)
{
    println ("Loop Button " + (isDeckA ? "A" : "B"));
};

DJView.prototype.onFilterOn = function (event, isDeckA, isShifted)
{
    if (!event.isDown () || isShifted)
        return;
    this.getDeviceBank (isDeckA).getDevice (0).toggleEnabledState ();
};


DJView.prototype.onEffectOn = function (event, isDeckA, isShifted, fxNumber)
{
    if (!event.isDown ())
        return;
    
    if (isShifted)
    {
        // Mute tracks
        var tb = this.model.getTrackBank ();
        tb.toggleMute ((isDeckA ? DJView.TRACK_DECK_A_PLAYBACK : DJView.TRACK_DECK_B_PLAYBACK) + fxNumber);
        return;
    }
    
    // +1 because first is the filter
    this.getDeviceBank (isDeckA).getDevice (1 + fxNumber).toggleEnabledState ();
};

DJView.prototype.onEQ = function (isDeckA, isShifted, param, value)
{
    if (isShifted)
        return;
    this.getDeviceBank (isDeckA).getDevice (5).getParameter (param).set (value, Config.maxParameterValue);
};

DJView.prototype.onSync = function (event, isDeckA)
{
    println ("onSync " + (isDeckA ? "A" : "B"));
};


DJView.prototype.onCue = function (event, isDeckA)
{
    println ("onCue " + (isDeckA ? "A" : "B"));
};


DJView.prototype.onPlayA = function (event)
{
    println ("onPlay A");
};


DJView.prototype.onMode = function (event, isDeckA, mode)
{
    println ("onMode " + (isDeckA ? "A" : "B") + ": " + mode);
};


DJView.prototype.onLoad = function (event, isDeckA)
{
    println ("onLoad " + (isDeckA ? "A" : "B"));
};


DJView.prototype.onPreFaderListen = function (event, isDeckA)
{
    if (event.isDown ())
        this.model.getTrackBank ().toggleMute (isDeckA ? DJView.TRACK_HEADPHONE_A : DJView.TRACK_HEADPHONE_B);
};

DJView.prototype.getDeviceBank = function (isDeckA)
{
    return isDeckA ? this.deviceBankA : this.deviceBankB;
};

DJView.prototype.handleIsEnabled = function (index, isEnabled)
{
    this.deviceEnabled[index] = isEnabled;
};
