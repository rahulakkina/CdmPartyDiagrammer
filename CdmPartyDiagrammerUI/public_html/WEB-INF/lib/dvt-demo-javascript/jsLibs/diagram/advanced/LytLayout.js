/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    Layout.js

    Main driver for dispatching layouts.

    Important assumption:

       - Rendering Component manages containers

    Since the Rendering Component manages containers,
    this routine would be invoked with just a top-level container. 

    To add a new pluggable layout, one needs to do the following:
  
       - Add the layout class (e.g., such as LytTreeLayout.js)
       - Add the appropriate "instance of" conditions to this.doLayout()
       - Add any layout specific parameters to the model code

    Each container has an associated layout.
    The main driver dispatches different, per container layouts from this routine.

    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - Code Refactor
    lmolesky    01/10/12 - Extensions to support channel padding.
    lmolesky    11/08/11 - Extensions to support containers.
    lmolesky	11/07/11 - Remove .layoutDesc, add PadRect class.
    lmolesky	09/13/11 - Created

    NOTES

*/

//
// 
//

var LytLayout = function()
{
    this.Init();

};

LytObj.createSubclass(LytLayout, LytObj, "LytLayout");

LytLayout.prototype.Init = function()
{

    this._padFlowDir = 5;
    this._padFlowPerp = 5;

    // layout Descriptor.
    this._layoutDesc = null;

};

/**
 Get the layout descriptor.
*/
LytLayout.prototype.getLayoutDesc = function() {

    //
    // create one if the calling api forgut to create.
    //

    if (!this._layoutDesc) {
	this._layoutDesc = new LytLayoutDesc();
    }

    return this._layoutDesc;

}

/**
 set the layout descriptor
 @param layoutD LytLayoutDesc()
*/
LytLayout.prototype.setLayoutDesc = function(layoutD) {

    this._layoutDesc = layoutD;

}


// var layoutMethod;
var layoutDesc;

//
// Set the padding in the flow direction.
//
LytLayout.prototype.setPaddingFlowDir = function(padding) {
    this._padFlowDir = padding;
}

//
// Set the padding perpindictular to the flow direction
//
LytLayout.prototype.setPaddingFlowPerp = function(padding) {
    this._padFlowPerp = padding;
}

LytLayout.printObj = function(obj) {

    var output;
    for (var property in obj) {
	output += property + ':' + obj[property] + ';';
    }
    alert(output);
}

//
//
//
LytLayout.prototype.doLayout = function(layoutContext) {

    var debug = false;
    var debugC = false;

    var i;
    var nodeContext;
    var dvtRect;

    var memberList;

    var levelU = new LytLevelUtil();

    //
    // Create linksIn and linksOut data structures.
    //
    var linkDS = new LytLinkDS();

    linkDS.createLinksInAndOut(layoutContext);

    var minimizeCrossings = false;
    var layoutClass;

    // var ld = this.getLayoutDesc();

    // alert('*** here *** ' + cid);

    if (debug) levelU.printLevelArray();

    layoutClass = this.getLayoutDesc().getLayoutClass();

    if (layoutClass instanceof LytTreeLayout) {
	var layoutD = layoutClass.getLayoutDesc();
	minimizeCrossings = layoutD.getMinimizeCrossings();
    }

    levelU.deriveLevels(layoutContext, linkDS, this.getLayoutDesc(), this, minimizeCrossings);

    // test - print out levelU._levelArray
    
    if (debug) levelU.printLevelMap(layoutContext);

    var layoutClass = this.getLayoutDesc().getLayoutClass();
    var channelPadU = new LytChannelPadUtil();

    if (layoutClass instanceof LytTreeLayout) {
	// 
	// Only treelayout needs levelU
	// 
	layoutClass.positionAllNodes(layoutContext, this.getLayoutDesc(), linkDS, levelU);
    } else if (layoutClass instanceof LytSparseGridLayout || layoutClass instanceof LytGridLayout) {
	//
	// channelPadU only needed by grid/sparsegrid/workflow layouts
	//
	layoutClass.positionAllNodes(layoutContext, this.getLayoutDesc(), linkDS, channelPadU);

    } else if (layoutClass instanceof LytWorkflowLayout) {
	// 
	// Note that the workflow layout needs levelU for tree embedding variant.
	// 
	layoutClass.positionAllNodes(layoutContext, this.getLayoutDesc(), linkDS, levelU, channelPadU);
    }

    var channelUtl = new LytChannelRouteUtil();
    var linkUtl = new LytLinkUtil();

    // 
    // Layout the links, using a topLevel link layout alg. (for now).
    // Note - channel routing requires additional data structures returned from layoutLinks()
    // So sparsegrids perform their own layout.
    // 
    var linkUtl = new LytLinkUtil();
    if (layoutClass instanceof LytTreeLayout) {

	linkUtl.layoutLinks(layoutContext, 
			    this.getLayoutDesc(),
			    this.getLayoutDesc().getLayoutFlow(), 
			    this.getLayoutDesc().getArrowLength(),
			    this.route, 
			    linkDS);

    } else if (layoutClass instanceof LytSparseGridLayout || layoutClass instanceof LytGridLayout) {

	//
	// We should also run this code per-container - for nested sparse grid routing.
	// And factor out redundant this.getLayoutDesc() ...
	//

	channelUtl.layoutLinksGrid(layoutContext, 
				layoutClass.getLayoutDesc(), // pass in the SparseGridLayoutDesc()
				this.getLayoutDesc(),
				layoutClass._getGridUtil(), // pass the GridUtil() constructed by GridLayout.
				linkDS, channelPadU);


    } else if (layoutClass instanceof LytWorkflowLayout) {

	//
	// This call is similar to the one for grid and sparse grid, 
	// except that we extract parameters that were earlier created by the synthetic LytWorkflowLayoutclass.
	//
	channelUtl.layoutLinksGrid(layoutContext, 
				layoutClass._getSparseGridLayoutClass().getLayoutDesc(), // pass in the SparseGridLayoutDesc()
				this.getLayoutDesc(),
				layoutClass._getSparseGridLayoutClass()._getGridUtil(), // pass the GridUtil() constructed by GridLayout.
				linkDS, channelPadU);
    }
}



LytLayout.LAYOUT_GRID = "LAYOUT_GRID ";
LytLayout.LAYOUT_BUS = "LAYOUT_BUS";
LytLayout.LAYOUT_SPARSE_GRID = "LAYOUT_SPARSE_GRID";
LytLayout.LAYOUT_TREE_SIMPLE = "LAYOUT_TREE_SIMPLE";

LytLayout.FLOW_LEFT_RIGHT = "FLOW_LEFT_RIGHT";
LytLayout.FLOW_RIGHT_LEFT = "FLOW_RIGHT_LEFT";
LytLayout.FLOW_TOP_DOWN = "FLOW_TOP_DOWN";
LytLayout.FLOW_BOTTOM_UP = "FLOW_BOTTOM_UP";

LytLayout.ROUTE_STRAIGHT = "ROUTE_STRAIGHT";
LytLayout.ROUTE_CHANNEL = "ROUTE_CHANNEL";
LytLayout.ROUTE_CHANNEL_HYBRID = "ROUTE_CHANNEL_HYBRID";

LytLayout.NODE_ALIGNMENT_CENTER = "NODE_ALIGNMENT_CENTER";
LytLayout.NODE_ALIGNMENT_FLUSH = "NODE_ALIGNMENT_FLUSH";