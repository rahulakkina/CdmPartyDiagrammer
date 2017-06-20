/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LinkDS.js

    Link Data Structures
    Creates links in and links out

    Standard vs. Structural Links
    -----------------------------

    Note that both "standard" and structural links are maintained.
    These are often identical, but differ when there are inner container links.

       - Structural Links: linksInSt, linksOutSt
       - Actual Links: linksIn, linksOut

    For example, if two container members are linked:

       -----               -----
      |  -  |             |  -  |
      | | |---------------->| | |
      |  -  |             |  -  |
       -----               -----

    The actual links would never be seen when processing containers.
    So we figure out the enclosing container of a link 

       ------               ------
      |  c0  |             |  c1  |
      |  --  |             |  --  |
      | |i0| |-------------->|i1| |
      |  --  |             |  --  |
       ------               ------

    This is implemented with getVisibleContainer(layoutContext, ID)

    The actual links are still needed when determining where to place links.

    See also the comments in LytLevelUtil.js

    NOTES

    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - Restructure code to reflect render-defined containers
    bglazer     12/14/11 - new Diagram layout classes from EM with some container
                        support from label LAYOUT_MAIN_GENERIC_111130.0112
    lmolesky	10/30/11 - Extend for container support.
    lmolesky	09/13/11 - Created

*/

//
// 
//
//

var LytLinkDS = function()
{
    this.Init();

};

LytObj.createSubclass(LytLinkDS, LytObj, "LytLinkDS");

LytLinkDS.prototype.Init = function()
{

    this._allNodesMap = new Array();    

    //
    // Links in/out
    //
    this._linksIn = new Array();    
    this._linksOut = new Array();    

    //
    // Structural links in/out
    //
    this._linksInSt = new Array();    
    this._linksOutSt = new Array();    

    this._childIndex = new Array();    

    // stores actual links
    this._linkMapper = new Array();

};

// 
// Returns the linkContext of link with srcID -> dstID in container cid.
// 
LytLinkDS.prototype.getLinkContext = function(srcID, dstID) {

    // alert(' get link context ' + cID);

    if (!this._linkMapper) {
	return null;
	// alert('ERROR: no linkMapper ' + cID);
    }

    if (!this._linkMapper[srcID]) return null;
    if (!this._linkMapper[srcID][dstID]) return null;

    return this._linkMapper[srcID][dstID];
}


LytLinkDS.prototype.getLinksIn = function()
{
  return this._linksIn;
};


LytLinkDS.prototype.getLinksOut = function()
{
  return this._linksOut;
};


LytLinkDS.prototype.getLinksInSt = function()
{
  return this._linksInSt;
};


LytLinkDS.prototype.getLinksOutSt = function()
{
  return this._linksOutSt;
};

//
// For a tree, Child index orders the children of a parent (0, 1, 2, ...)
//
LytLinkDS.prototype.getChildIndex = function(nodeID)
{
    return this._childIndex[nodeID];
};

//
// Create inlink data structures
//
LytLinkDS.prototype.createLinksInAndOut = function(layoutContext) {

    var srcID;
    var dstID;

    var debugC = false;

    var i;
    var linkCount = layoutContext.getLinkCount();

    //
    // Create a linksIn and linksOut structure for each node,
    // within the node's container
    //
    // Iterate through global link structure, 
    //
    //

    // this.createAllNodesMap(layoutContext);

    for (i=0; i<linkCount; i++) {

	linkContext = layoutContext.getLinkByIndex(i);

	dstID = linkContext.getEndId();
	srcID = linkContext.getStartId();
	
	if (!srcID) continue;
	if (!dstID) continue;

	srcNodeContext = layoutContext.getNodeById(srcID);
	dstNodeContext = layoutContext.getNodeById(dstID);

	srcCID = srcNodeContext.getContainerId();
	dstCID = dstNodeContext.getContainerId();
	
	//
	// Check to make sure link endpoints are visible.
	// If not, rewrite id to be containerID until it is visible.
	//
	var srcIDSt = this.getVisibleContainer(layoutContext, srcID);
	var dstIDSt = this.getVisibleContainer(layoutContext, dstID);

	// alert(' get vis ' + srcIDSt + ' ' + dstIDSt);

	// var cID = LytContainerUtil.getNodeCID(srcNodeContext);

	//
	// reference the linksOut/linksIn structure specific to the container.
	//

	var linksOutC = this._linksOut;
	var linksInC = this._linksIn;

	if (!linksOutC[srcID]) linksOutC[srcID] = new Array();
	linksOutC[srcID].push(dstID);

	if (!linksInC[dstID]) linksInC[dstID] = new Array();
	linksInC[dstID].push(srcID);

	//
	// Structural links determine the level.
	//

	var linksOutCSt = this._linksOutSt;
	var linksInCSt = this._linksInSt;

	//
	if (!linksOutCSt[srcIDSt]) linksOutCSt[srcIDSt] = new Array();
	linksOutCSt[srcIDSt].push(dstIDSt);

	if (!linksInCSt[dstIDSt]) linksInCSt[dstIDSt] = new Array();
	linksInCSt[dstIDSt].push(srcIDSt);

	if (debugC) alert(' createLinksIn/Out * ' + srcID + ' ' + dstID);

	//
	// store for future link lookup
	//

	if (!this._linkMapper) {
	    this._linkMapper = new Array();
	    // alert(' create link mapper ' + cID);

	}
	if (!this._linkMapper[srcID]) this._linkMapper[srcID] = new Array();
	this._linkMapper[srcID][dstID] = linkContext;
	
	 // alert(cID + ' linkmapper srcid ' + srcID + ' dstid ' + dstID);

    }

    //
    // create childIndex
    // childIndex numbers the children
    //
    var nodeCount = layoutContext.getNodeCount();

    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);
	srcID = nodeContext.getId();

	if (!srcID) continue;

	// if (this._linksOutContainer[cID][srcID]) {
	if (this._linksOut[srcID]) {

	    for (var j=0; j<this._linksOut[srcID].length; j++) {

		dstID = this._linksOut[srcID][j];
		this._childIndex[dstID] = j;

	    }
	}	
    }
}


LytLinkDS.prototype.containsNode = function(layoutContext, testNodeID) {

    var nodeCount = layoutContext.getNodeCount();

    for (var i=0; i<nodeCount; i++) {

	var nodeContext = layoutContext.getNodeByIndex(i);
	var srcID = nodeContext.getId();

	if (!srcID) continue;

	if (srcID == testNodeID) return true;

	// this._allNodes.push(srcID);

    }	

    return false;
}

//
// Get the visible container ...
// If the node is visible, return the original node.
// Othewise, return the first container that "contains" the node.
// Used to define the level structure when we have inner links.
//
LytLinkDS.prototype.getVisibleContainer = function(layoutContext, nodeID) {

    var debug = true;
    var debug = false;

    var i = 0;

    //
    // use a max Depth to avoid infinite loops
    //
    var maxDepth = 100;
    var nodeContext = layoutContext.getNodeById(nodeID);
    var newNodeID = null;

    if (this._allNodesMap[nodeID]) {
	if (debug) alert(nodeID + " use original id " + nodeID);
	return nodeID;
    }

    while (i++ < maxDepth) {

	if (!this._allNodesMap[nodeID]) {
	    if (debug) alert(nodeID + " use container id " + nodeContext.getContainerId());
	    newNodeID = nodeContext.getContainerId();

	    if (newNodeID == null)  return nodeID;

	    if (nodeID == newNodeID) return nodeID;
	    else nodeID = newNodeID;
	}
	else {
	    return nodeID;
	}
    }

    return nodeID;
}


LytLinkDS.prototype.printLinksOut = function(layoutContext) {

    var nodeCount = layoutContext.getNodeCount();
    alert('printLinksOutContainers ');

    for (var i=0; i<nodeCount; i++) {

	var nodeContext = layoutContext.getNodeByIndex(i);
	var srcID = nodeContext.getId();

	if (!srcID) continue;

	if (this._linksOut[srcID]) {

	    for (var j=0; j<this._linksOut[srcID].length; j++) {

		var dstID = this._linksOut[srcID][j];

		alert('linksOut ' + srcID + ' dst ' + dstID + ' j ' + j);
	    }
	}	
    }	
}

LytLinkDS.prototype.printLinksIn = function(layoutContext) {

    var nodeCount = layoutContext.getNodeCount();
    alert('printLinksIn ');

    for (var i=0; i<nodeCount; i++) {

	var nodeContext = layoutContext.getNodeByIndex(i);
	var srcID = nodeContext.getId();

	if (!srcID) continue;

	if (this._linksIn[srcID]) {

	    for (var j=0; j<this._linksIn[srcID].length; j++) {

		var dstID = this._linksIn[srcID][j];

		alert('linksIn ' + srcID + ' dst ' + dstID + ' j ' + j);
	    }

	}	
    }	
}

