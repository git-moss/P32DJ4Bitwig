// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

DJView.TRACK_DECK_A_FX = 1;
DJView.TRACK_DECK_A_PLAYBACK = 2;
DJView.TRACK_DECK_B_FX = 7;
DJView.TRACK_DECK_B_PLAYBACK = 8;
DJView.TRACK_HEADPHONE = 12;
DJView.TRACK_HEADPHONE_A = 13;
DJView.TRACK_HEADPHONE_B = 14;

function DJView (model)
{
    AbstractSessionView.call (this, model, model.numScenes, model.numTracks);

    this.trackBank = new TrackBankProxy (15, model.numScenes, 0, true);

    this.deckA = this.trackBank.trackBank.getTrack (DJView.TRACK_DECK_A_FX);
    this.deckB = this.trackBank.trackBank.getTrack (DJView.TRACK_DECK_B_FX);

    this.deviceBankA = this.deckA.createDeviceBank (6);
    this.deviceBankB = this.deckB.createDeviceBank (6);
    for (var i = 0; i < 6; i++)
    {
        this.deviceBankA.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i, DJView.prototype.handleIsEnabledA));
        this.deviceBankB.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i, DJView.prototype.handleIsEnabledB));
    }

    this.deviceEnabledA = initArray (true, 6);
    this.deviceEnabledB = initArray (true, 6);
}
DJView.prototype = new AbstractSessionView ();

DJView.prototype.onLoad = function (event, isDeckA)
{
// TODO API extension required - Open browser to browse songs
};

DJView.prototype.onEQ = function (isDeckA, isShifted, param, value)
{
    if (isShifted)
        return;
    this.getDeviceBank (isDeckA).getDevice (5).getParameter (param).set (value, Config.maxParameterValue);
};

DJView.prototype.updateButtons = function ()
{
    var tb = this.trackBank;
    var track = null;
    for (var i = 0; i < 4; i++)
    {
        track = tb.getTrack (DJView.TRACK_DECK_A_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 1, this.deviceEnabledA[1 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 4, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
        track = tb.getTrack (DJView.TRACK_DECK_B_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 2, this.deviceEnabledB[1 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 5, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    }

    track = tb.getTrack (DJView.TRACK_HEADPHONE_A);
    this.surface.updateButtonEx (P32DJ_PFL, 1, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    track = tb.getTrack (DJView.TRACK_HEADPHONE_B);
    this.surface.updateButtonEx (P32DJ_PFL, 2, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);

    this.surface.updateButtonEx (P32DJ_REC, 0, this.deviceEnabledA[5] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_SLIP, 0, this.deviceEnabledB[5] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
};

DJView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (velocity == 0)
        return;

    var cols = 4;
    var index = note - 36;
    var col = index % cols;
    var s = (this.rows - 1) - Math.floor (index / cols);

    var tb = this.trackBank;

    if (this.surface.isShiftPressed (true))
    {
        var pad = col + s * 4 + (isDeckA ? 0 : 16);
        tb.scrollToScene (4 * pad);
        return;
    }

    if (this.surface.isShiftPressed (false))
    {
        this.switchView (index);
        return;
    }

    var t = (isDeckA ? DJView.TRACK_DECK_A_PLAYBACK : DJView.TRACK_DECK_B_PLAYBACK) + col;
    var slots = tb.getClipLauncherSlots (t);

    if (this.surface.isLeftSyncPressed)
    {
        slots.stop ();
        return;
    }

    slots.select (s);
    slots.launch (s);
};

DJView.prototype.drawGrid = function ()
{
    if (this.surface.isShiftPressed (false))
    {
        this.drawViewSelection ();
        return;
    }

    var tb = this.trackBank;

    if (this.surface.isShiftPressed (true))
    {
        var scenePosition = Math.floor (tb.getScenePosition () / 4);
        // Scene selection mode
        for (var i = 0; i < 16; i++)
        {
            var x = i % 4;
            var y = Math.floor (i / 4);
            this.surface.pads.lightEx (x, y, i == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
            this.surface.pads.lightEx (4 + x, y, (16 + i) == scenePosition ? P32DJ_BUTTON_STATE_PINK : P32DJ_BUTTON_STATE_BLACK);
        }
        return;
    }

    // Clips
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

DJView.prototype.onVolumeKnob = function (isDeckA, isShifted, value)
{
    if (isShifted)
        return;
    var tb = this.trackBank;
    tb.setVolume (isDeckA ? DJView.TRACK_DECK_A_FX : DJView.TRACK_DECK_B_FX, value);
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
        var tb = this.trackBank;
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
    var tb = this.trackBank;
    tb.changeVolume (DJView.TRACK_HEADPHONE, isUp ? 1 : 126, Config.fractionValue);
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
        var tb = this.trackBank;
        tb.toggleMute ((isDeckA ? DJView.TRACK_DECK_A_PLAYBACK : DJView.TRACK_DECK_B_PLAYBACK) + fxNumber);
        return;
    }

    // +1 because first is the filter
    this.getDeviceBank (isDeckA).getDevice (1 + fxNumber).toggleEnabledState ();
};

DJView.prototype.onRecord = function (event)
{
    if (event.isDown ())
        this.getDeviceBank (true).getDevice (5).toggleEnabledState ();
};

DJView.prototype.onSlip = function (event)
{
    if (event.isDown ())
        this.getDeviceBank (false).getDevice (5).toggleEnabledState ();
};

DJView.prototype.onPreFaderListen = function (event, isDeckA)
{
    if (event.isDown ())
        this.trackBank.toggleMute (isDeckA ? DJView.TRACK_HEADPHONE_A : DJView.TRACK_HEADPHONE_B);
};

DJView.prototype.getDeviceBank = function (isDeckA)
{
    return isDeckA ? this.deviceBankA : this.deviceBankB;
};

DJView.prototype.handleIsEnabledA = function (index, isEnabled)
{
    this.deviceEnabledA[index] = isEnabled;
};

DJView.prototype.handleIsEnabledB = function (index, isEnabled)
{
    this.deviceEnabledB[index] = isEnabled;
};
