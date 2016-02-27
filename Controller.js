// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function Controller ()
{
    Config.init ();

    var output = new MidiOutput ();
    
    var input = new P32DJMidiInput ();

    this.scales = new Scales (36,   // Start note 
                              51,   // End note
                              4,    // Number of columns
                              4);   // Number of rows

    this.model = new Model (0,              // The MIDI CC at which the user parameters start
                            this.scales,    // The scales object
                            15,             // The number of track to monitor (per track bank)
                            4,              // The number of scenes to monitor (per scene bank)
                            6,              // The number of sends to monitor
                            6,              // The number of filters columns in the browser to monitor
                            16,             // The number of entries in one filter column to monitor
                            16,             // The number of search results in the browser to monitor
                            true);          // Don't navigate groups, all tracks are flat (if true)    
    
    this.surface = new P32DJ (output, input);
    
    this.surface.addView (VIEW_DJ, new DJView (this.model));
    // this.surface.addView (VIEW_DEVICE, new DeviceView (this.model));
    // this.surface.addView (VIEW_PLAY, new PlayView (this.model));
    // this.surface.addView (VIEW_DRUM, new DrumView (this.model));
    // this.surface.addView (VIEW_SEQUENCER, new SequencerView (this.model));
    // this.surface.addView (VIEW_SESSION, new SessionView (this.model));
    // this.surface.addView (VIEW_BROWSER, new BrowserView (this.model));
    // this.surface.addView (VIEW_SHIFT, new ShiftView (this.model));
    
    this.surface.setActiveView (VIEW_DJ);
}
Controller.prototype = new AbstractController ();
