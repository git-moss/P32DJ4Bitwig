// Written by Jürgen Moßgraber - mossgrabers.de
//            Michael Schmalle - teotigraphix.com
// (c) 2014-2016
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function BrowserSessionProxy (session, textLength, numFilterColumns, numFilterColumnEntries, numResults)
{
    this.session = session;
    this.textLength = textLength;
    this.numFilterColumns = numFilterColumns;
    this.numFilterColumnEntries = numFilterColumnEntries;
    this.numResults = numResults;

    this.isActive = false;    
    this.selectedResult = null;
    
    session.addIsActiveObserver (doObject (this, BrowserSessionProxy.prototype.handleIsActive));
    
    this.filterColumnBank = session.createFilterBank (this.numFilterColumns);
    this.filterColumns = [];
    this.filterColumnItemBanks = [];
    this.cursorItems = [];
    this.filterColumnData = this.createFilterColumns (this.numFilterColumns);
    var i;
    var j;
    var item;
    for (i = 0; i < this.numFilterColumns; i++)
    {
        this.filterColumns[i] = this.filterColumnBank.getItem (i);
        this.filterColumns[i].addExistsObserver (doObjectIndex (this, i, BrowserSessionProxy.prototype.handleColumnExists));
        this.filterColumns[i].addNameObserver (this.textLength, "", doObjectIndex (this, i, BrowserSessionProxy.prototype.handleColumnName));
        this.filterColumnItemBanks[i] = this.filterColumns[i].createItemBank (this.numFilterColumnEntries);
        
        for (j = 0; j < this.numFilterColumnEntries; j++)
        {
            item = this.filterColumnItemBanks[i].getItem (j);
            item.addExistsObserver (doObjectDoubleIndex (this, i, j, BrowserSessionProxy.prototype.handleItemExists));
            item.addValueObserver (this.textLength, "", doObjectDoubleIndex (this, i, j, BrowserSessionProxy.prototype.handleItemName));
            item.addHitCountObserver (doObjectDoubleIndex (this, i, j, BrowserSessionProxy.prototype.handleHitCount));
            item.isSelected ().addValueObserver (doObjectDoubleIndex (this, i, j, BrowserSessionProxy.prototype.handleItemIsSelected));
        }
        
        this.cursorItems[i] = this.filterColumns[i].createCursorItem ();
        this.cursorItems[i].addExistsObserver (doObjectIndex (this, i, BrowserSessionProxy.prototype.handleCursorItemExists));
        this.cursorItems[i].addValueObserver (this.textLength, "", doObjectIndex (this, i, BrowserSessionProxy.prototype.handleCursorItemName));
    }

    this.resultsColumn = session.getResults ();
    this.cursorResult = session.getCursorResult ();
    this.cursorResult.addValueObserver (this.textLength, "", doObject (this, BrowserSessionProxy.prototype.handleCursorResultValue));
    this.resultsItemBank = this.resultsColumn.createItemBank (this.numResults);
    this.resultData = this.createResultData (this.numResults);
    for (i = 0; i < this.numFilterColumnEntries; i++)
    {
        item = this.resultsItemBank.getItem (i);
        item.addExistsObserver (doObjectIndex (this, i, BrowserSessionProxy.prototype.handleResultExists));
        item.addValueObserver (this.textLength, "", doObjectIndex (this, i, BrowserSessionProxy.prototype.handleResultName));
        item.isSelected ().addValueObserver (doObjectIndex (this, i, BrowserSessionProxy.prototype.handleResultIsSelected));
    }
}

//--------------------------------------
// Public
//--------------------------------------

BrowserSessionProxy.prototype.activate = function ()
{
    this.session.activate ();
};

BrowserSessionProxy.prototype.getFilterColumn = function (column)
{
    return this.filterColumnData[column];
};

BrowserSessionProxy.prototype.getResultColumn = function ()
{
    return this.resultData;
};

BrowserSessionProxy.prototype.selectPreviousFilterItem = function (column)
{
	this.cursorItems[column].selectPrevious ();
};

BrowserSessionProxy.prototype.selectNextFilterItem = function (column)
{
	this.cursorItems[column].selectNext ();
};

BrowserSessionProxy.prototype.previousFilterItemPage = function (column)
{
    this.filterColumnItemBanks[column].scrollPageUp ();
};

BrowserSessionProxy.prototype.nextFilterItemPage = function (column)
{
    this.filterColumnItemBanks[column].scrollPageDown ();
};

BrowserSessionProxy.prototype.getSelectedFilterItemIndex = function (column)
{
    for (var i = 0; i < this.numFilterColumnEntries; i++)
    {
        if (this.filterColumnData[column].items[i].isSelected)
            return i;
    }
    return -1;
};

BrowserSessionProxy.prototype.selectPreviousResult = function ()
{
	this.cursorResult.selectPrevious ();
};

BrowserSessionProxy.prototype.selectNextResult = function ()
{
	this.cursorResult.selectNext ();
};

BrowserSessionProxy.prototype.getSelectedResult = function ()
{
    return this.selectedResult;
};

BrowserSessionProxy.prototype.getSelectedResultIndex = function ()
{
    for (var i = 0; i < this.numResults; i++)
    {
        if (this.resultData[i].isSelected)
            return i;
    }
    return -1;
};

BrowserSessionProxy.prototype.previousResultPage = function ()
{
    this.resultsItemBank.scrollPageUp ();
};

BrowserSessionProxy.prototype.nextResultPage = function ()
{
    this.resultsItemBank.scrollPageDown ();
};

//--------------------------------------
// Private
//--------------------------------------

BrowserSessionProxy.prototype.createFilterColumns = function (count)
{
    var columns = [];
    for (var i = 0; i < count; i++)
    {
        var col =
        {
            index: i,
            exists: false,
            name: '',
            items: [],
            cursorExists: false,
            cursorName: ''
        };
        for (var j = 0; j < this.numFilterColumnEntries; j++)
            col.items.push ({ index: j, exists: false, name: '', isSelected: false, hits: 0 });
        columns.push (col);
    }
    return columns;
};

BrowserSessionProxy.prototype.createResultData = function (count)
{
    var results = [];
    for (var i = 0; i < count; i++)
    {
        var result =
        {
            index: i,
            exists: false,
            name: ''
        };
        results.push (result);
    }
    return results;
};

//--------------------------------------
// Callback Handlers
//--------------------------------------

BrowserSessionProxy.prototype.handleIsActive = function (active)
{
    this.isActive = active;
};

BrowserSessionProxy.prototype.handleColumnExists = function (index, exists)
{
    this.filterColumnData[index].exists = exists;
};

BrowserSessionProxy.prototype.handleColumnName = function (index, name)
{
    this.filterColumnData[index].name = name;
};

BrowserSessionProxy.prototype.handleItemExists = function (index, item, exists)
{
    this.filterColumnData[index].items[item].exists = exists;
};

BrowserSessionProxy.prototype.handleItemName = function (index, item, name)
{
    this.filterColumnData[index].items[item].name = name;
};

BrowserSessionProxy.prototype.handleHitCount = function (index, item, hits)
{
    this.filterColumnData[index].items[item].hits = hits;
};

BrowserSessionProxy.prototype.handleItemIsSelected = function (index, item, isSelected)
{
    this.filterColumnData[index].items[item].isSelected = isSelected;
};

BrowserSessionProxy.prototype.handleResultExists = function (index, exists)
{
    this.resultData[index].exists = exists;
};

BrowserSessionProxy.prototype.handleResultName = function (index, name)
{
    this.resultData[index].name = name;
};

BrowserSessionProxy.prototype.handleResultIsSelected = function (index, isSelected)
{
    this.resultData[index].isSelected = isSelected;
};

BrowserSessionProxy.prototype.handleCursorItemExists = function (index, exists)
{
    this.filterColumnData[index].cursorExists = exists;
};

BrowserSessionProxy.prototype.handleCursorItemName = function (index, name)
{
    this.filterColumnData[index].cursorName = name;
};

BrowserSessionProxy.prototype.handleCursorResultValue = function (value)
{
    this.selectedResult = value;
};