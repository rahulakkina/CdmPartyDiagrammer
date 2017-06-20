/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     

    LytLinkUtil.js

    Link utilities.

    Description:
   
    Includes code for:
   
      - link endpoint backoff
      - basic routing
      - channel routing
   
    Notes: 
   
     -  In some cases, the layout will determine which links are backlinks (and sidelinks).
     Automatic tiering of nodes, for example, will determine the level of some nodes.
     It may be the preference that backlinks and sidelinks be "non-collapsable".
     So it follows that the layout should mark links as such,
     so that the render can properly calculate visible nodes.
   
     - We may need to extend the link structure with spline/arc info.

    MODIFIED    (MM/DD/YY)
    lmolesky	04/09/12 - Remove arrow backoff from this routine, moved it to the test renderer.
    lmolesky	03/11/12 - Spun off LytChannelRouteUtil.js from this file.
    lmolesky	03/11/12 - Wrap up orthogonal routing for close routes.
    lmolesky	01/30/12 - Code refactoring
    lmolesky	01/24/12 - Enhancements for getter link connections
    lmolesky	01/18/12 - Add support for crossContainerLink relative positioning
    lmolesky	01/10/12 - Expose functions for use by LytLabelUtil
    lmolesky	12/15/11 - Support link labels - LytLabelUtil.centerLinkLabels()
    bglazer     12/14/11 - new Diagram layout classes from EM with some container
                           support from label LAYOUT_MAIN_GENERIC_111130.0112
    lmolesky	11/28/11 - Enhance channel routing with getColSegmentWidthNoPad() - achieves tighter routes
    lmolesky	11/17/11 - Extend channel routing with srcNodeMatchesContainerID()
    lmolesky	10/13/11 - Update for Node Text Support
    lmolesky	09/13/11 - Created


*/

//
//
//
//


var LytLinkUtil = function()
{
    this.Init();
};

LytObj.createSubclass(LytLinkUtil, LytObj, "LytLinkUtil");

LytLinkUtil.prototype.Init = function()
{
};


//
// Set the drawing context (for test rendering).
//
var ctx;

LytLinkUtil.prototype.setDrawingContext = function(drawingContext)
{
    ctx = drawingContext;
};


//
// Draw a circle - used for diagnostics.
//
function drawCircleDiag(x, y, fillColor, r) {

    // var canvas = document.getElementById("canvas");
    // var ctx = canvas.getContext("2d");

    if (ctx) {

	ctx.beginPath();
	ctx.arc(x, y, r, 360,0, Math.PI * 2, false);
	ctx.closePath();

	ctx.strokeStyle = "#606060";
	ctx.stroke();
	ctx.fillStyle = fillColor;
	ctx.fill();

    }
}

// 
// width denominator 
//
// 2 - positions dst virtual routing point to center.
// > 2 - positions closer to the connecting edge.
//
//
var _widthDenominator = 2;
var _heightDenominator = 2;

var _aspectFactor = 2;

//
// Get the x offset that determines the virtual routing point.
// This is half the node width.
//

function getOffsetX(layoutContext, dstNode) {

    var r2 = dstNode.getBounds();

    var offsetX = r2.w /_widthDenominator;

    return offsetX;

}


function getOffsetY(layoutContext, dstNode) {

    var r2 = dstNode.getBounds();

    var offsetY = r2.h /_heightDenominator;

    return offsetY;

}

var useOffsetX = true;

//
// Layout Links.  Use for trees. (not grids!)
//
LytLinkUtil.prototype.layoutLinks = function(layoutContext, containerDesc, layoutFlow, arrowLength, route, linkDS) {

    var debug = false;

    if (debug) alert('layoutLinks ' + arrowLength);

    /*
    util.compute();
    alert (' test ' + util.parama);
*/

    util.calcCtlPtOffsets(layoutContext, linkDS, layoutFlow);

    var linksIn = linkDS.getLinksIn();
    var linksOut = linkDS.getLinksOut();

    var srcID;
    var dstID;

    var srcNode;
    var dstNode;

    var i;

    var linkCount = layoutContext.getLinkCount();

    var linkContext;

    //
    // For straight links,
    // Backoff all links,
    // using the calculated linksInOffsets
    //
    for (var i=0; i<linkCount; i++) {

	linkContext = layoutContext.getLinkByIndex(i);

	dstID = linkContext.getEndId();
	srcID = linkContext.getStartId();

	if (!dstID) continue;
	if (!srcID) continue;

	dstNode = layoutContext.getNodeById(dstID);
	srcNode = layoutContext.getNodeById(srcID);

	if (!srcNode) continue;
	if (!dstNode) continue;
        
	var endPoints;
	var coords = new Array();
	cctLength = 0;

	{

	    // alert(srcID + '-' + dstID + ' backofLink ' );

	    // backoffLink(layoutContext, linkContext, layoutFlow, linksInOffsetX, linksInOffsetY, arrowLength);
	    endPoints = LytLinkUtil.backoffLink(layoutContext, linkContext, layoutFlow, util.linksInOffsetX, util.linksInOffsetY, linkDS);

	    coords[0] = endPoints[0];
	    coords[1] = endPoints[1];

	    coords[2] = endPoints[2];
	    coords[3] = endPoints[3];

	    /*
	    if (isNaN(coords[0])) alert(' xxx 0');
	    if (isNaN(coords[1])) alert(' xxx 1');
	    if (isNaN(coords[2])) alert(' xxx 2');
	    if (isNaN(coords[3])) alert(' xxx 3');
*/

	    linkContext.setPoints(coords);

	    // center the link labels.
	    LytLabelUtil.centerLinkLabel(linkContext, coords[0], coords[1], coords[2], coords[3]);
	}
    }
}


//
// Utilities internal to LytLinkUtil
//
//
//
//
var util = {


    //
    // Example of a simple "Function as Method"
    //
    /*
    compute: function() {

	this.parama = 10;
	this.paramb = 20;

    }
*/



    //
    // Calculate the control point for a node based on the linksIn.
    // The control point is adaptive, based on the # of links in.
    //
    calcCtlPtOffsets: function(layoutContext, linkDS, layoutFlow) {

	this.linksInOffsetX = new Array();
	this.linksInOffsetY = new Array();

	var linkContext;

	var linkCount = layoutContext.getLinkCount();
	var nodeCount = layoutContext.getNodeCount();

	var dvtLink;
	var srcNode;
	var dstNode;

	var linksIn;
	var linksOut;

	var linksInMaxAngle = new Array();
	var linksInMinAngle = new Array();

	var srcID;
	var dstID;

	var i;

	var linksIn = linkDS.getLinksIn();
	var linksOut = linkDS.getLinksOut();

	// 
	// Calculate largest (and smallest) angle for links in.
	// (all links into a dstID)
	//
	var defaultOffsetX;
	var defaultOffsetY;

	var maxsrcID;
	var minsrcID;

	var maxAngle;
	var minAngle;

	//
	// Constants that identify min/max angles that have not been set.
	//
	var noMaxAngle = 0;
	var noMinAngle = 10000;

	var rise;
	var run;

	//
	// Calculate the offsets for all nodes.
	//
	for (i=0; i<nodeCount; i++) {

	    dstNode = layoutContext.getNodeByIndex(i);
	    if (!dstNode) continue;

	    dstID = dstNode.getId();

	    maxAngle = noMaxAngle;
	    minAngle = noMinAngle;

	    // alert(' dstid ' + dstID);

	    if (linksIn[dstID]) {

		// alert(' linksin ' + dstID);

		srcID = linksIn[dstID][0];
		srcNode = layoutContext.getNodeById(srcID);
		if (!srcNode) continue;

		// alert(' call getrise ' + dstID);
		
		rise = getRise(layoutContext, layoutFlow, srcID, dstID);
		run = getRun(layoutContext, layoutFlow, srcID, dstID);

		// alert(srcID + ' ^srcID ' + dstID + ' dstID ' + ' rise ' + rise + ' run ' + run);

		if (isValidSlope(rise, run)) {

		    maxsrcID = srcID;
		    maxAngle = Math.abs(getSlope(layoutContext, layoutFlow, maxsrcID, dstID));
		    
		    minsrcID = maxsrcID;
		    minAngle = maxAngle;
		    
		}

		//
		// Find the min and max angles for all links into a node.
		//
		for (var j=1; j<linksIn[dstID].length; j++) {


		    srcID = linksIn[dstID][j]
		    // alert(srcID + ' *srcID ' + dstID + ' dstID ' + ' rise ' + rise + ' run ' + run);

		    rise = getRise(layoutContext, layoutFlow, srcID, dstID);
		    run = getRun(layoutContext, layoutFlow, srcID, dstID);

		    if (isValidSlope(rise, run)) {

			testAngle = Math.abs(getSlope(layoutContext, layoutFlow, srcID, dstID));
			// alert(' testAngle ' + testAngle + ' srcID ' + srcID + ' dstID = ' + dstID);
			
			if (maxAngle < testAngle) {
			    maxsrcID = srcID;
			    maxAngle = testAngle;
			}

			if (minAngle > testAngle) {
			    minsrcID = srcID;
			    minAngle = testAngle;
			}
		    }
		}	

		// alert(' maxAngle ' + maxAngle + ' srcID ' + srcID + ' dstID = ' + dstID);
		linksInMaxAngle[dstID] = maxAngle;
		linksInMinAngle[dstID] = minAngle;

		//
		// Defaults offsets based on the node's center.
		//
		defaultOffsetX = getOffsetX(layoutContext, dstNode);
		defaultOffsetY = getOffsetY(layoutContext, dstNode);

		// alert(' default ' + defaultOffsetX + ' ' + defaultOffsetY);
		// alert(' min angles ' + minAngle + ' max ' + maxAngle);

		//
		// For steep angles, the control point could move closer to 
		// the connecting face.  This offset (that determines the control point)
		// is stored in linksInOffsetX[dstID].
		//

		if (maxAngle != noMaxAngle) {

		    // 
		    // For horizontal flows, the impliedOffsetX is
		    // half the node height divided by the max angle.
		    // 
		    var r2 = dstNode.getBounds();
		    var impliedOffsetX = r2.h / 2 / maxAngle;

		    // alert(' iox ' + impliedOffsetX);

		    if (impliedOffsetX < defaultOffsetX) {
			this.linksInOffsetX[dstID] = impliedOffsetX;
		    }

		}

		if (minAngle != noMinAngle) {

		    // 
		    // for vertical flows, find the min angle.
		    //

		    var impliedOffsetY = r2.w / 2 * minAngle;

		    // alert(' ioy ' + impliedOffsetY + ' default ' + defaultOffsetY);

		    if (impliedOffsetY < defaultOffsetY) {
			this.linksInOffsetY[dstID] = impliedOffsetY;
		    }
		}
	    }	
	}

	var debug = false;

	if (debug) {
	    for (i=0; i<nodeCount; i++) {

		dstNode = layoutContext.getNodeByIndex(i);
		dstID = dstNode.getId();

		if (layoutFlow == LytLayout.FLOW_LEFT_RIGHT)
		    if (linksInMaxAngle[dstID]) {
			alert(' linksInMaxAngle[ ' + dstID + '] = ' + linksInMaxAngle[dstID]);
			alert(' linksInOffsetX[ ' + dstID + '] = ' + this.linksInOffsetX[dstID]);

		    }

		if (layoutFlow == LytLayout.FLOW_TOP_DOWN)
		    if (linksInMinAngle[dstID]) {
			alert(' linksInMinAngle[ ' + dstID + '] = ' + linksInMinAngle[dstID]);
			alert(' linksInOffsetY[ ' + dstID + '] = ' + this.linksInOffsetY[dstID]);

		    }
	    }
	}
    }
}

//
// temp. - flag to adjust for arrows.
//
LytLinkUtil._aa = true;

//
// Backoff link endpoints
//
// Backs off a link.
// Determines the proper connection point of a link,
// returns these points by setting l.setPosition(array[])
//
// l: linkContext (DvtDiagrammerLayoutContext)
// layoutContext: (DvtDiagrammerLayoutContextLink)
// layoutFlow: 
//
// Need an option to force "on-center" links.
//
//
LytLinkUtil.backoffLink = function(layoutContext, l, layoutFlow, linksInOffsetX, linksInOffsetY, linkDS) {

    var debug = false;

    // return value
    var endPoints=new Array();

    var dstID = l.getEndId();
    var srcID = l.getStartId();

    // new code

    // srcID = linkDS.getVisibleContainer(layoutContext, srcID);
    // dstID = linkDS.getVisibleContainer(layoutContext, dstID);

    if (!dstID) return;
    if (!srcID) return;

    dstNode = layoutContext.getNodeById(dstID);
    srcNode = layoutContext.getNodeById(srcID);

    if (!dstNode) return;
    if (!srcNode) return;

    var linksIn = linkDS.getLinksIn();

    var srcPoint = LytNodeUtil.getNodePosRel(layoutContext, srcNode, dstNode);
    var dstPoint = LytNodeUtil.getNodePosRel(layoutContext, dstNode, srcNode);

    // var srcPoint = srcNode.getPosition();
    // var dstPoint = dstNode.getPosition();
    
    var r1 = srcNode.getBounds();
    var r2 = dstNode.getBounds();

    // testing

    // alert('backofflink ' + srcID + ' ' + dstID);

    //
    // Node centers.
    // Most accurate initial calculation for rise and run.
    // 
    // var c1 = getNodeCenter(layoutContext, srcID);
    // var c2 = getNodeCenter(layoutContext, dstID);

    var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    // 
    // This would return node centers.
    // Useful for debugging link backoff issues.
    // 
    var debugLink = false;
    if (debugLink) {

	endPoints[0] = c1.x;
	endPoints[1] = c1.y;

	endPoints[2] = c2.x;
	endPoints[3] = c2.y;

	return endPoints;
    }



    var pt1 = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);
    var pt2 = LytLinkUtil.getDstNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);

    var centerX2 = c2.x;

    var rise;
    var run;

    rise = c1.y - c2.y;
    run = c1.x - c2.x;

    rise = pt1.y - pt2.y;
    run = pt1.x - pt2.x;

    // alert('backofflink ' + srcID + ' dst c: ' + dstID + ' c1.x ' + c1.x + ' c1.y ' + c1.y + ' c2.x ' + c2.x + ' c2.y ' + c2.y);
    // alert('backofflink ' + srcID + ' dst p: ' + dstID + ' pt1.x ' + pt1.x + ' pt1.y ' + pt1.y + ' pt2.x ' + pt2.x + ' pt2.y ' + pt2.y);

    // alert('backofflink ' + srcID + ' dst ' + dstID + ' rise ' + rise + ' run ' + run + ' ');

    x2 = pt2.x;
    y2 = pt2.y;

    // 
    // dstAspectRatio_horz and dstAspectRatio_vert are aspect ratio for the destination node (for horizontal and vertical flows)
    // These ratios are used for calculating the backoff
    // - they tell us when a link should be connected to a side face vs. a top/bottom face.
    // 
    // For example, when a line of slope 1 would connect to a top face when below
    // (because node width/height > 1).
    // (The algorithm tries to draw to the node center, then back off the link to the intersecting face)
    // 
    //            \
    //             \
    //             --------- 
    //            |  \      |
    //            |    .    |
    //            |         |
    //             --------- 
    //
    var dstAspectRatio_horz = LytNodeUtil.getNodeConnectHeight(dstNode) / LytNodeUtil.getNodeConnectWidth(dstNode);
    var dstAspectRatio_vert = LytNodeUtil.getNodeConnectWidth(dstNode) / LytNodeUtil.getNodeConnectHeight(dstNode);

    // var dstAspectRatio_horz = r2.h / r2.w;
    // var dstAspectRatio_vert = r2.w / r2.h;

    // alert(' dstAspectRatio_horz ' + dstAspectRatio_horz);

    var runDelta = r2.w / 2;
    var riseDelta;
    // var riseDelta = (runDelta * rise / run);

    var slope;
    var radians;
    var yArrowDelta;

    switch(layoutFlow) {

    case LytLayout.FLOW_LEFT_RIGHT:

	if (debug) alert('FLOW_LEFT_RIGHT: ' + srcID + ' ' + dstID);

	//
	// For a tree (at most one inlink)
	//
	var enable = false;
	if (enable && linksIn[dstID].length <= 1 && layoutContext.getLinkConnectHint() != "DST_CENTER") {
	    
	    //
	    // For a single inLink, 
	    // position the link at the midpoint of the node's vertical face.
	    //
	    // (Y value is actuall positioned off the midpoint - 5/8 and 3/8).
	    //
	    if (run < 0) x2 = dstPoint.x - 1;
	    else  x2 = dstPoint.x + 1;

	    y2 = dstPoint.y + r2.h/2;

	    if (rise < 0) 
		y2 = dstPoint.y + 3 * r2.h / 8;
	    else
		y2 = dstPoint.y + 5 * r2.h / 8;

	    break;
	}

	//
	// Link direction follows the flow direction.
	// This is the common case.
	// Condition: negative run.
	//

	var offsetX = getOffsetX(layoutContext, dstNode);
	runDelta = offsetX;

	if (useOffsetX) {

	    if (!isNaN(linksInOffsetX[l.getEndId()])) {
		runDelta = linksInOffsetX[l.getEndId()];
		// alert('left-right offsetX '+  offsetX + ' runDelta  ' + runDelta);
	    }
	}

	// 
	// Run == 0, this is a vertical (or self) link.
	// 
	if (run == 0) {

	    if (rise > 0) {
		y2 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, dstNode, srcNode);
	    }
	    else { 
		y2 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);
	    }

	}
	// if (run < 0)
	else {

	    // aug
	    // for a single inLink, we should draw to the center.

	    //
	    // Test code for drawing the virtual routing point.
	    //
	    var drawVRP = false;
	    if (drawVRP) {

		// n28
		drawCircleDiag(dstPoint.x + runDelta, pt2.y, "#20c020", 2);

	    }

	    //
	    // source links originate from the subtree collapser
	    // (pt1.x, pt1.y) are the coordinates of the subtree collapser.
	    //

	    rise = pt1.y - c2.y;
	    run = pt1.x - c2.x
	    slope = rise/run;
	    // run = pt1.x - pt2.x;

	    // alert(' rise ' + rise + ' run ' + run);

	    if (rise == 0) {

		if (debug) alert('backoffLink rise == 0');

		x2 = dstPoint.x;
		y2 = c2.y;

		if (run < 0) 
		   x2 = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, dstNode, srcNode);
		else
		    x2 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, dstNode, srcNode);

		break;
	    }

	    riseDelta = (runDelta *  rise / run);

	    /// alert( ' riseDelta ' + riseDelta);

	    //
	    // simple case - natural side link.
	    //

	    //
	    // We force a side connection when the node has a separate label and the link is upward.
	    // (This gives a better looking diagram)
	    //
	    var forceSideConnection = false;
	    if (dstNode.getLabelPosition() && rise > 0) forceSideConnection = true;

	    if (runDelta != offsetX || (Math.abs(rise/run) <= dstAspectRatio_horz || forceSideConnection))
	    {

		if (debug) alert(' backoffS ');

		//
		// Link to side of the node.
		//
		var backedOffPt = LytLinkUtil.backoffSideLink(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY);

		x2 = backedOffPt.x;
		y2 = backedOffPt.y;

		rise = pt1.y - y2;
		run = pt1.x - x2;

	    } else {

		if (debug) alert(' backoffV ');

		var backedOffPt = LytLinkUtil.backoffVertLink(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY);
		x2 = backedOffPt.x;
		y2 = backedOffPt.y;

		rise = pt1.y - y2;
		run = pt1.x - x2;

	    }
	}

	break;

    case LytLayout.FLOW_TOP_DOWN:

	if (debug) alert('FLOW_TOP_DOWN: ' + srcID + ' ' + dstID);

	var drawVRP = false;
	var enable = false;
	//
	// For a tree (at most one inlink)
	//
	// not sure why we do this - disabled for now.
	// 
	if (enable && linksIn[dstID].length <= 1 && layoutContext.getLinkConnectHint() != "DST_CENTER") {
	    
	    //
	    // For a single inLink, 
	    // position the link at the midpoint of the node's vertical face.
	    //
	    // (x value is actually positioned off the midpoint - 5/8 and 3/8).
	    //
	    // x2 = dstPoint.x  + r2.w;
	    // if (rise < 0) y2 = dstPoint.y - 1;
	    // else y2 = dstPoint.y + 2;
	    
	    // if (run < 0) x2 = dstPoint.x + 3 * r2.w / 8;
	    // else x2 = dstPoint.x + 5 * r2.w / 8;

	    y2 = dstPoint.y + r2.h/2;
	    x2 = dstPoint.x + r2.w/2;

	    break;
	}

	var iSlope;
	var offsetY = getOffsetY(layoutContext, dstNode);
	riseDelta = offsetY;

	if (useOffsetX) {

	    if (!isNaN(linksInOffsetY[l.getEndId()])) {
		riseDelta = linksInOffsetY[l.getEndId()];
		// alert('top-down offsetY '+  offsetY + ' riseDelta  ' + riseDelta);
	    }
	}

	// Rise == 0, this is a horizontal link.
	if (rise == 0) {

	    if (debug) alert('rise ==  0 horz link ');


	    if (run > 0) {
		x2 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, dstNode, srcNode);
		if (debug) alert('run > 0');
	    }
	    else {
		x2 = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, dstNode, srcNode);
		if (debug) alert('run < 0');
	    }

	    break;

	}
	else {
	    // else if (rise < 0) {

	    if (debug) alert('rise < 0 ');

	    //
	    // Test code for drawing the virtual routing point.
	    //
	    if (drawVRP) {

		drawCircleDiag(pt2.x, dstPoint.y + riseDelta, "#20c020", 2);
	    }

	    //
	    // source links originate from the subtree collapser
	    // (pt1.x, pt1.y) are the coordinates of the subtree collapser.
	    //

	    rise = pt1.y - c2.y;
	    run = pt1.x - c2.x
	    iSlope = run/rise;

	    if (drawVRP) {
		drawCircleDiag(c2.x, c2.y, '#fdd000', 2);
	    }

	    // alert(' rise ' + rise + ' run ' + run);

	    if (run == 0) {

		x2 = c2.x;
		y2 = dstPoint.y;

		if (rise < 0) 
		    y2 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);
		else
		    y2 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, dstNode, srcNode);

		break;
	    }

	    runDelta = (riseDelta * iSlope);
	    // alert( ' runDelta ' + runDelta);

	    //
	    // simple case - natural top link.
	    //
	    // if (riseDelta != offsetY || (Math.abs(iSlope) <= dstAspectRatio_vert * _aspectFactor))
	    if (riseDelta != offsetY || (Math.abs(iSlope) <= dstAspectRatio_vert))
	    {
		if (debug) alert(' main case ');

		var backedOffPt = LytLinkUtil.backoffVertLink(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY);
		x2 = backedOffPt.x;
		y2 = backedOffPt.y;

		rise = pt1.y - y2;
		run = pt1.x - x2;

		// alert(' dst ' + l.getEndId() + ' sin* ' + Math.sin(slope) + ' cos ' + Math.cos(slope) );
		// drawCircleDiag(x2, y2, "#f00000", 2);

	    }
	    else {

		if (debug) alert(' not main case ');

		var backedOffPt = LytLinkUtil.backoffSideLink(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY);

		x2 = backedOffPt.x;
		y2 = backedOffPt.y;

		rise = pt1.y - y2;
		run = pt1.x - x2;

	    }
	}
    }

    // alert(' endConnectorOffset ' + l.getEndConnectorOffset());

    // 
    // Backoff the arrow, using the connector offset 
    // 

	endPoints[0] = pt1.x;
	endPoints[1] = pt1.y;

	endPoints[2] = x2;
	endPoints[3] = y2;


    if (LytLinkUtil._aa && (l.getEndConnectorOffset() > 0) ) {

	var dstRet;

	// +1 so that arrows do not actually touch nodes.
	dstRet = LytLinkUtil.backoffArrow2(l.getEndConnectorOffset(), endPoints[0], endPoints[1], x2, y2);

	endPoints[2] = dstRet[0];
	endPoints[3] = dstRet[1];

	// alert(' end co ' + srcID + ' ' +  dstID + ' ' + l.getEndConnectorOffset());

    } if (LytLinkUtil._aa && (l.getStartConnectorOffset() > 0) ) {

	var dstRet;

	// +1 so that arrows do not actually touch nodes.
	dstRet = LytLinkUtil.backoffArrow2(l.getStartConnectorOffset(), endPoints[2], endPoints[3], endPoints[0], endPoints[1]);

	endPoints[0] = dstRet[0];
	endPoints[1] = dstRet[1];

	// endPoints[2] = x2;
	// endPoints[3] = y2;

	// alert(' start co ' + srcID + ' ' +  dstID + ' ' + l.getStartConnectorOffset());

    }
/* else { 

	endPoints[0] = pt1.x;
	endPoints[1] = pt1.y;

	endPoints[2] = x2;
	endPoints[3] = y2;

	alert(' no co ' + srcID + ' ' +  dstID); 

    }
*/

    // testing
    // endPoints[0] = c1.x;
    // endPoints[1] = c1.y;


    // if (isNaN(endPoints[2])) alert('layoutFlow ' + layoutFlow + ' run ' + run + ' rise ' + rise);
    // l.setPoints(endPoints);

    return endPoints;
    // var test = l.getPoints();

    //    for (var i=0; i<test.length; i+=2) alertPoint(endPoints[i], endPoints[i+1]);

}

//
// Backoff the link by a distance of arrowLength.
// Version with two coordinates.
//
LytLinkUtil.backoffArrow2 = function(arrowLength, x1, y1, x2, y2) {

    var ret = new Array();

    var rise = y1 - y2;
    var run = x1 - x2;

    ret = LytLinkUtil.backoffArrow(arrowLength, rise, run, x2, y2);

    // alert ('backoffArrow2 ' + x2 + ' ' + y2 + ' => ' + ret[0] + ' ' + ret[1] );

    return ret;
}

//
// Backoff the link by a distance of arrowLength.
// Version with one coordinate, rise and run.
//
LytLinkUtil.backoffArrow = function(arrowLength, rise, run, x2, y2) {

    var ret = new Array();

    if (arrowLength <= 0) {

	ret[0] = x2;
	ret[1] = y2;

	return ret;
    }

    var radians = Math.atan2(rise, run);

    // back off the arrow.
    if (arrowLength > 0) {

	x2 += Math.cos(radians) * arrowLength;

	var yArrowDelta = Math.sin(radians) * arrowLength;
	y2 += yArrowDelta;

    }

    ret[0] = x2;
    ret[1] = y2;

    return ret;
}


/**
backoff a sidelink, returning the backed off point.
*/
LytLinkUtil.backoffSideLink = function(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY) {

    var returnPt = new DvtDiagramPoint(0,0);

    //
    // calculate runDelta
    // 

    var offsetX = getOffsetX(layoutContext, dstNode);
    runDelta = offsetX;

    if (useOffsetX) {

	if (!isNaN(linksInOffsetX[l.getEndId()])) {
	    runDelta = linksInOffsetX[l.getEndId()];
	}
    }

    // 
    // Run estimate based on node centers.
    // 

    var riseEstimate;
    var runEstimate;

    var fromCenter = false;

    if (fromCenter) {

	riseEstimate = c1.y - c2.y;
	runEstimate = c1.x - c2.x;

    } else {

	// 
	// Estimate from most likely connect points.
	// 
	riseEstimate = pt1.y - c2.y;
	runEstimate = pt1.x - c2.x;
    }


    riseDelta = (runDelta *  riseEstimate / runEstimate);

    //
    // Links counter to the flow direction have positive runs.
    // These are essentially "backlinks"
    // Backlinks are routed from the left-hand side of the destinationnode
    // (the opposite side of the collapser)
    //

    if (runEstimate < 0) {

	returnPt.x = dstPoint.x;
	returnPt.x = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, dstNode, srcNode);
	returnPt.y = c2.y - riseDelta;

    } else {

	returnPt.x = dstPoint.x + r2.w;
	returnPt.x = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, dstNode, srcNode);
	returnPt.y = c2.y + riseDelta;
    }

    return returnPt;

}

LytLinkUtil.backoffVertLink = function(layoutContext, l, pt1, pt2, c1, c2, r2, dstPoint, linksInOffsetX, linksInOffsetY) {

    var returnPt = new DvtDiagramPoint(0,0);


    var iSlope;
    var offsetY = getOffsetY(layoutContext, dstNode);
    riseDelta = offsetY;

    if (useOffsetX) {

	if (!isNaN(linksInOffsetY[l.getEndId()])) {
	    riseDelta = linksInOffsetY[l.getEndId()];
	}
    }

    var riseEstimate;
    var runEstimate;


    // 
    // from the center, or the collapser? 
    // we need a more modular way to determine this
    // 
    
    var fromCenter = false;

    if (fromCenter) {
	//
	// Estimate from node centers.
	//
	riseEstimate = c1.y - c2.y;
	runEstimate = c1.x - c2.x;
    }
    else {
	// 
	// Estimate from most likely connect points.
	// 
	riseEstimate = pt1.y - c2.y;
	runEstimate = pt1.x - c2.x;
    }

    //
    // we use (pt1.x, pt1.y as the origin point, based on LytLinkUtil.getSrcNodeLinkPosition().
    //

    iSlope = runEstimate/riseEstimate;

    runDelta = (riseDelta * iSlope);

    if (riseEstimate < 0) {

	returnPt.x = c2.x - runDelta;
	returnPt.y = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);

    } else {

	returnPt.x = c2.x + runDelta;
	returnPt.y = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, dstNode, srcNode);


    }

    return returnPt;

}




//
// Return the center of the node.
//
function getNodeCenter(layoutContext, nodeID) {

    var debug = false;

    if (debug) alert('getNodeCenter ' + nodeID);

    var pt;

    var node = layoutContext.getNodeById(nodeID);
    if (!node) {
	alert('ERROR: invalid node ' + nodeID);
	return (new DvtDiagramPoint(0,0));
    }

    var nodePoint = node.getPosition();

    if (!nodePoint) {
	alert('ERROR: invalid nodePoint ' + nodeID);
	return (new DvtDiagramPoint(0,0));
    }
    var r = node.getBounds();
    if (!r) alert('ERROR: invalid r ' + nodeID);

    pt = new DvtDiagramPoint(nodePoint.x + (r.w /2), nodePoint.y + (r.h /2));
    return pt;

}

LytLinkUtil.getSrcNodeLinkPosition = function(layoutContext, layoutFlow, srcID, dstID) {

    var debug = false;
    var debug9 = false;

    if (!srcID) return;
    if (!dstID) return;

    if (debug) alert(' getSrcNodeLinkPosition src ' + srcID + ' dstID ' + dstID);

    var srcNode = layoutContext.getNodeById(srcID);
    if (!srcNode) return;

    var srcPoint = srcNode.getPosition();
    var r1 = srcNode.getBounds();

    // not needed until we do top-down flows.
    var dstNode = layoutContext.getNodeById(dstID);
    if (!dstNode) return;

    var dstPoint = dstNode.getPosition();
    var r2 = dstNode.getBounds();

    //
    // Get the estimated slopes, in order to calculte rise and run.
    //
    // ccLink j18

    var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    // var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPoint(srcNode);
    // var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPoint(dstNode);

    var rise = c1.y - c2.y;
    var run = c1.x - c2.x;

    var x1;
    var y1;

    var pt;

    // 
    // Vertical link.
    // Route from bottom of src node.
    // 
    if (run == 0) {

	if (debug) alert(' getSrcNodeLinkPosition src ' + srcID + ' dstID ' + dstID + ' vertical link ' + rise);

	// cclink
	// x1 = LytNodeUtil.getNodeAbsoluteCenterX(srcNode);
	x1 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, srcNode, dstNode);

	// cclink
	// y1 = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);
	y1 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, srcNode, dstNode);

	if (rise > 0) {
	    // cclinks
	    // y1 = LytNodeUtil.getNodeAbsoluteTopConnectY(srcNode);
	    y1 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, srcNode, dstNode);
	}

	pt = new DvtDiagramPoint(x1, y1);
	return pt;

    }

    //
    // Horizontal Link
    //
    else if (rise == 0) {

	if (debug) alert('horizontal link');

	// cclink
	// y1 = LytNodeUtil.getNodeAbsoluteConnectCenterY(srcNode);
	if (debug9) alert(' backofflink call yrel center '  + srcID + ' dstID ' + dstID + ' horizontal link ' + rise);
	// turned false
	y1 = LytNodeUtil.getNodeAbsoluteConnectCenterYRel(layoutContext, srcNode, dstNode);
	// x1 = LytNodeUtil.getOriginX(srcNode) + LytNodeUtil.getNodeRightConnectX(srcNode);

	// cclink
	// x1 = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
	x1 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, srcNode, dstNode);

	// alert(srcID + " getOiginX " + LytNodeUtil.getOriginX(srcNode) + " srcPoint.x " + srcPoint.x);

	// Back links connect to left side.
	if (run > 0) {
	    // x1 = LytNodeUtil.getOriginX(srcNode) + LytNodeUtil.getNodeLeftConnectX(srcNode);
	    x1 = LytNodeUtil.getNodeAbsoluteLeftConnectX(srcNode);
	}
    }
    else {

	switch(layoutFlow) {

	case LytLayout.FLOW_LEFT_RIGHT:

	    // if (debug) alert('FLOW_LEFT_RIGHT');

	    // cclin
	    // y1 = LytNodeUtil.getNodeAbsoluteConnectCenterY(srcNode);
	    y1 = LytNodeUtil.getNodeAbsoluteConnectCenterYRel(layoutContext, srcNode, dstNode);

	    //
	    // Link direction follows the flow direction.
	    // This is the common case.
	    // Condition: negative run.
	    //

	    // Run == 0, this is a vertical (or self) link.
	    //
	    // If the run is less than the width, than we treat this as a vertical link
	    // and draw from the node bottom or node top.
	    //
	    if (Math.abs(run) < r1.w) {

		x1 = c1.x;
		y1 = c1.y;

		if (rise > 0) {
		    // y1 = srcPoint.y;
		    y1 = LytNodeUtil.getOriginY(srcNode);
		} else {
		    // cclink
		    // y1 = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);
		    y1 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, srcNode, dstNode);
		}
	    }
	    else if (run < 0) {

		// cclink
		// x1 = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
		x1 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, srcNode, dstNode);
		if (debug) alert('LEFT_RIGHT ' + srcID + ' ' + dstID + ' connect right ' + rise + ' s ' + (rise/run));

		// We could be routing through a link label.
		if (rise < 0) {
		
		    var srcLabelRect = srcNode.getLabelBounds();

		    if (srcLabelRect) {

			if (debug) alert(' srcLabelRect.w ' + srcLabelRect.w + ' r1.w ' + r1.w);

			// 
			//  A link would intersect (left) if the slope < (nodeRect.h /2) / (srcLabelRect.w - r1.w)/2
			// 
			//               ----
			//              |    |.    
			//              |    |          .
			//  -------------------------------    .
			//  |                             |
			//  -------------------------------
			// 
			// if (r1.w < srcLabelRect.w) {
			// hack to get demo to look good.
			// problem - r1.w is reported very large!
			if (r1.w < srcLabelRect.w) {

			    var okSlope = r1.h / (srcLabelRect.w - r1.w);

			    if (debug) alert(' okSlope ' + okSlope + ' ' + s);

			    var s = rise/run;

			    if (s > okSlope) {
				x1 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, srcNode, dstNode);
				y1 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, srcNode, dstNode);
			    }

			}
		    }
		}

	    }
	    else if (run > 0) {

		if (debug) alert(srcID + ' ' + dstID + ' connect left ' + rise);

		// cclink
		// x1 = LytNodeUtil.getNodeAbsoluteLeftConnectX(srcNode);
		x1 = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, srcNode, dstNode);

		// We could be routing through a link label.
		if (rise < 0) {
		
		    var srcLabelRect = srcNode.getLabelBounds();

		    if (srcLabelRect) {

			// 
			//  A link would intersect (left) if the slope < (r1.h /2) / (srcLabelRect.w - r1.w)/2
			// 
			//               ----
			//             .|    |.    
			//      .       |    |          
			//. -------------------------------    
			//  |                             |
			//  -------------------------------
			// 
			if (r1.w < srcLabelRect.w) {

			    var okSlope = r1.h / (srcLabelRect.w - r1.w);

			    var s = rise/run;

			    if (s < okSlope) {
				x1 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, srcNode, dstNode);
				y1 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, srcNode, dstNode);
			    }

			}
		    }
		}

	    }
	    
	    break;

	case LytLayout.FLOW_TOP_DOWN:

	    // if (debug) alert('FLOW_TOP_DOWN');

	    // cclink
	    // x1 = LytNodeUtil.getNodeAbsoluteCenterX(srcNode);
	    x1 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, srcNode, dstNode);

	    // rise == 0, this is a horizontal (or self) link.
	    if (Math.abs(rise) < r1.h) {

		// if (debug) alert('horz');
		if (debug) alert('TOP_DOWN ' + srcID + ' ' + dstID + ' SPECIAL CONDITIONS ' + rise);

		x1 = c1.x;
		y1 = c1.y;

		if (run > 0) {
		    // cclink
		    // x1 = LytNodeUtil.getOriginX(srcNode);
		    x1 = LytNodeUtil.getOriginXRel(layoutContext, srcNode, dstNode);
		} else {
		    // cclink
		    // x1 = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
		    x1 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, srcNode, dstNode);
		}
		// x1 += 20;
	    }
	    else if (rise < 0) {

		if (debug) alert('TOP_DOWN ' + srcID + ' ' + dstID + ' rise < 0 ' + rise);
		// if (debug) alert('rise < 0');

		// cclink
		// y1 = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

		y1 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, srcNode, dstNode);
		
	    }
	    else if (rise > 0) {

		if (debug) alert('TOP_DOWN ' + srcID + ' ' + dstID + ' rise > 0 ' + rise);
		// if (debug) alert('rise > 0');

		// cclink
		// y1 = LytNodeUtil.getOriginY(srcNode);
		y1 = LytNodeUtil.getOriginYRel(layoutContext, srcNode, dstNode);

	    }

	    pt = new DvtDiagramPoint(x1, y1);
	    return pt;


	}
    }

    var pt = new DvtDiagramPoint(x1, y1);
    return pt;

}

//
// Gets an estimate of the destination node's link position.
//
LytLinkUtil.getDstNodeLinkPosition = function(layoutContext, layoutFlow, srcID, dstID) {

    var srcNode = layoutContext.getNodeById(srcID);
    if (!srcNode) return;

    var srcPoint = srcNode.getPosition();
    var r1 =srcNode.getBounds();

    // not needed until we do top-down flows.
    var dstNode = layoutContext.getNodeById(dstID);
    if (!dstNode) return;

    var dstPoint = dstNode.getPosition();
    var r2 =dstNode.getBounds();

    //
    // Get the estimated slopes, in order to calculte rise and run.
    //

    // cclink2

    // var c1 = getNodeCenter(layoutContext, srcID);
    // var c2 = getNodeCenter(layoutContext, dstID);

    var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    var rise = c1.y - c2.y;
    var run = c1.x - c2.x;

    var x2;
    var y2;

    // bottom for positive rises
    // if (rise > 0) y2 = dstPoint.y + r2.h;
    // right side for a backlink
    // if (run > 0) x2 = dstPoint.x + r2.w;

    //
    // Short circuit for vertical and horizontal links.
    //

    // 
    // Vertical link.
    // Route to top of dst node.
    // 
    if (run == 0) {

	// cclink
	// x2 = LytNodeUtil.getNodeAbsoluteCenterX(dstNode);
	// y2 = LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);
	x2 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, dstNode, srcNode);
	y2 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);

	if (rise > 0) {
	    // cclink
	    // y2 = LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);
	    y2 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);
	}
    }
    //
    // Horizontal Link
    //
    else if (rise == 0) {

	// cclink
	// y2 = LytNodeUtil.getNodeAbsoluteConnectCenterY(dstNode);
	// x2 = LytNodeUtil.getNodeAbsoluteLeftConnectX(dstNode);

	// debug9
	// alert("get Dst Node link pos rise == 0 " + srcID + ' ' + dstID);

	y2 = LytNodeUtil.getNodeAbsoluteConnectCenterYRel(layoutContext, dstNode, srcNode);
	x2 = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, dstNode, srcNode);

	// Back links connect to left side.
	if (run > 0) {
	    // cclink
	    // x2 = LytNodeUtil.getNodeAbsoluteRightConnectX(dstNode);
	    x2 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, dstNode, srcNode);
	}
    }
    else {

	switch(layoutFlow) {

	case LytLayout.FLOW_LEFT_RIGHT:

	    // alert("left right " + srcID + ' ' + dstID);

	    var offsetX = r2.w /_widthDenominator;
	    y2 = dstPoint.y + r2.h/2;

	    if (Math.abs(run) < r2.w) {

		x2 = c2.x;
		y2 = c2.y;
		
		if (rise > 0) {
		    // cclink
		    // y2 = LytNodeUtil.getNodeAbsoluteBottomConnectY(dstNode);
		    y2 = LytNodeUtil.getNodeAbsoluteBottomConnectYRel(layoutContext, dstNode, srcNode);
		} else {
		    // cclink
		    // y2 = LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);
		    y2 = LytNodeUtil.getNodeAbsoluteTopConnectYRel(layoutContext, dstNode, srcNode);
		}

	    }
	    else if (run < 0) {

		// cclink
		// x2 = LytNodeUtil.getNodeAbsoluteCenterX(dstNode);
		x2 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, dstNode, srcNode);

	    }
	    else if (run > 0) {
		// cclink
		// x2 = LytNodeUtil.getNodeAbsoluteCenterX(dstNode);
		x2 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, dstNode, srcNode);
	    }
	    // Run == 0, this is a vertical (or self) link.

	    break;

	case LytLayout.FLOW_TOP_DOWN:
	default:

	    // alert("top down " + srcID + ' ' + dstID);

	    var offsetY = r2.h /_heightDenominator;

	    // cclink
	    // x2 = LytNodeUtil.getNodeAbsoluteCenterX(dstNode);
	    x2 = LytNodeUtil.getNodeAbsoluteCenterXRel(layoutContext, dstNode, srcNode);

	    // rise == 0, this is a horizontal (or self) link.
	    if (Math.abs(rise) < r2.h) {

		x2 = c2.x;
		y2 = c2.y;
		
		if (run > 0) {
		    // cclink
		    // x2 = LytNodeUtil.getNodeAbsoluteConnectRightX(dstNode);
		    x2 = LytNodeUtil.getNodeAbsoluteRightConnectXRel(layoutContext, dstNode, srcNode);
		} else {
		    // cclink
		    // x2 = LytNodeUtil.getNodeAbsoluteConnectLeftX(dstNode);
		    x2 = LytNodeUtil.getNodeAbsoluteLeftConnectXRel(layoutContext, dstNode, srcNode);
		}
	    }  
	    else if (rise < 0) {
		// cclink
		// y2 = LytNodeUtil.getNodeAbsoluteConnectCenterY(dstNode);
		y2 = LytNodeUtil.getNodeAbsoluteConnectCenterYRel(layoutContext, dstNode, srcNode);
	    }
	    else if (rise > 0) {
		
		// cclink
		// y2 = LytNodeUtil.getNodeAbsoluteConnectCenterY(dstNode);
		y2 = LytNodeUtil.getNodeAbsoluteConnectCenterYRel(layoutContext, dstNode, srcNode);

	    }

	    break;

	}
    }

    var pt = new DvtDiagramPoint(x2, y2);
    return pt;

}


//
// Gets an estimate of the destination node's link position (for FLOW layout)
// This version of getDstNodeLinkPosition() returns the same coord regardless of flow.
//
LytLinkUtil.getDstNodeLinkPositionFlow = function(layoutContext, layoutFlow, srcID, dstID) {

    var srcNode = layoutContext.getNodeById(srcID);
    if (!srcNode) return;

    var srcPoint = srcNode.getPosition();
    var r1 =srcNode.getBounds();

    // not needed until we do top-down flows.
    var dstNode = layoutContext.getNodeById(dstID);
    if (!dstNode) return;

    var dstPoint = dstNode.getPosition();
    var r2 =dstNode.getBounds();

    //
    // Get the estimated slopes, in order to calculte rise and run.
    //

    // cclink
    // var c1 = getNodeCenter(layoutContext, srcID);
    // var c2 = getNodeCenter(layoutContext, dstID);

    var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    var rise = c1.y - c2.y;
    var run = c1.x - c2.x;

    var x2;
    var y2;

    var offsetY = r2.h /_heightDenominator;
    x2 = dstPoint.x + r2.w/2;

    if (rise < 0) {

	y2 = dstPoint.y + offsetY;

    }
    else if (rise > 0) {

	y2 = dstPoint.y + r2.h - offsetY;

    }
    // rise == 0, this is a horizontal (or self) link.
    else {

	x2 = c2.x;
	y2 = c2.y;
	
	if (run > 0) {
	    x2 = dstPoint.x + r2.w;
	} else {
	    x2 = dstPoint.x;
	}
    }

    var pt = new DvtDiagramPoint(x2, y2);
    return pt;

}



/*
//
// Return the slope, center to center, of two nodes.
//
LytLinkUtil.prototype.getSlopeFromCenter = function(layoutContext, srcID, dstID) {

    // alert(' gs ' + srcID + ' ' + dstID);

    // var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    // var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    var c1 = getNodeCenter(layoutContext, srcID);
    var c2 = getNodeCenter(layoutContext, dstID);

    var rise = c1.y - c2.y;
    var run = c1.x - c2.x;

    return (rise/run);

}
*/



function getSlope(layoutContext, layoutFlow, srcID, dstID) {

    // alert(' gs ' + srcID + ' ' + dstID);

    // var c1 = getNodeCenter(layoutContext, srcID);
    if (!srcID) return;
    if (!dstID) return;

    var c1 = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);
    var c2 = LytLinkUtil.getDstNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);

    var rise = c1.y - c2.y;
    var run = c1.x - c2.x;

    return (rise/run);

}

function getRise(layoutContext, layoutFlow, srcID, dstID) {

    if (!srcID) return;
    if (!dstID) return;
    
    dstNode = layoutContext.getNodeById(dstID);
    srcNode = layoutContext.getNodeById(srcID);

    var c1 = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);
    var c2 = LytLinkUtil.getDstNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);

    var rise = c1.y - c2.y;

    // alert(' getrise ' + srcID + ' ' + dstID + ' rise ' + rise);

    return (rise);

}

function getRun(layoutContext, layoutFlow, srcID, dstID) {

    if (!srcID) return;
    if (!dstID) return;

    var c1 = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);
    var c2 = LytLinkUtil.getDstNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);

    var run = c1.x - c2.x;

    return (run);

}

//
// Filter "nearly vertical" or "nearly horizontal" slopes.
//
// (These "invalid" slopes could be caused by "sloppy side links"
// or "sloppy same column links").  If the centers were not exactly aligned,
// then a test for != 0 would succeed, and we would end up moving a 
// link control point all the way to the edge.
//
var steepLimit = 10;
function isValidSlope(rise, run) {

    if (Math.abs(rise) > steepLimit && Math.abs(run) > steepLimit) return true;

}

LytLinkUtil.ORIENTATION_HORIZONTAL = "HORIZONTAL";
LytLinkUtil.ORIENTATION_VERTICAL = "VERTICAL";

LytLinkUtil._LEFT = 0;
LytLinkUtil._RIGHT = 1;
LytLinkUtil._TOP = 2;
LytLinkUtil._BOTTOM = 3;
