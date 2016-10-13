// Written by Jürgen Moßgraber - mossgrabers.de
// (c) 2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

load ("framework/core/AbstractConfig.js");

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

Config.LIMIT_VOLUME_TO_0DB = 20;

Config.limitVolume = false;

Config.initListeners (Config.LIMIT_VOLUME_TO_0DB);


Config.init = function ()
{
    var prefs = host.getPreferences ();

    ///////////////////////////
    // Scale

    Config.activateScaleSetting (prefs);
    Config.activateScaleBaseSetting (prefs);
    Config.activateScaleInScaleSetting (prefs);
    
    ///////////////////////////
    // Workflow
    
    Config.limitVolumeSetting = prefs.getEnumSetting ("Limit Volume to 0dB", "Workflow", [ "On", "Off" ], "Off");
    Config.limitVolumeSetting.addValueObserver (function (value)
    {
        Config.limitVolume = value == "On";
        Config.notifyListeners (Config.LIMIT_VOLUME_TO_0DB);
    });

    Config.activateBehaviourOnStopSetting (prefs);
    Config.activateSelectClipOnLaunchSetting (prefs);
};
