// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function MixView (model)
{
    AbstractView.call (this, model);
}
MixView.prototype = new AbstractView ();

MixView.prototype.updateButtons = function ()
{
    var tb = this.model.getTrackBank ();
    var track = null;
    for (var i = 0; i < 4; i++)
    {
        track = tb.getTrack (MixView.TRACK_DECK_A_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 1, this.deviceEnabledA[1 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 4, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
        track = tb.getTrack (MixView.TRACK_DECK_B_PLAYBACK + i);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 2, this.deviceEnabledB[1 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 5, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    }

    track = tb.getTrack (MixView.TRACK_HEADPHONE_A);
    this.surface.updateButtonEx (P32DJ_PFL, 1, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);
    track = tb.getTrack (MixView.TRACK_HEADPHONE_B);
    this.surface.updateButtonEx (P32DJ_PFL, 2, track.mute ? P32DJ_BUTTON_STATE_OFF : P32DJ_BUTTON_STATE_ON);

    this.surface.updateButtonEx (P32DJ_REC, 0, this.deviceEnabledA[5] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_SLIP, 0, this.deviceEnabledB[5] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
};

MixView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
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
        return;
    }

    var t = (isDeckA ? MixView.TRACK_DECK_A_PLAYBACK : MixView.TRACK_DECK_B_PLAYBACK) + col;
    var slots = tb.getClipLauncherSlots (t);

    if (this.surface.isLeftSyncPressed)
    {
        slots.stop ();
        return;
    }

    slots.select (s);
    slots.launch (s);
};

MixView.prototype.drawGrid = function ()
{
    var tb = this.model.getTrackBank ();
    var scenePosition = Math.floor (tb.getScenePosition () / 4);

    if (this.surface.isShiftPressed (true))
    {
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

    if (this.surface.isShiftPressed (false))
    {
        this.drawViewSelection ();
        return;
    }

    // Clips 
    for (var x = 0; x < 4; x++)
    {
        var t1 = tb.getTrack (MixView.TRACK_DECK_A_PLAYBACK + x);
        var t2 = tb.getTrack (MixView.TRACK_DECK_B_PLAYBACK + x);
        for (var y = 0; y < this.rows; y++)
        {
            this.drawPad (t1.slots[y], x, y);
            this.drawPad (t2.slots[y], 4 + x, y);
        }
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

//
// Knobs
//

MixView.prototype.onBrowse = function (isShifted, value)
{
    this.model.getMasterTrack ().changeVolume (value, isShifted ? Config.fractionMinValue : Config.fractionValue);
};

MixView.prototype.onVolumeKnob = function (isDeckA, isShifted, value)
{
    if (isShifted)
        return;
    var tb = this.model.getTrackBank ();
    tb.setVolume (isDeckA ? MixView.TRACK_DECK_A_FX : MixView.TRACK_DECK_B_FX, value);
};

MixView.prototype.onFilterKnob = function (isDeckA, isShifted, value)
{
    var isInc = value <= 63;
    var speed = isInc ? value : value - Config.maxParameterValue;
    speed = Config.fractionValue * speed;
    var param = isShifted ? "CONTENTS/RESONANCE" : "CONTENTS/CUTOFF";
    this.getDeviceBank (isDeckA).getDevice (0).incDirectParameterValueNormalized (param, speed, Config.maxParameterValue);
};

MixView.prototype.onEffectKnob = function (isDeckA, isShifted, fxNumber, value)
{
    // Volume control
    if (isShifted)
    {
        var tb = this.model.getTrackBank ();
        tb.setVolume (1 + fxNumber + (isDeckA ? MixView.TRACK_DECK_A_FX : MixView.TRACK_DECK_B_FX), value);
        return;
    }

    // Device control
    this.getDeviceBank (isDeckA).getDevice (1 + fxNumber).setDirectParameterValueNormalized ("CONTENTS/MIX", value, Config.maxParameterValue);
};

//
// Buttons
//

MixView.prototype.onHeadphoneVolume = function (event, isUp)
{
    this.handleScroller (event, isUp ? this.changeHeadphoneVolumeUp : this.changeHeadphoneVolumeDown);
};

MixView.prototype.changeHeadphoneVolumeUp = function ()
{
    this.changeHeadphoneVolume (true);
};

MixView.prototype.changeHeadphoneVolumeDown = function ()
{
    this.changeHeadphoneVolume (false);
};

MixView.prototype.changeHeadphoneVolume = function (isUp)
{
    var tb = this.model.getTrackBank ();
    tb.changeVolume (MixView.TRACK_HEADPHONE, isUp ? 1 : 126, Config.fractionValue);
};

MixView.prototype.onFilterOn = function (event, isDeckA, isShifted)
{
    if (!event.isDown () || isShifted)
        return;
    this.getDeviceBank (isDeckA).getDevice (0).toggleEnabledState ();
};

MixView.prototype.onEffectOn = function (event, isDeckA, isShifted, fxNumber)
{
    if (!event.isDown ())
        return;

    if (isShifted)
    {
        // Mute tracks
        var tb = this.model.getTrackBank ();
        tb.toggleMute ((isDeckA ? MixView.TRACK_DECK_A_PLAYBACK : MixView.TRACK_DECK_B_PLAYBACK) + fxNumber);
        return;
    }

    // +1 because first is the filter
    this.getDeviceBank (isDeckA).getDevice (1 + fxNumber).toggleEnabledState ();
};

MixView.prototype.onEQ = function (isDeckA, isShifted, param, value)
{
    if (isShifted)
        return;
    this.getDeviceBank (isDeckA).getDevice (5).getParameter (param).set (value, Config.maxParameterValue);
};

MixView.prototype.onRecord = function (event)
{
    if (event.isDown ())
        this.getDeviceBank (true).getDevice (5).toggleEnabledState ();
};

MixView.prototype.onSlip = function (event)
{
    if (event.isDown ())
        this.getDeviceBank (false).getDevice (5).toggleEnabledState ();
};

MixView.prototype.onSyncA = function (event, isDeckA)
{
// Not used println ("onSync A");
};

MixView.prototype.onCueA = function (event, isDeckA)
{
// Not used println ("onCue A");
};

MixView.prototype.onPlayA = function (event)
{
// Not used println ("onPlay A");
};

MixView.prototype.onMode = function (event, isDeckA, mode)
{
// TODO API extension required - Pad modes
// Pads (Slicer) - Change loop length (8 temporary and 8 fixed) around current
// play position
// Pads (Loop) - Loop Start/End

};

MixView.prototype.onLoad = function (event, isDeckA)
{
// TODO API extension required - Open browser to browse songs
};

MixView.prototype.onPreFaderListen = function (event, isDeckA)
{
    if (event.isDown ())
        this.model.getTrackBank ().toggleMute (isDeckA ? MixView.TRACK_HEADPHONE_A : MixView.TRACK_HEADPHONE_B);
};

MixView.prototype.getDeviceBank = function (isDeckA)
{
    return isDeckA ? this.deviceBankA : this.deviceBankB;
};

MixView.prototype.handleIsEnabledA = function (index, isEnabled)
{
    this.deviceEnabledA[index] = isEnabled;
};

MixView.prototype.handleIsEnabledB = function (index, isEnabled)
{
    this.deviceEnabledB[index] = isEnabled;
};
