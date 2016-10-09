// Written by Jürgen Moßgraber - mossgrabers.de
//            Michael Schmalle - teotigraphix.com
// (c) 2014-2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function MidiInput ()
{
}

MidiInput.prototype.init = function ()
{
    this.port = host.getMidiInPort (0);
};

MidiInput.prototype.setMidiCallback = function (f)
{
    this.port.setMidiCallback (f);
};

MidiInput.prototype.setSysexCallback = function (f)
{
    this.port.setSysexCallback (f);
};

MidiInput.prototype.createNoteInputBase = function (name, filters)
{
    var noteInput = this.port.createNoteInput (name, filters);
    noteInput.setShouldConsumeEvents (false);
    return noteInput;
};
