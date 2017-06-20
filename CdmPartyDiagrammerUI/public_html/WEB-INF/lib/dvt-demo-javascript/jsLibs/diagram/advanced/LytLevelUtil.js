/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytLevelUtil.js

    Derive levels for tree/hierarchical layouts

    Output:

       deriveLevels() is called from tree-type layouts (LytTreeLayout.js)
       in order to create the level data structures:

       levelArray[][] - array for each level
       levelMap[nodeID] - maps nodeIDs to levels

    Notes:

    Minimize Crossings
    --------------------

    Minimizing link crossings between levels is supported.
    See:

       createConnectionMatrices()
       this._linkConnectionMatrix

    Structural Links
    ----------------

    Structural link data structures have an "St" postfix.

    One subtle aspect of level creation is dealing with inner container links.
    For example, 

       -----               -----
      |  -  |             |  -  |
      | | |---------------->| | |
      |  -  |             |  -  |
       -----               -----

    When laying at the top level, we would see no links between the containers.
    However, we want to structure the diagram (e.g. levelize with the levelArray)
    so we need to treat this case as if the link were between containers.

    This is why we use the structural versions of getLinksOut and getLinksIn (getLinksOutSt())
    These versions essentially see the links between the containers based on further processing
    (getVisibleContainer).

    Diagram Engine Treatement of Collapsed Containers
    -------------------------------------------------

    Also note that the DvtDiagram engine "rewrites" links when containers are collapsed.
    So here the layout engine would see i0->i1
   
       ------               ------
      |  c0  |             |  c1  |
      |  --  |             |  --  |
      | |i0| |-------------->|i1| |
      |  --  |             |  --  |
       ------               ------

    But if c1 is collapsed,
   
       ------               
      |  c0  |              ------
      |  --  |             |  c1  |
      | |i0| |------------>|      |
      |  --  |             |      |
       ------               ------

    the layout engine would see i0->c1

    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - Code Refactor
    lmolesky	04/30/12 - Change _linksInForward and _linksOutFoward to structural
    lmolesky	10/28/11 - Extending to support containers
    lmolesky	09/13/11 - Created

*/

//
// 
//

var LytLevelUtil = function()
{
    this.Init();

};

LytObj.createSubclass(LytLevelUtil, LytObj, "LytLevelUtil");

LytLevelUtil.prototype.Init = function()
{
    // array for each level
    this._levelArray = new Array();

    // maps node IDs to Levels
    this._levelMap =  new Array();

    // this._linkConnectionMatrix =  new Array();
    this._linkConnectionMatrix =  new Array();

    // max height of nodes in a level
    this._levelHeight = new Array();

    // 
    // Derived from leveU.linksOut and levelU.linksIn
    // 
    this._linksOutForward = new Array();
    this._linksInForward = new Array();

    this._initialCrossings = 0;

};

LytLevelUtil.prototype.getLevelArray = function() {
    return (this._levelArray);
}

LytLevelUtil.prototype.getLevelMap = function() {
    return (this._levelMap);
}

LytLevelUtil.prototype.getLevelHeight = function() {
    return (this._levelHeight);
}

LytLevelUtil.prototype.getLinksInForward = function() {
    return this._linksInForward;
}

LytLevelUtil.prototype.getLinksOutForward = function() {
    return this._linksOutForward;
}

LytLevelUtil.prototype.getNodeLevel = function(nodeID) {

    return (this._levelMap[nodeID]);

}

//
// Output of deriveLevels:
// 
// levelArray[][] - array for each level
// levelMap[nodeID] - maps nodeIDs to levels
//
LytLevelUtil.prototype.deriveLevels = function(layoutContext, linkDS, containerDesc, layoutClass, minimizeCrossings) {

    var debug = false;

    if (debug) alert(' **deriveLevels ');

    var nodeIndex;
    var nodeID;

    var rootNodes = this.createRootNodes(layoutContext, linkDS);

    var oneLevel = new Array();    

    var nodeCount = layoutContext.getNodeCount();

    // init levelMap
    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);
	nodeID = nodeContext.getId();

	this._levelMap[nodeID] = -1;

    }

    for (i=0; i<rootNodes.length; i++) {

	// nodeIndex = layoutContext.getNodeByIndex(i);
	// nodeID = nodeIndex.getId(rootNodesByIndex[i]);

	nodeID = rootNodes[i];

	if (debug) alert("root, index = " + rootNodes[i] + " nodeID " + nodeID);

	// root nodes at level 0
	this._levelMap[nodeID] = 0;

	oneLevel.push(nodeID);

    }

    // push the root level on to the levelArray.
    this._levelArray.push(oneLevel);

    if (debug) alert(" call deriveLevelsHelper " + oneLevel.length);
    
    this.deriveLevelsHelper(layoutContext, linkDS, oneLevel, 1);

    this.calculateLayoutLevelHeights(layoutContext, layoutClass);

    //
    this.createForwardLinks(layoutContext, linkDS);

    //
    // 
    //
    if (minimizeCrossings) {

	// create a link connection matrix.
	this.createConnectionMatrices(linkDS);

	if (debug) this.printConnectionMatrix(0);
	if (debug) this.printConnectionMatrix(1);

	this.reorderNodesInEachLevel(linkDS, 0);
    }
}

//
// Create nodes reachable from the current root nodes.
//

LytLevelUtil.prototype.createReachableNodes = function(layoutContext, linkDS, rootNodes) {

    var reachableNodesMap = new Array();

    //
    // All root nodes are reachable.
    //
    for (i=0; i<rootNodes.length; i++) {
	nodeID = rootNodes[i];
	reachableNodesMap[nodeID] = nodeID;
    }

    var nodeProcessedMap =  new Array();

    for (i=0; i<rootNodes.length; i++) {
	nodeID = rootNodes[i];
	// if (reachableNodesMap) alert (' has r');
	this.createReachableNodesHelper(layoutContext, linkDS, reachableNodesMap, nodeID, nodeProcessedMap);
    }

    return reachableNodesMap;


    // for (var rootID in this.reachableNodesMap) {
    // }
}

LytLevelUtil.prototype.createReachableNodesHelper = function(layoutContext, linkDS, reachableNodesMap, nodeID, nodeProcessedMap) {

    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    var linksOutSt = linkDS.getLinksOutSt();

    if (!linksOutSt[nodeID]) return;

    // alert (nodeID + ' crnh ');
    // if (reachableNodesMap) alert (nodeID + ' has r2 ');

    for (j=0; j<linksOutSt[nodeID].length; j++) {

	childID = linksOutSt[nodeID][j];

	//
	// If its not in the reachable map, add it, recursively call.
	//
	if (!reachableNodesMap[childID]) {

	    reachableNodesMap[childID] = childID;
	    this.createReachableNodesHelper(layoutContext, linkDS, reachableNodesMap, childID, nodeProcessedMap);

	}
    }
}



//
// Create forward links.
// Forward out links are derived based on ordering from this. and all linksOut.
// Similarly, for in links.
//
LytLevelUtil.prototype.createForwardLinks = function(layoutContext, linkDS) {

    var debug = false;

    var linksOutSt = linkDS.getLinksOutSt();
    var linksInSt = linkDS.getLinksInSt();

    var nodeIDa;
    var nodeIDb;

    var nodeCount = layoutContext.getNodeCount();
    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);
	nodeIDa = nodeContext.getId();

	var nodeALevel = this.getNodeLevel(nodeIDa);

	if (linksOutSt[nodeIDa]) {

	    for (j=0; j<linksOutSt[nodeIDa].length; j++) {

		nodeIDb = linksOutSt[nodeIDa][j];

		// alert(nodeIDa + ' check links out ' + nodeIDb + ' nodeALevel ' + nodeALevel + ' blevel ' + this.getNodeLevel(nodeIDb));

		// Forward links ...
		if (this.getNodeLevel(nodeIDb) > nodeALevel) {
		    if (!this._linksOutForward[nodeIDa]) this._linksOutForward[nodeIDa] = new Array();
		    this._linksOutForward[nodeIDa].push(nodeIDb);
		}
	    }
	    if (debug && this._linksOutForward[nodeIDa])
		alert(nodeIDa + ' forward links ' + this._linksOutForward[nodeIDa].length);
	}

	if (linksInSt[nodeIDa]) {

	    for (j=0; j<linksInSt[nodeIDa].length; j++) {

		nodeIDb = linksInSt[nodeIDa][j];

		// alert(nodeIDa + ' check links in ' + nodeIDb + ' nodeALevel ' + nodeALevel + ' blevel ' + this.getNodeLevel(nodeIDb));

		// Forward links ...
		if (this.getNodeLevel( nodeIDb) < nodeALevel) {
		    if (!this._linksInForward[nodeIDa]) this._linksInForward[nodeIDa] = new Array();
		    if (debug) alert(nodeIDa + '[ push ' + nodeIDb);
		    this._linksInForward[nodeIDa].push(nodeIDb);
		}
	    }
	}
    }
}

//
// Return a root node set for a graph that contains cycles.
//
// This is the case if we have "unreachable" nodes (from the root set).
//
// Cycle root nodes are derived as follows:
//    Incrementally add unreachable nodes to the root set
//    Recompute reachable set
//    Retest for unreachable nodes
// 
LytLevelUtil.prototype.findCycleRootNodes = function(layoutContext, linkDS, rootNodes) {

    var nodeCount = layoutContext.getNodeCount();

    var hasUnreachableNodes = true;
    var maxIterations = 50;
    var loopCount = 0;

    var linksOutSt = linkDS.getLinksOutSt();

    while (hasUnreachableNodes) {

	// detect bad code
	if (loopCount++ > maxIterations) break;

	var reachableNodesMap = this.createReachableNodes(layoutContext, linkDS, rootNodes);

	hasUnreachableNodes = false;

	var unReachableNodes = new Array();

	// Examine all nodes, if not in reachable, push to unreachable
	var nodeID;

	var nodeCount = layoutContext.getNodeCount();
	for (i=0; i<nodeCount; i++) {

	    nodeContext = layoutContext.getNodeByIndex(i);

	    // nodeContext = layoutContext.getNodeById(memberList[i]);
	    nodeID = nodeContext.getId();

	    if (!reachableNodesMap[nodeID]) {
		unReachableNodes.push(nodeID);
		hasUnreachableNodes = true;
	    }
	}
	
	//
	// If we have unreachable nodes,
	// pick the first one that has out links, add to root nodes.
	//
	if (hasUnreachableNodes) {

	    for (i=0; i<unReachableNodes.length; i++) {
		nodeID = unReachableNodes[i];

		// check to make sure we can update a param.
		if (linksOutSt[nodeID]) {
		    rootNodes.push(nodeID); 
		    break;
		}
	    }
	}
    }
}

LytLevelUtil.prototype.getFirstNodeWithLinksOut = function(layoutContext, linkDS) {

    var nodeCount = layoutContext.getNodeCount();

    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);
	nodeID = nodeContext.getId();

	if (linksIn[nodeID]) return nodeID;
    }

    return null;

}

LytLevelUtil.printAllNodes = function(layoutContext) {

    var nodeCount = layoutContext.getNodeCount();
    var nodeID;

    var allNodes = "AllNodes: ";

    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);
	nodeID = nodeContext.getId();

	allNodes += nodeID;
	if (i < nodeCount - 1)
	    allNodes += ",";

    }
    alert(allNodes);
}

//
// Determine which nodes are root nodes, return as an array.
//
LytLevelUtil.prototype.createRootNodes = function(layoutContext, linkDS) {

    var debug = false;
    var debugC = false;

    if (debugC) LytLevelUtil.printAllNodes(layoutContext);

    if (debug) alert(' createRootNodes ');

    var debug = false;

    var rootNodes;
    var rootNodes = new Array();    

    var linksInSt = linkDS.getLinksInSt();

    var nodeCount = layoutContext.getNodeCount();

    var rootID;

    var nodeCount = layoutContext.getNodeCount();
    for (i=0; i<nodeCount; i++) {

	nodeContext = layoutContext.getNodeByIndex(i);

	rootID = nodeContext.getId();

	//
	// safe init
	// Nodes not explicitly layed out get (0,0)
	//
	LytNodeUtil.setNodePosition(nodeContext, 0,0);

	// 
	// Note: linksInSt[] only maps links that have both src and dst within the container.
	// See the LytLinkDS.js code.
	// 

	if (!linksInSt[rootID]) {

	    rootNodes.push(rootID);
	    if (debug) alert("push root - index " + i + " id " + rootID);
	}
    }

    // 
    // If we haven't found any root nodes (nodes with no inlinks), then 
    // mark the first node in the data set as the root node.
    // 
    if (rootNodes.length == 0 && nodeCount > 0) {

	//
	// create a set of root nodes based on a different approach.
	//
 	this.findCycleRootNodes(layoutContext, linkDS, rootNodes);
	
	// this.printNodeArray(rootNodes, "cycleRootNodes ");

    }

    if (debugC) {

	var rn = "rootNodes ";
	for (var k=0; k<rootNodes.length; k++) {

	    rn += rootNodes[k];
	    rn += ',';
	}
	alert(rn);
    }

    return (rootNodes);
}



//
// Params:
//
//   linkDS: read linksIn data structure.
//   oneLevel: previous level - array of parents.
//
//
LytLevelUtil.prototype.deriveLevelsHelper = function(layoutContext, linkDS, oneLevelParent, levelNum) {

    var debug = false;

    var linksInSt = linkDS.getLinksInSt();
    var linksOutSt = linkDS.getLinksOutSt();

    var nodeIndex;
    var nodeID;

    if (debug) alert(" -> deriveLevelsHelper " + oneLevelParent.length + " level " + levelNum);

    //
    // Create the level for the children
    //
    var oneLevel = new Array();    

    for (i=0; i<oneLevelParent.length; i++) {

	var parentNodeID = oneLevelParent[i];

	// stop if there are no links out of the node
	if (!linksOutSt[parentNodeID]) continue;

	if (debug) alert("parent node " + parentNodeID + " linksout.length " + linkDS._linksOut[parentNodeID].length);

	//
	// Push all nodes that are linked to the parent node.
	// (don't push a node if it has already been pushed)
	//

	for (j=0; j<linksOutSt[parentNodeID].length; j++) {

	    childID = linksOutSt[parentNodeID][j];

	    if (debug) alert("link out " + childID);
	    // alert("link out " + childID);

	    //
	    // "promote" inner links so that we get the correct structure.
	    //
	    childID = linkDS.getVisibleContainer(layoutContext, childID);
	    // alert(' get vis child ' + childID);

	    if (this._levelMap[childID] == -1) {
		// 
		// make sure that this node has not been pushed already
		// 
		// alert(' push ' + childID);

		oneLevel.push(childID);
		this._levelMap[childID] = levelNum;
	    }
	}
    }

    if (oneLevel.length > 0) {

	// push the new level on to the levelArray.
	this._levelArray.push(oneLevel);

	// recursively call for next level.
	this.deriveLevelsHelper(layoutContext, linkDS, oneLevel, ++levelNum);
    }
}

//
// Print the level Array.
// Output Form: (nodeID:level#, nodeI:level#, ...)
//
LytLevelUtil.prototype.printLevelArray = function() {

    var level;
    var i;
    var j;

    alert('printLevelArrayC ');

    for (i=0; i<this._levelArray.length; i++) {

	level = ('[' + i + ']');

	for (j=0; j<this._levelArray[i].length; j++) {

	    if (j == 0) level += ': ';
	    if (j != 0) level += ',';

	    level += this._levelArray[i][j];

	}

	alert(level);
    
    }
}


//
// Create a link connection matrix.
// This is used to minimize crossings.
// (populates this._linkConnectionMatrix)
//
LytLevelUtil.prototype.createConnectionMatrices = function(linkDS) {

    var level;
    var i;

    for (i=0; i<this._levelArray.length - 1; i++) {

	this.createConnectionMatrix(linkDS, i);

    }
}

//
// Create the connection matrix at the specified level.
// (populates this._linkConnectionMatrix[])
//
LytLevelUtil.prototype.createConnectionMatrix = function(linkDS, level) {

    var j;
    var k;

    // 
    // Allocate one connectMatrix per pair of levels.
    //
    // For example, if we have 4 levels, 
    //   Matrix[0] will pair levels 0 and 1
    //   Matrix[1] will pair levels 1 and 2
    //   Matrix[2] will pair levels 2 and 3
    // 
    this._linkConnectionMatrix[level] = new LytConnectMatrix();

    // alert(' create connectin matrix ' + i);

    // m is shortcut handle
    m = this._linkConnectionMatrix[level];

    // 
    // Consider pairs of levels (i, i+1)
    // 
    var levelArray = this.getLevelArray();

    for (j=0; j<levelArray[level].length; j++) {

	var srcID = levelArray[level][j];

	m._rowNodeID[j] = srcID;
	m._connectMatrix[j] = new Array();
	
	for (k=0; k<levelArray[level+1].length; k++) {

	    var dstID = levelArray[level+1][k];

	    if (j == 0) m._colNodeID[k] = dstID;

	    if (linkDS.getLinkContext(srcID, dstID)) {
		m._connectMatrix[j][k] = 1;
	    } else {
		m._connectMatrix[j][k] = 0;
	    }
	}
    }
}


//
// Copy the new connect matrix to the level data structure (levelArray)
//
LytLevelUtil.prototype.copyConnections = function(linkDS, m, levelNumber) {

    // var level;
    var debug = false;

    var j;
    var k;

    var levelArray = this.getLevelArray();

    for (j=0; j<levelArray[levelNumber].length; j++) {

	levelArray[levelNumber][j] = m._rowNodeID[j];
	if(debug) alert(j + ' copy ' + m._rowNodeID[j]);
    }

    for (k=0; k<levelArray[levelNumber+1].length; k++) {
	
	levelArray[levelNumber+1][k] = m._colNodeID[k];
	if (debug) alert(k + ' copy * ' + m._colNodeID[k]);
    }

    // re-create the connection matrix
    this.createConnectionMatrix(linkDS, levelNumber);

    //
    // re-create the next level down (this is sufficient, as long as we iterate top-down).
    //
    if ((levelNumber+1) < levelArray.length - 1) 
	this.createConnectionMatrix(linkDS, levelNumber+1);

}


LytLevelUtil.prototype.printConnectionMatrix = function(i) {

    var rowVector = '';
    var colHeader = 'cols: ';
    var rowHeader = 'rows: ';

    var j;
    var k;

    var m = this._linkConnectionMatrix[i];

    for (j=0; j<m._rowNodeID.length; j++) {
	rowHeader += m._rowNodeID[j];
	rowHeader += ' ';
    }
    alert(rowHeader);

    for (j=0; j<m._connectMatrix.length; j++) {

	var srcID = m._rowNodeID[j];
	    
	rowVector = srcID + ' [';

	// alert(j + ' srcID ' + srcID);

	if (j == 0) {
	    for (k=0; k<m._connectMatrix[j].length; k++) {
		colHeader += m._colNodeID[k];
		colHeader += ' ';
	    }
	    alert(colHeader);
	}

	for (k=0; k<m._connectMatrix[j].length; k++) {

	    // alert(k + ' k ');

	    rowVector += m._connectMatrix[j][k];
	    rowVector += ' ';
	}

	rowVector += ']';
	alert(rowVector);

    }
}

//
// Return the number, rounded to decimal_points
//
function roundNumber(number,decimal_points) {

    if(!decimal_points) return Math.round(number);

    if(number == 0) {
	var decimals = "";
	for(var i=0;i<decimal_points;i++) decimals += "0";
	return "0."+decimals;
    }

    var exponent = Math.pow(10,decimal_points);
    var num = Math.round((number * exponent)).toString();
    return num.slice(0,-1*decimal_points) + "." + num.slice(-1*decimal_points)

}

//
// Reorder nodes in each level in order to reduce crossings.
//
// Terminate if crossings == 0
// Terminate if both row/columns are ordered.
//
LytLevelUtil.prototype.reorderNodesInEachLevel = function(linkDS, levelNumber) {

    var debug = false;

    var m = this._linkConnectionMatrix[levelNumber];

    var r;
    var k;

    var numReorderAttempts = 5;
    for (k=0; k<numReorderAttempts; k++) {
    
	if (k == 0) r = this.reorderMatrix(m);
	else r = this.reorderMatrix(r[LytLevelUtil.MATRIX_INDEX]);

	if (r[LytLevelUtil.TERMINATE_INDEX]) break;
    }

    //
    // Write the reording back
    //
    this.copyConnections(linkDS, r[LytLevelUtil.MATRIX_INDEX], 0);

    // copy r[] to this.linkConnectionMatrix()
    // m.printConnectionMatrix();

    if (debug) {
	alert('printConnectionMatrix after major reorder ' );
	this.printConnectionMatrix(0);
    }


    //
    // Sequentially reorder rows of all levels.
    //
    var i;
    var levelArray = this.getLevelArray();
    for (i=1; i<levelArray.length - 1; i++) {

	var levelNumber = i;
	if (debug) alert('level number ' + levelNumber);

	var m = this._linkConnectionMatrix[levelNumber];

	if (debug) {
	    alert('printConnectionMatrix before reorder levelNumber  ' + levelNumber );
	    this.printConnectionMatrix(levelNumber);
	}

	// r = this.reorderMatrixRows(m);

	r = this.reorderMatrixCols(m);

	if (debug) {
	    alert('printConnectionMatrix after reorder levelNumber  ' + levelNumber );
	    this.printConnectionMatrix(levelNumber);
	}

	this.copyConnections(linkDS, r[LytLevelUtil.MATRIX_INDEX], levelNumber);

    }
    // alert('  crossings ' + this.getCrossings(cID, linkDS));

}

LytLevelUtil.MATRIX_INDEX = 0;
LytLevelUtil.TERMINATE_INDEX = 1;

// 
// Used to support link crossing minimization
//
LytLevelUtil.prototype.reorderMatrixRows = function(m) {

    var r = new Array();
    r[LytLevelUtil.MATRIX_INDEX] = null;

    m.calcMetrics();

    // 
    // Return if the matrix has no crossings
    // or if both metrics are ordered
    //
    if (m.getCrossings() == 0 || m.isOrdered()) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
	r[LytLevelUtil.TERMINATE_INDEX] = true;
	return r;
    }

    var mPrev = new LytConnectMatrix();
    mPrev.clone(m);

    var crossingsPrev = m.getCrossings();

    //
    // Reorder by rows
    //
    var b = LytConnectMatrix.sortByNumericValue(m._rowMetric) 

    m.reOrderRows(b);
    m.calcMetrics();

    if (m.getCrossings() == 0 || m.isOrdered() || crossingsPrev > m.getCrossings()) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
    }
    else {
	r[LytLevelUtil.MATRIX_INDEX] = mPrev;
    }

    r[LytLevelUtil.TERMINATE_INDEX] = true;
    return r;


}

// 
// Used to support link crossing minimization
//
LytLevelUtil.prototype.reorderMatrixCols = function(m) {

    var debug = false;

    var r = new Array();
    r[LytLevelUtil.MATRIX_INDEX] = null;

    m.calcMetrics();
    if (debug) alert('reorderMatrixCols colMetrics: ' + m._colMetric);

    // 
    // Return if the matrix has no crossings
    // or if both metrics are ordered
    //
    if (m.getCrossings() == 0 || m.isOrdered()) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
	r[LytLevelUtil.TERMINATE_INDEX] = true;
	if (debug) alert('early return');
	return r;
    }
    var mPrev = new LytConnectMatrix();
    mPrev.clone(m);

    var crossingsPrev = m.getCrossings();

    //
    // Reorder by cols
   //
    var b = LytConnectMatrix.sortByNumericValue(m._colMetric) 
    // var b = LytConnectMatrix.sortByNumericValueInverse(m._colMetric) 

    m.reOrderCols(b);
    m.calcMetrics();
    if (debug) alert('reorderMatrixCols +1 colMetrics: ' + m._colMetric);

    var crossings = m.getCrossings();

    if (crossings == 0 || m.isOrdered() || crossingsPrev > crossings) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
	if (debug) alert(' return m');
    }
    else {
	r[LytLevelUtil.MATRIX_INDEX] = mPrev;
	if (debug) alert(' return mPrev,  crossings ' + crossings + ' crossingsPrev ' + crossingsPrev);
    }

    r[LytLevelUtil.TERMINATE_INDEX] = true;
    return r;

}

// 
// Reorder the passed matrix.
// 
// @return matrix in r[LytLevelUtil.MATRIX_INDEX], r[LytLevelUtil.TERMINATE_INDEX] is true if we should terminate.
// 
LytLevelUtil.prototype.reorderMatrix = function(m) {

    var debug = false;

    var r = new Array();
    r[LytLevelUtil.MATRIX_INDEX] = null;

    m.calcMetrics();
    if (debug) alert(' Enter reorderMatrix() ');
    if (debug) m.printConnectionMatrix();

    // 
    // Return if the matrix has no crossings
    // or if both metrics are ordered
    //
    if (m.getCrossings() == 0 || m.isOrdered()) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
	r[LytLevelUtil.TERMINATE_INDEX] = true;
	if (debug) alert('reorderMatrix no crossings or already ordered');
	return r;
    }

    // alert(' new print function ' );
    // m.printConnectionMatrix();


    if (debug) alert('reorder matrix clone');

    var mPrev = new LytConnectMatrix();
    mPrev.clone(m);

    // alert(' new print function on clone ' );
    // mPrev.printConnectionMatrix();

    var crossingsPrev = m.getCrossings();

    if (debug) alert('pre crossings ' + m.getCrossings());

    //
    // Reorder by rows
    //
    var b = LytConnectMatrix.sortByNumericValue(m._rowMetric) 

    m.reOrderRows(b);
    m.calcMetrics();

    if (debug) alert('crossings after row order ' + m.getCrossings());

    if (m.getCrossings() == 0 || m.isOrdered()) {
	r[LytLevelUtil.MATRIX_INDEX] = m;
	r[LytLevelUtil.TERMINATE_INDEX] = true;
	if (debug) alert('reorderMatrix no crossings or already ordered after reorder rows');
	return r;
    }

    //
    // if row and column metrics are ordered, terminate and return.
    //

    if (crossingsPrev <= m.getCrossings()) {
	// 
	// no improvement, so keep previous matrix.
	// 
	m = mPrev;
	if (debug) alert('reorderMatrix no improvement after reorder rows');
    }
    else {
	crossingsPrev =  m.getCrossings();
	if (debug) alert('reorderMatrix IMPROVEMENT after reorder rows, crossingsPrev ' + crossingsPrev + ' crossings ' + m.getCrossings());
	if (debug) m.printConnectionMatrix();
    }

    var mPrev = new LytConnectMatrix();
    mPrev.clone(m);

    // alert(' colmetric len ' + m._colMetric.length);

    //
    // column sort
    //

    var b2 = LytConnectMatrix.sortByNumericValue(m._colMetric) 
    m.reOrderCols(b2);

    if (crossingsPrev <= m.getCrossings()) {
	m = mPrev;
	if (debug) alert('reorderMatrix no improvement after reorder cols');
    }
    else {
	crossingsPrev =  m.getCrossings();
	if (debug) alert('reorderMatrix IMPROVEMENT after reorder cols');
	if (debug) m.printConnectionMatrix();
    }

    if (debug) alert('crossings after column order ' + m.getCrossings());

    r[LytLevelUtil.MATRIX_INDEX] = m; 
    r[LytLevelUtil.TERMINATE_INDEX] = false;

    return r;

}



//
// Calculate the heights of each level of the layout.
//
LytLevelUtil.prototype.calculateLayoutLevelHeights = function(layoutContext, layoutClass) {

    var debug = false;

    var levelArray = this.getLevelArray();
    if (!levelArray) return;

    // 
    // Variable names (maxHeight) make sense for TOP_DOWN case.
    // For TOP_DOWN, height in the level is the node's height.
    // For LEFT_RIGHT, height in the level is the node's width.
    //
    for (i=0; i<levelArray.length; i++) {

	var maxHeight = 0;
	var containerDesc = layoutClass.getLayoutDesc();
	var layoutFlow = containerDesc.getLayoutFlow();

	for (j=0; j<levelArray[i].length; j++) {

	    nodeContext = layoutContext.getNodeById(levelArray[i][j]);
	    nodeID = nodeContext.getId();

	    // if (debug) alert('calc ' + nodeID);
	    
	    // alert(nodeContext.getId());
            // dvtRect = nodeContext.getBounds();

	    // top-down calculation
	    switch (layoutFlow) {

	    case LytLayout.FLOW_TOP_DOWN:

		if (LytNodeUtil.getNodeHeight(nodeContext) > maxHeight) 
		    maxHeight = LytNodeUtil.getNodeHeight(nodeContext);
		break;

	    case LytLayout.FLOW_LEFT_RIGHT:

		if (LytNodeUtil.getNodeWidth(nodeContext) > maxHeight) maxHeight = LytNodeUtil.getNodeWidth(nodeContext);
		break;
	    }
	}

	this._levelHeight[i] = maxHeight;
    }
}

//
// copied this in from workflowlayout.js
//
LytLevelUtil.prototype.printNodeArray = function(nodeArray, str) {

    var buffer = "";
    for (var i=0; i<nodeArray.length; i++) {
	buffer += nodeArray[i];
	if (i < nodeArray.length - 1) buffer += ",";
    }
    alert(str + ' ' + buffer);
}


// LytLevelUtil.LAYOUT_GRID = 0;
