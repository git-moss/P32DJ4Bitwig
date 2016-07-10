// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

// ------------------------------
// Static configurations
// ------------------------------

// Inc/Dec of knobs
Config.fractionValue     = 6;
Config.fractionMinValue  = 1;
Config.maxParameterValue = 128;

// ------------------------------
// Editable configurations
// ------------------------------

Config.SCALES_SCALE        = 0;
Config.SCALES_BASE         = 1;
Config.SCALES_IN_KEY       = 2;
Config.LIMIT_VOLUME_TO_0DB = 3;

Config.scale       = 'Major';
Config.scaleBase   = 'C';
Config.scaleInKey  = true;
Config.limitVolume = false;

Config.init = function ()
{
    var prefs = host.getPreferences ();

    ///////////////////////////
    // Scale

    var scaleNames = Scales.getNames ();
    Config.scaleSetting = prefs.getEnumSetting ("Scale", "Scales", scaleNames, scaleNames[0]);
    Config.scaleSetting.addValueObserver (function (value)
    {
        Config.scale = value;
        Config.notifyListeners (Config.SCALES_SCALE);
    });
    
    Config.scaleBaseSetting = prefs.getEnumSetting ("Base", "Scales", Scales.BASES, Scales.BASES[0]);
    Config.scaleBaseSetting.addValueObserver (function (value)
    {
        Config.scaleBase = value;
        Config.notifyListeners (Config.SCALES_BASE);
    });

    Config.scaleInScaleSetting = prefs.getEnumSetting ("In Key", "Scales", [ "In Key", "Chromatic" ], "In Key");
    Config.scaleInScaleSetting.addValueObserver (function (value)
    {
        Config.scaleInKey = value == "In Key";
        Config.notifyListeners (Config.SCALES_IN_KEY);
    });


    ///////////////////////////
    // Workflow
    
    Config.limitVolumeSetting = prefs.getEnumSetting ("Limit Volume to 0dB", "Workflow", [ "On", "Off" ], "Off");
    Config.limitVolumeSetting.addValueObserver (function (value)
    {
        Config.limitVolume = value == "On";
        Config.notifyListeners (Config.LIMIT_VOLUME_TO_0DB);
    });
};

Config.setScale = function (scale)
{
    Config.scaleSetting.set (scale);
};

Config.setScaleBase = function (scaleBase)
{
    Config.scaleBaseSetting.set (scaleBase);
};

Config.setScaleInScale = function (inScale)
{
    Config.scaleInScaleSetting.set (inScale ? "In Key" : "Chromatic");
};

// ------------------------------
// Property listeners
// ------------------------------

Config.listeners = [];
for (var i = 0; i <= Config.LIMIT_VOLUME_TO_0DB; i++)
    Config.listeners[i] = [];

Config.addPropertyListener = function (property, listener)
{
    Config.listeners[property].push (listener);
};

Config.notifyListeners = function (property)
{
    var ls = Config.listeners[property];
    for (var i = 0; i < ls.length; i++)
        ls[i].call (null);
};

function Config () {}
