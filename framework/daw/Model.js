// Written by Jürgen Moßgraber - mossgrabers.de
//            Michael Schmalle - teotigraphix.com
// (c) 2014-2017
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function Model (scales,                    // The scales object
                numTracks,                 // The number of track to monitor (per track bank)
                numScenes,                 // The number of scenes to monitor (per scene bank)
                numSends,                  // The number of sends to monitor
                numFilterColumnEntries,    // The number of entries in one filter column to monitor
                numResults,                // The number of search results in the browser to monitor
                hasFlatTrackList,          // Don't navigate groups, all tracks are flat
                numParams,                 // The number of parameter of a device to monitor
                numDevicesInBank,          // The number of devices to monitor
                numDeviceLayers,           // The number of device layers to monitor
                numDrumPadLayers           // The number of drum pad layers to monitor
               )
{
    if (scales == null)
        return;
    
    this.numTracks              = numTracks ? numTracks : 8;
    this.numScenes              = numScenes ? numScenes : 8;
    this.numSends               = numSends  ? numSends  : 6;
    this.numFilterColumnEntries = numFilterColumnEntries ? numFilterColumnEntries : 16;
    this.numResults             = numResults ? numResults : 16;
    this.hasFlatTrackList       = hasFlatTrackList ? true : false;
    this.numParams              = numParams ? numParams : 8;
    this.numDevicesInBank       = numDevicesInBank ? numDevicesInBank : 8;
    this.numDeviceLayers        = numDeviceLayers ? numDeviceLayers : 8;
    this.numDrumPadLayers       = numDrumPadLayers ? numDrumPadLayers : 16;

    this.application = new ApplicationProxy ();
    this.transport = new TransportProxy ();
    this.groove = new GrooveProxy ();
    this.masterTrack = new MasterTrackProxy ();
    this.cursorTrack = host.createArrangerCursorTrack (0, 0);
    this.trackBank = new TrackBankProxy (this.cursorTrack, this.numTracks, this.numScenes, this.numSends, this.hasFlatTrackList);
    this.effectTrackBank = new EffectTrackBankProxy (this.cursorTrack, this.numTracks, this.numScenes, this.trackBank);
    this.primaryDevice = new CursorDeviceProxy (this.cursorTrack.createCursorDevice ("FIRST_INSTRUMENT", "First Instrument", this.numSends, CursorDeviceFollowMode.FIRST_INSTRUMENT), this.numSends);

    this.cursorDevice = new CursorDeviceProxy (host.createEditorCursorDevice (this.numSends), this.numSends);
    this.sceneBank = new SceneBankProxy (this.numScenes);

    this.project = host.getProject ();
    this.arranger = new ArrangerProxy ();
    this.mixer = new MixerProxy ();
    
    this.browser = new BrowserProxy (this.cursorTrack, this.cursorDevice, this.numFilterColumnEntries, this.numResults);

    this.currentTrackBank = this.trackBank;
    this.scales = scales;
}

/**
 * @returns {Scales}
 */
Model.prototype.getScales = function ()
{
    return this.scales;
};

Model.prototype.hasSelectedDevice = function ()
{
    return this.cursorDevice.hasSelectedDevice ();
};

Model.prototype.getSelectedDevice = function ()
{
    return this.cursorDevice.getSelectedDevice ();
};

Model.prototype.getPrimaryDevice = function ()
{
    return this.primaryDevice;
};

Model.prototype.getProject = function () { return this.project; };

/**
 * @returns {ArrangerProxy}
 */
Model.prototype.getArranger = function () { return this.arranger; };


/**
 * @returns {MixerProxy}
 */
Model.prototype.getMixer = function () { return this.mixer; };

/**
 * @returns {TransportProxy}
 */
Model.prototype.getTransport = function () { return this.transport; };

/**
 * @returns {GrooveProxy}
 */
Model.prototype.getGroove = function () { return this.groove; };

/**
 * @returns {MasterTrackProxy}
 */
Model.prototype.getMasterTrack = function () { return this.masterTrack; };

Model.prototype.toggleCurrentTrackBank = function ()
{
    this.currentTrackBank = this.currentTrackBank === this.trackBank ? this.effectTrackBank : this.trackBank;
};

Model.prototype.isEffectTrackBankActive = function ()
{
    return this.currentTrackBank === this.effectTrackBank;
};

/**
 * @returns {AbstractTrackBankProxy}
 */
Model.prototype.getCurrentTrackBank = function ()
{
    return this.currentTrackBank;
};

/**
 * @returns {TrackBankProxy}
 */
Model.prototype.getTrackBank = function () { return this.trackBank; };

/**
 * @returns {EffectTrackBankProxy}
 */
Model.prototype.getEffectTrackBank = function () { return this.effectTrackBank; };

/**
 * @returns {CursorDeviceProxy}
 */
Model.prototype.getCursorDevice = function () { return this.cursorDevice; };


/**
 * Get the selected device.
 * 
 * @returns {CursorDeviceProxy}
 */
Model.prototype.getDevice = function ()
{
    return this.getCursorDevice ();
};

/**
 * @returns {ApplicationProxy}
 */
Model.prototype.getApplication = function ()
{
    return this.application;
};

/**
 * @returns {SceneBankProxy}
 */
Model.prototype.getSceneBank = function ()
{
    return this.sceneBank;
};

/**
 * @returns {BrowserProxy}
 */
Model.prototype.getBrowser = function ()
{
    return this.browser;
};

/**
 * @returns {CursorClipProxy}
 */
Model.prototype.createCursorClip = function (cols, rows)
{
    return new CursorClipProxy (cols, rows);
};

/**
 * Returns true if session recording is enabled, a clip is recording 
 * or overdub is enabled.
 */
Model.prototype.hasRecordingState = function ()
{
    return this.transport.isRecording ||
           this.transport.isLauncherOverdub ||
           this.currentTrackBank.isClipRecording ();
};

Model.prototype.getQuartersPerMeasure = function ()
{
    return 4 * this.transport.getNumerator () / this.transport.getDenominator ();
};

Model.prototype.canSelectedTrackHoldNotes = function ()
{
    var t = this.getCurrentTrackBank ().getSelectedTrack ();
    return t != null && t.canHoldNotes;
};
