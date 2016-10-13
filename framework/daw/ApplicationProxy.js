// Written by Jürgen Moßgraber - mossgrabers.de
//            Michael Schmalle - teotigraphix.com
// (c) 2014-2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function ApplicationProxy ()
{
    this.application = host.createApplication ();
    
    this.panelLayout = 'ARRANGE';
    this.engineActive = false;

    this.application.addPanelLayoutObserver (doObject (this, ApplicationProxy.prototype.handlePanelLayout), 10);
    this.application.addHasActiveEngineObserver (doObject (this, ApplicationProxy.prototype.handleHasActiveEngine));
}

/**
 * Returns whether the current project's audio engine is active.
 *
 * @return {boolean}
 * @see ApplicationProxy.setEngineActive()
 */
ApplicationProxy.prototype.isEngineActive = function ()
{
    return this.engineActive;
};

/**
 * Returns whether the current Bitwig panel layout is ARRANGE.
 *
 * @return {boolean}
 * @see ApplicationProxy.setPanelLayout()
 */
ApplicationProxy.prototype.isArrangeLayout = function ()
{
    return this.panelLayout == 'ARRANGE';
};

/**
 * Returns whether the current Bitwig panel layout is MIX.
 *
 * @return {boolean}
 * @see ApplicationProxy.setPanelLayout()
 */
ApplicationProxy.prototype.isMixerLayout = function ()
{
    return this.panelLayout == 'MIX';
};

/**
 * Returns whether the current Bitwig panel layout is EDIT.
 *
 * @return {boolean}
 * @see ApplicationProxy.setPanelLayout()
 */
ApplicationProxy.prototype.isEditLayout = function ()
{
    return this.panelLayout == 'EDIT';
};

/**
 * Sets whether the active project's audio engine is active.
 *
 * @param {boolean} active Current project's engine active.
 */
ApplicationProxy.prototype.setEngineActive = function (active)
{
    if (active)
        this.application.activateEngine();
    else
        this.application.deactivateEngine();
};

/**
 * Toggles the active project's audio engine on/off.
 *
 * @see ApplicationProxy.setEngineActive()
 */
ApplicationProxy.prototype.toggleEngineActive = function ()
{
    this.setEngineActive (!this.engineActive);
};

/**
 * Switches the Bitwig Studio user interface to the panel layout with the given name.
 *
 * @param panelLayout {string} the name of the new panel layout (ARRANGE, MIX, EDIT)
 */
ApplicationProxy.prototype.setPanelLayout = function (panelLayout)
{
    this.application.setPanelLayout (panelLayout);
};

/**
 * Returns the active panel layout (ARRANGE, MIX or EDIT).
 * @returns {string} (ARRANGE, MIX or EDIT)
 */
ApplicationProxy.prototype.getPanelLayout = function ()
{
    return this.panelLayout;
};

/**
 * Toggles the visibility of the note editor panel.
 */
ApplicationProxy.prototype.toggleNoteEditor = function ()
{
    this.application.toggleNoteEditor ();
};

/**
 * Toggles the visibility of the automation editor panel.
 */
ApplicationProxy.prototype.toggleAutomationEditor = function ()
{
    this.application.toggleAutomationEditor ();
};

/**
 * Toggles the visibility of the device chain panel.
 */
ApplicationProxy.prototype.toggleDevices = function ()
{
    this.application.toggleDevices ();
};

/**
 * Toggles the visibility of the inspector panel.
 */
ApplicationProxy.prototype.toggleInspector = function ()
{
    this.application.toggleInspector ();
};

/**
 * Toggles the visibility of the mixer panel.
 */
ApplicationProxy.prototype.toggleMixer = function ()
{
    this.application.toggleMixer ();
};

/**
 * Toggles between full screen and windowed user interface.
 */
ApplicationProxy.prototype.toggleFullScreen = function ()
{
    this.application.toggleFullScreen ();
};

/**
 * Toggles the visibility of the browser panel.
 */
ApplicationProxy.prototype.toggleBrowserVisibility = function()
{
    this.application.toggleBrowserVisibility ();
};

/**
 * Duplicates the active selection in Bitwig Studio if applicable.
 */
ApplicationProxy.prototype.duplicate = function ()
{
    this.application.duplicate ();
};

/**
 * Deletes the selected items in Bitwig Studio if applicable.
 */
ApplicationProxy.prototype.deleteSelection = function ()
{
    this.application.remove ();
};

/**
 * Sends a redo command to Bitwig Studio.
 */
ApplicationProxy.prototype.redo = function ()
{
    this.application.redo ();
};

/**
 * Sends an undo command to Bitwig Studio.
 */
ApplicationProxy.prototype.undo = function ()
{
    this.application.undo ();
};

/**
 * Not implemented.
 */
ApplicationProxy.prototype.addEffect = function ()
{
    displayNotification ("Add Effect: Function not supported (yet).");
};

/**
 * Creates a new audio track.
 */
ApplicationProxy.prototype.addAudioTrack = function ()
{
    this.application.createAudioTrack (-1);
};

/**
 * Creates a new effect track.
 */
ApplicationProxy.prototype.addEffectTrack = function ()
{
    this.application.createEffectTrack (-1);
};

/**
 * Creates a new instrument track.
 */
ApplicationProxy.prototype.addInstrumentTrack = function ()
{
    this.application.createInstrumentTrack (-1);
};

/**
 * Equivalent to an Arrow-Left key stroke on the computer keyboard.
 * The concrete functionality depends on the current keyboard focus in Bitwig Studio.
 */
ApplicationProxy.prototype.arrowKeyLeft = function ()
{
    this.application.arrowKeyLeft ();
};

/**
 * Equivalent to an Arrow-Up key stroke on the computer keyboard.
 * The concrete functionality depends on the current keyboard focus in Bitwig Studio.
 */
ApplicationProxy.prototype.arrowKeyUp = function ()
{
    this.application.arrowKeyUp ();
};

/**
 * Equivalent to an Arrow-Right key stroke on the computer keyboard.
 * The concrete functionality depends on the current keyboard focus in Bitwig Studio.
 */
ApplicationProxy.prototype.arrowKeyRight = function ()
{
    this.application.arrowKeyRight ();
};

/**
 * Equivalent to an Arrow-Down key stroke on the computer keyboard.
 * The concrete functionality depends on the current keyboard focus in Bitwig Studio.
 */
ApplicationProxy.prototype.arrowKeyDown = function ()
{
    this.application.arrowKeyDown ();
};

//--------------------------------------
// Actions
//--------------------------------------

/**
 * Returns the action for the given action identifier.
 * @see Application.getAction()
 * @param id the action identifier string, must not be `null`
 * @returns {Action}
 */
ApplicationProxy.prototype.getAction  = function (id)
{
    return this.application.getAction (id);
};

/**
 * Returns a list of action categories that is used by Bitwig Studio to group actions
 * into categories.
 * @see Application.getActionCategories()
 * @returns {ActionCategory[]}
 */
ApplicationProxy.prototype.getActionCategories  = function ()
{
    return this.application.getActionCategories ();
};

/**
 * Returns the action category associated with the given identifier.
 * @see Application.getActionCategory()
 * @param id the category identifier string, must not be `null`
 * @returns {ActionCategory}
 */
ApplicationProxy.prototype.getActionCategory   = function (id)
{
    return this.application.getActionCategory  (id);
};

/**
 * Returns a list of actions that the application supports.
 * @see Application.getActions()
 * @returns {Action[]}
 */
ApplicationProxy.prototype.getActions  = function ()
{
    return this.application.getActions ();
};

//--------------------------------------
// Callback Handlers
//--------------------------------------

ApplicationProxy.prototype.handlePanelLayout = function (panelLayout)
{
    this.panelLayout = panelLayout;
};

ApplicationProxy.prototype.handleHasActiveEngine = function (active)
{
    this.engineActive = active;
};
