/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytTreeLayout.js

    Implementation of tree and "general directed graph (tolerates cycles)" layouts.
    Tree layouts have no cycles.  
    LytTreeLayout can also handle cycles, however, the resulting layouts may not look the best.

    Algorithm based on Kozo Sugiyama publicaion in
    "Graph Drawing and Applications", Series on Software Engineering and Knowledge Engineering Vol. 11

    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - Code Refactor
    lmolesky	04/30/12 - Optimize positionAllNodes() (removed loop that positioned nodes with getSubtreeWidth())
    lmolesky	03/15/12 - Code cleanup, for distribution
    lmolesky	02/02/12 - Improvements to layout algorthm - see compressor()
    lmolesky	10/25/11 - call super.doLayout() to set up container data structures.
    lmolesky	10/06/11 - Move getNodeWidthFlow() to LytNodeUtil.  New function handle labels.
    lmolesky	09/13/11 - Created

*/

//
// 
//
var LytTreeLayout = function()
{
    this.Init();

};

LytObj.createSubclass(LytTreeLayout, LytLayout, "LytTreeLayout");

LytTreeLayout.prototype.Init = function()
{

    LytTreeLayout.superclass.Init.call(this);

    //
    // Support default LytTreeLayoutDesc
    //
    if (!this._layoutDesc)
	this._layoutDesc = new LytTreeLayoutDesc();

};


LytTreeLayout.prototype.setLayoutDesc = function(layoutDesc) {
    this._layoutDesc = layoutDesc;
}


LytTreeLayout.prototype.getLayoutDesc = function() {

    //
    // Tolerates the case when the api calls setLayoutDesc()
    //
    if (!this._layoutDesc) this._layoutDesc = new LytTreeLayoutDesc();

    return (this._layoutDesc);
}


LytTreeLayout.prototype.getRowSpace = function() {
    // return this._rowSpace;
    return this.getLayoutDesc().getRowSpace();
}

LytTreeLayout.prototype.getOptimizeNodePositions = function() {
    return this.getLayoutDesc().getOptimizeNodePositions();
}

LytTreeLayout.prototype.getBetweenLevelSpace = function() {
    // return this._betweenLevelSpace;
    return this.getLayoutDesc().getBetweenLevelSpace();
}

LytTreeLayout.prototype.getLayoutAlign = function() {
    // return this._layoutAlign;
    return this.getLayoutDesc().getLayoutAlign();
}



//
// When we have multiple links in, adjust the node position based on the average of all parents.
// Note, that we adjust node positions based on node centers.
//
//
// a30
LytTreeLayout.getAverageNodePosition = function(layoutContext, layoutFlow, linksInF, linksOutForward, rowSpace, nodeID) {

    var j;
    var parentID;
    var nodeContext;
    var nodeContextParent;
    var parentX;

    var sumXorY = 0;


    var nodeHeight;
    var nodeWidth;

    var debug = false;
    if (debug) alert('getAvgNodePos ' + nodeID);

    if (!linksInF) return;

    //
    // non-tree case (nodeID has multiple inLinks)
    // set to average value of all parents.
    //
    // avgX = 0;

    var p;

    for (j=0; j<linksInF.length; j++) {

	// 
  	// Set the node's center to the avg of all parent centers.
	// 

	parentID = linksInF[j];
	nodeContextParent = layoutContext.getNodeById(parentID);


	switch (layoutFlow) {

	case LytLayout.FLOW_TOP_DOWN:

	    p = LytNodeUtil.getNodeAbsoluteCenterConnectPoint(nodeContextParent);
	    sumXorY += p.x;

	    break;

	case LytLayout.FLOW_LEFT_RIGHT:
	    //
	    // nothing special when the top node part is the main icon
	    // nodeHeight = LytNodeUtil.getNodeHeight(nodeContext);
	    // 
	    parentY = LytNodeUtil.getOriginY(nodeContextParent);
	    sumXorY += parentY;

	    break;

	}
    }
    
    var avgX = sumXorY / linksInF.length;

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:

	nodeContext = layoutContext.getNodeById(nodeID);
	nodeWidth = LytNodeUtil.getNodeWidth(nodeContext);

	avgX -= nodeWidth / 2;
	
	// alert('nodeID ' + nodeID + ' FLOW_TOP_DOWN nodeWidth ' + nodeWidth);

	break;

    case LytLayout.FLOW_LEFT_RIGHT:
	break;

    }

    return avgX;

}

// 
// Return the parent positon based on the average of all child nodes.
// 
LytTreeLayout.getAverageParentNodePosition = function(layoutContext, layoutFlow, linksOutF, linksInForward, nodeID, defaultReturnX) {

    var j;
    var childID;

    var nodeContextChild;
    var childX;

    var p;

    var sumXorY = 0;

    if (!linksOutF) return defaultReturnX;

    //
    // If the parent node has a single outlink to a child that has multiple inlinks,
    // then do not make adustments to the parent.
    //
    if (linksOutF.length == 1 && linksInForward[linksOutF[0]].length > 1) {
	return defaultReturnX;
    }

    //
    // Multiple out links - calculate average of all children
    // Average based on child centers.
    //

    for (j=0; j<linksOutF.length; j++) {

	childID = linksOutF[j];
	nodeContextChild = layoutContext.getNodeById(childID);

	// childX = LytNodeUtil.getOriginFlow(nodeContextChild, layoutFlow);
	// sumXorY += childX;

	switch (layoutFlow) {

	case LytLayout.FLOW_TOP_DOWN:

	    p = LytNodeUtil.getNodeAbsoluteCenterConnectPoint(nodeContextChild);
	    sumXorY += p.x;

	    break;

	case LytLayout.FLOW_LEFT_RIGHT:
	    //
	    // nothing special when the top node part is the main icon
	    // nodeHeight = LytNodeUtil.getNodeHeight(nodeContext);
	    // 
	    var parentY = LytNodeUtil.getOriginY(nodeContextChild);
	    sumXorY += parentY;

	    break;

	}

    }
    

    var avgX = sumXorY / linksOutF.length;

    //
    // adjust based on the parent node center
    //
    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:

	var nodeContext = layoutContext.getNodeById(nodeID);
	var nodeWidth = LytNodeUtil.getNodeWidth(nodeContext);

	avgX -= nodeWidth / 2;
	
	break;

    case LytLayout.FLOW_LEFT_RIGHT:
	break;

    }


    return avgX;

}

LytTreeLayout.sortNumber = function(a,b)
{
    return b - a;
}
LytTreeLayout.sortPriority = function(a,b) {

    return (b.metric - a.metric);
}

LytTreeLayout.sortIndexAscending = function(a,b) {

    return (a.levelIndex - b.levelIndex);
}

LytTreeLayout.sortIndexDescending = function(a,b) {

    return (b.levelIndex - a.levelIndex);
}

LytTreeLayout.printPriority = function(priority) {
    LytTreeLayout.printPriorityLimit(priority, priority.length);
}

LytTreeLayout.printPriorityLimit = function(priority, limit) {

    var j;
    //    var p = new Array();

    var s = "";
    limit = Math.min(priority.length, limit);


    for (j=0; j<limit; j++) {

	s += '{';
	s += priority[j].nodeID;
	s += ': ';

	s += '*levelIndex: ';
	s += priority[j].levelIndex;
	s += ', ';

	s += 'childIndex: ';
	s += priority[j].childIndex;
	s += ', ';

	s += 'metric: ';
	s += priority[j].metric;

	s += '}, ';

	// alert(' metric ' + priority[j].metric);

	// p.push(priority[j].metric);

    }
    // alert (p);
    alert (s);
}

LytTreeLayout.printLevelPriority = function(p) {

    var k;
    //    var p = new Array();

    var s = "";

    for (k=0; k<p.length; k++) {

	s += '{';
	s += p[k].nodeID;
	s += ': ';

	s += 'levelIindex: ';
	s += p[k].levelIndex;

	s += '}, ';

    }
    alert (s);
}

//
// Return a copy of priority[] that has all .levelIndex < testLevelIndex
//
LytTreeLayout.getSmallerLevelIndexNodes = function(priority, arrayLimit, testLevelIndex) {

    var j;

    var returnPriority = new Array();

    for (j=0; j<arrayLimit; j++) {

	if (priority[j].levelIndex < testLevelIndex) {
	    returnPriority.push({nodeID: priority[j].nodeID, 
				 levelIndex: priority[j].levelIndex,
				 metric: priority[j].metric,
				 childIndex: priority[j].childIndex});

	}
    }

    // LytTreeLayout.printPriority(returnPriority);

    return returnPriority;

}

LytTreeLayout.getLargerLevelIndexNodes = function(priority, arrayLimit, testLevelIndex) {

    var j;

    var returnPriority = new Array();

    for (j=0; j<arrayLimit; j++) {

	if (priority[j].levelIndex > testLevelIndex) {
	    returnPriority.push({nodeID: priority[j].nodeID, 
				 levelIndex: priority[j].levelIndex,
				 metric: priority[j].metric,
				 childIndex: priority[j].childIndex});

	}
    }

    // LytTreeLayout.printPriority(returnPriority);

    return returnPriority;

}


LytTreeLayout.pushForward = function(layoutContext, priority, arrayLimit, nodeID, levelIndex, layoutFlow, rowSpace, forward) {

    var debug2 = false;
    var debug = false;

    var j;

    // if (nodeID == 'g') alert('PUSH G');
    if (debug2 && nodeID == 'n3') alert('PUSH n3' + arrayLimit + ' ' + levelIndex + ' p.len ' + priority.length);
    if (debug2 && nodeID == 'n3') LytTreeLayout.printPriorityLimit(priority, arrayLimit);

    // copy the nodeID and index, then sort on index.

    var oneLevelPriority = new Array();

    // if (arrayLimit > priority.length - 1) arrayLimit = priority.length - 1;    

    arrayLimit = Math.min(arrayLimit, priority.length);

    //
    // Consider a subset of the elements in the priority array, those that have already been placed.
    //
    for (j=0; j<arrayLimit; j++) {

	oneLevelPriority.push({nodeID: priority[j].nodeID, levelIndex: priority[j].levelIndex});

    }

    if (forward)
	oneLevelPriority.sort(LytTreeLayout.sortIndexAscending);
    else 
	oneLevelPriority.sort(LytTreeLayout.sortIndexDescending);

    if (debug2) LytTreeLayout.printLevelPriority(oneLevelPriority);

    var prevNodeID;

    var nextX;
    var nextY;

    var nextNodeID;

    var nodeWidth;
    var nodeHeight;

    // LytTreeLayout.printLevelPriority(oneLevelPriority);

    for (j=0; j<oneLevelPriority.length; j++) {

	if (debug) alert(' check ' + nodeID + ' against ' +  oneLevelPriority[j].nodeID);

	if (forward) {
	    // consider only nodes we want to push forward.
	    if (levelIndex >= oneLevelPriority[j].levelIndex) {
		if (debug2) alert(' skip '  +  oneLevelPriority[j].nodeID);
		continue;
	    }
	}
	if (!forward) {

	    if (levelIndex <= oneLevelPriority[j].levelIndex) {
		if (debug2) alert(' back skip '  +  oneLevelPriority[j].nodeID);
		if (debug2) alert(' fixed node ' + nodeID + ' ' + levelIndex + ' float node  ' + oneLevelPriority[j].nodeID + ' ' +  oneLevelPriority[j].levelIndex);
		continue;
	    }
	}


	switch (layoutFlow) {

	case LytLayout.FLOW_LEFT_RIGHT:
	case LytLayout.FLOW_TOP_DOWN:

	    // nodeID = priority[arrayLimit].nodeID;
	    nodeContext = layoutContext.getNodeById(nodeID);

	    currentX = LytNodeUtil.getOriginX(nodeContext);
	    currentY = LytNodeUtil.getOriginY(nodeContext);

	    nodeWidth = LytNodeUtil.getNodeWidth(nodeContext);
	    nodeHeight = LytNodeUtil.getNodeHeight(nodeContext);

	    nextNodeID = oneLevelPriority[j].nodeID;
	    nextNodeLevelIndex = oneLevelPriority[j].levelIndex;
	    nextNodeContext = layoutContext.getNodeById(nextNodeID);

	    nextX = LytNodeUtil.getOriginX(nextNodeContext);
	    nextY = LytNodeUtil.getOriginY(nextNodeContext);

	    if (nextNodeID == nodeID) continue;

	    // if (nodeID == 'g' && nextNodeID == 'h') {
	    // alert('gh gx ' + currentX + ' hx ' + nextX);
	// }

	    // Check for overlap
	    if (forward) {

		// if ((currentX + nodeWidth + rowSpace) > nextX) {

		switch (layoutFlow) {
		    
		case LytLayout.FLOW_TOP_DOWN:

		    if ((currentX + nodeWidth + rowSpace) > nextX) {

			if (debug2) alert(nodeID + ' push next ' + nextNodeID);
			// LytTreeLayout.printLevelPriority(oneLevelPriority);

			var updateNextX = currentX + nodeWidth + rowSpace;
			nextY = LytNodeUtil.getOriginY(nextNodeContext);
			LytNodeUtil.setNodePosition(nextNodeContext, updateNextX, nextY);

			var newPriority = LytTreeLayout.getSmallerLevelIndexNodes(priority, arrayLimit, nextNodeLevelIndex);
			LytTreeLayout.pushForward(layoutContext, newPriority, arrayLimit, nextNodeID, nextNodeLevelIndex, layoutFlow, rowSpace, forward);

		    }

		    break;


		case LytLayout.FLOW_LEFT_RIGHT:

		    if ((currentY + nodeHeight + rowSpace) > nextY) {

			if (debug2) alert(nodeID + ' push next ' + nextNodeID);
			// LytTreeLayout.printLevelPriority(oneLevelPriority);

			var updateNextY = currentY + nodeHeight + rowSpace;
			nextX = LytNodeUtil.getOriginX(nextNodeContext);
			LytNodeUtil.setNodePosition(nextNodeContext, nextX, updateNextY);

			var newPriority = LytTreeLayout.getSmallerLevelIndexNodes(priority, arrayLimit, nextNodeLevelIndex);
			LytTreeLayout.pushForward(layoutContext, newPriority, arrayLimit, nextNodeID, nextNodeLevelIndex, layoutFlow, rowSpace, forward);


		    }

		    break;

		}
	    }

	    if (!forward) {

		//
		// Here, we look at all nodes behind us.
		//

		//
		// Optimization - if all nodes are behind us, move ourself.
		//

		nodeWidthPrev = LytNodeUtil.getNodeWidth(nextNodeContext);
		nodeHeightPrev = LytNodeUtil.getNodeHeight(nextNodeContext);

		switch (layoutFlow) {
		    
		case LytLayout.FLOW_TOP_DOWN:

		    if (currentX < (nextX + nodeWidthPrev + rowSpace)) {

			if (debug2) alert(nodeID + ' push back prev ' + nextNodeID);
			
			nextY = LytNodeUtil.getOriginY(nextNodeContext);
			updateNextX = currentX - nodeWidthPrev - rowSpace;
			LytNodeUtil.setNodePosition(nextNodeContext, updateNextX, nextY);

			//
			// recreate priority with all nodes with index < test node index
			//

			var newPriority = LytTreeLayout.getSmallerLevelIndexNodes(priority, arrayLimit, nextNodeLevelIndex);
			// LytTreeLayout.printPriority(newPriority);

			LytTreeLayout.pushForward(layoutContext, newPriority, arrayLimit, nextNodeID, nextNodeLevelIndex, layoutFlow, rowSpace, forward);

		    }

		    break;

		case LytLayout.FLOW_LEFT_RIGHT:

		    if (currentY < (nextY + nodeHeightPrev + rowSpace)) {

			nextX = LytNodeUtil.getOriginX(nextNodeContext);
			updateNextY = currentY - nodeHeightPrev - rowSpace;
			LytNodeUtil.setNodePosition(nextNodeContext, nextX, updateNextY);

			var newPriority = LytTreeLayout.getSmallerLevelIndexNodes(priority, arrayLimit, nextNodeLevelIndex);
			LytTreeLayout.pushForward(layoutContext, newPriority, arrayLimit, nextNodeID, nextNodeLevelIndex, layoutFlow, rowSpace, forward);

		    }
		    break;
		}
		    
	    }

	    break;

	}
    }

}



//
// Simple version, only makes adjustments if there is existing space fo these adjustments.
//
//
LytTreeLayout.adjustNodePositionsDownSimple = function(layoutContext, layoutFlow, levelU, linkDS, rowSpace, levelNumber) {

    var debug9 = false;

    if (debug9) alert('adjust level ' + levelNumber);

    var debug = false;
    var debug2 = false;

    var i;
    var j;

    var nodeID;

    var linksInForward = levelU.getLinksInForward();
    var linksOutForward = levelU.getLinksOutForward();

    var levelArray = levelU.getLevelArray();
    var oneLevel = levelArray[levelNumber];
    var levelMap = levelU.getLevelMap();

    var currentX;
    var currentY;

    var nodeContext;
    var levelIndex;

    //
    // Repostion a subset of nodes:
    // check all nodes that have a single inlink and zero or one outlink.
    //
    for (j=0; j<oneLevel.length; j++) {

	nodeID = oneLevel[j];

	if (debug) alert(j + ' process node  ' + nodeID);

	// alert(j + ' process node  ' + nodeID);

	// 
	// node must have an inlink.
	// 
	if (!linksInForward[nodeID]) continue;
	if (linksInForward[nodeID].length > 1) continue;

	//
	// node must have less than one outlink
	// 
	if (linksOutForward[nodeID] && linksOutForward[nodeID].length > 1) continue;

	//
	// nodes must be a single child
	//
	parentID = LytTreeLayout.getParent(levelMap, linkDS, nodeID);
	if (linksOutForward[parentID] && linksOutForward[parentID].length > 1) continue;

	// alert(j + 'links check  ' + nodeID);

	nodeContext = layoutContext.getNodeById(nodeID);
	currentY = LytNodeUtil.getOriginY(nodeContext);
	currentX = LytNodeUtil.getOriginX(nodeContext);

	var newXorY = LytTreeLayout.getAverageNodePosition(layoutContext, layoutFlow, linksInForward[nodeID], linksOutForward, rowSpace, nodeID);
	// if (priority[j].childIndex < 0) newXorY -= rowSpace;

	if (debug9) alert(nodeID + ' ' + currentX + ' => ' + newXorY);

	//
	// Reposition if it does not overlap any other node.
	//

	//
	// Need to make sure that we don't step on a higher priority node.
	//
	var setXorY = newXorY;

	//
	// check for overlap with the previous node in the level
	//
	if (j > 0) {

	    var prevNodeID = oneLevel[j-1];
	    var nodeContextPrev = layoutContext.getNodeById(prevNodeID);

	    var pXorY = LytNodeUtil.getOriginFlow(nodeContextPrev, layoutFlow);

	    var nodeDimPre;

	    switch (layoutFlow) {

	    case LytLayout.FLOW_TOP_DOWN:

		nodeDimPre = LytNodeUtil.getNodeWidth(nodeContextPrev);
		break;

	    case LytLayout.FLOW_LEFT_RIGHT:

		nodeDimPre = LytNodeUtil.getNodeHeight(nodeContextPrev);
		break;

	    }

	    var xLimit = pXorY + nodeDimPre + rowSpace;

	    // if (nodeID == 'm3') alert(nodeID  + ' prevNodeID ' + prevNodeID + ' ' + newXorY + ' ' + pXorY);
	    // if (nodeID == 'm3') alert(' xLimit ' + xLimit  + ' prevX ' + pXorY);

	    // skip or adjust if there is overlap
	    if (newXorY <= xLimit) {

		if (xLimit < currentX) setXorY = xLimit;
		else continue;

	    }

	}

	if (j < oneLevel.length - 1) {

	    var nextNodeID = oneLevel[j+1];
	    var nodeContextNext = layoutContext.getNodeById(nextNodeID);

	    var pXorY = LytNodeUtil.getOriginFlow(nodeContextNext, layoutFlow);

	    var nodeDim;

	    switch (layoutFlow) {

	    case LytLayout.FLOW_TOP_DOWN:
		nodeDim = LytNodeUtil.getNodeWidth(nodeContext);
		break;

	    case LytLayout.FLOW_LEFT_RIGHT:
		nodeDim = LytNodeUtil.getNodeHeight(nodeContext);
		break;
	    }


	    var xLimit = pXorY - nodeDim - rowSpace;

	    // if (nodeID == 'm3') alert(nodeID  + ' ' + newXorY + ' ' + pXorY);

	    // skip or adjust if there is overlap
	    if (newXorY >= xLimit) {

		if (xLimit > currentX) setXorY = xLimit;
		else continue;
	    }

	}

	if (debug) 	    
	    alert(nodeID + ' setNodePosition ' + setXorY);

	nodeContext = layoutContext.getNodeById(nodeID);

	switch (layoutFlow) {

	case LytLayout.FLOW_TOP_DOWN:

	    LytNodeUtil.setNodePosition(nodeContext, setXorY, currentY);
	    break;

	case LytLayout.FLOW_LEFT_RIGHT:

	    LytNodeUtil.setNodePosition(nodeContext, currentX, setXorY);
	
	    break;

	}
    }
}


//
// Set the node positions for the first level.
// Needed to handle orphans.
// For example, if a graph has three root nodes (no links at all), this method will properly position the three nodes.
//
LytTreeLayout.adjustNodePositionsInit = function(layoutContext, layoutFlow, levelU, linkDS, rowSpace) {

    var debug9 = false;

    var levelNumber = 0;

    if (debug9) alert('adjust level ' + levelNumber);

    var debug = false;
    var debug2 = false;

    var i;
    var j;

    var nodeID;

    var linksInForward = levelU.getLinksInForward();
    var linksOutForward = levelU.getLinksOutForward();

    var levelArray = levelU.getLevelArray();

    var oneLevel = levelArray[levelNumber];

    var levelMap = levelU.getLevelMap();

    var currentX = 0;
    var currentY = 0;

    var nodeContext;
    var levelIndex;

    //
    // Repostion a subset of nodes:
    // check all nodes that have a single inlink and zero or one outlink.
    //
    var setXorY = 0;

    for (j=0; j<oneLevel.length; j++) {

	nodeID = oneLevel[j];

	if (debug) alert(j + ' process node  ' + nodeID);

	nodeContext = layoutContext.getNodeById(nodeID);

	if (j > 0) {

	    var prevNodeID = oneLevel[j-1];
	    var nodeContextPrev = layoutContext.getNodeById(prevNodeID);

	    var pXorY = LytNodeUtil.getOriginFlow(nodeContextPrev, layoutFlow);

	    var nodeDimPre;

	    switch (layoutFlow) {

	    case LytLayout.FLOW_TOP_DOWN:

		nodeDimPre = LytNodeUtil.getNodeWidth(nodeContextPrev);
		break;

	    case LytLayout.FLOW_LEFT_RIGHT:

		nodeDimPre = LytNodeUtil.getNodeHeight(nodeContextPrev);
		break;

	    }

	    setXorY = pXorY + nodeDimPre + rowSpace;

	}

	switch (layoutFlow) {

	case LytLayout.FLOW_TOP_DOWN:

	    LytNodeUtil.setNodePosition(nodeContext, setXorY, currentY);
	    break;

	case LytLayout.FLOW_LEFT_RIGHT:

	    LytNodeUtil.setNodePosition(nodeContext, currentX, setXorY);
	
	    break;

	}
    }
}



LytTreeLayout.adjustNodePositionsDown = function(layoutContext, layoutFlow, levelU, linkDS, rowSpace, levelNumber) {

    var debug9 = false;

    if (debug9) alert('adjust level ' + levelNumber);

    var debug = false;
    var debug2 = false;

    var i;
    var j;

    var nodeID;

    var linksInForward = levelU.getLinksInForward();
    var linksOutForward = levelU.getLinksOutForward();

    var levelArray = levelU.getLevelArray();
    var oneLevel = levelArray[levelNumber];

    var levelMap = levelU.getLevelMap();

    // alert(' levelArray.l ' + levelArray.length);

    var priority = new Array();

    for (j=0; j<oneLevel.length; j++) {

	// alert('j ' +j);

	nodeID = oneLevel[j];

	//
	// a node with no inlinks is assigned the lowest priority
	// index is the level index
	//
	priority.push({nodeID: nodeID, levelIndex: j, metric: -100, childIndex: 0});

	//
	// Nodes that have multiple inlinks get a high priority.
	//
	if (linksInForward[nodeID] && linksInForward[nodeID].length > 0)
	    priority[j].metric = linksInForward[nodeID].length;


	if (linksInForward[nodeID] && linksInForward[nodeID].length == 1) {

	    // 
	    // for nodes that have a single inlink,
	    // if their parent has multiple outlinks,
	    // adjust the priority of these nodes so that the center node is highest.
	    // This will position the tree balanced.
	    // 

	    parentID = LytTreeLayout.getParent(levelMap, linkDS, nodeID);

	    if (parentID) {

		if (linksOutForward[parentID].length > 1) {

		    // alert(parentID + ' lif ' + linksOutForward[parentID].length);
		    var halfLength  = Math.floor(linksOutForward[parentID].length/2);
		    var childPriority = linkDS.getChildIndex(nodeID) - halfLength;

		    // order about the center node
		    if (childPriority > 0) 
			childPriority = - childPriority - 0.5;
		    
		    // alert(nodeID + ' child p ' + childPriority);

		    // bump priority of all child nodes.
		    priority[j].metric = childPriority + linksOutForward[parentID].length;

		}
	    }
	}
    }
    
    var currentX;
    var currentY;

    var nodeContext;
    var levelIndex;

    // alert('priority ' + LytTreeLayout.printPriority(priority));
    // alert('priority.sort ' + LytTreeLayout.printPriority(priority.sort(LytTreeLayout.sortPriority)));

    // sort priority[]
    priority.sort(LytTreeLayout.sortPriority);
    if (debug2) LytTreeLayout.printPriority(priority);

    //
    for (j=0; j<priority.length; j++) {

	levelIndex = priority[j].levelIndex;
	nodeID = oneLevel[levelIndex];
	if (debug) alert(j + ' priority ' + nodeID);

	// ***
	if (debug2) alert('PRIORITY Node ' + nodeID + ' (' + j + ')');

	nodeContext = layoutContext.getNodeById(nodeID);
	currentX = LytNodeUtil.getOriginX(nodeContext);
	currentY = LytNodeUtil.getOriginY(nodeContext);

	var newXorY = LytTreeLayout.getAverageNodePosition(layoutContext, layoutFlow, linksInForward[nodeID], linksOutForward, rowSpace, nodeID);
	// if (priority[j].childIndex < 0) newXorY -= rowSpace;

	if (debug9) alert(nodeID + ' ' + currentX + ' => ' + newXorY);

	//
	// Need to make sure that we don't step on a higher priority node.
	//
	var setXorY = newXorY;

	if (j > 0) {

	    //
	    // Check all higher priority nodes that come before node j in the levelArray.
	    // Get the largest value (plus spacing etc.) of these nodes.
	    //

	    var nodeBeforeX = LytTreeLayout.getLargestNodeBeforeXorY(layoutContext, layoutFlow, oneLevel, priority, j, levelIndex, rowSpace);

	    // alert(' nodeBeforeX ' + nodeBeforeX);
	    //
	    // NOTE - Math.max does not work properly on Number.MIN_VALUE,
	    // so we need this extra check.
	    //
	    if (nodeBeforeX != Number.MIN_VALUE)
		setXorY = Math.max(nodeBeforeX, newXorY);

	    if (debug9) {
		if (setXorY != newXorY) alert(nodeID + ' largest-before adjust ' + nodeBeforeX);
		else (" not set");

	    }

	    //
	    // Similar to above,
	    // Check all higher priority nodes that come after node j in the levelArray.
	    // Get the smallest value (plus spacing etc.) of these nodes.
	    // New node must be less than this value.
	    //

	    var nodeAfterX = LytTreeLayout.getSmallestNodeAfterXorY(layoutContext, layoutFlow, oneLevel, priority, j, levelIndex, rowSpace);

	    if (debug) alert(' latest ' + nodeAfterX);

	    if (nodeAfterX != Number.MAX_VALUE)
		setXorY = Math.min(nodeAfterX, setXorY);

	    if (debug) alert(' adjusted x ' + setXorY);

	}

	if (debug) 	    
	    alert(nodeID + ' setNodePosition ' + setXorY);

	nodeContext = layoutContext.getNodeById(nodeID);

	switch (layoutFlow) {

	case LytLayout.FLOW_TOP_DOWN:
	    LytNodeUtil.setNodePosition(nodeContext, setXorY, currentY);
	    break;

	case LytLayout.FLOW_LEFT_RIGHT:
	    LytNodeUtil.setNodePosition(nodeContext, currentX, setXorY);
	    break;
	}


	// LytNodeUtil.setNodePosition(nodeContext, setX, currentY);

	// if (debug9) alert('n2.x ' + tempX + ' n6.x ' + tempX6 + ' nodeID ' + nodeID + ' set X to  => ' + setX);

	// 
	// Adjust positions of all other nodes so that there is no overlap.
	// 

	if (j > 0) LytTreeLayout.pushForward(layoutContext, priority, j, nodeID, levelIndex, layoutFlow, rowSpace, false);
	// haven't verfied with a test case if the next line is actuall necessary
	if (j > 0) LytTreeLayout.pushForward(layoutContext, priority, j, nodeID, levelIndex, layoutFlow, rowSpace, true);


    }
}


LytTreeLayout.adjustNodePositionsUp = function(layoutContext, layoutFlow, levelU, linkDS, rowSpace, levelNumber) {

    var debug9 = false;

    if (debug9) alert('adjust level ' + levelNumber);

    var debug = false;
    var debug2 = false;

    var i;
    var j;

    var nodeID;

    var linksInForward = levelU.getLinksInForward();
    var linksOutForward = levelU.getLinksOutForward();

    var levelArray = levelU.getLevelArray();
    var oneLevel = levelArray[levelNumber];

    var levelMap = levelU.getLevelMap();

    // alert(' levelArray.l ' + levelArray.length);

    var priority = new Array();

    for (j=0; j<oneLevel.length; j++) {

	// alert('j ' +j);

	nodeID = oneLevel[j];

	//
	// a node with no inlinks is assigned the lowest priority
	// index is the level index
	//
	priority.push({nodeID: nodeID, levelIndex: j, metric: -100, childIndex: 0});

	//
	// Nodes that have multiple children get higher priorities
	//
	if (linksOutForward[nodeID] && linksOutForward[nodeID].length > 0)
	    priority[j].metric = linksOutForward[nodeID].length;

    }


    var currentX;
    var currentY;

    var nodeContext;
    var levelIndex;

    var newXorY;
    
    // alert('priority ' + LytTreeLayout.printPriority(priority));
    // alert('priority.sort ' + LytTreeLayout.printPriority(priority.sort(LytTreeLayout.sortPriority)));

    // sort priority[]
    priority.sort(LytTreeLayout.sortPriority);
    if (debug2) LytTreeLayout.printPriority(priority);

    //
    for (j=0; j<priority.length; j++) {

	levelIndex = priority[j].levelIndex;
	nodeID = oneLevel[levelIndex];
	if (debug9) alert(j + ' priority ' + nodeID);

	nodeContext = layoutContext.getNodeById(nodeID);
	currentY = LytNodeUtil.getOriginY(nodeContext);
	currentX = LytNodeUtil.getOriginX(nodeContext);

	// if (priority[j].childIndex < 0) newXorY -= rowSpace;

	switch (layoutFlow) {
	    
	case LytLayout.FLOW_TOP_DOWN:

	    newXorY = LytTreeLayout.getAverageParentNodePosition(layoutContext, layoutFlow, linksOutForward[nodeID], linksInForward, nodeID, currentX);
	    break;

	case LytLayout.FLOW_LEFT_RIGHT:

	    newXorY = LytTreeLayout.getAverageParentNodePosition(layoutContext, layoutFlow, linksOutForward[nodeID], linksInForward, nodeID, currentY);
	    break;

	}


	if (debug9) alert(nodeID + ' ' + currentX + ' => ' + newXorY);



	//
	// Need to make sure that we don't step on a higher priority node.
	//
	var setXorY = newXorY;

	if (j > 0) {

	    //
	    // Check all higher priority nodes that come before node j in the levelArray.
	    // Get the largest value (plus spacing etc.) of these nodes.
	    // New node must be greater than this value.
	    //

	    var nodeBeforeX = LytTreeLayout.getLargestNodeBeforeXorY(layoutContext, layoutFlow, oneLevel, priority, j, levelIndex, rowSpace);
	    // alert(' nodeBeforeX ' + nodeBeforeX);
	    //
	    // NOTE - Math.max does not work properly on Number.MIN_VALUE,
	    // so we need this extra check.
	    //
	    if (nodeBeforeX != Number.MIN_VALUE)
		setXorY = Math.max(nodeBeforeX, newXorY);

	    if (debug9) {
		if (setXorY != newXorY) alert(nodeID + ' largest-before adjust ' + nodeBeforeX);
		else (" not set");
	    }

	    //
	    // Similar to above,
	    // Check all higher priority nodes that come after node j in the levelArray.
	    // Get the smallest value (plus spacing etc.) of these nodes.
	    // New node must be less than this value.
	    //

	    var nodeAfterXorY = LytTreeLayout.getSmallestNodeAfterXorY(layoutContext, layoutFlow, oneLevel, priority, j, levelIndex, rowSpace);

	    if (debug) alert(' latest ' + nodeAfterXorY);

	    if (nodeAfterXorY != Number.MAX_VALUE)
		setXorY = Math.min(nodeAfterXorY, setXorY);

	    if (debug) alert(' adjusted x ' + setXorY);

	}

	if (debug) 	    
	    alert(nodeID + ' setNodePosition ' + setXorY);

	nodeContext = layoutContext.getNodeById(nodeID);
	// LytNodeUtil.setNodePosition(nodeContext, setXorY, currentY);

	switch (layoutFlow) {
	    
	case LytLayout.FLOW_TOP_DOWN:
	    LytNodeUtil.setNodePosition(nodeContext, setXorY, currentY);
	    break;

	case LytLayout.FLOW_LEFT_RIGHT:
	    LytNodeUtil.setNodePosition(nodeContext, currentX, setXorY);
	    break;
	    
	}

	// if (debug9) alert('n2.x ' + tempX + ' n6.x ' + tempX6 + ' nodeID ' + nodeID + ' set X to  => ' + setXorY);

	// 
	// Adjust positions of all other nodes so that there is no overlap.
	// 

	if (j > 0) LytTreeLayout.pushForward(layoutContext, priority, j, nodeID, levelIndex, layoutFlow, rowSpace, false);
	if (j > 0) LytTreeLayout.pushForward(layoutContext, priority, j, nodeID, levelIndex, layoutFlow, rowSpace, true);


    }
}




//
// Return the x value that we must be greater than.
//
// Strategy: Examine all higher priority nodes.
// Find the largest levelIndex that is less than the slotLevelIndex.
// Return that node's x position + width + spacing.
// 
LytTreeLayout.getLargestNodeBeforeXorY = function(layoutContext, layoutFlow, oneLevel, priority, testJ, slotLevelIndex, rowSpace) {

    var debug = false;

    var levelIndex;
    var levelIndexPrior = -1;
    var j;

    var largestXorY = Number.MIN_VALUE;
    var nodeContext;

    // Examine all higher priority nodes
    for (j=0; j<testJ; j++) {

	levelIndex = priority[j].levelIndex;

	if (debug) alert(priority[j].nodeID + ' slotLevelIndex ' + slotLevelIndex  + ' check (test node) ' + priority[testJ].nodeID + ' levelIndex ' + levelIndex);

	// 
	// Follow the order of the levelIndex,
	// so only consider nodes that preceed the test node
	// 
	if (levelIndex < slotLevelIndex) {

	    if (debug) alert(priority[j].nodeID + ' is before ' + priority[testJ].nodeID);

	    nodeContext = layoutContext.getNodeById(priority[j].nodeID);

	    //
	    // Find the node that has the largest x value.
	    // 
	    if (largestXorY < LytNodeUtil.getOriginFlow(nodeContext, layoutFlow)) {
		largestXorY = LytNodeUtil.getOriginFlow(nodeContext, layoutFlow);
		levelIndexPrior = levelIndex;
		if (debug) alert(priority[j].nodeID + ' has larger x (test node) ' + priority[testJ].nodeID);
	    }



	}
    }

    if (levelIndexPrior == -1) {
	return Number.MIN_VALUE;
    }

    var nodeID = oneLevel[levelIndexPrior];
    nodeContext = layoutContext.getNodeById(nodeID);

    if (debug) 
	alert(priority[testJ].nodeID + ' getLargestNodeBefore: prior node id ' + nodeID + ' levelIndexPrior ' + levelIndexPrior + ' right connect x ' + LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContext) + ' rowspace '  + rowSpace);

    // var r = LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContext) + rowSpace;

    // var r;
    // r = LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContext) + rowSpace;


    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:
	r = LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContext) + rowSpace;
	break;

    case LytLayout.FLOW_LEFT_RIGHT:
	r = LytNodeUtil.getNodeAbsoluteBottomConnectY(nodeContext) + rowSpace;
	break;
    }



    // var r = LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContext);

    return r;

}


LytTreeLayout.getSmallestNodeAfterXorY = function(layoutContext, layoutFlow, oneLevel, priority, testJ, slotLevelIndex, rowSpace) {

    var debug = false;

    var levelIndex;
    var levelIndexAfter = -1;
    var j;
    var nodeContext;
    var smallestXorY = Number.MAX_VALUE;

    // Examine all higher priority nodes
    for (j=0; j<testJ; j++) {

	// 
	// Follow the order of the levelIndex,
	// so only consider nodes that are after the test node
	// 
	levelIndex = priority[j].levelIndex;
	if (levelIndex > slotLevelIndex) {

	    nodeContext = layoutContext.getNodeById(priority[j].nodeID);

	    //
	    // Find the node that has the largest x value.
	    // 
	    if (smallestXorY > LytNodeUtil.getOriginFlow(nodeContext, layoutFlow)) {
		smallestXorY = LytNodeUtil.getOriginFlow(nodeContext, layoutFlow);
		levelIndexAfter = levelIndex;
	    }
	    // alert(' level index ' + levelIndexAfter);
	}
    }

    if (levelIndexAfter == -1) return Number.MAX_VALUE;

    var nodeContextB = layoutContext.getNodeById(priority[testJ].nodeID);

    var nodeID = oneLevel[levelIndexAfter];
    nodeContext = layoutContext.getNodeById(nodeID);


    var r;

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:
	var testNodeWidth = LytNodeUtil.getNodeWidth(nodeContextB);
	r = LytNodeUtil.getNodeAbsoluteLeftConnectX(nodeContext) - rowSpace - testNodeWidth;
	// r = LytNodeUtil.getNodeCenterX(nodeContext) - rowSpace - testNodeWidth;
	break;

    case LytLayout.FLOW_LEFT_RIGHT:
	var testNodeHeight = LytNodeUtil.getNodeHeight(nodeContextB);
	r = LytNodeUtil.getNodeAbsoluteTopConnectY(nodeContext) - rowSpace - testNodeHeight;
	// r = LytNodeUtil.getNodeCenterY(nodeContext) - rowSpace - testNodeHeight;
	break;

    }
    
    if (debug) alert(nodeID + ' getLatest ' + r);

    return r;

}


//
// Translate all nodes in the level data structure by (x,y)
//
LytTreeLayout.translateAllNodes = function(layoutContext, levelArray, x, y) {

    var i;
    var j;
    // var p;

    for (i= levelArray.length - 1; i >= 0; i--) {

	// alert(' level ' + i);

	// Position the parent at the midpoint of the first and last child.

	oneLevel = levelArray[i];

	// if (debug) alert(' i = ' + i + " oneLevel.length " + oneLevel.length);

	for (j=0; j<oneLevel.length; j++) {

	    nodeID = oneLevel[j];

	    var nodeContext = layoutContext.getNodeById(nodeID);
	    var dvtRect = nodeContext.getBounds();

	    var currentX = LytNodeUtil.getOriginX(nodeContext);
	    var currentY = LytNodeUtil.getOriginY(nodeContext);

	    // p.x += x;
	    // p.y += y;

	    // alert(nodeID + ' cx ' + currentX + ' ' + currentY);
	    LytNodeUtil.setNodePosition(nodeContext, currentX + x, currentY + y);
	    // LytNodeUtil.setNodePosition(nodeContext, currentX, currentY);


	}
    }
}



//
// return the minimum x value of all nodes.
// Use for TOP_DOWN
//
LytTreeLayout.getMinLayoutFlow = function(layoutContext, layoutFlow, levelArray) {

    var i;

    var minX = Number.MAX_VALUE;

    for (i=0; i<levelArray.length; i++) {

	oneLevel = levelArray[i];

	//
	// We only need to check the first node in the level - this will have the smallest coordinate.
	//
	if (oneLevel.length > 0) {
	
	    nodeID = oneLevel[0];

	    var nodeContext = layoutContext.getNodeById(nodeID);

	    var currentX = LytNodeUtil.getOriginFlow(nodeContext, layoutFlow);
	    // var currentY = LytNodeUtil.getOriginY(nodeContext);

	    if (minX > currentX) minX = currentX;

	}
    }

    return minX;
}



var _shiftedMap;


// 
// For diagnostics - prints all nodes in the tree.
// 
LytTreeLayout.prototype.printNodes = function(levelArray, layoutContext) {

    var level = '';;

    var i;
    var j;

    for (i=0; i<levelArray.length; i++) {

	if (i != 0) level += ' ';
	level += ('[' + i + ']');

	for (j=0; j<levelArray[i].length; j++) {

	    if (j == 0) level += ': ';
	    if (j != 0) level += ', ';

	    level += levelArray[i][j];

	    var nodeID = levelArray[i][j];
	    var nodeContext = layoutContext.getNodeById(nodeID);
	    var x = LytNodeUtil.getOriginX(nodeContext);
	    var y = LytNodeUtil.getOriginY(nodeContext);

	    level += '(';
	    level += Math.round(x);
	    level += ',';
	    level += Math.round(y);
	    level += ')';
	    
	}
    }

    alert(level);
    
}

LytTreeLayout.isDebugNode = function(nodeID) {

    return false;

    
}


//
// Compress subtrees to be closer to each other (if separated by more than rowspace).
//
LytTreeLayout.prototype.compressor = function(layoutContext, layoutFlow, levelArray, levelU, linkDS) {

    var debug = false;
    var debug9 = false;

    // return;

    if (debug) alert(' compressor ' + this.getRowSpace());

    var i;
    var j;

    var levelArray = levelU.getLevelArray();

    var levelMap = levelU.getLevelMap();

    var _boundingBox = new Array();

    for (i=levelArray.length - 1; i >= 0; i--) {

	oneLevel = levelArray[i];

	if (debug9) alert(' oneLevel ' + levelArray[i]);
	//
	// start at j=1
	//
	for (j=1; j<oneLevel.length; j++) {

	    nodeID = oneLevel[j];

	    var nodeContext = layoutContext.getNodeById(nodeID);
	    var dvtRect = nodeContext.getBounds();

	    prevNodeID = oneLevel[j-1];

	    parentID = LytTreeLayout.getParent(levelMap, linkDS, nodeID);
	    parentIDPrev = LytTreeLayout.getParent(levelMap, linkDS, prevNodeID);

	    // alert(nodeID + ' parent is  ' + parentID);
	    // alert(prevNodeID + ' prev parent is  ' + parentIDPrev);

	    // 
	    // If the subtrees share a parent, then try to compress 
	    // 
	    if (parentID == parentIDPrev) {

		// if (debug) this.printNodes(levelArray, layoutContext);
		// if (LytTreeLayout.isDebugNode(nodeID)) alert(' compare nodes ' + nodeID + ' prevNode ' + prevNodeID + ' (parent ' + parentID + ')');

		nodeProcessedMap =  new Array();
		var prevTreeDepth = LytTreeLayout.getSubtreeDepth(layoutContext, levelU, prevNodeID, linkDS, nodeProcessedMap, 0, false);

		nodeProcessedMap =  new Array();
		var treeDepth = LytTreeLayout.getSubtreeDepth(layoutContext, levelU, nodeID, linkDS, nodeProcessedMap, 0, false);

		// if (LytTreeLayout.isDebugNode(nodeID)) alert(nodeID + ' depths ' + treeDepth + ' ' + prevTreeDepth);

		var compareDepth = Math.min(prevTreeDepth, treeDepth);
		// var compareDepth = treeDepth;

		//
		// Calculate the bounding boxes of each subtree.
		//


		var bboxPre = new LytDimension(Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
		nodeProcessedMap =  new Array();
		LytTreeLayout.getSubtreeBoundingBox(layoutContext, layoutFlow, prevNodeID, linkDS, nodeProcessedMap, 0, compareDepth, false, bboxPre);

		var bbox = new LytDimension(Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
		nodeProcessedMap =  new Array();
		// alert(' call on ' + nodeID);
		LytTreeLayout.getSubtreeBoundingBox(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, 0, compareDepth, false, bbox);

		var bboxWidth = bbox.getXMax() - bbox.getXMin();
		var bboxPreWidth = bboxPre.getXMax() - bboxPre.getXMin();

		var bboxHeight = bbox.getYMax() - bbox.getYMin();
		var bboxPreHeight = bboxPre.getYMax() - bboxPre.getYMin();

		//
		// Check if the gap is wider than the allocated spacing.
		//

		var subTreeGap = false;
		if (layoutFlow == LytLayout.FLOW_TOP_DOWN) {

		    if ((bboxPre.getXMax() + this.getRowSpace()) < bbox.getXMin()) subTreeGap = true;

		    var space = bbox.getXMin() - bboxPre.getXMax();
		    // alert(nodeID + ' space ' + space);

		    // if (LytTreeLayout.isDebugNode(nodeID)) alert(nodeID + ' gap ' + subTreeGap + ' space ' + space);

		} else {

		    if ((bboxPre.getYMax() + this.getRowSpace()) < bbox.getYMin()) subTreeGap = true;

		    var space = bbox.getYMin() - bboxPre.getYMax();

		    // alert(nodeID + ' space ' + space + ' ' + subTreeGap);
		    if (space > this.getRowSpace()) subTreeGap = true;
		}
		    
		if (debug) {
		if (layoutFlow == LytLayout.FLOW_TOP_DOWN) {
		    alert (bbox.getXMin() -(bboxPre.getXMax() + this.getRowSpace()));
		    alert(nodeID + ' x ' +  bbox.getXMin() + ' ' + bboxPre.getXMax());
		} else  {
		    alert (bbox.getYMin() -(bboxPre.getYMax() + this.getRowSpace()));
		    alert(nodeID + ' y ' +  bbox.getYMin() + ' ' + bboxPre.getYMax());
		}
		}

		var enableSubtreeGapMinimize = true;

		if (enableSubtreeGapMinimize && subTreeGap) {

		    if (debug) alert(nodeID + ' check Gap ');

		    if (debug) this.printNodes(levelArray, layoutContext);

		    // alert(prevNodeID + ' BBox ' + bboxPre.toString());
		    // alert(nodeID + ' BBox ' + bbox.toString());

		    var xOffset = bbox.getXMin() - bboxPre.getXMax() - this.getRowSpace();
		    var yOffset = bbox.getYMin() - bboxPre.getYMax() - this.getRowSpace();

		    if (debug) {
			if (layoutFlow == LytLayout.FLOW_TOP_DOWN) {
			    alert(' merge ' + prevNodeID + ' ' + nodeID + ' attempt to offset ' + xOffset);
			    alert(' nodeID ' + nodeID + ' bboxWidth ' + bboxWidth + ' prevNodeID ' + prevNodeID + ' bboxPreWidth ' + bboxPreWidth);
			} else { 
			    alert(' merge ' + prevNodeID + ' ' + nodeID + ' attempt to offset ' + yOffset);
			    alert(' nodeID ' + nodeID + ' bboxHeight ' + bboxHeight + ' prevNodeID ' + prevNodeID + ' bboxPreHeight ' + bboxPreHeight);
			}
		    }

		    var firstChildIDArray = new Array();

		    for (var k = 0; k < levelArray.length; k++) { 
			firstChildIDArray[k] = null;
		    }

		    var xDiff = xOffset;
		    var yDiff = yOffset;

		    nodeProcessedMap =  new Array();

		    var orderByX = true;

		    if (layoutFlow == LytLayout.FLOW_TOP_DOWN) orderByX = true;
		    else orderByX = false;

		    LytTreeLayout.getSubtreeLevelMinMax(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, i, firstChildIDArray, orderByX);

		    var maxOffsetX;
		    var maxOffsetY;

		    // for (var k = i; k >= 0; k--) {
		    for (var k = i; k <firstChildIDArray.length; k++) {
			
			// if (firstChildArray[k] == Number.MAX_VALUE) continue;
			var firstChildID = firstChildIDArray[k];
			if (firstChildID == null) continue;

			// alert(' k = ' + k + ' firstChild ID ' + firstChildIDArray[k]);

			var kLevel = levelArray[k];

			var levelPrevNodeID = LytTreeLayout.getPrevNodeInLevel(kLevel, firstChildID);

			//
			// Reduce the shift offset if it would overlap the previously layed-out node on this level.
			// (Note, we allow the first subtree on a level to shift into negative space,
			//  this is repaired when the entire tree is adjusted).
			//

			var levelPrevChildX = 0; // This is the left edge of the layout.  (add padding?)
			if (levelPrevNodeID != null) {

			    // alert(' prev node ' + prevNodeID);

			    var nodeContextPrev = layoutContext.getNodeById(levelPrevNodeID);
			    // var levelPrevChildX = LytNodeUtil.getOriginX(nodeContextPrev);
			    var levelPrevChildX = LytNodeUtil.getNodeAbsoluteRightConnectX(nodeContextPrev);
			    var levelPrevChildY = LytNodeUtil.getNodeAbsoluteBottomConnectY(nodeContextPrev);
			    

			    var nodeContextFC = layoutContext.getNodeById(firstChildID);    
			    var firstChildX = LytNodeUtil.getOriginX(nodeContextFC);
			    var firstChildY = LytNodeUtil.getOriginY(nodeContextFC);

			    // alert(' levelPrevNodeID ' + levelPrevNodeID + ' x ' + levelPrevChildX);
			    // alert(' nodeID ' + firstChildID + ' x ' + firstChildX);

			    // 
			    // Use the lastChild from the previous subtree
			    // and the first child from the current subtree
			    // 
			    // This defines a maximum offset (so that no two already positioned nodes will overlap).
			    // 

			    // maxOffset = (firstChildArray[k] - lastChildArrayPre[k] - this.getRowSpace());
			    if (layoutFlow == LytLayout.FLOW_TOP_DOWN) {
				maxOffsetX = (firstChildX - levelPrevChildX - this.getRowSpace());
				if (xDiff > maxOffsetX) {
				    // if (LytTreeLayout.isDebugNode(nodeID)) alert(' xDiff ' + xDiff + ' reduced to ' + maxOffsetX);
				    // if (LytTreeLayout.isDebugNode(nodeID)) alert('firstChildX ' + firstChildX + ' levelPrev ' +  levelPrevChildX + ' ' + this.getRowSpace());
				    xDiff = maxOffsetX;
				}
				// alert(nodeID + ' x diff ' + xDiff);
			    } else {
				maxOffsetY = (firstChildY - levelPrevChildY - this.getRowSpace());
				if (yDiff > maxOffsetY) yDiff = maxOffsetY;
				// alert(nodeID + ' y diff ' + yDiff);
			    }
			    

			    if (debug) {
				if (layoutFlow == LytLayout.FLOW_TOP_DOWN)
				    alert('k ' + k + ' maxOffsetX '  + maxOffsetX + ' firstChildX ' + firstChildX + ' levelPrevChildX ' + levelPrevChildX);
				else
				    alert('k ' + k + ' maxOffsetY '  + maxOffsetY + ' firstChildY ' + firstChildY + ' levelPrevChildY ' + levelPrevChildY);
			    }				
			}
			
		    }

		    // alert(diff);

		    nodeProcessedMap =  new Array();

		    if (layoutFlow == LytLayout.FLOW_TOP_DOWN) {
			// alert(' call compress ');
			if (xDiff > 0) LytTreeLayout.compressSubtree(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, xDiff, 0);
		    } else {
			// alert(' call compress ');
			if (yDiff > 0) LytTreeLayout.compressSubtree(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, 0, yDiff); 
		    }

		    if (debug) this.printNodes(levelArray, layoutContext);
		}
	    }
	}
    }
}


//
// Return the node in the level that preceeds testNodeID
//
LytTreeLayout.getPrevNodeInLevel = function(kLevel, testNodeID) {

    var m;

    for (m=0; m<kLevel.length; m++) {

	// alert(' m ' + kLevel[m]);
	if (kLevel[m] == testNodeID) 
	    if (m > 0) return kLevel[m - 1];
	// alert(' prev node ' + kLevel[m - 1]);

    }

    return null;

}




LytTreeLayout.getSubtreeBoundingBox = function(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, currentDepth, maxDepth, depthCalcOption, bbox) {

    // alert(' called ' + currentDepth + ' maxD  ' + maxDepth);

    var debug = false;

    var linksOut = linkDS.getLinksOutSt();
    var nodeContext;

    var p;
    var dim;

    //
    // Avoid infinte recursion.
    //
    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    nodeContext = layoutContext.getNodeById(nodeID);
    if (!nodeContext) return;

    var p = nodeContext.getPosition();
    var dim =  nodeContext.getBounds();

    var nodeWidth = LytNodeUtil.getNodeWidth(nodeContext);
    var nodeHeight = LytNodeUtil.getNodeHeight(nodeContext);

    // alert(nodeID + ' bounds ' + dim.w);

    if (p.x < bbox.getXMin()) bbox.setXMin(p.x);
    if (p.y < bbox.getYMin()) bbox.setYMin(p.y);

    var x2;
    var y2;

    // x2 = p.x + dim.w;
    // y2 = p.y + dim.h;

    x2 = p.x + nodeWidth;
    y2 = p.y + nodeHeight;

    if (x2 > bbox.getXMax()) bbox.setXMax(x2);
    if (y2 > bbox.getYMax()) bbox.setYMax(y2);

    if (debug) alert('node bounds ' + nodeID + ' ' + p.x + ' ' + p.y + ' ' + x2 + ' ' + y2);

    //
    // If there are no links out, then return 
    //
    if (!linksOut[nodeID] || linksOut[nodeID].length == 0) {
	// alert (nodeID + ' no links out');
	return;
    }

    // 
    // Node has links out - subtree with is sum of all child subtrees.
    // 

    var j;

    // limit traversal of subtree to maxDepth

    if (!depthCalcOption && currentDepth+1 > maxDepth) return;

    var levelWidth = 0;

    for (j=0; j<linksOut[nodeID].length; j++) {

	childID = linksOut[nodeID][j];

	// alert(' call on child ' + childID);

	//
	// traverse child subtree
	//
	LytTreeLayout.getSubtreeBoundingBox(layoutContext, layoutFlow, childID, linkDS, nodeProcessedMap, currentDepth+1, maxDepth, depthCalcOption, bbox);

    }
}


//
// Apply the offsets to the subtree, effectively compressing layout space.
// When called by compressor(), the xOffset or the yOffset are zero.
// The xOffset is non-zero for top-down flows,
// yOffset is non-zero for left-right flows.
//
LytTreeLayout.compressSubtree = function(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, xOffset, yOffset) {

    var debug = false;

    var linksOut = linkDS.getLinksOut();
    var nodeContext;

    //
    // Avoid infinte recursion.
    //
    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    nodeContext = layoutContext.getNodeById(nodeID);
    if (!nodeContext) return;

    var currentX = LytNodeUtil.getOriginX(nodeContext);
    var currentY = LytNodeUtil.getOriginY(nodeContext);

    LytNodeUtil.setNodePosition(nodeContext, currentX - xOffset, currentY - yOffset);

    // If there are no links out, then return 
    if (!linksOut[nodeID] || linksOut[nodeID].length == 0) {
	return;
    }

    // 
    // Node has links out - subtree with is sum of all child subtrees.
    // 

    var j;

    for (j=0; j<linksOut[nodeID].length; j++) {

	childID = linksOut[nodeID][j];
	LytTreeLayout.compressSubtree(layoutContext, layoutFlow, childID, linkDS, nodeProcessedMap, xOffset, yOffset);
    }
}

LytTreeLayout.getSubtreeLevelMinMax = function(layoutContext, layoutFlow, nodeID, linkDS, nodeProcessedMap, currentLevel, firstChildIDArray, orderByX) {

    // alert(' called ' + currentDepth + ' maxD  ' + maxDepth);

    var debug = false;

    var linksOut = linkDS.getLinksOut();
    var nodeContext;

    //
    // Avoid infinte recursion.
    //
    if (nodeProcessedMap[nodeID]) return;
    nodeProcessedMap[nodeID] = 1;

    nodeContext = layoutContext.getNodeById(nodeID);
    if (!nodeContext) return;

    var currentX = LytNodeUtil.getOriginX(nodeContext);
    var currentY = LytNodeUtil.getOriginY(nodeContext);

    if (firstChildIDArray[currentLevel] == null) 
	firstChildIDArray[currentLevel] = nodeID;
    else {
	var nodeContextFC = layoutContext.getNodeById(firstChildIDArray[currentLevel]);    
	var firstChildX = LytNodeUtil.getOriginX(nodeContextFC);
	var firstChildY = LytNodeUtil.getOriginY(nodeContextFC);
    }


    // 
    // save the smallest value
    // 

    if (orderByX) {

	if (firstChildX > currentX) 
	    firstChildIDArray[currentLevel] = nodeID;

    } else {

	// fill in for Y
	if (firstChildY > currentY) 
	    firstChildIDArray[currentLevel] = nodeID;

    }

    //
    // If there are no links out, then return 
    //
    if (!linksOut[nodeID] || linksOut[nodeID].length == 0) {
	return;
    }

    // 
    // Node has links out - subtree with is sum of all child subtrees.
    // 

    var j;

    for (j=0; j<linksOut[nodeID].length; j++) {

	childID = linksOut[nodeID][j];

	// alert(' call on child ' + childID);

	//
	// traverse child subtree
	//
	// note we use -1 based on the reverse order of level traversal
	//
	LytTreeLayout.getSubtreeLevelMinMax(layoutContext, layoutFlow, childID, linkDS, nodeProcessedMap, currentLevel+1, firstChildIDArray, orderByX);

    }
}

LytTreeLayout.prototype.positionAllNodes = function(layoutContext, containerDesc, linkDS, levelU) {

    var layoutFlow = containerDesc.getLayoutFlow();

    var levelArray = levelU.getLevelArray();

    if (!levelArray) return;

    var levelMap = levelU.getLevelMap();
    var levelHeight = levelU.getLevelHeight();

    var debug = false;
    var i;
    var j;
    var dvtRect;

    // alert(' setpos print levelMap ');

    if (debug) {

	for (var i=0; i<levelMap.length; i++)
	    alert(' levelmap ' + levelMap[i]); 
   }  

    if (debug) levelU.printLevelArray();
    
    var nodeContext;
    var nodeID;

    // Set the initial level position
    var levelPos = 0;

    _shiftedMap = new Array();

    var linksIn = linkDS.getLinksIn();

    rowPosArray = new Array();
    subTreeWidthArray = new Array();

    if (debug) alert(' levelArray.length = ' + levelArray.length);

    // should be false
    var adjustForMultipleLinksIn = true;

    // 
    // Set the "level" positions of the nodes.
    // Set the y position for top_down,
    // or set the x position for left_right
    //
    levelPos = 0;
    for (i=0; i<levelArray.length; i++) {

	oneLevel = levelArray[i];

	if (debug) alert(' i = ' + i + " oneLevel.length " + oneLevel.length);

	for (j=0; j<oneLevel.length; j++) {

	    nodeID = oneLevel[j];
	    // alert(nodeID + ' set node ' + levelPos);

	    nodeContext = layoutContext.getNodeById(nodeID);

	    switch (layoutFlow) {

	    case LytLayout.FLOW_TOP_DOWN:

		LytNodeUtil.setNodePosition(nodeContext, 0, levelPos);
		break;

	    case LytLayout.FLOW_LEFT_RIGHT:

		LytNodeUtil.setNodePosition(nodeContext, levelPos, 0);
		break;

	    }
	}

	// maintain the current level height position
	levelPos += levelHeight[i];
	// alert('levelheight ' + levelHeight[i]);
	// if (i > 0) levelPos += this.getBetweenLevelSpace();
	levelPos += this.getBetweenLevelSpace();
    
	// alert(i + ' levelPos ' + levelPos);

    }

    // 
    // Set to true to enable smart padding.
    // 
    var smartPad = false;
    var smartPad = true;

    if (smartPad) {

	var betweenLevelSpaceForLinks = LytLabelUtil.smartPadTree(layoutContext, containerDesc, levelU, linkDS);

	var sumSpace = 0;
	// 
	// Reposition nodes using space for links
	//
	for (i=1; i<levelArray.length; i++) {

	    //
	    // start with index 1 (root nodes need no additional spacing)
	    //
	    sumSpace += betweenLevelSpaceForLinks[i - 1];

	    rowPos = 0;

	    oneLevel = levelArray[i];

	    for (j=0; j<oneLevel.length; j++) {

		nodeID = oneLevel[j];
		nodeContext = layoutContext.getNodeById(nodeID);

		dvtRect = nodeContext.getBounds();

		// var tempY = LytNodeUtil.getOriginY(nodeContext);
		// var tempX = LytNodeUtil.getOriginX(nodeContext);

		// 
		// handle negative node bounds
		// 
		var tempY = LytNodeUtil.getOriginY(nodeContext) + dvtRect.y;
		var tempX = LytNodeUtil.getOriginX(nodeContext) + dvtRect.x;

		switch (layoutFlow) {

		case LytLayout.FLOW_TOP_DOWN:

		    LytNodeUtil.setNodePosition(nodeContext, tempX, tempY + sumSpace);

		    break;

		case LytLayout.FLOW_LEFT_RIGHT:

		    LytNodeUtil.setNodePosition(nodeContext, tempX + sumSpace, tempY);

		    break;

		}
	    }
	}
    }

    var en = false;
    var en = true;

    // levelU.printLevelMap(layoutContext);
    // if (shiftNodeForShortSubtree) repositionParents(layoutContext, layoutFlow, levelU, linkDS);

    if (en) this.compressor(layoutContext, layoutFlow, levelArray, levelU, linkDS);

    var enable = false;
    var enable = true;

    if (this.getOptimizeNodePositions() && enable) 
    {
	// alert(' levelU ' + levelArray.length);

	// set initial positions for level 0 nodes
	LytTreeLayout.adjustNodePositionsInit(layoutContext, layoutFlow, levelU, linkDS, this.getRowSpace());

	for (i=1; i<levelArray.length; i++) 
 	    LytTreeLayout.adjustNodePositionsDown(layoutContext, layoutFlow, levelU, linkDS, this.getRowSpace(), i);

	for (i= levelArray.length - 2; i >= 0; i--) 
	    LytTreeLayout.adjustNodePositionsUp(layoutContext, layoutFlow, levelU, linkDS, this.getRowSpace(), i);


	for (i=1; i<levelArray.length; i++) 
  	    LytTreeLayout.adjustNodePositionsDownSimple(layoutContext, layoutFlow, levelU, linkDS, this.getRowSpace(), i);

    }

    var useLastStageCompression = false;
    var useLastStageCompression = true;
    if (useLastStageCompression) this.compressor(layoutContext, layoutFlow, levelArray, levelU, linkDS);

    //  
    // This will adjust root nodes after final stage compression (if needed)
    //  
    if (levelArray.length > 1)
	LytTreeLayout.adjustNodePositionsUp(layoutContext, layoutFlow, levelU, linkDS, this.getRowSpace(), 0);


    //
    // Use half a rowspace for padding around the tree.
    //

    var treeX = - this.getRowSpace()/2;
    var treeY = - this.getRowSpace()/2;

    //
    // Translate the layout.
    // Needed because compressor may have translated into negative space.
    //

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:    

	treeX = LytTreeLayout.getMinLayoutFlow(layoutContext, layoutFlow, levelArray);
	treeX -= this.getRowSpace()/2;

	break;

    case LytLayout.FLOW_LEFT_RIGHT:

	treeY = LytTreeLayout.getMinLayoutFlow(layoutContext, layoutFlow, levelArray);
	treeY -= this.getRowSpace()/2;
	break;

    }

    LytTreeLayout.translateAllNodes(layoutContext, levelArray, -treeX, - treeY);

}


//
// Return the parent of nodeID.
// In the case of multiple parents, return the parent that is one level above the node.
//
//function getParent(levelU, linkDS, nodeID) {
// function getParent(levelMap, linkDS, nodeID) {
LytTreeLayout.getParent = function(levelMap, linkDS, nodeID) {

    var nodeLevel = levelMap[nodeID];
    var linksIn = linkDS.getLinksInSt();

    var parentLevel;

    var j;
    var parentID = null;

    if (!linksIn[nodeID]) return null;

    for (j=0; j<linksIn[nodeID].length; j++) {

	parentID = linksIn[nodeID][j];

	parentLevel = levelMap[parentID];

	if (parentLevel == nodeLevel - 1) return parentID;

    }

    return parentID;

}

//
//
//
LytTreeLayout.getSubtreeDepth = function(layoutContext, levelU, nodeID, linkDS, nodeProcessedMap, depth, debugDepth) {

    var debug = false;

    if (debugDepth) alert('getSubtreeDepth ' + nodeID + ' d ' + depth);
    // var linksOut = linkDS.getLinksOut();
    var linksOutForward = levelU.getLinksOutForward();

    //
    // Avoid infinte recursion.
    //
    if (nodeProcessedMap[nodeID]) { 
	// alert('fini return');  
	return; 
    }

    nodeProcessedMap[nodeID] = 1;

    //
    // If there are no links out, then return the node's dimensions
    //
    if (!linksOutForward[nodeID] || linksOutForward[nodeID].length == 0) {

	var nodeContext = layoutContext.getNodeById(nodeID);
	if (debug) alert('getSubtreeWidth getbounds on ' + nodeID);

	if (!nodeContext) {
	    alert("LyTreeLayout: ERROR2: node " + nodeID + " undefined ");
	    return 0;
	}

	return(depth);

    }

    // 
    // Node has links out - subtree with is sum of all child subtrees.
    // 

    var subWidth = 0;

    var j;
    var depthTemp = depth;
    var depthReturn;

    var nodeLevel = levelU.getNodeLevel(nodeID);

    for (j=0; j<linksOutForward[nodeID].length; j++) {

	childID = linksOutForward[nodeID][j];

	var childLevel = levelU.getNodeLevel(childID);
	
	if (childLevel <= nodeLevel) { 
	    // alert(nodeID + ' skip ' + childID);
	    continue;
	}

	//
	// add child subtree
	//
	depthReturn = LytTreeLayout.getSubtreeDepth(layoutContext, levelU, childID, linkDS, nodeProcessedMap, depth+1, debugDepth);

	depthTemp = Math.max(depthReturn, depthTemp);

    }

    if (debug) alert(nodeID + ' subtreeDepth ' + depthTemp);
    return depthTemp;
}


// LytTreeLayout.TESTVAR = 0;

//
// Integration function - this function binds tag attributes to layout attributes.
//
LytTreeLayout.treeLayout = function(layoutContext)
{
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

    var layoutNodeAlign;
    //layoutNodeAlign = LytLayout.NODE_ALIGNMENT_FLUSH;
    layoutNodeAlign = LytLayout.NODE_ALIGNMENT_CENTER;
    if (layoutAttrs && layoutAttrs["nodeAlign"])
    {
	if (layoutAttrs["nodeAlign"] === "flush")
	{
	    layoutNodeAlign = LytLayout.NODE_ALIGNMENT_FLUSH;
	}
    }

    var betweenLevelSpace = 20;
    if (layoutAttrs && layoutAttrs["levelPadding"])
    {
	betweenLevelSpace = parseInt(layoutAttrs["levelPadding"]);
    }
    var rowSpace = 10;
    if (layoutAttrs && layoutAttrs["siblingPadding"])
    {
	rowSpace = parseInt(layoutAttrs["siblingPadding"]);
    }
    
    var L = new LytLayout();
    var treeL = new LytTreeLayout();
    var desc = new LytTreeLayoutDesc();
    //treeL.setLayoutMethod(LytLayout.LAYOUT_TREE_SIMPLE);

    desc.setLayoutAlign(layoutNodeAlign);

    //
    // Spacing parameters
    //
    desc.setBetweenLevelSpace(betweenLevelSpace);
    desc.setRowSpace(rowSpace);
    
    treeL.setLayoutDesc(desc);
    
    var layoutD = LytLayoutDesc.createLayoutDesc(L, treeL, layoutFlow);

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

    // L.setArrowLength(0);

    L.doLayout(layoutContext);
};