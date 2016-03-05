// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function DeviceView (model)
{
    if (model == null)
        return;

    MixView.call (this, model);

    this.deviceBank = model.getTrackBank ().cursorTrack.createDeviceBank (8);
    this.fxDeviceBank = model.getEffectTrackBank ().cursorTrack.createDeviceBank (8);
    for (var i = 0; i < 8; i++)
    {
        this.deviceBank.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i, DeviceView.prototype.handleIsEnabledDevice));
        this.fxDeviceBank.getDevice (i).addIsEnabledObserver (doObjectIndex (this, i, DeviceView.prototype.handleIsEnabledDeviceFX));
    }
    this.deviceEnabled = initArray (false, 8);
    this.deviceEnabledFX = initArray (false, 8);
    
    
}
DeviceView.prototype = new MixView ();

DeviceView.prototype.onSyncA = function (event)
{
    if (!event.isDown ())
        return;
    var device = this.model.getDevice ();
    if (device.hasSelectedDevice ())
        device.toggleWindowOpen ();
};

DeviceView.prototype.onBrowseButton = function (event)
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

DeviceView.prototype.onBrowse = function (isShifted, value)
{
    if (this.isBrowserActive ())
    {
        var session = this.model.getBrowser ().getPresetSession ();            
        if (value < 64)
        {
            session.selectNextResult ();
            if (session.getSelectedResultIndex () == session.numResults - 1)
                session.nextResultPage ();
        }
        else
        {
            session.selectPreviousResult ();
            if (session.getSelectedResultIndex () == 0)
                session.previousResultPage ();
        }
        return;
    }
    
    AbstractView.prototype.onBrowse.call (this, isShifted, value);
};

DeviceView.prototype.onEQ = function (isDeckA, isShifted, param, value)
{
    var index = param + (isDeckA ? 2 : 5);
    this.model.getDevice ().getMacro (index).getAmount ().set (value, Config.maxParameterValue);
};

DeviceView.prototype.onFilterOn = function (event, isDeckA, isShifted)
{
    if (!event.isDown ())
        return;
    var index = isDeckA ? 0 : 1;
    this.model.getDevice ().getMacro (index).getAmount ().reset ();
};

DeviceView.prototype.onFilterKnob = function (isDeckA, isShifted, value)
{
    if (this.isBrowserActive ())
    {
        var session = this.model.getBrowser ().getPresetSession ();            
        filterColumn = isDeckA ? 5 : 3;
        if (value < 64)
        {
            session.selectNextFilterItem (filterColumn);
            if (session.getSelectedFilterItemIndex (filterColumn) == session.numFilterColumnEntries - 1)
                session.nextFilterItemPage (filterColumn);
        }
        else
        {
            session.selectPreviousFilterItem (filterColumn);
            if (session.getSelectedFilterItemIndex (filterColumn) == 0)
                session.previousFilterItemPage (filterColumn);
        }
        return;
    }
    
    var index = isDeckA ? 0 : 1;
    var param = this.model.getDevice ().getMacroParam (index);
    var v = changeValue (value, param.value, isShifted ? Config.fractionMinValue : Config.fractionValue, Config.maxParameterValue);
    this.model.getDevice ().getMacro (index).getAmount ().set (v, Config.maxParameterValue);
};

DeviceView.prototype.onEffectKnob = function (isDeckA, isShifted, fxNumber, value)
{
    if (isShifted)
        return;

    var cd = this.model.getDevice ();
    var index = (isDeckA ? 0 : 4) + fxNumber;
    cd.setParameter (index, value);
};

DeviceView.prototype.onEffectOn = function (event, isDeckA, isShifted, fxNumber)
{
    if (!event.isDown ())
        return;

    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();
    if (selectedTrack == null)
        return;

    var index = (isDeckA ? 0 : 4) + fxNumber;
    this.getDeviceBank ().getDevice (index).toggleEnabledState ();
};

DeviceView.prototype.updateButtons = function ()
{
    var states = this.model.isEffectTrackBankActive () ? this.deviceEnabled : this.deviceEnabledFX;
    for (var i = 0; i < 4; i++)
    {
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 1, states[i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 4, states[i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);

        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 2, states[4 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
        this.surface.updateButtonEx (P32DJ_FX1_ON + i, 5, states[4 + i] ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    }

    var tb = this.model.getCurrentTrackBank ();
    var selectedTrack = tb.getSelectedTrack ();

    this.surface.updateButtonEx (P32DJ_PFL, 1, selectedTrack != null && selectedTrack.solo ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_PFL, 2, selectedTrack != null && selectedTrack.mute ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);

    var transport = this.model.getTransport ();
    this.surface.updateButtonEx (P32DJ_REC, 0, transport.isRecording ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
    this.surface.updateButtonEx (P32DJ_SLIP, 0, transport.isLauncherOverdub ? P32DJ_BUTTON_STATE_ON : P32DJ_BUTTON_STATE_OFF);
};

DeviceView.prototype.onGridNote = function (event, isDeckA, isShifted, note, velocity)
{
    if (velocity == 0)
        return;

    var cols = 4;
    var index = note - 36;
    var col = index % cols;

    var tb = this.model.getCurrentTrackBank ();

    if (this.surface.isShiftPressed (true))
    {
        var device = this.model.getDevice ();
        if (!device.hasSelectedDevice ())
            return;
            
        var s = (this.rows - 1) - Math.floor (index / cols);
        var pad = col + s * 4;

        if (isDeckA)
        {
            var deviceBanks = this.calcDeviceBanks ();
            if (deviceBanks.pages.length > 0 && deviceBanks.pages[pad] && deviceBanks.pages[pad].length > 0)
            {
                displayNotification ("Device " + (pad + 1) + ": " + deviceBanks.pages[pad]);
                device.selectSibling (pad);
            }
        }
        else
        {
            device.setSelectedParameterPage (pad);
            var paramBanks = this.calcParamBanks ();
            displayNotification ("Parameter Bank " + (pad + 1) + ": " + paramBanks.pages[pad]);
        }
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

DeviceView.prototype.drawGrid = function ()
{
    if (this.surface.isShiftPressed (true))
    {
        var deviceBanks = this.calcDeviceBanks ();
        var paramBanks = this.calcParamBanks ();
        for (var i = 0; i < 16; i++)
        {
            var x = i % 4;
            var y = Math.floor (i / 4);
            this.surface.pads.lightEx (x, y, deviceBanks.pages.length > 0 && deviceBanks.pages[i] && deviceBanks.pages[i].length > 0 ? (i == deviceBanks.page ? P32DJ_BUTTON_STATE_RED : P32DJ_BUTTON_STATE_PINK) : P32DJ_BUTTON_STATE_BLACK);
            this.surface.pads.lightEx (4 + x, y, paramBanks != null && i == paramBanks.page ? P32DJ_BUTTON_STATE_RED : (paramBanks != null && i < paramBanks.pages.length ? P32DJ_BUTTON_STATE_BLUE : P32DJ_BUTTON_STATE_BLACK));
        }
        return;
    }

    MixView.prototype.drawGrid.call (this);
};

DeviceView.prototype.getDeviceBank = function ()
{
    return this.model.isEffectTrackBankActive () ? this.fxDeviceBank : this.deviceBank;
};

DeviceView.prototype.handleIsEnabledDevice = function (index, isEnabled)
{
    this.deviceEnabled[index] = isEnabled;
};

DeviceView.prototype.handleIsEnabledDeviceFX = function (index, isEnabled)
{
    this.deviceEnabledFX[index] = isEnabled;
};

DeviceView.prototype.calcDeviceBanks = function ()
{
    var pages = [];
    var cd = this.model.getDevice ();
    for (var i = 0; i < 16; i++)
        pages.push (cd.getSiblingDeviceName (i));
    return { pages: pages, page: cd.getPositionInBank (), offset: 0 };
};

DeviceView.prototype.calcParamBanks = function ()
{
    var device = this.model.getDevice ();
    var pages = device.getParameterPageNames ();
    var page = device.getSelectedParameterPage ();
    if (pages == null || pages.length == 0)
        return null;
    if (page >= pages.length || page < 0)
        page = 0;
    return { pages : pages, page : page, offset : Math.floor (page / 8) * 8 };
};

DeviceView.prototype.isBrowserActive = function ()
{
    return this.model.getBrowser ().getPresetSession ().isActive;
};
