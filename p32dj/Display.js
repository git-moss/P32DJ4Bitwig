// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var P32DJ_DIGIT_CODES = new Array ();

P32DJ_DIGIT_CODES[' '.charCodeAt (0)] = 0;
P32DJ_DIGIT_CODES['-'.charCodeAt (0)] = 1;
P32DJ_DIGIT_CODES['_'.charCodeAt (0)] = 8;
P32DJ_DIGIT_CODES["'".charCodeAt (0)] = 32;

P32DJ_DIGIT_CODES['A'.charCodeAt (0)] = 119;
P32DJ_DIGIT_CODES['b'.charCodeAt (0)] = 31;
P32DJ_DIGIT_CODES['C'.charCodeAt (0)] = 78;
P32DJ_DIGIT_CODES['c'.charCodeAt (0)] = 13;
P32DJ_DIGIT_CODES['d'.charCodeAt (0)] = 61;
P32DJ_DIGIT_CODES['E'.charCodeAt (0)] = 79;
P32DJ_DIGIT_CODES['F'.charCodeAt (0)] = 71;
P32DJ_DIGIT_CODES['G'.charCodeAt (0)] = 94;
P32DJ_DIGIT_CODES['H'.charCodeAt (0)] = 55;
P32DJ_DIGIT_CODES['h'.charCodeAt (0)] = 23;
P32DJ_DIGIT_CODES['I'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['i'.charCodeAt (0)] = 16;
P32DJ_DIGIT_CODES['r'.charCodeAt (0)] = 5;
P32DJ_DIGIT_CODES['L'.charCodeAt (0)] = 14;
P32DJ_DIGIT_CODES['l'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['n'.charCodeAt (0)] = 21;
P32DJ_DIGIT_CODES['o'.charCodeAt (0)] = 29;
P32DJ_DIGIT_CODES['P'.charCodeAt (0)] = 103;
P32DJ_DIGIT_CODES['S'.charCodeAt (0)] = 91;
P32DJ_DIGIT_CODES['U'.charCodeAt (0)] = 62;
P32DJ_DIGIT_CODES['u'.charCodeAt (0)] = 28;

P32DJ_DIGIT_CODES['0'.charCodeAt (0)] = 126;
P32DJ_DIGIT_CODES['1'.charCodeAt (0)] = 48;
P32DJ_DIGIT_CODES['2'.charCodeAt (0)] = 109;
P32DJ_DIGIT_CODES['3'.charCodeAt (0)] = 121;
P32DJ_DIGIT_CODES['4'.charCodeAt (0)] = 51;
P32DJ_DIGIT_CODES['5'.charCodeAt (0)] = 91;
P32DJ_DIGIT_CODES['6'.charCodeAt (0)] = 95;
P32DJ_DIGIT_CODES['7'.charCodeAt (0)] = 112;
P32DJ_DIGIT_CODES['8'.charCodeAt (0)] = 127;
P32DJ_DIGIT_CODES['9'.charCodeAt (0)] = 123;

function Display (output)
{
    this.output = output;

    this.currentDigits = initArray (-1, 4);
    this.digits = initArray ('0'.charCodeAt (0), 4);

    this.currentDots = initArray (-1, 2);
    this.dots = initArray (5, 2);
}

Display.prototype.setLeftDots = function (first, second)
{
    this.setDots (true, first, second);
};

Display.prototype.setRightDots = function (first, second)
{
    this.setDots (false, first, second);
};

Display.prototype.setDots = function (isLeft, first, second)
{
    var code = 5;
    if (first)
        code = second ? 14 : 12;
    else if (second)
        code = 13;
    this.dots[isLeft ? 0 : 1] = code;
};

Display.prototype.setLeftDisplay = function (code)
{
    this.setDisplay (true, code);
};

Display.prototype.setRightDisplay = function (code)
{
    this.setDisplay (false, code);
};

Display.prototype.setDisplay = function (isLeft, code)
{
    var letter1 = P32DJ_DIGIT_CODES[code.charCodeAt (0)];
    if (typeof (letter1) == 'undefined')
        letter1 = 0;
    var letter2 = P32DJ_DIGIT_CODES[code.charCodeAt (1)];
    if (typeof (letter2) == 'undefined')
        letter2 = 0;
    var index = isLeft ? 0 : 2;
    this.digits[index] = letter1;
    this.digits[index + 1] = letter2;
};

Display.prototype.invalidate = function (isLeft)
{
    var index = isLeft ? 0 : 2;
    this.digits[index] = 0;
    this.digits[index + 1] = 0;
};

Display.prototype.flush = function ()
{
    for (var i = 0; i < 2; i++)
    {
        var channel = 1 + i;
        
        if (this.dots[i] != this.currentDots[i])
        {
            this.currentDots[i] = this.dots[i];
            this.output.sendCCEx (channel, 0x1B, this.dots[i]);
            // Digits must always be redrawn if dots have changed
            this.invalidate (i == 0);
        }
        
        var offset = i * 2;
        for (var j = 0; j < 2; j++)
        {
            var index = offset + j;
            if (this.digits[index] != this.currentDigits[index])
            {
                this.currentDigits[index] = this.digits[index];
                this.output.sendCCEx (channel, 0x1C + j, this.digits[index]);
            }
        }
    }
};
