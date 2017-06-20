
/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/**
 * @constructor
 * 
    DESCRIPTION

    LytGridLayout.as

    Code for grid layout.
     
    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - refine parameters for setNodePositionGrid()
    lmolesky	01/10/12 - Add support for link labels (smartPad)
    lmolesky	10/10/11 - Add support for node labels
    lmolesky	09/13/11 - Created


    NOTES

*/


//
// Grid layout
//
//

var LytGridLayout = function()
{
    this.Init();

};

LytObj.createSubclass(LytGridLayout, LytLayout, "LytGridLayout");

LytGridLayout.prototype.Init = function()
{
    this._gridUtil = null;

    LytGridLayout.superclass.Init.call(this);

};

LytGridLayout.prototype.setLayoutDesc = function(layoutDesc) {
    this._layoutDesc = layoutDesc;
}


LytGridLayout.prototype.getLayoutDesc = function() {

    //
    // Tolerates the case when the api calls setLayoutDesc()
    //
    // note: should warn that no GridLayouDesc was provided.
    //
    if (!this._layoutDesc) this._layoutDesc = new LytGridLayoutDesc();

    return (this._layoutDesc);
}

//
// Internal function, used to get/set the grid util from the LytLayout class.
//
LytGridLayout.prototype._setGridUtil = function(gridU) {
    this._gridUtil = gridU;
}

LytGridLayout.prototype._getGridUtil = function() {

    return (this._gridUtil);
}

LytGridLayout.prototype.positionAllNodes = function(layoutContext, containerDesc, linkDS, channelPadU) {

    var debug = false;
    // debug = true;

    var layoutFlow = containerDesc.getLayoutFlow();

    if (debug) alert("LytGridLayout.positionAllNodesNode " + cid);

    var i;
    var nodeContext;
    var dvtRect;

    var layoutD = this.getLayoutDesc();

    if (layoutD) {

	var gridNodeCount = layoutD.getNodeCount();
	if (debug) alert(" gridNodeCount " + gridNodeCount);
	var pad = layoutD.getPad();

	this._gridUtil = new LytGridUtil();
	this._gridUtil.setNodeCount(gridNodeCount);
	this._gridUtil.setPad(pad[0], pad[1]);

	// alert(gridNodeCount)
	var nodeToGridIndex = new Array();

	for (var i=0; i<gridNodeCount; i++) {

	    nodeContext = layoutContext.getNodeByIndex(i);
	    nodeID = nodeContext.getId();

	    if (debug) alert(" positionNode " + nodeID);

	    // Save the grid spot for later reference.
	    // nodetoGridIndex[nodeID] = i;
	    this._gridUtil.setGridIndex(nodeID, i);
	    
	    // alert(nodeContext.getId());
            // dvtRect = nodeContext.getBounds();
	    // this._gridUtil.setCellSize(i, dvtRect.w, dvtRect.h);

	    w = LytNodeUtil.getNodeWidth(nodeContext);
	    h = LytNodeUtil.getNodeHeight(nodeContext);

	    this._gridUtil.setCellSize(i, w, h);

	    nodeContent = nodeContext.getContentBounds();
	    this._gridUtil.setCellContent(i, nodeContent.w, nodeContent.h);

            // alert("w " + dvtRect.w);

	}

	// 
	// need to call this prior to smartPad() - since spartPad calls getCol() and getRow().
	// 
	if (!isNaN(layoutD.getNumCols()))
	    this._gridUtil.fixNumCols(layoutD.getNumCols(), true);
	else if (!isNaN(layoutD.getNumRows()))
	    this._gridUtil.fixNumRows(layoutD.getNumRows(), false);
	else 
	    this._gridUtil.fixCols();

	var numRows = this._gridUtil.getNumRows();
	var numCols = this._gridUtil.getNumCols();
	channelPadU.init(numRows, numCols);

	// 
	// Automatically adjust padding based on the label lengths.
	// 
	LytLabelUtil.smartPadGrid(layoutContext, containerDesc, this._gridUtil, pad, layoutD, layoutFlow, linkDS, channelPadU);

	this._gridUtil.refreshPadding();

	//
	// Position each node in the grid.
	//
	for (var index=0; index<gridNodeCount; index++) {

	    var pt0;

	    pt0 = this._gridUtil.getGridCoord(index);

	    nodeContext = layoutContext.getNodeByIndex(index);
	    nodeID = nodeContext.getId();

	    // alert(nodeID + ' getGridCoord ' + pt0.getX());

	    // var cellWidthDiff = this._gridUtil.getGridCoordCellWidthDiff(index);
	    // get the column width
	    var colWidth = this._gridUtil.getColWidthNoPad(index);
	    var xPad = this._gridUtil._getPadWidthPreInternal(index);

	    var cellContentHeightDiff = this._gridUtil.getGridCoordCellContentHeightDiff(index);
	    var yPad = this._gridUtil._getPadHeightPreInternal(index);

	    LytNodeUtil.setNodePositionGrid(nodeContext, pt0.getX(), pt0.getY(), xPad, colWidth, yPad, cellContentHeightDiff);

	}
    } 
}

LytGridLayout.gridLayout = function(layoutContext)
{

    var gridD = new LytGridLayoutDesc();

    gridD.setNodeCount(layoutContext.getNodeCount());
    gridD.setPad(10, 10);
    
    // alert('gridLayout ' + layoutContext.getNodeCount());

    var layoutAttrs = layoutContext.getLayoutAttributes();
    
    var layoutFlow;
    layoutFlow = LytLayout.FLOW_TOP_DOWN;
    if (layoutAttrs && layoutAttrs["flowDir"])
    {
	if (layoutAttrs["flowDir"] === "leftRight")
	{
	    layoutFlow = LytLayout.FLOW_LEFT_RIGHT;
	}
    }
    
    if (layoutAttrs && layoutAttrs["padHeight"] &&  layoutAttrs["padWidth"]) {

	// alert(layoutAttrs["padWidth"] + ' ' + layoutAttrs["padHeight"]);

	var padWidth = parseInt(layoutAttrs["padWidth"]);
	var padHeight = parseInt(layoutAttrs["padHeight"]);

	// alert('padw, h ' + padWidth + ' ' + padHeight);

	if (!isNaN(padWidth) && !isNaN(padHeight))
            gridD.setPad(padWidth, padHeight);

    }

    var rootCount = Math.sqrt(layoutContext.getNodeCount());
    rootCount = Math.floor(rootCount);

    //
    // Best practice 
    // - use setNumRows for LEFT_RIGHT layouts 
    // - use setNumCols for TOP_DOWN layouts 
    //
    switch (layoutFlow)
    {

    case LytLayout.FLOW_LEFT_RIGHT:

	gridD.setNumRows(rootCount);

	if (layoutAttrs && layoutAttrs["gridRows"]) {
	    var gridRows = parseInt(layoutAttrs["gridRows"]);
	    if (!isNaN(gridRows)) gridD.setNumRows(gridRows);
	}

	break;

    case LytLayout.FLOW_TOP_DOWN:

	gridD.setNumCols(rootCount);

	if (layoutAttrs && layoutAttrs["gridCols"]) {
	    var gridCols = parseInt(layoutAttrs["gridCols"]);
	    if (!isNaN(gridCols)) gridD.setNumCols(gridCols);
	}

	break;

    }

    var L = new LytLayout();
    var gridLayout = new LytGridLayout();

    gridLayout.setLayoutDesc(gridD);
    
    var layoutD = LytLayoutDesc.createLayoutDesc(L, gridLayout, layoutFlow);
    
    L.doLayout(layoutContext);
};
