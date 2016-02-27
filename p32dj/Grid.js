// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function Grid (output)
{
    this.output = output;

    this.rows = 4;
    this.columns = 8;
    
    this.arraySize = this.rows * this.columns;
    this.currentButtonColors = initArray (P32DJ_BUTTON_STATE_OFF, this.arraySize);
    this.buttonColors = initArray (P32DJ_BUTTON_STATE_OFF, this.arraySize);
}

Grid.prototype.light = function (index, color)
{
    this.buttonColors[index] = color;
};

Grid.prototype.lightEx = function (x, y, color)
{
    this.buttonColors[x + this.columns * y] = color;
};

// Forces redraw of grid button
Grid.prototype.invalidate = function (index)
{
    this.currentButtonColors[index] = P32DJ_BUTTON_STATE_INVALID;
};

// Forces redraw of all grid buttons
Grid.prototype.redraw = function (index)
{
    for (var i = 0; i < this.arraySize; i++)
        this.invalidate (i);
};

Grid.prototype.flush = function ()
{
    for (var i = 0; i < this.arraySize; i++)
    {
        if (this.currentButtonColors[i] == this.buttonColors[i])
            continue;
        this.currentButtonColors[i] = this.buttonColors[i];
        this.setPadColor (i, this.buttonColors[i]);
    }
};

Grid.prototype.turnOff = function ()
{
    for (var i = 0; i < this.arraySize; i++)
        this.buttonColors[i] = P32DJ_BUTTON_STATE_OFF;
    this.flush ();
};

Grid.prototype.setPadColor = function (index, color)
{
    var col = index % 8;
    var channel = col < 4 ? 1 : 2;
    if (col >= 4)
        col -= 4;
    var pad = 36 + (3 - Math.floor (index / 8)) * 4 + col;
    this.output.sendNoteEx (channel, pad, color);
    this.output.sendNoteEx (3 + channel, pad, color);
};
