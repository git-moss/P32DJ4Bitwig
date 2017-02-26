// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016-2017
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

GlobalConfig.DISPLAY_TEXT_LENGTH = 30;
GlobalConfig.MASTER_TRACK_TEXT_LENGTH = GlobalConfig.DISPLAY_TEXT_LENGTH;
GlobalConfig.TRACK_BANK_TEXT_LENGTH = GlobalConfig.DISPLAY_TEXT_LENGTH;
GlobalConfig.CURSOR_DEVICE_TEXT_LENGTH = GlobalConfig.DISPLAY_TEXT_LENGTH;


function Controller ()
{
    Config.init ();

    this.scales = new Scales (36, // Start note
                              68, // End note
                              8,  // Number of columns
                              4); // Number of rows

    this.model = new Model (this.scales, // The scales object
                            8,     // The number of track to monitor (per track bank)
                            4,     // The number of scenes to monitor (per scene bank)
                            8,     // The number of sends to monitor
                            16,    // The number of entries in one filter column to monitor
                            16,    // The number of search results in the browser to monitor
                            true,  // Don't navigate groups, all tracks are flat (if true)
                            8,     // The number of parameter of a device to monitor
                            16);   // The number of devices to monitor 
   
    var input = new MidiInput ();
    var output = new MidiOutput ();
    this.surface = new P32DJ (output, input);

    this.surface.addView (VIEW_DJ, new DJView (this.model));
    this.surface.addView (VIEW_MIX, new MixView (this.model));
    this.surface.addView (VIEW_DEVICE, new DeviceView (this.model));

    this.surface.addViewChangeListener (doObject (this, function (prevViewID, viewID)
    {
        this.updateIndication ();
    }));

    Config.addPropertyListener (Config.SCALES_SCALE, doObject (this, function ()
    {
        this.scales.setScaleByName (Config.scale);
        var view = this.surface.getActiveView ();
        if (view != null)
            view.updateNoteMapping ();
    }));
    Config.addPropertyListener (Config.SCALES_BASE, doObject (this, function ()
    {
        this.scales.setScaleOffsetByName (Config.scaleBase);
        var view = this.surface.getActiveView ();
        if (view != null)
            view.updateNoteMapping ();
    }));
    Config.addPropertyListener (Config.SCALES_IN_KEY, doObject (this, function ()
    {
        this.scales.setChromatic (!Config.scaleInKey);
        var view = this.surface.getActiveView ();
        if (view != null)
            view.updateNoteMapping ();
    }));
    
    this.model.getTrackBank ().addTrackSelectionListener (doObject (this, Controller.prototype.updateIndication));

    this.surface.setActiveView (VIEW_MIX);
}
Controller.prototype = new AbstractController ();

Controller.prototype.updateIndication = function ()
{
    this.model.getMasterTrack ().setVolumeIndication (true);

    var tb = this.model.getCurrentTrackBank ();

    var isMix = this.surface.isActiveView (VIEW_MIX);
    var isDevice = this.surface.isActiveView (VIEW_DEVICE);

    var selectedTrack = tb.getSelectedTrack ();
    var device = this.model.getDevice ();
    for (var i = 0; i < 8; i++)
    {
        var hasTrackSel = selectedTrack != null && selectedTrack.index == i;
        tb.setVolumeIndication (i, isMix);
        tb.setPanIndication (i, isMix);
        for (var j = 0; j < 8; j++)
            tb.setSendIndication (i, j, hasTrackSel && isMix && isDevice);
        device.getParameter (i).setIndication (isDevice);
    }
};
