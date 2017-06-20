/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION

    Utilities for link labels.
    Handles link label rotation and placement.
    Supported for trees and grids.
    Handles smart padding, where the length of link labels can increase grid column or row padding
     
    MODIFIED    (MM/DD/YY)
    lmolesky	05/02/12 - Code Refactor
    lmolesky	02/21/12 - Eliminite extra padding for special case diagonal routes (adjacent columns).
    lmolesky	01/10/12 - Add support for variable column/row padding.
    lmolesky	12/09/11 - Created

*/


//
// 
//

var LytLabelUtil = function()
{
    this.Init();

};

LytObj.createSubclass(LytLabelUtil, LytObj, "LytLabelUtil");

LytLabelUtil.prototype.Init = function()
{

};

//
// Set the position of the link label
// (for export to the renderer)
//
LytLabelUtil.setLinkLabelPosition = function(linkContext, linkLabelRect, x, y) {

    // linkLabelRect.x = x;
    // linkLabelRect.y = y;

    linkContext.setLabelPosition(new DvtDiagramPoint(x,y));
}

//
//
//
LytLabelUtil.setLinkLabelRadians = function(linkLabelRect, radians) {

    
    linkLabelRect._radians =  radians;
}

//
// Position the link labels about the midpoint of the link.
// Also set rotation angle.
//
// Render will use:
//   - bounding box
//   - rotation angle
// to correctly position a link label.
//
LytLabelUtil.centerLinkLabel = function(linkContext, srcX, srcY, dstX, dstY) {

    var debug = false;

    if (isNaN(srcX)) return;
    if (isNaN(srcY)) return;

    if (isNaN(dstX)) return;
    if (isNaN(dstY)) return;

    if (debug) alert(' center link label ' + srcX + ' ' + srcY + ' ' + dstX + ' ' + dstY);

    // 
    // Apply adjustments if we have a link label.
    // 
    var linkLabelRect = linkContext.getLabelBounds();
    
    if (linkLabelRect) {

	var coords = linkContext.getPoints();

	var rise = dstY - srcY;
	var run =  dstX - srcX;

	// 
	// (1) Center label about link midpoint.
	// 
	var midpointX = (srcX + dstX) / 2;
	var midpointY = (srcY + dstY) / 2;

	// 
	// (2) Calculate and set link label rotation radians
	// 

	if (run == 0)  {
	    // LytLabelUtil.setLinkLabelPosition(linkContext, linkLabelRect, midpointX - (linkLabelRect.w / 2) - linkLabelRect.h/2, midpointY - (linkLabelRect.h/2));
	    LytLabelUtil.setLinkLabelPosition(linkContext, linkLabelRect, midpointX - (linkLabelRect.w / 2) - linkLabelRect.h/2, midpointY - (linkLabelRect.h));
	}
	if (rise == 0)  {
	    // For horizontal links.
	    LytLabelUtil.setLinkLabelPosition(linkContext, linkLabelRect, midpointX - (linkLabelRect.w / 2), midpointY - (linkLabelRect.h));
	} 

	var radians = Math.atan2(rise, run);

	// 
	// adjust rotation for right to left links - better readability (avoid upside down links)
	// 
	if (run < 0) radians += Math.PI;

	if (run != 0 && rise != 0) {

	    // offsets to center label.
            var xOffset = - linkLabelRect.w/2;
            var yOffset = - linkLabelRect.h/2;
	    
	    var baselineOffsetX = Math.abs(Math.cos(radians - Math.PI/2) * linkLabelRect.h/2);
	    var baselineOffsetY = - Math.abs(Math.sin(radians - Math.PI/2) * linkLabelRect.h/2);

	    //
	    // Make the appropriate baseline adjustments
	    //
	    if (run < 0) {
   		baselineOffsetX = -baselineOffsetX;
            }

	    if (rise < 0) {
   		baselineOffsetX = -baselineOffsetX;
 	    }

	    LytLabelUtil.setLinkLabelPosition(linkContext, linkLabelRect, midpointX + xOffset + baselineOffsetX, midpointY + yOffset + baselineOffsetY);

	}


	if (debug) alert(' rise ' + rise + ' run ' + run + ' radians ' + radians);

	LytLabelUtil.setLinkLabelRadians(linkLabelRect, radians);

	var setRA = true;

	if (setRA) linkContext.setLabelRotationAngle(radians);
	else linkContext.setLabelRotationAngle(0);

	// 
	// Set the rotation point (relative to the link position)
	// 
        
	var rotationPoint = new DvtDiagramPoint(linkLabelRect.w/2, linkLabelRect.h/2);
	// 	var rotationPoint = new DvtDiagramPoint((linkLabelRect.w / 2) + linkLabelRect.h/2, linkLabelRect.h/2);

	var setRP = true;
	if (setRP)
	    linkContext.setLabelRotationPoint(rotationPoint);

	if (run == 0)  {

	    var rotationPoint = new DvtDiagramPoint(linkLabelRect.w/2, linkLabelRect.h/2);
	    linkContext.setLabelRotationPoint(rotationPoint);

	}
	if (rise == 0)  {

	    var rotationPoint = new DvtDiagramPoint(linkLabelRect.w/2, linkLabelRect.h/2);
	    linkContext.setLabelRotationPoint(rotationPoint);

	}

    }
}

//
// Static function.
//
//
// Increase the padding for tree-based layouts based on the link label length.
// (Labels are assumed to be rotated)
//
// Return a betweenLevelSpace[] array.
// e.g., betweenLevelSpace[0] is the spacing between the root and next level.
//
//
LytLabelUtil.smartPadTree = function(layoutContext, containerDesc, levelU, linkDS) {

    var labelPadFactor = 1.1;

    var layoutFlow = containerDesc.getLayoutFlow();

    var levelArray = levelU.getLevelArray();
    var levelMap = levelU.getLevelMap();

    var betweenLevelSpace = new Array();

    // var linksIn = linkDS.getLinksInContainer(cid);
    // var linksOut = linkDS.getLinksOutContainer(cid);

    var linksIn = linkDS.getLinksIn();
    var linksOut = linkDS.getLinksOut();

    for (i=1; i<levelArray.length; i++) {

	betweenLevelSpace[i-1] = 0;
	rowPos = 0;

	oneLevel = levelArray[i];

	for (j=0; j<oneLevel.length; j++) {

	    var nodeID = oneLevel[j];

	    if (!linksIn[nodeID]) continue;

	    for (k=0; k<linksIn[nodeID].length; k++) {

		parentID = linksIn[nodeID][k];
		
		parentLevel = levelMap[parentID];

		var linkContext = linkDS.getLinkContext(parentID, nodeID);

		// alert(' check linkContext ' + parentID + ' ' + nodeID);

		// var srcID = linkContext.getStartId();
		// var dstID = linkContext.getEndId();

		// 
		// Apply adjustments if we have a link label.
		// 
		var linkLabelRect = linkContext.getLabelBounds();

		if (linkLabelRect) {

		    var nodeLevel = levelU.getNodeLevel(nodeID);
		    var parentLevel = levelU.getNodeLevel(parentID);

		    var nodeContext = layoutContext.getNodeById(nodeID);
		    var nodeContextParent = layoutContext.getNodeById(parentID);

		    var rise = LytNodeUtil.getOriginY(nodeContextParent) - LytNodeUtil.getOriginY(nodeContext);
		    var run = LytNodeUtil.getOriginX(nodeContextParent) - LytNodeUtil.getOriginX(nodeContext);

		    // alert(nodeID + ' ' + nodeLevel + ' ' + parentLevel + ' rise ' + rise + ' run ' + run);

		    // figure out rise and run from node positions

		    var labelLengths = LytLabelUtil.calculateRotatedLabelLengths(rise, run, linkLabelRect);

		    var linkLabelXLength = labelLengths.getAttr1();
		    var linkLabelYLength = labelLengths.getAttr2();

		    // set between level space return values.

		    var space = 0;

		    switch (layoutFlow) {

		    case LytLayout.FLOW_TOP_DOWN:

			space = linkLabelYLength * labelPadFactor;
			break;


		    case LytLayout.FLOW_LEFT_RIGHT:

			space = linkLabelXLength * labelPadFactor;
			break;

		    }

		    betweenLevelSpace[i-1] = Math.max(betweenLevelSpace[i-1], space);

		}
	    }
	}
    }

    return betweenLevelSpace;

}

//
// return the length of a rotated link label.
//
LytLabelUtil.calculateRotatedLabelLengths = function(rise, run, linkLabelRect) {

    if (rise == 0) {

	linkLabelXLength = linkLabelRect.w;
	linkLabelYLength = linkLabelRect.h;

    } else if (run == 0) {

	linkLabelXLength = linkLabelRect.h;
	linkLabelYLength = linkLabelRect.w;

    } else 
    {
	var radians = Math.atan2(rise, run);

	linkLabelXLength = Math.abs(Math.cos(radians) * linkLabelRect.w);
	linkLabelXLength = Math.max(linkLabelXLength, Math.abs(Math.sin(radians) * linkLabelRect.h));

	linkLabelYLength = Math.abs(Math.sin(radians) * linkLabelRect.h);
	linkLabelYLength = Math.max(linkLabelYLength, Math.abs(Math.sin(radians) * linkLabelRect.w));

	// alert(" radians " + radians + ' xl ' +  linkLabelXLength + ' yl ' +  linkLabelYLength);

    }

    var values = new LytAttributes2(linkLabelXLength, linkLabelYLength);

    return values;

}

//
// White space between channels.
// We may wan to expose this constant.
//
var channelWhiteSpace = 3;

//
// Increase the grid padding based on the length of labels.
// (Labels are assumed to be rotated)
//
// smartPadGrid also handles grid padding for parallel channels, where each link in 
// the channel may or may not have text.
//
// @param layoutDesc - passed to isLongVerticalRoute()
// @param layoutFlow - passed to isLongVerticalRoute()
// @param channelPadU - populated in this function, passed back to LytLayout for read access in LytLinkUtil.LayoutLinksGrid()
//
LytLabelUtil.smartPadGrid = function(layoutContext, containerDesc, gridUtil, defaultPad, layoutDesc, layoutFlow, linkDS, channelPadU) {

    var numRows = gridUtil.getNumRows();
    var numCols = gridUtil.getNumCols();

    var debug = false;

    //
    // Get link index (for calculating parallel channel spacing)
    //
    var horzLinksOut = new Array();
    var vertLinksOut = new Array();

    var linkHorzChannel = new Array();
    var linkHorzChannelBack = new Array();
    var linkHorzChannelMiddle = new Array();

    var linkVertChannel = new Array();
    var linkVertChannelBack = new Array();
    var linkVertChannelMiddle = new Array();

    // 
    // Logic for creating sorted channels is in LytLinkUtil, and used during link routing.
    // However, link routing is done AFTER the grid padding is set.
    // So we call calculateLongLinksOutSimple() in order to retrieve sorted channels
    // (linkHorzChannel, LinkHorzChannelBack, etc.).
    // 
    // Subsequently, we use the sorted channels to determine how much padding to allocate for 
    // the channels.  Note the that the channels could have text strings.
    // 
    LytChannelRouteUtil.calculateLongLinksOutSimple(layoutContext, layoutDesc, containerDesc, gridUtil, linkDS,
					    horzLinksOut, vertLinksOut,
					    linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
					    linkVertChannel, linkVertChannelBack, linkVertChannelMiddle);

    //
    // For adjacent links, right column would be a forward link 
    //
    
    var route = containerDesc.getRoute();

    var linkCount = layoutContext.getLinkCount();

    if (debug) alert(' linkcount ' + linkCount);

    //
    // Arrays to store maximum link length per row and column
    //
    var linkLengthCols = new Array();
    var linkLengthColsPre = new Array();
    var linkLengthColsPost = new Array();

    var linkLengthRows = new Array();
    var linkLengthRowsPre = new Array();
    var linkLengthRowsPost = new Array();

    for (var i=0; i<numCols+1; i++) {

	linkLengthCols[i] = 0;
	linkLengthColsPre[i] = 0;
	linkLengthColsPost[i] = 0;
    }

    for (var i=0; i<numRows+1; i++) {

	linkLengthRows[i] = 0;
	linkLengthRowsPre[i] = 0;
	linkLengthRowsPost[i] = 0;
    }

    for (var i=0; i<linkCount; i++) {

	var linkContext = layoutContext.getLinkByIndex(i);

	// 
	// Apply adjustments if we have a link label.
	// 
	var linkLabelRect = linkContext.getLabelBounds();
	
	//
	// For parallel channels without labels, reserve a small (minimum) amount of space for each link.
	//
	var textHeight = channelWhiteSpace;

	if (linkLabelRect) textHeight = linkLabelRect.h + channelWhiteSpace;
	// linkContext._channelRoute = false;
	{
	    var srcID = linkContext.getStartId();
	    var dstID = linkContext.getEndId();

	    // if (debug) alert('text rect on ' + srcID + ' ' + dstID);

	    var srcIndex = gridUtil.getGridIndex(srcID);
	    var dstIndex = gridUtil.getGridIndex(dstID);

	    // get the column 
	    var srcRow = gridUtil.getRow(srcIndex);
	    var dstRow = gridUtil.getRow(dstIndex);

	    var srcCol = gridUtil.getCol(srcIndex);
	    var dstCol = gridUtil.getCol(dstIndex);

	    if (debug) alert(' text rect on srcID  ' + srcID + ' ' + dstID + ' srcIndex ' + srcIndex + ' ' + dstIndex);
	    // if (debug) alert(' text rect on srcID ' + srcID + ' ' + dstID + ' ' + srcCol + ' ' + dstCol);

	    // 
	    // Calculate the rotated link height/width
	    // Approach - use the row/column indexes to calculate the rise and run
	    // (Note that this is not entirely accurate - it is only accurate if the grid spacing in x and y has an aspect ratio of 1)
	    // 

	    rise = srcRow - dstRow;
	    run = srcCol - dstCol;

	    var useRow = srcRow;

	    if (linkLabelRect)
		linkLabelRect._channelRoute = false;
	    // linkContext._channelRoute = false;
	    // 
	    // Only smartpad for nodes that are adjacent in the grid
	    // 
	    if (Math.abs(rise) > 1 || Math.abs(run) > 1) {

		//
		// Handle channel routes
		//

		var horz = true;
		var chIndex;

		if (LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, gridUtil)) {

		    horz = false;
		    // var kindex = LytLinkUtil.getKIndex(horz, srcRow, dstRow, srcCol, dstCol, horzLinksOut, vertLinksOut);

		    if (linkLabelRect)
			linkLabelRect._channelRoute = true;
		    // linkContext._channelRoute = false;
		    // 
		    // Text is written vertically, so pad columns with the text height.
		    // 
		    // linkLengthCols[srcCol] = Math.max(linkLengthCols[srcCol], linkLabelRect.h);

		    if (LytChannelRouteUtil.isForwardLink(srcRow, dstRow)) {

			// forward links are rendered below the node, so allocate POST padding.
			linkLengthColsPost[srcCol] = Math.max(linkLengthColsPost[srcCol], textHeight);

			chIndex = linkVertChannel[srcCol][linkContext.getId()];
			LytChannelPadUtil.assignMaxVal(srcCol, chIndex, channelPadU.textHeightColsPost, textHeight);

		    } else {

			// kkk

			// back links are rendered to the left of the node, so allocate PRE padding.
			linkLengthColsPre[srcCol] = Math.max(linkLengthColsPre[srcCol], textHeight);

			chIndex = linkVertChannelBack[srcCol][linkContext.getId()];
			// alert(' preassign [' + srcCol + '] [' + chIndex + '] =' + textHeight);

			// 
			// Note that we sometimes miss preassignments - the short segments have not been coded 
			// (just the long segments).
			// assignMaxVal() attempts to fix this.
			// 


			// alert(' preassign ' + chIndex + ' ' + linkContext.getId());
			// alert(' channelPadU.textHeightColsPre[srcCol][0] ' + channelPadU.textHeightColsPre[srcCol][0]);

			LytChannelPadUtil.assignMaxVal(srcCol, chIndex, channelPadU.textHeightColsPre, textHeight);
			// channelPadU.textHeightColsPre[srcCol][chIndex] = textHeight;
			

		    }

		} else if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, gridUtil)) {

		    // don't need kindex.
		    // var kindex = LytLinkUtil.getKIndex(horz, srcRow, dstRow, srcCol, dstCol, horzLinksOut, vertLinksOut);

		    if (linkLabelRect)
			linkLabelRect._channelRoute = true;
		    // linkContext._channelRoute = false;
		    // 
		    // Text is written horizontally, so pad rows with the text height.
		    // 
		    // linkLengthRows[srcRow] = Math.max(linkLengthRows[srcRow], textHeight);

		    if (LytChannelRouteUtil.isForwardLink(srcCol, dstCol)) {
			linkLengthRowsPost[srcRow] = Math.max(linkLengthRowsPost[srcRow], textHeight);

			chIndex = linkHorzChannel[srcRow][linkContext.getId()];
			LytChannelPadUtil.assignMaxVal(srcRow, chIndex, channelPadU.textHeightRowsPost, textHeight);
			// alert(' chindex ' + chIndex);

		    } else {

			linkLengthRowsPre[srcRow] = Math.max(linkLengthRowsPre[srcRow], textHeight);

			chIndex = linkHorzChannelBack[srcRow][linkContext.getId()];
			LytChannelPadUtil.assignMaxVal(srcRow, chIndex, channelPadU.textHeightRowsPre, textHeight);

			// alert(' srcRow ' + srcRow + ' chindex ' + chIndex);
		    }
		} 
		else if (LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, gridUtil)) {

		    // 
		    // No extra padding for special case diagonal routes (those that have adjacent columns)
		    // 
		    if (Math.abs(srcCol - dstCol) <= 1) continue;

		    // note - isLongDiagonalRoute has slightly different function signature

		    // var kindex = LytLinkUtil.getKIndex(horz, srcRow, dstRow, srcCol, dstCol, horzLinksOut, vertLinksOut);

		    //
		    // Allocate text space for diagonal routes.
		    //

		    if (linkLabelRect)
			linkLabelRect._channelRoute = true;
		    // linkContext._channelRoute = false;

		    if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
			useRow = srcRow;
		    }
		    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
			useRow = srcRow + 1;
		    }
		    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
			useRow = dstRow;
		    }
		    if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
			useRow = srcRow + 1;
		    }

		    if (LytChannelRouteUtil.isSpecialDiagHorz(srcRow, dstRow, srcCol, dstCol)) {
			useRow = srcRow;
		    }
			
		    // 
		    // Text is written horizontally, so pad rows with the text height.
		    // 
		    // linkLengthRows[useRow] = Math.max(linkLengthRows[useRow], textHeight);
		    // Text is above link, ...
		    // 
		    linkLengthRowsPre[useRow] = Math.max(linkLengthRowsPre[useRow], textHeight);

		    // alert(' diag ' + useRow + ' ' + linkContext.getId());
		    // alert(' ml ' + linkHorzChannelMiddle.length);

		    // middle indexs have one less, so we subtract 1
		    if (useRow > 0)
			chIndex = linkHorzChannelMiddle[useRow-1][linkContext.getId()];
		    else 
			chIndex = linkHorzChannelMiddle[useRow][linkContext.getId()];

		    LytChannelPadUtil.assignMaxVal(useRow, chIndex, channelPadU.textHeightRowsPre, textHeight);

		    if (debug) alert(' useRow ' + useRow + ' text height ' + linkLengthRowsPre[useRow]);
		}

		if (!linkLabelRect) continue;
		if (!linkLabelRect._channelRoute) continue;

		// else continue;

	    }

	    if (linkLabelRect && !linkLabelRect._channelRoute) {

		// 
		// smartpad for point-to-point links in a grid.
		// 

		var isHorizontalText = true;
		if (rise != 0) isHorizontalText = false;
		
		if (debug) alert('!channelRoute:  rise ' + rise + ' run ' + run);

		var labelLengths = LytLabelUtil.calculateRotatedLabelLengths(rise, run, linkLabelRect);

		var linkLabelXLength = labelLengths.getAttr1();
		var linkLabelYLength = labelLengths.getAttr2();

		if (debug) alert('LytLabelUtil: xlen ' + linkLabelXLength + ' ylen ' + linkLabelYLength);

		// 
		// store largest length in column/row
		// Note that we only consider adjacent nodes in the grid.
		// Following logic finds the smallest of the two adjacent column/row ids in order to compute the index.
		// 

		var minCol = srcCol;
		if (dstCol < srcCol) minCol = dstCol;

		// alert(' cols ' + minCol + ' ' + srcCol + ' ' + dstCol);

		if (isHorizontalText) {
		    linkLengthCols[minCol] = Math.max(linkLengthCols[minCol], linkLabelXLength);
		} else {
		    // 
		    // increase the X padding only if the width of the label 
		    // is larger than than half the column width.
		    //
		    //  ---   ---
		    // |   | |   |
		    //  ---   ---
		    //   |
		    //   | L
		    //   | A
		    //   | B
		    //   | E 
		    //   | L
		    //   |
		    //  ---   ---
		    // |   | |   |
		    //  ---   ---
		    // 

		    if (gridUtil.getColWidthNoPad(srcIndex)/2 < linkLabelXLength) {

			var additionalSpaceNeeded = linkLabelXLength - gridUtil.getColWidthNoPad(srcIndex)/2;

			linkLengthCols[minCol] = Math.max(linkLengthCols[minCol], additionalSpaceNeeded);

			// alert(' srcIndex ' + srcIndex + ' colWidth ' + gridUtil.getColWidthNoPad(srcIndex) + ' ' + linkLabelXLength);
		    }
		}

		var minRow = srcRow;
		if (dstRow < srcRow) minRow = dstRow;

		if (!isHorizontalText) {
		    linkLengthRows[minRow] = Math.max(linkLengthRows[minRow], linkLabelYLength);
		} else {

		    // increase the Y padding only if the height of the label 
		    // is larger than than half the row height.

		    //  ---            ---
		    // |   |----------|   |
		    //  ---            ---
		    //  ---   LABEL    ---
		    // |   |----------|   |
		    //  ---            ---

		    if (gridUtil.getRowHeightNoPad(srcIndex)/2 < linkLabelYLength) {

			var additionalSpaceNeeded = linkLabelYLength - gridUtil.getRowHeightNoPad(srcIndex)/2;

			linkLengthRows[minRow] = Math.max(linkLengthRows[minRow], additionalSpaceNeeded);

		    }
		}
	    }
	}
    }

    var maxColPad = 0;
    var maxRowPad = 0;

    var whiteSpace = 16;
    whiteSpace = 0;

    var total = 0;

    //
    // Find the maximum col pad.
    //
    for (var i in linkLengthCols) {

	//
	// put it all on post (point-to-point ...)
	// could have a better strategy here.
	//
	if (linkLengthCols[i] > 0) {
	    var max = Math.max(linkLengthCols[i] + whiteSpace, linkLengthColsPost[i]);
	    gridUtil.setPadWidthArrayPostCol(i, max);
	}
    }

    for (var i in channelPadU.textHeightColsPre) {

	if (channelPadU.textHeightColsPre[i].length >= 1) {
	    
	    total = 0;

	    for (var k=0; k<channelPadU.textHeightColsPre[i].length; k++) {
		
		total += channelPadU.textHeightColsPre[i][k];
		// alert(' add ' + linkLengthColsPre[i][k]);
	    }

	    // alert(' pre total col ' + total);
	    gridUtil.setPadWidthArrayPreCol(i, total);
	}
    }

    for (var i in channelPadU.textHeightColsPost) {

	if (channelPadU.textHeightColsPost[i].length >= 1) {
	    
	    total = 0;

	    for (var k=0; k<channelPadU.textHeightColsPost[i].length; k++) {
		total += channelPadU.textHeightColsPost[i][k];
	    }

	    // alert(' post total col ' + total);
	    gridUtil.setPadWidthArrayPostCol(i, total);
	}

	//
	// put it all on post (point-to-point ...)
	// could have a better strategy here.
	//
	if (linkLengthCols[i] > 0) {
	    var max = Math.max(linkLengthCols[i] + whiteSpace, linkLengthColsPost[i]);
	    gridUtil.setPadWidthArrayPostCol(i, max);
	}
    }

    // 
    // Find the maximum row pad.
    // 
    for (var i in linkLengthRows) {

	if (linkLengthRows[i] > 0) {
	    var max = Math.max(linkLengthRows[i] + whiteSpace, linkLengthRowsPost[i]);
	    gridUtil.setPadHeightArrayPostRow(i, max);
	}
    }

    for (var i in channelPadU.textHeightRowsPre) {

	if (channelPadU.textHeightRowsPre[i].length >= 1) {
	    
	    total = 0;

	    for (var k=0; k<channelPadU.textHeightRowsPre[i].length; k++) {
		
		total += channelPadU.textHeightRowsPre[i][k];
		// alert(' add ' + linkLengthRowsPre[i][k]);
	    }

	    // alert(' pre total ' + total);

	    gridUtil.setPadHeightArrayPreRow(i, total);
	}
    }

    for (var i in channelPadU.textHeightRowsPost) {

	if (channelPadU.textHeightRowsPost[i].length >= 1) {
	    
	    total = 0;

	    for (var k=0; k<channelPadU.textHeightRowsPost[i].length; k++) {
		total += channelPadU.textHeightRowsPost[i][k];
	    }

	    // alert(' rows post total ' + total);

	    gridUtil.setPadHeightArrayPostRow(i, total);
	}
    }
}
