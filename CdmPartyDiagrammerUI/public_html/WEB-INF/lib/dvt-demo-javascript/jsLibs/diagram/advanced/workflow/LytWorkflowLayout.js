/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytWorkFlowLayout.js

    Workflow layout.

    This class creates workflow layouts by automatically positioning nodes within a LytSparseGridLayout.

    There are two main placement stragegies:

       - NODE_PLACEMENT_ORTHOGONAL
         Place nodes so that the links are at right angles (linked nodes are in the same row or column)
         This works well for flow layouts that have at most two outlinks (excluding back-links).

       - NODE_PLACEMENT_HIERARCHICAL 
         This is basically a tree, but with the workflow alignment.  
         Use for layouts that have many outlinks.

    MODIFIED    (MM/DD/YY)
    lmolesky	05/04/12 - Code Refactoring
    lmolesky	09/13/11 - Created

*/

//
// 
//
/**
 * @constructor
 */
var LytWorkflowLayout = function()
{
    this.Init();

    this._sgLayout = new LytSparseGridLayout();

};

LytObj.createSubclass(LytWorkflowLayout, LytLayout, "LytWorkflowLayout");

LytWorkflowLayout.prototype.Init = function()
{

    LytWorkflowLayout.superclass.Init.call(this);

    this._nodePlacementStyle = LytWorkflowLayout.NODE_PLACEMENT_ORTHOGONAL;
};


LytWorkflowLayout.prototype.setNodePlacementStyle = function(nodePlacementStyle) {

    this._nodePlacementStyle = nodePlacementStyle;

}

LytWorkflowLayout.prototype.getNodePlacementStyle = function() {
    return this._nodePlacementStyle;
}

//
// Internal function.
//
LytWorkflowLayout.prototype._getSparseGridLayoutClass = function() {
    return this._sgLayout;
}


//
// Set the layout descriptor.  Currently, a padding desc is supported.
//
// @param layoutDesc LytPadDesc
//
LytWorkflowLayout.prototype.setLayoutDesc = function(layoutDesc) {
    this._layoutDesc = layoutDesc;
}


LytWorkflowLayout.prototype.getLayoutDesc = function() {

    //
    // Tolerates the case when the api calls setLayoutDesc()
    //
    if (!this._layoutDesc) this._layoutDesc = new LytPadDesc();

    return (this._layoutDesc);
}
//
// We should check that all links link to nodes that exist.
//
// LytWorkflowLayout.prototype.doLayout = function(layoutContext) {
LytWorkflowLayout.prototype.positionAllNodes = function(layoutContext, containerDesc, linkDS, levelU, channelPadU) {

    var debug = false;

    var levelArray = levelU.getLevelArray();

    var layoutFlow = containerDesc.getLayoutFlow();

    if (debug) alert('LytWorkflowLayout: positionAllNodes ' + layoutFlow);

    var i;
    var nodeContext;
    var dvtRect;

    // 
    // Flow layouts are build on top of sparse grids.
    // So, underneath the covers, we instantiate a new SparseGridLayout.
    // 
    this._sgLayout = new LytSparseGridLayout();
    var sparseGridD = new LytSparseGridLayoutDesc();

    // 
    // Copy the padding from the callers layout descriptor into the new SparseGridDesc
    //
    var layoutD = this.getLayoutDesc();
    var pad = layoutD.getPad();
    sparseGridD.setPad(pad[0], pad[1]);

    //
    // Depending on the placement style, set the grid locations of the nodes.
    //
    switch (this._nodePlacementStyle) {

    case LytWorkflowLayout.NODE_PLACEMENT_ORTHOGONAL:
	this.setGridLocations(layoutContext, containerDesc, levelU, sparseGridD, linkDS);
	break;

    case LytWorkflowLayout.NODE_PLACEMENT_HIERARCHICAL:
	this.setGridLocationsTree(layoutContext, containerDesc, levelU, sparseGridD, linkDS);
	break;

    }

    // 
    // Set the arrow length of the SparseGridLayout,
    // using the value copied from WorkflowLayout
    // 

    // var arrowLength = this.getArrowLength(arrowLength);
    // this._sgLayout.setArrowLength(arrowLength);

    this._sgLayout.setLayoutDesc(sparseGridD);

    this._sgLayout.positionAllNodes(layoutContext, containerDesc, linkDS, channelPadU);


}


//
// Flow version
//
LytWorkflowLayout.prototype.setGridLocations = function(layoutContext, containerDesc, levelU, sparseGridD, linkDS) {

    var debug = false;

    var p;

    var i;
    var j;

    var layoutFlow = containerDesc.getLayoutFlow();

    if (debug) levelU.printLevelArray();
    
    var nodeContext;
    var nodeID;

    var levelPos = 0;

    var linksIn = linkDS.getLinksIn();

    rowPosArray = new Array();
    subTreeWidthArray = new Array();

    // 
    // Set the positions of the nodes, based on a tree layout.
    //
	
    var levelArray = levelU.getLevelArray();
    var oneLevel = levelArray[0];
    var levelMap = levelU.getLevelMap();

    if (debug) alert(' i = ' + i + " oneLevel.length " + oneLevel.length);

    for (j=0; j<oneLevel.length; j++) {

	nodeID = oneLevel[j];

	if (j == 0) {

	    // 
	    // root node positioned at (0,0)
	    // 
	    var p = new LytPoint(0,0);
	    sparseGridD.setGridLoc(nodeID, p);

	    if (debug) alert(nodeID + ' set grid loc root ' + p.getString());

	}
	else {
	    // 
	    // secondary root nodes are positioned at (maxX+1, 0)
	    // 
	    var maxX = sparseGridD.getMaxLocXInternal();

	    var p = new LytPoint(maxX+1,0);
	    sparseGridD.setGridLoc(nodeID, p);

	    if (debug) alert(nodeID + ' set grid loc ' + p.getString());


	}
	
	var nodeProcessedMap =  new Array();
	this.placeNode(layoutContext, containerDesc, layoutFlow, levelU, sparseGridD, linkDS, nodeID, nodeProcessedMap);


	// alert(nodeID + ' setgridloc ' + p.getString());

    }
}


//
// Set node locations for NODE_PLACEMENT_HIERARCHICAL
//
LytWorkflowLayout.prototype.setGridLocationsTree = function(layoutContext, containerDesc, levelU, sparseGridD, linkDS) {

    var layoutFlow = containerDesc.getLayoutFlow();

    var debug = false;

    var p;

    var i;
    var j;

    // alert(' setpos print levelMap ');

    if (debug) {

	for (var i=0; i<levelU._levelMap.length; i++)
	    alert(' levelmap ' + levelU._levelMap[i]);
    }  

    if (debug) levelU.printLevelArray();
    
    var nodeContext;
    var nodeID;

    var levelPos = 0;

    rowPosArray = new Array();
    subTreeWidthArray = new Array();

    var levelArray = levelU.getLevelArray();
    var levelMap = levelU.getLevelMap();

    // 
    // Set the positions of the nodes, based on a tree layout.
    //
    for (i=0; i<levelArray.length; i++) {

	oneLevel = levelArray[i];

	if (debug) alert(' i = ' + i + " oneLevel.length " + oneLevel.length);

	for (j=0; j<oneLevel.length; j++) {

	    nodeID = oneLevel[j];

	    var p = new LytPoint(i,j);
	    sparseGridD.setGridLoc(nodeID, p);
	    // alert(nodeID + ' setgridloc ' + p.getString());

	}

	// maintain the current level height position
	levelPos += levelU._levelHeight[i];
	// alert('levelheight ' + levelU._levelHeight[i]);
	if (i > 0) levelPos += this._betweenLevelSpace;
    
    }
}


//
// Update a node's x location
//
LytWorkflowLayout.prototype.updateNodeLocationX = function(nodeID, sparseGridD, xLoc) {

    var nodeLoc = sparseGridD.getGridLoc(nodeID);
    var newLocation = new LytPoint(nodeLoc.getX(), nodeLoc.getY());
    // var xDiff = xLoc - nodeLoc.getX();

    newLocation.setX(xLoc);
    sparseGridD.setGridLoc(nodeID, newLocation);
}

//
// Push right:
// When we encounter n?, we need to push its "connected column" right
//
// n0 -> n2 -> n6
// |     |
// n1    n5
// |       \
// n3 -> n4 n?
//
//
// Needs to be rewritten as such:
//
// n0 -----> n2 -> n6
// |         |
// n1        n5
// |         |
// n3 -> n4  n?
//
//
// In this case, the column connected nodes would be {n?, n5, n2}
// and the "reachable forward nodes" would be {n6}
//
// push a parent node to the right.
//
LytWorkflowLayout.prototype.pushNodeRight = function(containerDesc, sparseGridD, linkDS, nodeID, xLoc) {

    var debug = false;

    var layoutFlow = containerDesc.getLayoutFlow();

    // alert(' pushNodeRight ' + nodeID + ' current grid ' + sparseGridD.getGridLoc(nodeID).getString());

    // 
    // calculate the x grid offset
    // 

    var nodeLoc = sparseGridD.getGridLoc(nodeID);
    var columnXGridOffset = xLoc - nodeLoc.getX();

    if (debug) alert('xdiff ' + columnXGridOffset);

    //
    // If this node has any links in (that are in a previous row)
    // then we need to push these (already positioned) nodes right.
    // 
    // alert(' pushNodeRight ' + nodeID + ' updated grid ' + sparseGridD.getGridLoc(nodeID).getString());
    // alert(' pushNodeRight ' + columnXGridOffset);
    // 
    var linksIn = linkDS.getLinksIn();

    if (linksIn[nodeID]) {

	// this.pushNodeRightPropagate(sparseGridD, linkDS, nodeID, xLoc, columnXGridOffset);
	var firstChildChainMap = new Array();
	firstChildChainMap[nodeID] = nodeID;

	var nodeProcessedMap =  new Array();

	//
	// create the column connected nodes.
	//
	this.getFirstChildChain(containerDesc, nodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap);
	if (debug) this.printNodeMap(firstChildChainMap, 'columnConnectedNodes');

	var nodeProcessedMap =  new Array();

	// get the forward reachable nodes.  Return result is in reachableNodesMap.
	var reachableNodesMap = new Array();
	this.getForwardReachableNodes(containerDesc, nodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap, reachableNodesMap);
	if (debug) this.printNodeMap(reachableNodesMap, 'reachableNodes');

	this.updateNodesX(firstChildChainMap, sparseGridD, columnXGridOffset);
	this.updateNodesX(reachableNodesMap, sparseGridD, columnXGridOffset);

    }
}


//
// Push the node down.  Analog to pushNodeRight.
//
LytWorkflowLayout.prototype.pushNodeDown = function(containerDesc, sparseGridD, linkDS, nodeID, yLoc) {

    var debug = false;

    var linksOut = linkDS.getLinksOut();
    var linksIn = linkDS.getLinksIn();

    var firstChildID;

    if (!linksIn[nodeID]) return;

    //
    // Check all links into nodeID, if any have links out that are "first children",
    // then add to columnConnectedNodes, and call recursively.
    //
    for (var i=0; i<linksIn[nodeID].length; i++) {

	srcNodeID = linksIn[nodeID][i];

	if (linksOut[srcNodeID]) {
	    firstChildID = linksOut[srcNodeID][0];
	    // Push the srcNode if its FIRST link out is connected to nodeID.
	    // (this means that it the nodes are in the same column).
	    if (firstChildID == nodeID) {
		// should also has map test (no cycles)
		// columnConnectedNodes.push(srcNodeID);
		firstChildChainMap[srcNodeID] = nodeID;
		this.getFirstChildChain(containerDesc, srcNodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap);
	    }
	}
    }
}



LytWorkflowLayout.prototype.printNodeArray = function(columnConnectedNodes, str) {

    var buffer = "";
    for (var i=0; i<columnConnectedNodes.length; i++) {
	buffer += columnConnectedNodes[i];
	if (i < columnConnectedNodes.length - 1) buffer += ",";
    }
    alert(str + ' ' + buffer);
}

//
// Print out a node map.
// used for diagnostics.
//
LytWorkflowLayout.prototype.printNodeMap = function(nodeMap, str) {

    var buffer = "";

    for (var nodeID in nodeMap) {
	buffer += nodeID;
	buffer += ",";
    }

    alert(str + ' ' + buffer);
}

//
// Update the x coordinate of all nodes.
//
LytWorkflowLayout.prototype.updateNodesX = function(nodeMap, sparseGridD, xDiff) {

    var buffer = "";

    for (var nodeID in nodeMap) {
	this.updateNodeLocationX(nodeID, sparseGridD, xDiff);
    }
}

//
// Update the y coordinate of all nodes.
//
LytWorkflowLayout.prototype.updateNodesY = function(nodeMap, sparseGridD, yDiff) {

    var buffer = "";

    for (var nodeID in nodeMap) {
	this.updateNodeLocationY(nodeID, sparseGridD, yDiff);
    }
}


//
// Update a node's x location
//
LytWorkflowLayout.prototype.updateNodeLocationX = function(nodeID, sparseGridD, xDiff) {

    var nodeLoc = sparseGridD.getGridLoc(nodeID);
    var newLocation = new LytPoint(nodeLoc.getX() + xDiff, nodeLoc.getY());

    // newLocation.setX(xLoc);
    sparseGridD.setGridLoc(nodeID, newLocation);
}

//
// Update a node's y location
//
LytWorkflowLayout.prototype.updateNodeLocationY = function(nodeID, sparseGridD, yDiff) {

    var nodeLoc = sparseGridD.getGridLoc(nodeID);
    var newLocation = new LytPoint(nodeLoc.getX(), nodeLoc.getY() + yDiff);

    // alert(nodeID + ' updateLocationY yDiff ' + yDiff + ' ' + newLocation.getX() + ' ' + newLocation.getY());

    sparseGridD.setGridLoc(nodeID, newLocation);
}



//
//
//
// n0
// | 
// nodeID
//
// passed with nodeID
// n1 has links in.
// column connected nodes would be {n0, nodeID} in this case.
//
LytWorkflowLayout.prototype.getFirstChildChain = function(containerDesc, nodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap) {
    
    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    var layoutFlow = containerDesc.getLayoutFlow();

    var linksIn = linkDS.getLinksIn();
    var linksOut = linkDS.getLinksOut();

    var firstChildID;

    if (!linksIn[nodeID]) return;

    //
    // Check all links into nodeID, if any have links out that are "first children",
    // then add to columnConnectedNodes, and call recursively.
    //
    for (var i=0; i<linksIn[nodeID].length; i++) {

	srcNodeID = linksIn[nodeID][i];

	if (linksOut[srcNodeID]) {
	    firstChildID = linksOut[srcNodeID][0];
	    // Push the srcNode if its FIRST link out is connected to nodeID.
	    // (this means that it the nodes are in the same column).
	    if (firstChildID == nodeID) {
		// should also has map test (no cycles)
		// columnConnectedNodes.push(srcNodeID);
		firstChildChainMap[srcNodeID] = nodeID;
		this.getFirstChildChain(containerDesc, srcNodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap);
	    }
	}
    }
}

//
// Return all nodes that are reachable from the input node map (firstChildChainMap).
// Only FORWARD reachable nodes are returned.
// 
// This function is used in determining which nodes to push.
//
LytWorkflowLayout.prototype.getForwardReachableNodes = function(containerDesc, nodeID, nodeProcessedMap, sparseGridD, linkDS, firstChildChainMap, reachableNodesMap) {
    
    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    var layoutFlow = containerDesc.getLayoutFlow();

    var linksIn = linkDS.getLinksIn();
    var linksOut = linkDS.getLinksOut();

    var firstChildID;
    var childID;

    for (var ccNodeID in firstChildChainMap) {

	// ccNodeID = columnConnectedNodes[i];

	if (linksOut[ccNodeID]) {

	    // firstChildChainMap[srcNodeID] = srcNodeID;

	    for (j=0; j<linksOut[ccNodeID].length; j++) {

		childID = linksOut[ccNodeID][j];
		
		// alert(ccNodeID + ' child ' + childID);

		// skip nodes in the original list
		if (firstChildChainMap[childID]) continue;
		// skip nodes already reachable
		if (reachableNodesMap[childID]) continue;

		// 
		// check to make sure that the link is forward.
		// grid location of ccNodeID should be less than childID
		// 

		var ccLoc = sparseGridD.getGridLoc(ccNodeID);
		var childLoc = sparseGridD.getGridLoc(childID);
		
		if (childLoc.getY() < ccLoc.getY()) continue;
		if (childLoc.getX() < ccLoc.getX()) continue;

		// reachableNodes.push(childID);
		reachableNodesMap[childID] = childID;
	    }
	}
    }
}


//
// Place a node at the next available spot in the flow.
//
LytWorkflowLayout.prototype.placeNode = function(layoutContext, containerDesc, layoutFlow, levelU, sparseGridD, linkDS, parentNodeID, nodeProcessedMap) {

    var debug = false;
    if (debug) alert(' placeNode ' + parentNodeID);

    if (nodeProcessedMap[parentNodeID]) return;
    nodeProcessedMap[parentNodeID] = 1;

    var layoutFlow = containerDesc.getLayoutFlow();

    // get the grid location of the parent
    var parentLoc = sparseGridD.getGridLoc(parentNodeID);

    var linksIn = linkDS.getLinksIn();
    var linksOut = linkDS.getLinksOut();

    var nodeLoc;

    if (!linksOut[parentNodeID]) return;

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:

	for (var i=0; i<linksOut[parentNodeID].length; i++) {

	    nodeID = linksOut[parentNodeID][i];
	    if (debug) alert(' flow top_down place node ' + nodeID);

	    // do not place a node that has already been placed
	    if (sparseGridD.getGridLocOrNull(nodeID)) continue;

	    switch (i) {

		//
		// Position first link out below parent node 
		//
	    case 0:

		var nextRow = parentLoc.getY()+1;
		// alert(nodeID + ' placeNode parent X ' + parentLoc.getX() + ' ' + sparseGridD.getMaxX(nextRow));

		// 
		// check for a collision in the next row.
		// 
		if (parentLoc.getX() <= sparseGridD.getMaxX(nextRow)) {
		    // alert(' pre pushNodeRight ' + parentNodeID + ' current grid ' + sparseGridD.getGridLoc(parentNodeID).getString());
		    this.pushNodeRight(containerDesc, sparseGridD, linkDS, parentNodeID, sparseGridD.getMaxX(nextRow)+1);
		    // reset parent location
		    parentLoc = sparseGridD.getGridLoc(parentNodeID);
		}

		nodeLoc = new LytPoint(parentLoc.getX(), nextRow);
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		break;


		// 
		// Position the second link out next to the parent node
		// 
	    case 1:
		nodeLoc = new LytPoint(parentLoc.getX()+1, parentLoc.getY());
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		// alert(' case 1 ' + nodeID + ' ' + nodeLoc.getString());
		break;

		//
		// Third and subsequent links are positioned next to parent node.
		//
	    default:
		nodeLoc = new LytPoint(parentLoc.getX()+i, parentLoc.getY());
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		break;
	    }
	}

	break;

    case LytLayout.FLOW_LEFT_RIGHT:

	for (var i=0; i<linksOut[parentNodeID].length; i++) {

	    nodeID = linksOut[parentNodeID][i];
	    // alert(' place node ' + nodeID);

	    if (debug) alert(' flow left_right place node ' + nodeID);

	    // do not place a node that has already been placed
	    if (sparseGridD.getGridLocOrNull(nodeID)) continue;

	    switch (i) {

		//
		// Position first link out to the side of parent node
		//
	    case 0:

		var nextRow = parentLoc.getX()+1;
		// alert(nodeID + ' placeNode parent X ' + parentLoc.getX() + ' ' + sparseGridD.getMaxX(nextRow));

		// 
		// check for a collision in the next row.
		// 
		if (parentLoc.getY() <= sparseGridD.getMaxY(nextRow)) {
		    // alert(' pre pushNodeDown ' + parentNodeID + ' current grid ' + sparseGridD.getGridLoc(parentNodeID).getString());
		    this.pushNodeDown(containerDesc, sparseGridD, linkDS, parentNodeID, sparseGridD.getMaxY(nextRow)+1);
		    // reset parent location
		    parentLoc = sparseGridD.getGridLoc(parentNodeID);
		}

		nodeLoc = new LytPoint(nextRow, parentLoc.getY());
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		break;


		// 
		// Position the second link out below the parent node
		// 
	    case 1:
		nodeLoc = new LytPoint(parentLoc.getX(), parentLoc.getY()+1);
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		// alert(' case 1 ' + nodeID + ' ' + nodeLoc.getString());
		break;

		//
		// Third and subsequent links are positioned 
		//
	    default:
		nodeLoc = new LytPoint(parentLoc.getX(), parentLoc.getY()+i);
		sparseGridD.setGridLoc(nodeID, nodeLoc);
		break;

	    }
	}

	break;

    }

    // 
    // Recursively call placeNode for all links out
    //
    for (var i=0; i<linksOut[parentNodeID].length; i++) {
	nodeID = linksOut[parentNodeID][i];
	this.placeNode(layoutContext, containerDesc, layoutFlow, levelU, sparseGridD, linkDS, nodeID, nodeProcessedMap);
    }
}

LytWorkflowLayout.NODE_PLACEMENT_ORTHOGONAL = "NODE_PLACEMENT_ORTHOGONAL";
LytWorkflowLayout.NODE_PLACEMENT_HIERARCHICAL = "NODE_PLACEMENT_HIERARCHICAL";

LytWorkflowLayout.workflowLayout = function(layoutContext)
{
    var L = new LytLayout();
    var layout = new LytWorkflowLayout();

    var sparseGridD = new LytGridPadDesc();
    sparseGridD.setPad(50, 50);
    
    var layoutAttrs = layoutContext.getLayoutAttributes();
    
    var layoutFlow;
    layoutFlow = LytLayout.FLOW_TOP_DOWN;
    //layoutFlow = LytLayout.FLOW_LEFT_RIGHT;
    if (layoutAttrs && layoutAttrs["flowDir"])
    {
	if (layoutAttrs["flowDir"] === "leftRight")
	{
	    layoutFlow = LytLayout.FLOW_LEFT_RIGHT;
	}
    }
    
    var nodePlacementStyle;
    nodePlacementStyle = LytWorkflowLayout.NODE_PLACEMENT_ORTHOGONAL;
    //nodePlacementStyle = LytWorkflowLayout.NODE_PLACEMENT_HIERARCHICAL;
    if (layoutAttrs && layoutAttrs["nodePlacementStyle"])
    {
	if (layoutAttrs["nodePlacementStyle"] === "hierarchical")
	{
	    nodePlacementStyle = LytWorkflowLayout.NODE_PLACEMENT_HIERARCHICAL;
	}
    }
    
    layout.setLayoutDesc(sparseGridD);
    layout.setNodePlacementStyle(nodePlacementStyle);
    

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

    // set the arrow head length (pixels)
    // L.setArrowLength(0);

    // call the layout routine
    L.doLayout(layoutContext);
}
