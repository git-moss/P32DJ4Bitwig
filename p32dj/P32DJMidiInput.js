// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

MidiInput.prototype.createNoteInput = function ()
{
    return this.createNoteInputBase ("P32DJ", [ "80????" /* Note off */, "90????" /* Note on */, "B0????" /* CCs */ ]);
};
