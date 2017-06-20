
/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION

    LytSparseGridLayout.as

    Code for sparse grid layout.
     
    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - refine parameters for setNodePositionGrid()
    lmolesky	01/10/12 - Additional updates for smartPad.
    lmolesky	12/11/11 - Updating to support node labels. (smartPad)
    lmolesky	09/15/11 - Created

*/

//
// Grid layouts
//
//
/**
 * @constructor
 */
var LytSparseGridLayout = function()
{
    this.Init();
};

LytObj.createSubclass(LytSparseGridLayout, LytLayout, "LytSparseGridLayout");

LytSparseGridLayout.prototype.Init = function()
{
    this._gridUtil = null;

    LytSparseGridLayout.superclass.Init.call(this);

};

LytSparseGridLayout.prototype.setLayoutDesc = function(layoutDesc) {
    this._layoutDesc = layoutDesc;
}


LytSparseGridLayout.prototype.getLayoutDesc = function() {

    //
    // Tolerates the case when the api calls setLayoutDesc()
    //
    if (!this._layoutDesc) this._layoutDesc = new LytSparseGridLayoutDesc();

    return (this._layoutDesc);
}

//
// Internal function, used to get/set the grid util from the LytLayout class.
//
LytSparseGridLayout.prototype._setGridUtil = function(gridU) {
    this._gridUtil = gridU;
}

LytSparseGridLayout.prototype._getGridUtil = function() {

    return (this._gridUtil);
}

//
// Positiona all nodes.
// Store grid results back into this._gridUtil for use by routing algorithm.
//
LytSparseGridLayout.prototype.positionAllNodes = function(layoutContext, containerDesc, linkDS, channelPadU) {

    var debug = false;

    var layoutFlow = containerDesc.getLayoutFlow();

    var i;
    var nodeContext;
    var dvtRect;

    //
    // Handle cases where there is a layoutDesc (gridLayoutDesc)
    //
    var layoutD = this.getLayoutDesc();
    if (debug) alert (' LytSparseGridLayout.positionAllNodes ^^ layout D ' + layoutD._info);

    if (layoutD) {

	var maxX = layoutD.getMaxLocXInternal();
	var maxY = layoutD.getMaxLocYInternal();

	// var gridNodeCount = this.layoutDesc.getNodeCount();
	var gridNodeCount = (maxX + 1) * (maxY + 1);
	if (debug)  alert('sgLayout positionAllNodes gridNodeCount ' + gridNodeCount + ' maxX ' + maxX + ' maxY ' + maxY);

	var pad = layoutD.getPad();

	this._gridUtil = new LytGridUtil();

	this._gridUtil.setNodeCount(gridNodeCount);
	this._gridUtil.setPad(pad[0], pad[1]);

	// this._gridUtil.setNumCols(maxX + 1);
	switch (layoutFlow) {

	case LytLayout.FLOW_LEFT_RIGHT:
	    this._gridUtil.fixNumCols(maxX+1, true);
	    break;

	case LytLayout.FLOW_TOP_DOWN:
	    this._gridUtil.fixNumRows(maxY+1, false);
	    break;

	}

	// 
	// Init cell size to zero.
	//
	for (var i=0; i<gridNodeCount; i++) {
	    this._gridUtil.setCellSize(i, 0, 0);
	    this._gridUtil.setCellContent(i, 0, 0);
	}

	// 
	// Set the grid index of each sparse node.
	// (Needed for smartPad block)
	// Also, set the (initial) node dimensions - this is also a prerequsite for smartPad.
	// 
	for (var nodeID in this.getLayoutDesc()._nodeToGridLocMap) {

	    pt = this.getLayoutDesc()._nodeToGridLocMap[nodeID];
	    var index = this._gridUtil.getIndexFromPoint(pt);

	    this._gridUtil.setGridIndex(nodeID, index);

	    nodeContext = layoutContext.getNodeById(nodeID);

	    w = LytNodeUtil.getNodeWidth(nodeContext);
	    h = LytNodeUtil.getNodeHeight(nodeContext);

	    nodeContent = nodeContext.getContentBounds();

	    // alert(nodeID + ' nodeID ' + w + ' ' + h);
	    this._gridUtil.setCellSize(index, w, h);
	    this._gridUtil.setCellContent(index, nodeContent.w, nodeContent.h);
	}

	//
	// (semi)Finalize the number of rows/columns.
	//
	switch (layoutFlow) {

	case LytLayout.FLOW_LEFT_RIGHT:
	    this._gridUtil.fixNumCols(maxX+1, true);
	    break;

	case LytLayout.FLOW_TOP_DOWN:
	    this._gridUtil.fixNumRows(maxY+1, false);
	    break;

	}

	// 
	// Automatically adjust padding based on the label lengths.
	// 
	var numRows = this._gridUtil.getNumRows();
	var numCols = this._gridUtil.getNumCols();
	channelPadU.init(numRows, numCols);

	LytLabelUtil.smartPadGrid(layoutContext, containerDesc, this._gridUtil, pad, this.getLayoutDesc(), layoutFlow, linkDS, channelPadU);

	this._gridUtil.refreshPadding();

	//
	// Set the position of each sparse grid node.
	//
	for (var nodeID in this.getLayoutDesc()._nodeToGridLocMap) {

	    pt = this.getLayoutDesc()._nodeToGridLocMap[nodeID];
	    index = this._gridUtil.getIndexFromPoint(pt);

	    // pt0 = this._gridUtil.getGridCoordCentered(index);

	    // 
	    // Get the grid coordinate (non-centered)
	    // Then, get the pre-pads and cell diffs, pass to setNodePositionGrid() for centering.
	    // 
	    pt0 = this._gridUtil.getGridCoord(index);
	    // alert(nodeID + ' getGridCoord ' + pt0.getX());

	    nodeContext = layoutContext.getNodeById(nodeID);

	    // var cellWidthDiff = this._gridUtil.getGridCoordCellWidthDiff(index);

	    // get the column width
	    var colWidth = this._gridUtil.getColWidthNoPad(index);
	    var xPad = this._gridUtil._getPadWidthPreInternal(index);

	    var cellContentHeightDiff = this._gridUtil.getGridCoordCellContentHeightDiff(index);
	    var yPad = this._gridUtil._getPadHeightPreInternal(index);

	    LytNodeUtil.setNodePositionGrid(nodeContext, pt0.getX(), pt0.getY(), xPad, colWidth, yPad, cellContentHeightDiff);

	    // alert(nodeID + ' setNodePosition '  + pt0.getX() + ' ' + pt0.getY());

	}
    } 
}

// LytSparseGridLayout.TESTVAR = 0;
LytSparseGridLayout.sparseGridLayout = function(layoutContext)
{
    var gridL = new LytSparseGridLayoutDesc();
    gridL.setNodeCount(layoutContext.getNodeCount());
    gridL.setPad(30,30);
    
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
            gridL.setPad(padWidth, padHeight);

    }

    // alert(' nodecount ' + layoutContext.getNodeCount());

    for (var ni = 0; ni < layoutContext.getNodeCount(); ni++) {
	var node = layoutContext.getNodeByIndex(ni);
	var nodeLayoutAttrs = node.getLayoutAttributes();
	
	var gridX = 0;
	var gridY = 0;
	if (nodeLayoutAttrs && nodeLayoutAttrs["gridX"])
	{
	    gridX = parseInt(nodeLayoutAttrs["gridX"]);
	}
	if (nodeLayoutAttrs && nodeLayoutAttrs["gridY"])
	{
	    gridY = parseInt(nodeLayoutAttrs["gridY"]);
	}
	gridL.setGridLoc(node.getId(), new LytPoint(gridX, gridY));
    }
    
    var L = new LytLayout();
    var layout = new LytSparseGridLayout();

    layout.setLayoutDesc(gridL);
    
    var layoutD = LytLayoutDesc.createLayoutDesc(L, layout, layoutFlow);

    //
    // Set the arrow length for the layout.
    // This influences how much space is allocated for orthogonal links.
    //
    var arrowLength = 3.0;

    if (layoutAttrs && layoutAttrs["arrowLength"])
    {
	arrowLength= parseInt(layoutAttrs["arrowLength"]);
    }
    arrowLength = Math.max(0, arrowLength);

    layoutD.setArrowLength(arrowLength);

    L.doLayout(layoutContext);
}