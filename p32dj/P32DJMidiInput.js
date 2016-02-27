// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function P32DJMidiInput ()
{
    MidiInput.call (this);
}

P32DJMidiInput.prototype = new MidiInput ();

P32DJMidiInput.prototype.createNoteInput = function ()
{
    // TODO
    var noteInput = this.port.createNoteInput ("P32DJ",
                                               "80????",  // Note off
                                               "90????",  // Note on
                                               "B0????"); // CCs
    noteInput.setShouldConsumeEvents (false);
    return noteInput;
};
