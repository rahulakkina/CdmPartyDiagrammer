/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytNodeUtil.js

    Node utility methods.
    (Static functions)

    Normalizing positions within containers:

       - l.localToGlobal(new DvtDiagramPoint(0,0), nodeContext);

    MODIFIED    (MM/DD/YY)
    lmolesky 01/19/12 - update with container normalized node positions
    bglazer  12/19/11 - fix for bug 13387124
    bglazer  12/14/11 - new Diagram layout classes from EM with some container
                        support from label LAYOUT_MAIN_GENERIC_111130.0112
    lmolesky	10/06/11 - Created


    NOTES

    (labelPos.y + labelRect.h) - does not work correctly for collapsed container (too much y).
    should understand why.
    (p.y + nodeRect.h + nodeRect.y + labelRect.h) - we use this calculation instead.

    containerOutlineRect - unneeded?
    

*/

LytNodeUtil = function()
{
    // this.Init();

};

/**
Return the relative (container normalized) position of a node.  linkedNode is the node that node is linked to.

@param l DvtDiagramLayoutContext
@param nodeContext DvtDiagramLayoutContextNode
@param linkedNodeContext DvtDiagramLayoutContextNode
*/
LytNodeUtil.getNodePosRel = function(l, nodeContext, linkedNodeContext) {

    var ccLink = nodeContext.getContainerId() || linkedNodeContext.getContainerId();

    var p = nodeContext.getPosition();
    if (ccLink) p = l.localToGlobal(new DvtDiagramPoint(0,0), nodeContext);

    return p;

}

/**
 Return the relative (container normalized) position of a node label.  
*/
LytNodeUtil.getLabelPosRel = function(l, nodeContext, linkedNodeContext) {

    var returnPoint = new DvtDiagramPoint(0,0);

    var labelPos = nodeContext.getLabelPosition();
    if (!labelPos) return returnPoint;

    var ccLink = nodeContext.getContainerId() || linkedNodeContext.getContainerId();
    if (!ccLink) return labelPos;

    // var p = nodeContext.getPosition();
    var pRel = l.localToGlobal(new DvtDiagramPoint(0,0), nodeContext);

    returnPoint.x = labelPos.x + pRel.x;
    returnPoint.y = labelPos.y + pRel.y;

    return returnPoint;

}


// old, original
LytNodeUtil.getLabelPosRelOrig = function(l, nodeContext, linkedNodeContext) {

    var returnPoint = new DvtDiagramPoint(0,0);

    var labelPos = nodeContext.getLabelPosition();
    if (!labelPos) return returnPoint;

    var ccLink = nodeContext.getContainerId() || linkedNodeContext.getContainerId();
    if (!ccLink) return labelPos;

    var p = nodeContext.getPosition();
    var pRel = l.localToGlobal(new DvtDiagramPoint(0,0), nodeContext);
    // var pRel = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

    var xDiff = pRel.x - p.x;
    var yDiff = pRel.y - p.y;

    returnPoint.x = labelPos.x + xDiff;
    returnPoint.y = labelPos.y + yDiff;

    return returnPoint;

}

//
// Static function (note - no prototype keyword).
//
// Get the width of a node.
// Extending to handle nodes with labels:
//
//  TopDown - return the width
//
//     ----
//    |    |
//    |    |
//     ----
//   Node Label
//
//   |<  ret >|
//
//
//  LeftRight - return the height
//
//     ----           ---
//    |    |           |
//    |    |          ret
//     ----            |
//   Node Label       ---
//
// LytNodeUtil.getNodeWidthFlow = function(nodeContext, layoutFlow, containerOutlineRect) {
LytNodeUtil.getNodeWidthFlow = function(nodeContext, layoutFlow) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var ret = 0;

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:

	if (nodeRect && labelRect) ret = Math.max(nodeRect.w, labelRect.w);
	else if (nodeRect) ret = nodeRect.w;
	else if (labelRect) ret = labelRect.w;

	return ret;


    case LytLayout.FLOW_LEFT_RIGHT:

	if (nodeRect) ret += nodeRect.h;
	if (labelRect) ret += labelRect.h;

	return ret;


    }

    return ret;

}

/**
Return the node width.
*/
LytNodeUtil.getNodeWidth = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var ret = 0;

    if (nodeRect && labelRect) ret = Math.max(nodeRect.w, labelRect.w);
    else if (nodeRect) ret = nodeRect.w;
    else if (labelRect) ret = labelRect.w;

    return ret;

}

/**
Return the node height.
*/
LytNodeUtil.getNodeHeight = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var ret = 0;

    if (nodeRect) ret += nodeRect.h;
    if (labelRect) ret += labelRect.h;

    // alert( nodeContext.getId() + " getNodeHeight " + ret);

    return ret;

}

/**
 Return the node connect width.
 This is normally the nodeContext.getBounds.w,
 because links are connected to the node icon.
*/
LytNodeUtil.getNodeConnectWidth = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) return nodeRect.w;
    else {
	labelRect = nodeContext.getLabelBounds();
	if (labelRect) return labelRect.w;
    }

    return 0;

}

//
// Return the node connect height.
//
LytNodeUtil.getNodeConnectHeight = function(nodeContext) {


    var ret = 0;

    var nodeRect = nodeContext.getBounds();
    if (nodeRect) return nodeRect.h;

    else {
	labelRect = nodeContext.getLabelBounds();
	if (labelRect) return labelRect.h;
    }

    return 0;

}

//
// mirrors getNodeRightEdge()
// Returns same value as getNodeAbsoluteBottomConnectY()
//
LytNodeUtil.getNodeBottomEdgeY = function(nodeContext) {
    return LytNodeUtil.getNodeAbsoluteBottomConnectY(nodeContext);
}


//
// return the node's label height
//
LytNodeUtil.getLabelHeight = function(nodeContext) {

    var labelRect = nodeContext.getLabelBounds();
    if (!labelRect) return 0;
    else return labelRect.h;

}


LytNodeUtil.getNodeAbsoluteBottomConnectYRel = function(l, nodeContext, linkedNodeContext) {

    var p;
    var nodeRect = nodeContext.getBounds();

    if (nodeRect)
	p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

    var labelRect = nodeContext.getLabelBounds();

    if (labelRect && nodeRect) {

	labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

	// This works best
	return (p.y + nodeRect.h + nodeRect.y + labelRect.h);

/*

	// works for expanded node,
	// too much y for collapsed container
	return(labelPos.y + labelRect.h);

	// pretty whacky for collapsed - y way too large
	return(p.y + labelPos.y + labelRect.h);

	// test, works as expected.
	// but does not account for label.
	return (p.y + nodeRect.h + nodeRect.y);
*/



    }

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	return (p.y + nodeRect.h + nodeRect.y);
    }

    return 0;

}



// needed
LytNodeUtil.getNodeAbsoluteBottomConnectY = function(nodeContext) {

    labelRect = nodeContext.getLabelBounds();
    if (labelRect) {

	var labelPos = nodeContext.getLabelPosition();

	if (nodeRect) 
	    return (p.y + nodeRect.h + nodeRect.y + labelRect.h);
	// return(labelPos.y + labelRect.h + nodeRect.y);

	return(labelPos.y + labelRect.h);
    }

    var nodeRect = nodeContext.getBounds();
    if (nodeRect) {

	var p = nodeContext.getPosition();
	return (p.y + nodeRect.h + nodeRect.y);
    }

    return 0;

}


/*
LytNodeUtil.getNodeTopConnectY = function(nodeContext) {
    return 0;
}
*/

LytNodeUtil.getNodeAbsoluteTopConnectY = function(nodeContext) {

    var p;

    var nodeRect = nodeContext.getBounds();
    if (nodeRect) {
	p = nodeContext.getPosition();
	return (p.y + nodeRect.y);
    }

    labelRect = nodeContext.getLabelBounds();
    if (labelRect) {
	p = nodeContext.getLabelPosition();
	return (p.y + nodeRect.y);
    }

    p = nodeContext.getPosition();
    return p.y;

}

LytNodeUtil.getNodeAbsoluteTopConnectYRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();
    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	return (p.y + nodeRect.y);
    }

    labelRect = nodeContext.getLabelBounds();
    if (labelRect) {
	var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

	// neg fix
	if (nodeRect) 	return (labelPos.y + nodeRect.y);

	return (labelPos.y);
    }

    p = nodeContext.getPosition();
    return p.y;

}

//
// Return the top connection point of a node.
//
//
//       .        Top connection point
//     ----
//    |    |
//    |    |
//     ----
//   Node Label
//
//
LytNodeUtil.getNodeTopConnectPoint = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var connectionPoint = new LytPoint();

    connectionPoint.x = LytNodeUtil.getNodeCenterX(nodeContext);
    connectionPoint.y = 0;

    return connectionPoint;

}


//
// Return the right connection point of a node.
//
//     ----
//    |    |
//    |    |.   Right connection point
//    |    |
//     ----
//   Node Label
//
//
LytNodeUtil.getNodeRightConnectX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var x;

    // 
    // x center is midpoint of the max node width and label width.
    // 
    
    //
    // Connection to the right of the nodeRect dimensions.
    //
    if (nodeRect && labelRect) {
	x = nodeRect.w;
	// if (nodeRect.w > labelRect.w) x = nodeRect.w;
	// else x = labelRect.w/2 + nodeRect.w/2 
    }

    else if (nodeRect) x = nodeRect.w;
    else if (labelRect) x = labelRect.w;

    return x;

}

LytNodeUtil.getNodeAbsoluteRightConnectXRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	return (p.x + nodeRect.w + nodeRect.x);
    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    if (labelRect && labelPos) return(labelPos.x + labelRect.w);

    return 0;

}

LytNodeUtil.getNodeAbsoluteRightConnectX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {
	var p = nodeContext.getPosition();
	return (p.x + nodeRect.w + nodeRect.x);
    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = nodeContext.getLabelPosition();

    if (labelRect && labelPos) return(labelPos.x + labelRect.w);

    return 0;

}

//
// Return node's center connection point.
// This is normally calculated from nodeContext.getBounds().
//
LytNodeUtil.getNodeAbsoluteCenterConnectPoint = function(nodeContext) {

    var returnPoint = new LytPoint(0,0);

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = nodeContext.getPosition();

	returnPoint.x = p.x + nodeRect.w/2;
	returnPoint.y = p.y + nodeRect.h/2;

	return returnPoint;

    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = nodeContext.getLabelPosition();

    if (labelRect && labelPos) {

	returnPoint.x = labelPos.x + labelRect.w/2;
	returnPoint.y = labelPos.y + labelRect.h/2;

	return returnPoint;
    }

    return returnPoint;

}

// function getSrcNodePositionRel(l, srcNode, dstNode) {

//
// Version for Renderer Containers
//
LytNodeUtil.getNodeAbsoluteCenterConnectPointRel = function(l, nodeContext, linkedNodeContext) {

    // var returnPoint = new LytPoint(0,0);
    var returnPoint = new DvtDiagramPoint(0,0);

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	returnPoint.x = p.x + nodeRect.w/2 + nodeRect.x;
	returnPoint.y = p.y + nodeRect.h/2 + nodeRect.y;

	// alert('center y ' + p.y + ' ' + nodeRect.h + ' ' + nodeRect.y);

	return returnPoint;

    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    if (labelRect && labelPos) {

	returnPoint.x = labelPos.x + labelRect.w/2;
	returnPoint.y = labelPos.y + labelRect.h/2;

	return returnPoint;
    }

    return returnPoint;

}

//
// Return the x Center of a node.
//
LytNodeUtil.getNodeCenterX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var xCenter;

    // 
    // x center is midpoint of the max node width and label width.
    // 
    if (nodeRect && labelRect) xCenter = Math.max(nodeRect.w, labelRect.w);
    else if (nodeRect) xCenter = nodeRect.w;
    else if (labelRect) xCenter = labelRect.w;

    return xCenter/2;

}

LytNodeUtil.getNodeAbsoluteCenterXRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	return (p.x + nodeRect.w/2 + nodeRect.x);
    }

    labelRect = nodeContext.getLabelBounds();

    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    if (labelRect && labelPos) return labelPos.x + labelRect.w/2;

    return 0;

}

//
// Like center, but adds the origin.
//
LytNodeUtil.getNodeAbsoluteCenterX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {
	var p = nodeContext.getPosition();
	return (p.x + nodeRect.w/2 + nodeRect.x);
    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = nodeContext.getLabelPosition();

    // neg fix
    if (labelRect && labelPos) return labelPos.x + labelRect.w/2 + nodeRect.x;

    return 0;

}


//
// Return the y center connection point of a node.
//
//     -----
//    |     |
//    |  .  | <--- Center connectiong point Y
//    |     |
//     -----
//   Node Label
//
// Return the Y midpoint of the nodeRect.
//
//
LytNodeUtil.getNodeConnectCenterY = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var centerY = 0;

    // neg fix
    if (nodeRect) centerY = nodeRect.h/2 + nodeRect.y;
    else if (labelRect) centerY = labelRect.h/2;

    return centerY;

}

LytNodeUtil.getNodeAbsoluteConnectCenterY = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {
	var p = nodeContext.getPosition();
	return (p.y + nodeRect.h/2 + nodeRect.y);
    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = nodeContext.getLabelPosition();
    // neg fix
    if (labelRect && labelPos) return(labelPos.y + labelRect.h/2 + p.y);

    return 0;

}

LytNodeUtil.getNodeAbsoluteConnectCenterYRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

	// neg fix
	return (p.y + nodeRect.h/2 + nodeRect.y);
    }

    labelRect = nodeContext.getLabelBounds();
    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    if (labelRect && labelPos) return(labelPos.y + labelRect.h/2);

    return 0;

}


//
// Return the right edge point of a node.
//
//     ----
//    |    |
//    |    |  .   Right Edge
//    |    |
//     ----
//   Node Label
//
// Should recode to not use bounds.x
//
//
LytNodeUtil.getNodeRightEdgeX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var rightEdgeX;
    var originX = LytNodeUtil.getOriginX(nodeContext);

    // 
    // x center is midpoint of the max node width and label width.
    // 
    
    //
    // Connection to the right of the nodeRect dimensions.
    //
    if (nodeRect && labelRect) {
/*
	if (nodeRect.w > labelRect.w) 
	    rightEdgeX = originX + nodeRect.w;
	else rightEdgeX = originX + labelRect.w;
*/

	if (nodeRect.w > labelRect.w) 
	    rightEdgeX = originX + labelRect.w + nodeRect.x;
	else 
	    rightEdgeX = originX + nodeRect.w + nodeRect.x;
    }

    else if (nodeRect) rightEdgeX = originX + nodeRect.w + nodeRect.x;
    else if (labelRect) rightEdgeX = originX + labelRect.w;

    return rightEdgeX;

}

//
// get the left x connection point
// (does not use bounds.x ...)
//
LytNodeUtil.getNodeLeftConnectX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();

    var leftEdgeX = 0;

    if (nodeRect && labelRect) {
	if (labelRect.w > nodeRect.w) 
	    leftEdgeX = (labelRect.w - nodeRect.w) / 2;
    }

    return leftEdgeX;

}

//
// Absolute version of LeftConnectX
//
LytNodeUtil.getNodeAbsoluteLeftConnectX = function(nodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {
	var p = nodeContext.getPosition();
	return (p.x + nodeRect.x);
    }

    var labelPos = nodeContext.getLabelPosition();

    if (labelPos) {
	return labelPos.x;
    }
}


LytNodeUtil.getNodeAbsoluteLeftConnectXRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();

    if (nodeRect) {

	var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);
	return (p.x + nodeRect.x);
    }

    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    if (labelPos) return labelPos.x;

    return 0;

}


/**
Return getOriginX() for TOP_DOWN and getOriginY() for LEFT_RIGHT
*/
LytNodeUtil.getOriginFlow = function(nodeContext, layoutFlow) {

    switch (layoutFlow) {

    case LytLayout.FLOW_TOP_DOWN:

	return LytNodeUtil.getOriginX(nodeContext);

    case LytLayout.FLOW_LEFT_RIGHT:

	return LytNodeUtil.getOriginY(nodeContext);
    }
}

//
// get the leftmost x coordinate
//
LytNodeUtil.getOriginX = function(nodeContext) {

    nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();
    var labelPos = nodeContext.getLabelPosition();

    var p = nodeContext.getPosition();

    var originX;

    if (nodeRect && labelPos) originX = Math.min(p.x, labelPos.x);
    else if (nodeRect) originX = p.x;
    else if (labelPos) originX = labelPos.x;

    return originX;

}

LytNodeUtil.getOriginXRel = function(l, nodeContext, linkedNodeContext) {


    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();
    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

    var originX;

    if (nodeRect) originX = p.x;
    else if (labelPos) originX = labelPos.x;

    return originX;

}

//
// get the topmost y coordinate
//
LytNodeUtil.getOriginY = function(nodeContext) {

    nodeRect = nodeContext.getBounds();
    var labelPos = nodeContext.getLabelPosition();

    var p = nodeContext.getPosition();

    var originY;

    if (nodeRect && labelPos)
	originY = Math.min(p.y, labelPos.y);
    else if (nodeRect) originY = p.y;
    else if (labelPos) originY = labelPos.y;

    return originY;

}




//
// get the topmost y coordinate
//
LytNodeUtil.getOriginYRel = function(l, nodeContext, linkedNodeContext) {

    var nodeRect = nodeContext.getBounds();
    var labelPos = LytNodeUtil.getLabelPosRel(l, nodeContext, linkedNodeContext);

    var p = LytNodeUtil.getNodePosRel(l, nodeContext, linkedNodeContext);

    var originY;

    if (nodeRect && labelPos) {
	// originY = nodeRect.y;
	originY = p.y;
    }

    // else if (nodeRect) originY = nodeRect.y;
    else if (nodeRect) originY = p.y;
    else if (labelPos) originY = labelPos.y;

    return originY;

}

//
// setPosition - when a node's position is updated,
// also update the node label bounds.
//
// (x,y)
//   .  ----
//     |    |
//     |    |
//      ----
//   Node Label
//
//

LytNodeUtil.setNodePosition = function(nodeContext, x, y) {

    var debug = false;

    if (debug) alert(nodeContext.getId() + ' setNodePosition ' + x + ' ' + y);

    var nodeRect = nodeContext.getBounds();
    labelRect = nodeContext.getLabelBounds();
    var diff;

    var labelX;
    var labelY;

    if (labelRect && !nodeRect) {

	labelX = x;
	labelY = y;
	nodeContext.setLabelPosition(new DvtDiagramPoint(labelX, labelY));	
	return;
    }
    // 
    // Calculate and set x values for label an node bounding box
    // based on the relative length of the node box and the label box.
    // 
    if (labelRect) {

	labelY = y + nodeRect.h + nodeRect.y;

	if (labelRect.w > nodeRect.w) {
	    labelX = x;
	} else {
	    // neg fix
	    diff = nodeRect.w - labelRect.w + nodeRect.x;
	    labelX = x + diff/2;
	}

	nodeContext.setLabelPosition(new DvtDiagramPoint(labelX, labelY));	

	// if (debug) alert(nodeContext.getId() + ' setNodePosition ' + labelX + ' ' + labelY + ' ' + labelRect.w + ' ' + labelRect.h);

	// 
	// Offset node's x to reflect longer label.
	// 
	var nodeX = x;
	var nodeY = y;
	if (labelRect.w > nodeRect.w) {
	    diff = labelRect.w - nodeRect.w;
	    var nodeX = x + diff/2;
	}
	
	// 
	// set both Position and bounds
	// one of these will eventually become redundant.  (discussion with Brendon G.)
	// 
	// nodeContext.setBounds(new DvtDiagramRectangle(nodeX, nodeY, nodeRect.w, nodeRect.h));	
	nodeContext.setPosition(new DvtDiagramPoint(nodeX, nodeY));
	return;

    }
    else if (nodeRect) {

	// nodeContext.setBounds(new DvtDiagramRectangle(x, y, nodeRect.w, nodeRect.h));	
	nodeContext.setPosition(new DvtDiagramPoint(x, y));
	return;
    } 
    else nodeContext.setPosition(new DvtDiagramPoint(x, y));

}

/**
Set node positions within a grid.

@param xCellPad - prePad for widths
@param colWidth - width of the grid column
@param yCellPad - prePad for heights
@param cellHeightDiff - cell height difference
*/
LytNodeUtil.setNodePositionGrid = function(nodeContext, x, y, xCellPad, colWidth, yCellPad, cellHeightDiff) {

    var debug = false;

    var alignCenterY = true;

    if (debug) alert(nodeContext.getId() + ' setNodePosition ' + x + ' ' + y);
    if (debug) alert(nodeContext.getId() + ' yCellPad ' + yCellPad + ' cellHeightDiff ' + cellHeightDiff);

    var nodeRect = nodeContext.getBounds();
    var labelRect = nodeContext.getLabelBounds();

    var labelX;
    var labelY;

    var nodeX ;
    var nodeY;

    // 
    // label only
    // 
    if (labelRect && !nodeRect) {

	if (debug) alert(' label and !node ');

	labelX = LytNodeUtil.getGridCenterX(x, xCellPad, colWidth, labelRect.w);
	labelY = y + yCellPad + cellHeightDiff;

	nodeContext.setLabelPosition(new DvtDiagramPoint(labelX, labelY));	
	return;
    }

    // 
    // Node and Label
    // 
    if (labelRect) {

	if (debug) alert(' label and node ');

	// 
	// center the node in the column.
	// 
	nodeX = LytNodeUtil.getGridCenterX(x, xCellPad, colWidth, nodeRect.w);

	if (alignCenterY) nodeY = y + yCellPad + cellHeightDiff/2;
	else nodeY = y + yCellPad;
	
	//
	// Align label to bottom of node
	//
	labelY = nodeY + nodeRect.h;
	labelX = LytNodeUtil.getGridCenterX(x, xCellPad, colWidth, labelRect.w);
	// alert('setLpos ' + labelX);

	nodeContext.setPosition(new DvtDiagramPoint(nodeX, nodeY));
	nodeContext.setLabelPosition(new DvtDiagramPoint(labelX, labelY));	
	return;

    }
    // 
    // Node only
    // 
    else if (nodeRect) {

	nodeX = LytNodeUtil.getGridCenterX(x, xCellPad, colWidth, nodeRect.w);

	if (alignCenterY) nodeY = y + yCellPad + cellHeightDiff/2;
	else nodeY = y + yCellPad;

	nodeContext.setPosition(new DvtDiagramPoint(nodeX, nodeY));

	return;
    } 
    else nodeContext.setPosition(new DvtDiagramPoint(x, y));

}


//
// Center node or label along the x axis.
// Add the cell x padding to half the difference of the nodeOrLabelWidth and the (unpadded) grid column width.
//
LytNodeUtil.getGridCenterX = function(x, xCellPad, colWidth, nodeOrLabelWidth) {

    var xOffset = xCellPad + ((colWidth - nodeOrLabelWidth) /2);
    var nodeX = x + xOffset;
    
    return nodeX;

}
