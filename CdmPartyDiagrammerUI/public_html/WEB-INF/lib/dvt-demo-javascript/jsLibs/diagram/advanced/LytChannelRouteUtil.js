/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytChannelRouteUtil.js

    Description:
    
    Implementation of channel routing.
    Channel routing uses orthogonal links and attempts to minimize link overlap and link crossings
    via managed channels.
   
    Notes: 

    Logic for handling start connectors offsets needs to be added.

    MODIFIED    (MM/DD/YY)
    lmolesky	04/10/12 - add callCenterLinkLabel()
    lmolesky	04/09/12 - Removed arrow backoff from this layout code (arrow backoff implemented in render)
    lmolesky	03/14/12 - Created


*/

//
//
//
//


var LytChannelRouteUtil = function()
{
    this.Init();
};

LytObj.createSubclass(LytChannelRouteUtil, LytObj, "LytChannelRouteUtil");

LytChannelRouteUtil.prototype.Init = function()
{
};


//
// Set the drawing context (for test rendering).
//
var ctx;

LytChannelRouteUtil.prototype.setDrawingContext = function(drawingContext)
{
    ctx = drawingContext;
};


LytChannelRouteUtil.isDownRun = function(srcRow, dstRow) {

    if (srcRow < dstRow) return true;
    return false;
}

LytChannelRouteUtil.isRightRun = function(srcCol, dstCol) {

    // alert('isrr ' + srcCol + ' ' + dstCol);
    if (srcCol < dstCol) return true;
    return false;
}

var srcConnectSingle = false;


//
// Simple version, called by LytLabelUtil.js
// Called to retrieve sorted channels (linkHorzChannel, LinkHorzChannelBack, etc.).
//
LytChannelRouteUtil.calculateLongLinksOutSimple = function(layoutContext, layoutDesc, containerDesc, grid, linkDS,
						   horzLinksOut, vertLinksOut,
						   linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
						   linkVertChannel, linkVertChannelBack, linkVertChannelMiddle)
{

    var horzLinksOutBack = new Array();
    var vertLinksOutBack = new Array();

    var horzLinksOutMiddle = new Array();
    var vertLinksOutMiddle = new Array();

    var rowLinksOut = new Array();
    var rowLinksOutBack = new Array();

    var colLinksOut = new Array();
    var colLinksOutBack = new Array();

    var rowLinksOutMiddle = new Array();
    var colLinksOutMiddle = new Array();

    var colLinksOutMirror = new Array();
    var rowLinksOutMirror = new Array();
    var rowLinksOutBackMirror = new Array();
    var colLinksOutBackMirror = new Array();

    var horzChannelLineCount = new Array();
    var horzChannelLineCountBack = new Array();
    var horzChannelLineCountMiddle = new Array();

    var vertChannelLineCount = new Array();
    var vertChannelLineCountBack = new Array();
    var vertChannelLineCountMiddle = new Array();

    LytChannelRouteUtil.calculateLongLinksOut(layoutContext, layoutDesc, containerDesc, grid, linkDS,
				      horzLinksOut, vertLinksOut,
				      horzLinksOutBack, vertLinksOutBack,
				      horzLinksOutMiddle, vertLinksOutMiddle,
				      rowLinksOut, rowLinksOutBack,
				      colLinksOut, colLinksOutBack,
				      rowLinksOutMiddle, colLinksOutMiddle,
				      colLinksOutMirror, rowLinksOutMirror,    
				      rowLinksOutBackMirror, colLinksOutBackMirror,
				      horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
				      vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
				      linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
				      linkVertChannel, linkVertChannelBack, linkVertChannelMiddle);
}

LytChannelRouteUtil.calculateLongLinksOut = function(layoutContext, layoutDesc, containerDesc, grid, linkDS,
					     horzLinksOut, vertLinksOut,
					     horzLinksOutBack, vertLinksOutBack,
					     horzLinksOutMiddle, vertLinksOutMiddle,
					     rowLinksOut, rowLinksOutBack,
					     colLinksOut, colLinksOutBack,
					     rowLinksOutMiddle, colLinksOutMiddle,
					     colLinksOutMirror, rowLinksOutMirror,    
					     rowLinksOutBackMirror, colLinksOutBackMirror,
					     horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
					     vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
					     linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
					     linkVertChannel, linkVertChannelBack, linkVertChannelMiddle)

{

    var debug = false;

    var layoutFlow = containerDesc.getLayoutFlow();
    // var arrowLength = containerDesc.getArrowLength();
    var route = containerDesc.getRoute();
    // alert(route + ' route');


    util.calcCtlPtOffsets(layoutContext, linkDS, layoutFlow);

    var linkContext;

    var linkCount = layoutContext.getLinkCount();
    var nodeCount = layoutContext.getNodeCount();

    // var srcNode;
    // var dstNode;

    var srcID;
    var dstID;

    var i;

    // var rise;
    // var run;

    // 
    // Setup counts.
    //
    // Calculate
    // 
    //    - long horizontal links out.
    //    - long vertical links out.
    // 
    // For merged link up-segments, we really don't need horzLinksOut[].
    // So this block of code is currently unnecessary, (excepte we are checking !horzLinksOut in an if)
    //
    //
    for (var i=0; i<linkCount; i++) {

	linkContext = layoutContext.getLinkByIndex(i);

	srcID = linkContext.getStartId();
	dstID = linkContext.getEndId();

	//
	// Test src and dst nodes cids to make sure that at least one 
	// is in the container that we are currently laying out.
	//
	// So skip nodes where neither have the cid of the container that we are laying out.
	//
	// if (!LytLinkUtil.srcNodeMatchesContainerID(layoutContext, cid, srcID, dstID)) continue;

	if (debug) alert(' links ' + srcID + ' ^srcID ' + dstID + ' dstID  layoutFlow ' + layoutFlow);
	
	if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid) ||
	    LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid) ||
	    LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {

	    srcID = linkContext.getStartId();
	    dstID = linkContext.getEndId();

	    // if (debug) alert(' isLongH or isLongV or isLongD srcID ' + srcID + ' dstID ' + dstID);
	    // if (debug && LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid)) alert(' islongH');

	    if (!dstID) continue;
	    if (!srcID) continue;

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcCol = grid.getCol(srcIndex);
	    var srcRow = grid.getRow(srcIndex);

	    var dstCol = grid.getCol(dstIndex);
	    var dstRow = grid.getRow(dstIndex);

	    var obj = new nodeIndex(dstID, dstCol);

	    if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid)) {

		if (debug) alert(' long Horizontal ' + srcID + ' ' + dstID);

		if (!horzLinksOut[srcID]) horzLinksOut[srcID] = new Array();
		if (!horzLinksOutBack[srcID]) horzLinksOutBack[srcID] = new Array();
		// horzLinksOut[srcID].push(obj);
	    } 
	    else if (LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid)) {

		// alert(' long v ');

		 var obj = new nodeIndex(dstID, dstRow);
		if (debug) alert(' longvert ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol);
		
		if (!vertLinksOut[srcID]) vertLinksOut[srcID] = new Array();
		if (!vertLinksOutBack[srcID]) vertLinksOutBack[srcID] = new Array();
		// vertLinksOut[srcID].push(obj);
	    }
	    else if (LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {

		if (debug) alert(' long Diag ' + srcID + ' ' + dstID);

		if (!vertLinksOutMiddle[srcID]) vertLinksOutMiddle[srcID] = new Array();
		if (!vertLinksOutMiddle[dstID]) vertLinksOutMiddle[dstID] = new Array();

		if (!horzLinksOutMiddle[dstID]) horzLinksOutMiddle[dstID] = new Array();
		if (!horzLinksOutMiddle[srcID]) horzLinksOutMiddle[srcID] = new Array();

	    }

	    // alert('srcID ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol);

	}
    }

    //
    // calculate all links out of a row that are horizontal
    // 

    var colLinksOut_Merge = new Array();
    var colLinksOutBack_Merge = new Array();

    var rowLinksOut_Merge = new Array();
    var rowLinksOutBack_Merge = new Array();

    var debugMapChannel = false;

    for (var i=0; i<linkCount; i++) {

	linkContext = layoutContext.getLinkByIndex(i);

	srcID = linkContext.getStartId();
	dstID = linkContext.getEndId();

	if (!dstID) continue;
	if (!srcID) continue;

	// if (!LytLinkUtil.srcNodeMatchesContainerID(layoutContext, cid, srcID, dstID)) continue;


	if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid) ||
	    LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid) ||
	    LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {

	    // srcID = linkContext.getStartId();
	    // dstID = linkContext.getEndId();

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcRow = grid.getRow(srcIndex);
	    var srcCol = grid.getCol(srcIndex);

	    var dstRow = grid.getRow(dstIndex);
	    var dstCol = grid.getCol(dstIndex);

	    var shortSeg;
	    var longSeg;

	    if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid)) {

		if (debugMapChannel) alert('LOOP 2 longhorz 2  ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol);
		var r2r = new rowToRow(linkContext, srcCol, dstCol, 0);

		if (srcCol < dstCol) {

		    // short seg from source
		    shortSeg = new rowToRow(linkContext, dstRow, dstRow+1, 1);
		    if (!colLinksOut[srcCol]) colLinksOut[srcCol] = new Array();
		    colLinksOut[srcCol].push(shortSeg);

		    // main
		    if (!rowLinksOut[srcRow]) rowLinksOut[srcRow] = new Array();
		    rowLinksOut[srcRow].push(r2r);

		    // alert('short seg ' + dstRow);

		    // 
		    // short seg from dst
		    // 0 has better sort order
		    // 
		    shortSeg = new rowToRow(linkContext, dstRow, dstRow+1, 0);
		    if (!colLinksOutBack[dstCol]) colLinksOutBack[dstCol] = new Array();
		    colLinksOutBack[dstCol].push(shortSeg);

		    // alert(' longhorz shortseg  ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol + ' dstRow ' + dstRow + ' dstCol ' + dstCol);

		} else {

		    if (!rowLinksOutBack[srcRow]) rowLinksOutBack[srcRow] = new Array();
		    rowLinksOutBack[srcRow].push(r2r);

		}
	    }
	    else if (LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid)) {

		// alert(' longvert 2  ' + srcID + ' dstID ' + dstID + ' srcRow ' + srcRow + ' dstRow ' + dstRow);
		// this is a misnomer
		if (debugMapChannel) alert('LOOP 2 longvert 2  ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol);
		var c2c = new rowToRow(linkContext, srcRow, dstRow, 0);

		if (srcRow < dstRow) {

		    // push to src - these conflict with rowLinksOut
		    shortSeg = new rowToRow(linkContext, dstCol, dstCol+1, 1);
		    if (!rowLinksOut[srcRow]) rowLinksOut[srcRow] = new Array();
		    rowLinksOut[srcRow].push(shortSeg);
		    // alert('push ' + dstCol);

		    if (!colLinksOut[srcCol]) colLinksOut[srcCol] = new Array();
		    colLinksOut[srcCol].push(c2c);

		    // alert('colLinksOut.length *push ' + colLinksOut[srcCol].length);

		    //
		    // For forward links, we also allocate a short segment for the horizontal elbow.
		    // 

		    // should test that we are not at the end col.
		    // 
		    shortSeg = new rowToRow(linkContext, dstCol, dstCol+1, 0);
		    if (!rowLinksOutBack[dstRow]) rowLinksOutBack[dstRow] = new Array();
		    rowLinksOutBack[dstRow].push(shortSeg);

		    // alert('vertical long dstRow ' + dstRow + ' dstCol ' + dstCol); 


		} else {
		    if (!colLinksOutBack[srcCol]) colLinksOutBack[srcCol] = new Array();
		    colLinksOutBack[srcCol].push(c2c);
		}
	    }
	    else if (LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {


		if (debugMapChannel) alert('LOOP 2 longdiag 2  ' + srcID + ' dstID ' + dstID + ' srcCol ' + dstCol);

		if (LytChannelRouteUtil.isSpecialDiagVert(srcRow, dstRow, srcCol, dstCol)) {

		    if (debugMapChannel) alert(" SPECIAL DIAG VERT srcCol " + srcCol + ' dstCol ' + dstCol);
		    var c2c = new rowToRow(linkContext, srcRow, dstRow, 0);
		    //
		    // For adjacent columns, allocate space in the min col.
		    // This will allocate space for adjacent, crossing links correctly.
		    //
		    var pushCol = Math.min(srcCol, dstCol);
		    if (!colLinksOutMiddle[pushCol]) colLinksOutMiddle[pushCol] = new Array();
		    colLinksOutMiddle[pushCol].push(c2c);

		} else if (LytChannelRouteUtil.isSpecialDiagHorz(srcRow, dstRow, srcCol, dstCol)) {

		    if (debugMapChannel) alert(" SPECIAL DIAG HORZ srcCol " + srcCol + ' dstCol ' + dstCol);
		    
		    var r2r = new rowToRow(linkContext, srcCol, dstCol, 0);
		    var pushRow = Math.min(srcRow, dstRow);
		    if (!rowLinksOutMiddle[pushRow]) rowLinksOutMiddle[pushRow] = new Array();
		    rowLinksOutMiddle[pushRow].push(r2r);

		} else if (LytChannelRouteUtil.isSpecialDiagVertFS(grid, srcRow, dstRow, srcCol, dstCol)) {

		    if (debugMapChannel) alert(" SPECIAL DIAG VERT FS srcCol " + srcCol + ' dstCol ' + dstCol);

		    var c2c = new rowToRow(linkContext, srcRow, dstRow, 0);
		    var pushCol = Math.min(srcCol, dstCol);
		    if (!colLinksOutMiddle[pushCol]) colLinksOutMiddle[pushCol] = new Array();
		    colLinksOutMiddle[pushCol].push(c2c);

		} else {


		    if (debug) alert('LOOP 2 islongdiag ');

		    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {


			shortSeg = new rowToRow(linkContext, srcCol, srcCol+1, 1);

			// short horizontal segment on source node
			if (!rowLinksOutMiddle[srcRow]) rowLinksOutMiddle[srcRow] = new Array();
			rowLinksOutMiddle[srcRow].push(shortSeg);

			var c2c = new rowToRow(linkContext, srcRow, dstRow, 0);
			if (!colLinksOutMiddle[srcCol]) colLinksOutMiddle[srcCol] = new Array();
			colLinksOutMiddle[srcCol].push(c2c);

			// 
			// main horizontal segment
			// 
			var dstRowMinus = dstRow - 1;
			longSeg = new rowToRow(linkContext, srcCol, dstCol, 1);
			if (!rowLinksOutMiddle[dstRowMinus]) rowLinksOutMiddle[dstRowMinus] = new Array();
			rowLinksOutMiddle[dstRowMinus].push(longSeg);


		    } else if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {


			// Long Diagonal back/down

			var r2r = new rowToRow(linkContext, srcCol, dstCol, 0);

			// (long) backchannel is run first.
			if (!rowLinksOutMiddle[srcRow]) rowLinksOutMiddle[srcRow] = new Array();
			rowLinksOutMiddle[srcRow].push(r2r);

			// alert(srcRow + ' push long back ' + srcCol + ' ' + dstCol);

			longSeg = new rowToRow(linkContext, srcRow, dstRow, 0);
			if (!colLinksOutMiddle[dstCol]) colLinksOutMiddle[dstCol] = new Array();
			colLinksOutMiddle[dstCol].push(longSeg);

			// short segment to destination, routed in the forward links horz. channel.
			shortSeg = new rowToRow(linkContext, dstCol, dstCol+1, 1);

			var dstRowMinus = dstRow - 1;
			if (!rowLinksOutMiddle[dstRowMinus]) rowLinksOutMiddle[dstRowMinus] = new Array();
			rowLinksOutMiddle[dstRowMinus].push(shortSeg);
			// alert(' create segment isDown/!isRight ' + dstRowMinus);

		    } else if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

			if (debug) alert(" ROUTE UP RIGHT ");

			// short seg from source
			shortSeg = new rowToRow(linkContext, srcRow, srcRow-1, 1);
			if (!colLinksOutMiddle[srcCol]) colLinksOutMiddle[srcCol] = new Array();
			colLinksOutMiddle[srcCol].push(shortSeg);

			// horizontal channel
			var r2r = new rowToRow(linkContext, srcCol, dstCol - 1, 0);
			var srcRowMinus = srcRow - 1;
			if (!rowLinksOutMiddle[srcRowMinus]) rowLinksOutMiddle[srcRowMinus] = new Array();
			rowLinksOutMiddle[srcRowMinus].push(r2r);
			if (debug) alert(' create segment !isDown/isRight ' + srcRowMinus);

			// vertical backchannel 
			longSeg = new rowToRow(linkContext, srcRow, dstRow, 0);
			var dstColMinus = dstCol - 1;
			if (!colLinksOutMiddle[dstColMinus]) colLinksOutMiddle[dstColMinus] = new Array();
			colLinksOutMiddle[dstColMinus].push(longSeg);



		    } else if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
			// Long Diagonal back channel

			var dstColMinus = Math.max(dstCol - 1, 0);
			var r2r = new rowToRow(linkContext, srcCol, dstColMinus, 0);
			// (long) backchannel is run first.
			if (!rowLinksOutMiddle[srcRow]) rowLinksOutMiddle[srcRow] = new Array();
			rowLinksOutMiddle[srcRow].push(r2r);

			// vertical backchannel 
			longSeg = new rowToRow(linkContext, srcRow, dstRow, 0);
			var dstColMinus = dstCol - 1;
			if (dstColMinus >= 0) {
			    if (!colLinksOutMiddle[dstColMinus]) colLinksOutMiddle[dstColMinus] = new Array();
			    colLinksOutMiddle[dstColMinus].push(longSeg);

			}
		    }
		}
	    }
	}
    }

    //
    // Result rowLinksOut[] is an array of link segments (for each row)
    // rowLinksOutBack[] stores the back links.
    //

    // alert('rowLinksOut.length ' + rowLinksOut.length);
    // alert('colLinksOut.length ' + colLinksOut.length);
    // alert('rowLinksOutBack.length ' + rowLinksOutBack.length);
    // alert('colLinksOutBack.length ' + colLinksOutBack.length);


    mergeR2RDst(colLinksOutBack, colLinksOutBack_Merge, grid);
    prune(colLinksOutBack, colLinksOutBack_Merge, grid, colLinksOutBackMirror);

    mergeR2RSrc(colLinksOut, colLinksOut_Merge, grid);
    prune(colLinksOut, colLinksOut_Merge, grid, colLinksOutMirror);

    mergeR2RSrcRow(rowLinksOut, rowLinksOut_Merge, grid);
    prune(rowLinksOut, rowLinksOut_Merge, grid, rowLinksOutMirror);

    mergeR2RDstRow(rowLinksOutBack, rowLinksOutBack_Merge, grid);
    prune(rowLinksOutBack, rowLinksOutBack_Merge, grid, rowLinksOutBackMirror);

    // test: channelroutehorz ("FORWARD_SRC") demonstrates where we need mirrors.
    // (use mirror in mapLinksToChannel for case where colLinksOut is undefined).

    // sort 
    for (var i=0; i<rowLinksOut.length; i++) {
	var a = rowLinksOut[i];
	if (a) a.sort(sortColDistance);
    }
    for (var i=0; i<rowLinksOutBack.length; i++) {

	var a = rowLinksOutBack[i];
	if (a) a.sort(sortColDistance);
    }

    for (var i=0; i<rowLinksOutMiddle.length; i++) {
	var a = rowLinksOutMiddle[i];
	// if (a) for (var j=0; j<a.length; j++) alert(' sort pre ' + a[j].srcCol + ' ' + a[j].dstCol);
	if (a) a.sort(sortColDistance);
    }

    for (var i=0; i<colLinksOut.length; i++) {
	var a = colLinksOut[i];

	if (a) {

	    // alert('sort colLinksOut.length  ' + colLinksOut[i].length);
	    // for (var j=0; j<colLinksOut[i].length; j++) alert(' sort pre ' + a[j].srcCol + ' ' + a[j].dstCol);

	    a.sort(sortRowDistance);

	    // for (var j=0; j<colLinksOut[i].length; j++) alert(' sort ' + a[j].srcCol + ' ' + a[j].dstCol);
	}
    }

    for (var i=0; i<colLinksOutBack.length; i++) {

	var a = colLinksOutBack[i];

	//if (a) 
	//for (var j=0; j<colLinksOutBack[i].length; j++) {
	//alert('colLinksOutBack col ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' srcCol  ' + a[j].srcCol + ' dstCol ' + a[j].dstCol);
	//}

	if (a) a.sort(sortRowDistance);
    }

    for (var i=0; i<colLinksOutMiddle.length; i++) {
	var a = colLinksOutMiddle[i];
	if (a) a.sort(sortRowDistance);
    }

    var horz = true;

    mapLinksToChannel(grid, rowLinksOut, linkHorzChannel, horzChannelLineCount, horz);
    mapLinksToChannel(grid, rowLinksOutBack, linkHorzChannelBack, horzChannelLineCountBack, horz);
    mapLinksToChannel(grid, rowLinksOutMiddle, linkHorzChannelMiddle, horzChannelLineCountMiddle, horz);

    horz = false;

    mapLinksToChannel(grid, colLinksOut, linkVertChannel, vertChannelLineCount, horz);
    mapLinksToChannel(grid, colLinksOutBack, linkVertChannelBack, vertChannelLineCountBack, horz);
    mapLinksToChannel(grid, colLinksOutMiddle, linkVertChannelMiddle, vertChannelLineCountMiddle, horz);

    copyMirror(colLinksOut, linkVertChannel, colLinksOutMirror);
    copyMirror(colLinksOutBack, linkVertChannelBack, colLinksOutBackMirror);
    copyMirror(rowLinksOut, linkHorzChannel, rowLinksOutMirror);
    copyMirror(rowLinksOutBack, linkHorzChannelBack, rowLinksOutBackMirror);

    // 
    // Result of this is linkHorzChannel[], which maps link IDs to channels
    // 
    var debug_dumpLinksOut = false;

    if (debug_dumpLinksOut) {

	for (var i=0; i<rowLinksOutMiddle.length; i++) {

	    var a = rowLinksOutMiddle[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {

		alert('row middle linksout linkID ' + a[j].l.getId() + ' => ' +  linkHorzChannelMiddle[i][a[j].l.getId()])
	    }
	}

	for (var i=0; i<rowLinksOut.length; i++) {

	    var a = rowLinksOut[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {

		alert('linksout linkID ' + a[j].l.getId() + ' => ' +  linkHorzChannel[i][a[j].l.getId()])
	    }
	}

	for (var i=0; i<colLinksOut.length; i++) {

	    var a = colLinksOut[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {

		alert('col linksout linkID ' + a[j].l.getId() + ' => ' +  linkVertChannel[i][a[j].l.getId()])
	    }
	}

	for (var i=0; i<rowLinksOutBack.length; i++) {

	    var a = rowLinksOutBack[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {

		alert('linksoutBack linkID ' + a[j].l.getId() + ' => ' +  linkHorzChannelBack[i][a[j].l.getId()])
	    }
	}

	for (var i=0; i<colLinksOutBack.length; i++) {

	    var a = colLinksOutBack[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {

		alert('col linksoutBack linkID ' + a[j].l.getId() + ' => ' +  linkVertChannelBack[i][a[j].l.getId()])
	    }
	}

	for (var i=0; i<colLinksOutMiddle.length; i++) {

	    var a = colLinksOutMiddle[i];
	    if (!a) continue;

	    for (var j=0; j < a.length; j++) {
		alert('col middle linksout linkID ' + a[j].l.getId() + ' => ' +  linkVertChannelMiddle[i][a[j].l.getId()])
	    }
	}
    }

    // 
    // sort the horzLinksOut
    // 
    for (i=0; i<nodeCount; i++) {

	srcNode = layoutContext.getNodeByIndex(i);
	srcID = srcNode.getId();

	var srcIndex = grid.getGridIndex(srcID);
	var srcCol = grid.getCol(srcIndex);

	if (horzLinksOut[srcID]) {

	    var a = horzLinksOut[srcID];

	    for (k=0; k<a.length; k++) {
		alert(' horzLinksOut srcID ' + srcID + ' dstID ' + a[k].ID + ' index ' + a[k].index );
	    }

	    // 
	    // Sort each links out array based on the index.
	    // 

	    a.sort(sortIndex);

/*
	    for (k=0; k<a.length; k++) {
		alert('srcID ' + srcID + ' dstID ' + a[k].ID + ' index ' + a[k].index );
	    }
*/
	}
    }

    for (i=0; i<nodeCount; i++) {

	srcNode = layoutContext.getNodeByIndex(i);
	srcID = srcNode.getId();

	var srcIndex = grid.getGridIndex(srcID);


	if (vertLinksOut[srcID]) {

	    var a = vertLinksOut[srcID];

	    for (k=0; k<a.length; k++) {
		alert(' vertLinksOut srcID ' + srcID + ' dstID ' + a[k].ID + ' index ' + a[k].index );
	    }

	    a.sort(sortIndex);
	}
    }
}


//
// Set up data structures, then backoff the link endpoints.
// Issues: how to best handle links between containers.
//
// We probably need to extend in order to pass in only the links that we will render.
//
//
LytChannelRouteUtil.prototype.layoutLinksGrid = function(layoutContext, layoutDesc, containerDesc, grid, linkDS, channelPadU) {

    var debug = false;
    var debug2 = false;
    var debug7 = false;

    // alert(' layout links grid');

    var horzLinksOut = new Array();
    var vertLinksOut = new Array();

    var horzLinksOutBack = new Array();
    var vertLinksOutBack = new Array();

    var horzLinksOutMiddle = new Array();
    var vertLinksOutMiddle = new Array();

    var rowLinksOut = new Array();
    var rowLinksOutBack = new Array();

    var colLinksOut = new Array();
    var colLinksOutBack = new Array();

    var rowLinksOutMiddle = new Array();
    var colLinksOutMiddle = new Array();

    //  this mirror is used.
    var colLinksOutMirror = new Array();
    var rowLinksOutMirror = new Array();
    // mirror currently unused
    var rowLinksOutBackMirror = new Array();
    // mirror currently unused
    var colLinksOutBackMirror = new Array();

    var layoutFlow = containerDesc.getLayoutFlow();
    var arrowLength = containerDesc.getArrowLength();
    var route = containerDesc.getRoute();

    var linkContext;

    var linkCount = layoutContext.getLinkCount();
    var nodeCount = layoutContext.getNodeCount();

    var srcNode;
    var dstNode;

    var srcID;
    var dstID;

    var i;

    var horzChannelLineCount = new Array();
    var horzChannelLineCountBack = new Array();
    var horzChannelLineCountMiddle = new Array();

    var vertChannelLineCount = new Array();
    var vertChannelLineCountBack = new Array();
    var vertChannelLineCountMiddle = new Array();

    // maps linkID to its channel
    var linkHorzChannel = new Array();
    var linkHorzChannelBack = new Array();
    var linkHorzChannelMiddle = new Array();

    var linkVertChannel = new Array();
    var linkVertChannelBack = new Array();
    var linkVertChannelMiddle = new Array();

    LytChannelRouteUtil.calculateLongLinksOut(layoutContext, layoutDesc, containerDesc, grid, linkDS,
				      horzLinksOut, vertLinksOut,
				      horzLinksOutBack, vertLinksOutBack,
				      horzLinksOutMiddle, vertLinksOutMiddle,
				      rowLinksOut, rowLinksOutBack,
				      colLinksOut, colLinksOutBack,
				      rowLinksOutMiddle, colLinksOutMiddle,
				      colLinksOutMirror, rowLinksOutMirror,    
				      rowLinksOutBackMirror, colLinksOutBackMirror,
				      horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
				      vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
				      linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
				      linkVertChannel, linkVertChannelBack, linkVertChannelMiddle);


    var firstPass = true;

    var gridMapperDst = new Array();
    var gridMapperSrc = new Array();

    this.layoutLongLinksGrid(layoutContext, layoutDesc, containerDesc, grid, linkDS, channelPadU,
			     horzLinksOut, vertLinksOut,
			     horzLinksOutBack, vertLinksOutBack,
			     horzLinksOutMiddle, vertLinksOutMiddle,
			     rowLinksOut, rowLinksOutBack,
			     colLinksOut, colLinksOutBack,
			     rowLinksOutMiddle, colLinksOutMiddle,
			     colLinksOutMirror, rowLinksOutMirror,    
			     rowLinksOutBackMirror, colLinksOutBackMirror,
			     horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
			     vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
			     linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
			     linkVertChannel, linkVertChannelBack, linkVertChannelMiddle, gridMapperSrc, gridMapperDst, firstPass);



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

	// if (!LytLinkUtil.srcNodeMatchesContainerID(layoutContext, cid, srcID, dstID)) continue;

	dstNode = layoutContext.getNodeById(dstID);
	srcNode = layoutContext.getNodeById(srcID);
	
	var dstIndex = grid.getGridIndex(dstID);
	var srcIndex = grid.getGridIndex(srcID);

	if (firstPass) {

	    if (!gridMapperDst[dstIndex]) gridMapperDst[dstIndex] = new Direction();
	    if (!gridMapperDst[srcIndex]) gridMapperDst[srcIndex] = new Direction();
	    if (!gridMapperSrc[srcIndex]) gridMapperSrc[srcIndex] = new Direction();
	    if (!gridMapperSrc[dstIndex]) gridMapperSrc[dstIndex] = new Direction();

	}

	if (!srcNode) continue;
	if (!dstNode) continue;
        
	var endPoints;
	var coords = new Array();
	cctLength = 0;


	//
	// should also have an orthogonal check here eventually
	//
	if (!LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid) 
	    && !LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid)
	    && !LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {

	    if (debug) alert(srcID + '-' + dstID + ' backofLink ' );

	    // alert('ChannelRouteUtil: ' + srcID + '-' + dstID + ' backofLink ' );
	    // we should set this to the link offset.
	    
	    endPoints = LytLinkUtil.backoffLink(layoutContext, linkContext, layoutFlow, util.linksInOffsetX, util.linksInOffsetY, linkDS);

	    coords[0] = endPoints[0];
	    coords[1] = endPoints[1];

	    coords[2] = endPoints[2];
	    coords[3] = endPoints[3];

	    // coords[2] = dstPt[0];
	    // coords[3] = dstPt[1];

	    // alert(srcID + '-' + dstID + ' cll ' + coords[2] + ' ' + coords[3]);

	    linkContext.setPoints(coords);

	    // Equal x coordinates -> vertical line.
	    if (coords[0] == coords[2]) {
		if (coords[1] < coords[3]) {
		    gridMapperDst[dstIndex].top++;
		    gridMapperSrc[srcIndex].bottom++;
		}
		else {
		    gridMapperDst[dstIndex].bottom++;
		    gridMapperSrc[srcIndex].top++;
		}

	    } else if (coords[1] == coords[3]) {
		// horizontal line
		if (coords[0] < coords[2]) {
		    gridMapperDst[dstIndex].left++;
		    gridMapperSrc[srcIndex].right++;
		    if (debug7) alert(' claim dst left ' + dstIndex + ' src right ' + srcIndex);

		}
		else {
		    gridMapperDst[dstIndex].right++;
		    gridMapperSrc[srcIndex].left++;
		    if (debug7) alert(' claim00 dst right ' + dstIndex + ' src left ' + srcIndex);
		}
	    }

	    LytChannelRouteUtil.backoffArrowDstForCoords(linkContext, coords);
	    LytLabelUtil.centerLinkLabel(linkContext, coords[0], coords[1], coords[2], coords[3]);

	}



	var ccLink = srcNode.getContainerId() || dstNode.getContainerId();

	if (ccLink) {

	    if (debug) alert(' CrossContainerLink: ' + srcID + ' ' + dstID);

	}
    }

    firstPass = false;

    this.layoutLongLinksGrid(layoutContext, layoutDesc, containerDesc, grid, linkDS, channelPadU,
			     horzLinksOut, vertLinksOut,
			     horzLinksOutBack, vertLinksOutBack,
			     horzLinksOutMiddle, vertLinksOutMiddle,
			     rowLinksOut, rowLinksOutBack,
			     colLinksOut, colLinksOutBack,
			     rowLinksOutMiddle, colLinksOutMiddle,
			     colLinksOutMirror, rowLinksOutMirror,    
			     rowLinksOutBackMirror, colLinksOutBackMirror,
			     horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
			     vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
			     linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
			     linkVertChannel, linkVertChannelBack, linkVertChannelMiddle, gridMapperSrc, gridMapperDst, firstPass);

}

// arrow adjust temp
var aa = false;
var debug_aa = true;

// 
// Backoff destination links, updating coords.
// 
LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl = function(l, coords, ctlPoints) {

    if (!coords) return;
    if (coords.length < 4) return;

    var ctlLength = ctlPoints.length;

    if (isNaN(coords[0])) return;
    if (isNaN(coords[1])) return;

    var debug = false;

    if (l.getEndConnectorOffset() > 0) 
    {

	var dstRet;

	var x1 = ctlPoints[ctlLength - 2];
	var y1 = ctlPoints[ctlLength - 1];

	if (debug) alert(' backoff dc ' + x1 + ' ' + y1 + ' ' +  coords[2 + ctlLength] + ' ' +  coords[3 + ctlLength] + ' ctllen ' + ctlLength);

	// alert(' backoff dc ' + x1 + ' ' + y1 + ' ' +  coords[2 + ctlLength] + ' ' +  coords[3 + ctlLength]);
	if (debug) alert(' end offset ' + l.getEndConnectorOffset());

	// 
	// the *2 aligns the connector properly ...
	// 
	dstRet = LytLinkUtil.backoffArrow2(l.getEndConnectorOffset()*2, x1, y1, coords[2 + ctlLength], coords[3 + ctlLength]);

	if (debug) alert(' -> ' + dstRet[0] + ' ' + dstRet[1]);

	if (!isNaN(dstRet[0]) && !isNaN(dstRet[1])) {

	    coords[2 + ctlLength] = dstRet[0];
	    coords[3 + ctlLength] = dstRet[1];
	}

    } 
    if (l.getStartConnectorOffset() > 0) 
    {

	var dstRet;

	// alert(' backoff start conn ' + ctlPoints[0] + ' ' + ctlPoints[1] + ' ' +  coords[0] + ' ' +  coords[1] + ' offset ' + l.getStartConnectorOffset());

	// 
	// the *2 aligns the connector properly ...
	// 
	dstRet = LytLinkUtil.backoffArrow2(l.getStartConnectorOffset()*2, ctlPoints[0], ctlPoints[1], coords[0], coords[1]);

	if (debug) alert(' -> ' + dstRet[0] + ' ' + dstRet[1]);

	if (!isNaN(dstRet[0]) && !isNaN(dstRet[1])) {

	    coords[0] = dstRet[0];
	    coords[1] = dstRet[1];
	}

    } 
}    

//
// This is called for direct links (no angular bends)
//
LytChannelRouteUtil.backoffArrowDstForCoords = function(l, coords) {

    var debug = false;
    if (!coords) return;
    if (coords.length < 4) return;

    if (isNaN(coords[0])) return;
    if (isNaN(coords[1])) return;
    if (isNaN(coords[2])) return;
    if (isNaN(coords[3])) return;

    // return;

    if (l.getEndConnectorOffset() > 0) 
    {

	// alert(' backoff End Co ' + l.getEndConnectorOffset());

	var dstRet;

	if (debug) alert(' backoff dst for coords ' + coords[0] + ' ' + coords[1] + ' ' +  coords[2] + ' ' +  coords[3]);

	dstRet = LytLinkUtil.backoffArrow2(l.getEndConnectorOffset(), coords[0], coords[1], coords[2], coords[3]);

	if (!isNaN(dstRet[0]) && !isNaN(dstRet[1])) {

	    coords[2] = dstRet[0];
	    coords[3] = dstRet[1];
	}
    } 
    if (l.getStartConnectorOffset() > 0) 
    {

	var dstRet;

	// alert(' backoff Start Co ' + l.getStartConnectorOffset());

	dstRet = LytLinkUtil.backoffArrow2(l.getStartConnectorOffset(), coords[2], coords[3], coords[0], coords[1]);

	if (!isNaN(dstRet[0]) && !isNaN(dstRet[1])) {

	    coords[0] = dstRet[0];
	    coords[1] = dstRet[1];
	}
    } 
}    

//
// object to store connection directions.
//
function Direction() {
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.top_skew_left = 0;
    this.bottom = 0;
}

LytChannelRouteUtil.prototype.layoutLongLinksGrid = function(layoutContext, layoutDesc, containerDesc, grid, linkDS, channelPadU,
						     horzLinksOut, vertLinksOut,
						     horzLinksOutBack, vertLinksOutBack,
						     horzLinksOutMiddle, vertLinksOutMiddle,
						     rowLinksOut, rowLinksOutBack,
						     colLinksOut, colLinksOutBack,
						     rowLinksOutMiddle, colLinksOutMiddle,
						     colLinksOutMirror, rowLinksOutMirror,    
						     rowLinksOutBackMirror, colLinksOutBackMirror,
						     horzChannelLineCount, horzChannelLineCountBack, horzChannelLineCountMiddle,
						     vertChannelLineCount, vertChannelLineCountBack, vertChannelLineCountMiddle,
						     linkHorzChannel, linkHorzChannelBack, linkHorzChannelMiddle,
						     linkVertChannel, linkVertChannelBack, linkVertChannelMiddle, gridMapperSrc, gridMapperDst, firstPass)

{

    var debug = false;
    var debug2 = false;

    if (debug) alert('layoutLongLinksGrid ' + firstPass);

    // var gridMapperDstResult = new Array();
    // var gridMapperDstResult = new Array();

    var linkCount = layoutContext.getLinkCount();

    var layoutFlow = containerDesc.getLayoutFlow();
    var arrowLength = containerDesc.getArrowLength();

    var route = containerDesc.getRoute();

    var skewConstant = arrowLength * 2;

    // var gridMapperDstResult = new 

    // if (firstPass) gridMapperDst = new Array();

    //
    // Route long links.
    //
    //
    // Backoff all links,
    // using the calculated linksInOffsets
    //
    for (var i=0; i<linkCount; i++) {

	if (debug) alert(' link ' + i);
	if (debug) alert(' layoutlonglinksgrid link ' + i);
	
	linkContext = layoutContext.getLinkByIndex(i);

	// adjust arrow length routing based on size of connector
	if (linkContext.getEndConnectorOffset() > 0) {

	    // getEndConnectorOffset() returns half the stroke width (e.g., .5 for stroke width of 1)

	    arrowLength = linkContext.getEndConnectorOffset() * 3 + 3;

	    // alert(' co ' + linkContext.getEndConnectorOffset());
	}

	dstID = linkContext.getEndId();
	srcID = linkContext.getStartId();

	if (!dstID) continue;
	if (!srcID) continue;

	// if (!LytLinkUtil.srcNodeMatchesContainerID(layoutContext, cid, srcID, dstID)) continue;

	dstNode = layoutContext.getNodeById(dstID);
	srcNode = layoutContext.getNodeById(srcID);

	if (!srcNode) continue;
	if (!dstNode) continue;
        
	var srcIndex = grid.getGridIndex(srcID);
	var dstIndex = grid.getGridIndex(dstID);

	// only a scalar is needed
	var gridMapperDstResult = new Direction();
	var gridMapperSrcResult = new Direction();

	// 
	// On the first pass, allocate a new object for any new dstIndex.
	// These objects store the connection direction.
	// 
	if (firstPass) {

	    // March 9

	    // if (!gridMapperDst[dstIndex]) gridMapperDst[dstIndex] = new Direction();
	    // if (!gridMapperSrc[srcIndex]) gridMapperSrc[srcIndex] = new Direction();

	    if (!gridMapperDst[dstIndex]) gridMapperDst[dstIndex] = new Direction();
	    if (!gridMapperDst[srcIndex]) gridMapperDst[srcIndex] = new Direction();
	    if (!gridMapperSrc[srcIndex]) gridMapperSrc[srcIndex] = new Direction();
	    if (!gridMapperSrc[dstIndex]) gridMapperSrc[dstIndex] = new Direction();


	}


	var endPoints;
	var coords = new Array();

	var ctlLength = 0;

	// alert(' i ' + i + ' srcID ' + srcID);
	// alert(' horzLinksOut[srcID] ' + horzLinksOut[srcID].length);

	var horz = true;
	var ctlPoints;

	if (isHorizontalRoute(linkContext, layoutFlow, grid) && horzLinksOut[srcID]) {

	    // if (horzLinksOut[srcID]) {

	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isHorizontalRoute()* ');

	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    // a02
	    // alert(srcCol + ' ' + dstCol);

	    if (srcCol < dstCol) {
		
		// Forward Links
		ctlPoints = routeOrthog(layoutContext, linkContext, layoutFlow, arrowLength, grid, 
					horzLinksOut[srcID], linkHorzChannel, horzChannelLineCount, // main
					horzLinksOut[dstID], linkHorzChannel, horzChannelLineCount, // dummy
					vertLinksOut[srcID], linkVertChannel, vertChannelLineCount, // forward links on src
					vertLinksOutBack[dstID], linkVertChannelBack, vertChannelLineCountBack, // backlinks on dst
					horz, "", channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass);
	    } else {

		// alert('back links ' + srcID);

		// if (! horzLinksOutBack[srcID]) alert ('no horzLinksOutBack');

		ctlPoints = routeOrthog(layoutContext, linkContext, layoutFlow, arrowLength, grid, 
					horzLinksOutBack[srcID], linkHorzChannelBack, horzChannelLineCountBack, // main
					horzLinksOutBack[dstID], linkHorzChannelBack, horzChannelLineCountBack, // dummy
					vertLinksOutBack[srcID], linkVertChannelBack, vertChannelLineCountBack, // dummy
					vertLinksOutBack[dstID], linkVertChannelBack, vertChannelLineCountBack, // dummy
					horz, "", channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass);
	    }

	    if (ctlPoints)
		ctlLength = ctlPoints.length;
	}
	else if (isVerticalRoute(linkContext, layoutFlow, grid) && vertLinksOut[srcID]) {
	    // else if (vertLinksOut[srcID]) {
	    
	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isVerticalRoute()* ');

	    horz = false;

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    // a02
	    // alert('vlo ' + srcRow + ' ' + dstRow);

	    if (srcRow < dstRow) {
		// Forward Links

		ctlPoints = routeOrthog(layoutContext, linkContext, layoutFlow, arrowLength, grid, 
					horzLinksOut[srcID], linkHorzChannel, horzChannelLineCount, // forward links on src
					horzLinksOutBack[dstID], linkHorzChannelBack, horzChannelLineCountBack, // backlinks on dst
					vertLinksOut[srcID], linkVertChannel, vertChannelLineCount, // main
					vertLinksOut[srcID], linkVertChannel, vertChannelLineCount, // dummy
					horz, "", channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass);
	    } else 
		// Backlinks
		// alert('back ');

		ctlPoints = routeOrthog(layoutContext, linkContext, layoutFlow, arrowLength, grid, 
					horzLinksOutBack[srcID], linkHorzChannelBack, horzChannelLineCountBack, 
					horzLinksOutBack[dstID], linkHorzChannelBack, horzChannelLineCountBack, 
					vertLinksOutBack[srcID], linkVertChannelBack, vertChannelLineCountBack, // main
					vertLinksOutBack[dstID], linkVertChannelBack, vertChannelLineCountBack, // dummy
					horz, "", channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass);


	    if (ctlPoints)
		ctlLength = ctlPoints.length;
	}
	else if (LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {
	    
	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isLongDiagonalRoute()* ');


	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    // alert(' srcCol ' + srcCol + ' dstCol ' + dstCol + ' isLongDiagonalRoute() ');
	    // alert(' srcIndex ' + srcIndex + ' dstIndex ' + dstIndex + ' isLongDiagonalRoute() ');

	    horz = false;

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    ctlPoints = routeOrthog(layoutContext, linkContext, layoutFlow, arrowLength, grid, 
				    horzLinksOutMiddle[srcID], linkHorzChannelMiddle, horzChannelLineCountMiddle, // backlinks on src
				    horzLinksOutMiddle[dstID], linkHorzChannelMiddle, horzChannelLineCountMiddle, // second main - dstID is WRONG
				    vertLinksOutMiddle[srcID], linkVertChannelMiddle, vertChannelLineCountMiddle, // main
				    vertLinksOutMiddle[dstID], linkVertChannelMiddle, vertChannelLineCountMiddle, // dummy
				    false, "DIAG", channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass);

	    if (ctlPoints)
		ctlLength = ctlPoints.length;

	    if (debug) {
		if (ctlPoints) {
		    alert('len ' + ctlPoints.length);
		}
		else alert(' noooooooooooo ');

	    }

	}

	var srcPoint;
	var dstPoint;

	// var c1 = getNodeCenter(layoutContext, srcID);
	// var c2 = getNodeCenter(layoutContext, dstID);

	var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
	var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

	var r1 = srcNode.getBounds();
	var r2 = dstNode.getBounds();

	// cc2
	// srcPoint = srcNode.getPosition();
	srcPoint = LytNodeUtil.getNodePosRel(layoutContext, srcNode, dstNode);

	// cc2
	// dstPoint = dstNode.getPosition();
	dstPoint = LytNodeUtil.getNodePosRel(layoutContext, dstNode, srcNode);

	var linkLabelRect = linkContext.getLabelBounds();

	//
	// For grid routing, we should assume no collapsers.
	// For horizontal grid routes, the backoff is trivial -
	// we could just compute the edge points directly.
	//
	if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid) && horzLinksOut[srcID]) {

	    var srcX = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID).x;
	    var dstX = LytLinkUtil.getDstNodeLinkPositionFlow(layoutContext, layoutFlow, srcID, dstID).x;


	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isLongHorizontalRoute() ');

	    if (LytChannelRouteUtil.isForwardLink(srcCol, dstCol)) {

		if (aa) {

		    if (srcX < dstX) dstX -= arrowLength;
		    else dstX += arrowLength;
		}


		// fixx2
		coords[0] = srcX;
		// coords[0] = srcPoint.x + LytNodeUtil.getNodeRightConnectX(srcNode);

		coords[1] = ctlPoints[1];

		if (srcConnectSingle) {
		    var srcY = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID).y;
		    coords[1] = srcY;
		}

		coords[2 + ctlLength] = dstX;
		coords[3 + ctlLength] = ctlPoints[ctlLength -1];
		
		if (firstPass) {

		    if (srcX < dstX) gridMapperDst[dstIndex].left++;
		    else gridMapperDst[dstIndex].right++;
		}

		// alert('isHorizRoute: ' + linkContext.getId() + ' coords.length ' + coords.length + ' (' + coords[0] + ',' + coords[1] + ')');

		// Center link label on the horizontal run
		// Use control points (2,3) and (4,5)
		// alert('cll long horz ' + ctlPoints.length);


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    } else {

		//
		// Backlink - link to node tops.
		//
		coords[0] = c1.x;
		coords[1] = srcPoint.y;

		coords[2 + ctlLength] = c2.x;

		if (aa) {
		    coords[3 + ctlLength] = dstPoint.y - arrowLength;
		}
		else coords[3 + ctlLength] = dstPoint.y;

		if (firstPass) gridMapperDst[dstIndex].top++;

		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytLabelUtil.centerLinkLabel(linkContext, ctlPoints[0], ctlPoints[1], ctlPoints[2], ctlPoints[3]);
		}

		// Note - a backlink with a label in row 0 will need more top padding

	    }

	}
	else if (LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid)  && vertLinksOut[srcID]) {

	    var srcX = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID).x;
	    var dstX = LytLinkUtil.getDstNodeLinkPositionFlow(layoutContext, layoutFlow, srcID, dstID).x;

	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isLongVerticalRoute() ');

	    if (LytChannelRouteUtil.isForwardLink(srcRow, dstRow)) {

		var dstY = dstPoint.y;

		if (aa) {

		    if (debug_aa) alert('aa adjust 1 ');
		//
		// Adjust for arrowheads (assume on destination)
		//

		    if (srcPoint.y < dstPoint.y) dstY -= arrowLength;
		    else dstY += arrowLength;
		}

		coords[0] = ctlPoints[0];
		// coords[1] = srcPoint.y + r1.h;
		// coords[1] = srcPoint.y + LytNodeUtil.getNodeBottomConnectY(srcNode);	
		coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

		coords[2 + ctlLength] = c2.x;
		coords[3 + ctlLength] = dstY;


		if (firstPass) {
		    if (srcY < dstY) gridMapperDst[dstIndex].top++;
		    else gridMapperDst[dstIndex].bottom++;
		}

		// alert('isHorizRoute: ' + linkContext.getId() + ' coords.length ' + coords.length + ' (' + coords[0] + ',' + coords[1] + ')');

		// Center link label on the vertical run
		// Use control points (2,3) and (4,5)
		// alert('cll long vert ' + ctlPoints.length);


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    } else {

		//
		// Backlink - link to node sides.
		//

		//
		// adjust destination x arrow location.
		//
		var dstX = dstPoint.x;

		if (aa) {
		    if (debug_aa) alert('aa adjust 2');
		    dstX -= arrowLength;
		}
		coords[0] = srcPoint.x;
		coords[1] = c1.y;

		coords[2 + ctlLength] = dstX;
		coords[3 + ctlLength] = c2.y;

		if (firstPass) {
		    if (srcX < dstX) gridMapperDst[dstIndex].left++;
		    else gridMapperDst[dstIndex].right++;
		}

		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytLabelUtil.centerLinkLabel(linkContext, ctlPoints[0], ctlPoints[1], ctlPoints[2], ctlPoints[3]);
		}

	    }

	}

	if (LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid) && (horzLinksOutMiddle[srcID] || vertLinksOutMiddle[srcID])  ) {

	    // alert(srcID + ' is long diag  route ' + ctlLength);
	    if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' isLongDiagonalRoute()x ');

	    var srcX = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID).x;
	    var dstX = LytLinkUtil.getDstNodeLinkPositionFlow(layoutContext, layoutFlow, srcID, dstID).x;

	    // a16
	    
	    // if (LytChannelRouteUtil.isForwardLink(srcCol, dstCol)) {
	    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
		// special 11

		// alert(' is down right');

		if (Math.abs(srcCol - dstCol) == 1 || Math.abs(srcRow - dstRow) == 1) {

		    if (!firstPass) {
			this.setLinkDst(linkContext, coords, dstNode, srcID, dstID, c2, gridMapperDstResult, skewConstant, ctlLength, arrowLength);
			this.setLinkSrc(linkContext, coords, srcNode, srcID, dstID, c1, gridMapperSrcResult, skewConstant);
		    }

		} else {

		    var dstY = dstPoint.y  + r2.h;

		    if (aa) {
		    if (debug_aa) alert('aa adjust 3');
			dstY += arrowLength;
		    }

		    //
		    // Src node bottom.
		    //
		    coords[0] = c1.x;
		    // fixx
		    // coords[1] = srcPoint.y + r1.h;
		    // coords[1] = srcPoint.y + LytNodeUtil.getNodeBottomConnectY(srcNode);
		    coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

		    coords[2 + ctlLength] = c2.x;
		    if (aa) {
			coords[3 + ctlLength] = dstPoint.y - arrowLength;
		    }
		    coords[3 + ctlLength] = dstPoint.y;

		    if (firstPass) gridMapperDst[dstIndex].top++;

		}
		// alert('cll long 8 ' + ctlPoints.length + ' ' + coords.length);
		// alert(' srcID ' + srcID + ' dstID ' + dstID);


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}


	    } else if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

		// down left
		// claim10

		if (Math.abs(srcCol - dstCol) == 1 || Math.abs(srcRow - dstRow) == 1) {

		    if (!firstPass) {
			this.setLinkDst(linkContext, coords, dstNode, srcID, dstID, c2, gridMapperDstResult, skewConstant, ctlLength, arrowLength);
			this.setLinkSrc(linkContext, coords, srcNode, srcID, dstID, c1, gridMapperSrcResult, skewConstant);
		    }


		} else {


		    var dstY = dstPoint.y  + r2.h;
		    if (aa) {
		    if (debug_aa) alert('aa adjust 4');
			dstY += arrowLength;
		    }

		    //
		    // Src node bottom.
		    //
		    coords[0] = c1.x;
		    // coords[1] = srcPoint.y + r1.h;
		    // coords[1] = srcPoint.y + LytNodeUtil.getNodeBottomConnectY(srcNode);
		    coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

		    coords[2 + ctlLength] = c2.x;
		    if (aa) {
			coords[3 + ctlLength] = dstPoint.y - arrowLength;
		    }
		    else coords[3 + ctlLength] = dstPoint.y;

		    if (firstPass) gridMapperDst[dstIndex].top++;

		}


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    } else if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

		// claim01

		// 312
		// alert(' set coords is down right');
		if (Math.abs(srcCol - dstCol) == 1 || Math.abs(srcRow - dstRow) == 1) {

		    if (!firstPass) {
			this.setLinkDst(linkContext, coords, dstNode, srcID, dstID, c2, gridMapperDstResult, skewConstant, ctlLength, arrowLength);
			this.setLinkSrc(linkContext, coords, srcNode, srcID, dstID, c1, gridMapperSrcResult, skewConstant);
		    }

		} else {

		    coords[0] = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
		    coords[1] = LytNodeUtil.getNodeAbsoluteConnectCenterY(srcNode);

		    if (aa) {
			coords[2 + ctlLength] = dstPoint.x - arrowLength;
		    }
		    else coords[2 + ctlLength] = dstPoint.x;
		    coords[3 + ctlLength] = c2.y;

		    if (firstPass) gridMapperDst[dstIndex].left++;

		}

		// alert(' *** up right call backoffArrowDstForCoordsAndCtl ' + ctlLength);
		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    } else if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

		// special 00
		// special !d!r

		if (debug2) alert('!d!r ' + firstPass);

		// claim9

		if (Math.abs(srcCol - dstCol) == 1 || Math.abs(srcRow - dstRow) == 1) {

		    if (debug2) alert('!d!r close ');

		    if (!firstPass) {

			this.setLinkDst(linkContext, coords, dstNode, srcID, dstID, c2, gridMapperDstResult, skewConstant, ctlLength, arrowLength);
			this.setLinkSrc(linkContext, coords, srcNode, srcID, dstID, c1, gridMapperSrcResult, skewConstant);
		    }


		} else {

		    coords[0] = c1.x;
		    // coords[1] = srcPoint.y + r1.h;
		    // coords[1] = srcPoint.y + LytNodeUtil.getNodeBottomConnectY(srcNode);
		    coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

		    if (aa) {
			coords[2 + ctlLength] = dstPoint.x - arrowLength;
		    }
		    else coords[2 + ctlLength] = dstPoint.x;
		    coords[3 + ctlLength] = c2.y;

		    if (firstPass) 
			gridMapperDst[dstIndex].left++;

		}


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    } else {

		if (debug2) alert(' srcID ' + srcID + ' dstID ' + dstID + ' backlink() ');

		//
		// Backlink - link to node bottoms.
		//

		var dstY = dstPoint.y  + r2.h;
		if (aa) {
		    if (debug_aa) alert('aa adjust 5');
		    dstY += arrowLength;
		}

		coords[0] = c1.x;
		// coords[1] = srcPoint.y + LytNodeUtil.getNodeBottomConnectY(srcNode);
		coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);
		// coords[1] = srcPoint.y + r1.h;

		coords[2 + ctlLength] = c2.x;
		coords[3 + ctlLength] = dstY;

		if (firstPass) {
		    if (srcY < dstY) gridMapperDst[dstIndex].top++;
		    else gridMapperDst[dstIndex].bottom++;
		}


		if (!firstPass) {
		    LytChannelRouteUtil.backoffArrowDstForCoordsAndCtl(linkContext, coords, ctlPoints);
		    LytChannelRouteUtil.callCenterLinkLabel(linkContext, ctlPoints, coords, firstPass);
		}

	    }
	}

	// 
	// copy points if they have been set.
	// 
	if (LytChannelRouteUtil.isLongHorizontalRoute(linkContext, layoutDesc, layoutFlow, grid) 
	    || LytChannelRouteUtil.isLongVerticalRoute(linkContext, layoutDesc, layoutFlow, grid)
	    || LytChannelRouteUtil.isLongDiagonalRoute(linkContext, layoutFlow, route, grid)) {

	    //
	    // copy the control points into the return array.
	    //
	    for (var k=0; k<ctlLength; k++) {

		coords[2 + k] = ctlPoints[k];
	    }

	    linkContext.setPoints(coords);

	}
    }


    return coords;

}

//
// Call center link label with the correct parameters,
// depending on the number of control points.
//
LytChannelRouteUtil.callCenterLinkLabel = function(linkContext, ctlPoints, coords, firstPass) {

    if (firstPass) return;

    if (ctlPoints.length >= 6)
	LytLabelUtil.centerLinkLabel(linkContext, ctlPoints[2], ctlPoints[3], ctlPoints[4], ctlPoints[5]);
    else if (ctlPoints.length >= 4)
	LytLabelUtil.centerLinkLabel(linkContext, ctlPoints[0], ctlPoints[1], ctlPoints[2], ctlPoints[3]);
    else if (ctlPoints.length >= 2) {
	LytLabelUtil.centerLinkLabel(linkContext, coords[0], coords[1], ctlPoints[0], ctlPoints[1]);
    } else {
	LytLabelUtil.centerLinkLabel(linkContext, coords[0], coords[1], coords[2], coords[3]);
    }

}

/**
@param srcID - used for debugging
@param dstID - used for debugging
@param coords - return values
*/
LytChannelRouteUtil.prototype.setLinkSrc = function(l, coords, srcNode, srcID, dstID, c1, gridMapperSrcResult, skewConstant) {

    var d = false;

    if (d) alert('setLinkSrc');

    //
    // Switch on SrcResult.
    //
    if (gridMapperSrcResult.top) {

	if (d) alert('gridMapperSrcResult.top');

	coords[0] = c1.x;
	coords[1] =  LytNodeUtil.getNodeAbsoluteTopConnectY(srcNode);

    } else if (gridMapperSrcResult.top_skew_left) {

	if (d) alert('gridMapperSrcResult.sl');
	coords[0] = c1.x - skewConstant;
	coords[1] =  LytNodeUtil.getNodeAbsoluteTopConnectY(srcNode);

    } else if (gridMapperSrcResult.top_skew_right) {

	if (d) alert('gridMapperSrcResult.sr');
	coords[0] = c1.x + skewConstant;
	coords[1] =  LytNodeUtil.getNodeAbsoluteTopConnectY(srcNode);

    } else if (gridMapperSrcResult.left) {

	if (d) alert('gridMapperSrcResult.l');
	coords[0] = LytNodeUtil.getNodeAbsoluteLeftConnectX(srcNode);
	coords[1] = c1.y;

    } else if (gridMapperSrcResult.left_skew_top) {

	coords[0] = LytNodeUtil.getNodeAbsoluteLeftConnectX(srcNode);
	coords[1] = c1.y - skewConstant;
    }
    else if (gridMapperSrcResult.bottom) {
	coords[0] = c1.x;
	coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);
    }
    else if (gridMapperSrcResult.bottom_skew_right) {

	coords[0] = c1.x + skewConstant;
	coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

    } 
    else if (gridMapperSrcResult.bottom_skew_left) {

	coords[0] = c1.x - skewConstant;
	coords[1] = LytNodeUtil.getNodeAbsoluteBottomConnectY(srcNode);

    } 
    else if (gridMapperSrcResult.right) {

	coords[0] = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
	coords[1] = c1.y;
    }
    else if (gridMapperSrcResult.right_skew_bottom) {

	coords[0] = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
	coords[1] = c1.y + skewConstant;
    }
    else if (gridMapperSrcResult.right_skew_top) {

	coords[0] = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
	coords[1] = c1.y - skewConstant;
    }
    else if (gridMapperSrcResult.left_skew_bottom) {

	coords[0] = LytNodeUtil.getNodeAbsoluteLeftConnectX(srcNode);
	coords[1] = c1.y + skewConstant;

    } else {
	alert('error no gridMapperSrcResult srcID ' + srcID + ' dstID ' + dstID + ' ' + gridMapperSrcResult);
    }


}

LytChannelRouteUtil.prototype.setLinkDst = function(l, coords, dstNode, srcID, dstID, c2, gridMapperDstResult, skewConstant, ctlLength, arrowLength) {

    // alert(' setLinkDst ');

    var debug = false;

    if (gridMapperDstResult.top) {

	if (debug) alert('setLinkDst top');
	// coords[0] = LytNodeUtil.getNodeAbsoluteRightConnectX(srcNode);
	// coords[1] = c1.y;

	coords[2 + ctlLength] = c2.x;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);

    } else if (gridMapperDstResult.right) {

	if (debug) alert('setLinkDst right');

	coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteRightConnectX(dstNode);
	coords[3 + ctlLength] = c2.y;

    } else if (gridMapperDstResult.left) {

	if (debug) alert('setLinkDst left');

	coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteLeftConnectX(dstNode);
	coords[3 + ctlLength] = c2.y;

    }  else if (gridMapperDstResult.bottom) {

	if (debug) alert('setLinkDst bottom');

	coords[2 + ctlLength] = c2.x;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteBottomConnectY(dstNode);

    } else if (gridMapperDstResult.left_skew_bottom) {

	coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteLeftConnectX(dstNode);
	coords[3 + ctlLength] = c2.y + skewConstant;

    } else if (gridMapperDstResult.left_skew_top) {

	coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteLeftConnectX(dstNode);
	coords[3 + ctlLength] = c2.y - skewConstant;

    } else if (gridMapperDstResult.top_skew_left) {

	coords[2 + ctlLength] = c2.x - skewConstant;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);

    } else if (gridMapperDstResult.top_skew_right) {

	coords[2 + ctlLength] = c2.x + skewConstant;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteTopConnectY(dstNode);

    } else if (gridMapperDstResult.bottom_skew_right) {
	
	coords[2 + ctlLength] = c2.x + skewConstant;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteBottomConnectY(dstNode);

    } else if (gridMapperDstResult.bottom_skew_left) {
	
	coords[2 + ctlLength] = c2.x - skewConstant;
	coords[3 + ctlLength] =  LytNodeUtil.getNodeAbsoluteBottomConnectY(dstNode);

    } else if (gridMapperDstResult.right_skew_bottom) {

	coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteRightConnectX(dstNode);
	coords[3 + ctlLength] = c2.y + skewConstant;

    } else if (gridMapperDstResult.right_skew_top) {

	 coords[2 + ctlLength] = LytNodeUtil.getNodeAbsoluteRightConnectX(dstNode);
	coords[3 + ctlLength] = c2.y - skewConstant;

    } else {
	alert('error no gridMapperDstResult srcID ' + srcID + ' dstID ' + dstID + ' ' + gridMapperDstResult);
	for (p in gridMapperDstResult) {
	    alert(' prop ' + p);
	}
    }

    LytChannelRouteUtil.backoffArrowDstForCoords(l, coords);


}



// m15

//
// Merge vertical link segments under some conditions:
//
//   - src/dst are in same row.
//   - destination node ids match (shown below), or
//   - source node ids match.
//
//   ---       ---                             ---       
//  |   |     |   |                           |   |
//  |   |-    |   |-                       -->|   |
//  |   | |   |   | |                     |   |   |
//   ---  |    ---  |                     |    --- 
//        |          ---------------------|
//         -------------------------------
//
//
function mergeR2RDst(colLinksOut, colLinksOut_Merge, grid) {

    // 
    var debug = false;

    for (var i=0; i<colLinksOut.length; i++) {

	var a = colLinksOut[i];
	if (!a) continue;

	//
	// iterate over colLinksOut[],
	// 
	for (var j=0; j < a.length; j++) {

	    if (debug) alert('mergeR2R col ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' ' + a[j].srcCol + ' ' + a[j].dstCol);

	    var srcID = a[j].l.getStartId();
	    var dstID = a[j].l.getEndId();

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    // alert('srcRow ' + srcRow + ' dstRow ' + dstRow);
	    // alert('srcCol ' + srcCol + ' dstCol ' + dstCol);

	    //
	    // We essentially push (onto [row][col] grid locations) link IDs.
	    // After processing, any grid location that has > 1 link ID => we should merge link IDs.
	    //

	    if (srcRow == dstRow) {

		if (debug) alert('candidate for row ' + srcRow + ' in col ' + i);

		if (!colLinksOut_Merge[dstRow]) colLinksOut_Merge[dstRow] = new Array();
		if (!colLinksOut_Merge[dstRow][dstCol]) colLinksOut_Merge[dstRow][dstCol] = new Array();
		// push just the link, or the row2row?
		// colLinksOut_Merge[dstRow][dstCol].push(a[j].l);
		colLinksOut_Merge[dstRow][dstCol].push(a[j]);

		if (debug) alert(' push ' + dstRow + ' ' + dstCol);
	    }
	}
    }
}

// Copied from above
function mergeR2RDstRow(rowLinksOut, rowLinksOut_Merge, grid) {

    // 
    var debug = false;

    for (var i=0; i<rowLinksOut.length; i++) {

	var a = rowLinksOut[i];
	if (!a) continue;

	//
	// iterate over rowLinksOut[],
	// 
	for (var j=0; j < a.length; j++) {

	    if (debug) alert('mergeR2R row ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' ' + a[j].srcRow + ' ' + a[j].dstRow);

	    var srcID = a[j].l.getStartId();
	    var dstID = a[j].l.getEndId();

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    if (srcCol == dstCol) {

		if (debug) alert('candidate for row ' + srcCol + ' in row ' + i);

		if (!rowLinksOut_Merge[dstCol]) rowLinksOut_Merge[dstCol] = new Array();
		if (!rowLinksOut_Merge[dstCol][dstRow]) rowLinksOut_Merge[dstCol][dstRow] = new Array();

		rowLinksOut_Merge[dstCol][dstRow].push(a[j]);

	    }
	}
    }
}

//
// Version for source.
//
function mergeR2RSrc(colLinksOut, colLinksOut_Merge, grid) {

    var debug = false;

    for (var i=0; i<colLinksOut.length; i++) {

	var a = colLinksOut[i];
	if (!a) continue;

	//
	// iterate over colLinksOut[],
	// 
	for (var j=0; j < a.length; j++) {

	    if (debug) alert('mergeR2R col ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' ' + a[j].srcCol + ' ' + a[j].dstCol);

	    var srcID = a[j].l.getStartId();
	    var dstID = a[j].l.getEndId();

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    // alert('srcRow ' + srcRow + ' dstRow ' + dstRow);
	    // alert('srcCol ' + srcCol + ' dstCol ' + dstCol);

	    //
	    // We essentially push (onto [row][col] grid locations) link IDs.
	    // After processing, any grid location that has > 1 link ID => we should merge link IDs.
	    //

	    if (srcRow == dstRow) {

		if (debug) alert('candidate for row ' + srcRow + ' in col ' + i);

		if (!colLinksOut_Merge[srcRow]) colLinksOut_Merge[srcRow] = new Array();
		if (!colLinksOut_Merge[srcRow][srcCol]) colLinksOut_Merge[srcRow][srcCol] = new Array();
		// push just the link, or the row2row?
		// colLinksOut_Merge[srcRow][srcCol].push(a[j].l);
		colLinksOut_Merge[srcRow][srcCol].push(a[j]);

		if (debug) alert(' push ' + srcRow + ' ' + srcCol);
	    }
	}
    }
}

//
// Version for source row.
// Function was copied and modified based on mergeR2RSrc()
//
function mergeR2RSrcRow(rowLinksOut, rowLinksOut_Merge, grid) {

    var debug = false;

    for (var i=0; i<rowLinksOut.length; i++) {

	var a = rowLinksOut[i];
	if (!a) continue;

	//
	// iterate over rowLinksOut[],
	// 
	for (var j=0; j < a.length; j++) {

	    if (debug) alert('mergeR2R row ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' ' + a[j].srcRow + ' ' + a[j].dstRow);

	    var srcID = a[j].l.getStartId();
	    var dstID = a[j].l.getEndId();

	    var srcIndex = grid.getGridIndex(srcID);
	    var dstIndex = grid.getGridIndex(dstID);

	    var srcCol = grid.getCol(srcIndex);
	    var dstCol = grid.getCol(dstIndex);

	    var srcRow = grid.getRow(srcIndex);
	    var dstRow = grid.getRow(dstIndex);

	    // alert('srcRow ' + srcRow + ' dstRow ' + dstRow);
	    // alert('srcCol ' + srcCol + ' dstCol ' + dstCol);

	    //
	    // We essentially push (onto [row][row] grid locations) link IDs.
	    // After processing, any grid location that has > 1 link ID => we should merge link IDs.
	    //

	    if (srcCol == dstCol) {

		if (debug) alert('candidate for row ' + srcRow + ' in row ' + i);

		if (!rowLinksOut_Merge[srcCol]) rowLinksOut_Merge[srcCol] = new Array();
		if (!rowLinksOut_Merge[srcCol][srcRow]) rowLinksOut_Merge[srcCol][srcRow] = new Array();
		rowLinksOut_Merge[srcCol][srcRow].push(a[j]);

		// if (debug) alert(' push ' + srcRow + ' ' + srcCol);
	    }
	}
    }
}

//
// Examine all colLinksOut
// If any are mirrored, copy the linkVerChannel of all to the mirror
//
function copyMirror(colLinksOut, linkVertChannel, colLinksOutMirror) {

    var debug = false;

    for (var i=0; i<colLinksOut.length; i++) {

	var a = colLinksOut[i];
	if (!a) continue;

	for (var j=0; j < a.length; j++) {

	    if (debug) alert('*col linksout linkID ' + a[j].l.getId() + ' => ' +  linkVertChannel[i][a[j].l.getId()])
	    if (colLinksOutMirror[a[j].l.getId()]) {

		var b = colLinksOutMirror[a[j].l.getId()];
		if (debug) alert(a[j].l.getId() + ' is mirrored, length ' + b.length);

		for (var k=0; k < b.length; k++) {
		    if (debug) alert(' contains * ' + b[k].getId());
		    // use the same channel as the mirrored link
		    linkVertChannel[i][b[k].getId()] = linkVertChannel[i][a[j].l.getId()];
		    if (debug) alert(' assign ' +  b[k].getId() + ' to same as ' + a[j].l.getId());
		    if (debug) alert('linkVertChannel[][' + b[k].getId() + '] = ' + linkVertChannel[i][a[j].l.getId()]);
		}
	    }
	}
    }
}

function formatLink(l) {

    return(l.getStartId() + '-' +  l.getEndId() );
}


//
// Prune the link from colLinksOut.
// (add to a mirror)
//
//
//         a) remove "should prunes" from colLinksOut.
//         b) map all removed link ids to position of remaining mirror.
//
// note - currently, we do nothing with the mirror, since the mirrored links default to the correct location.
//
function prune(colLinksOut, colLinksOut_Merge, grid, colLinksOutMirror) {

    var debug = false;

    for (var i=0; i<colLinksOut_Merge.length; i++) {

	var a = colLinksOut_Merge[i];
	if (!a) continue;

	// Prune all ...

	for (var j=0; j < a.length; j++) {

	    var b = a[j];

	    if (!b) continue

	    //
	    // b[0].l is the link that we "keep"
	    // Any additional ones are deleted from colLinksOut and are also mirrored
	    //
	    for (var k=1; k < b.length; k++) {

		if (debug) alert(' should prune ' + i + ' link ' + b[k].l.getId());


		// Removing from colLinksOut - 

		// j is the col
		var c = colLinksOut[j];
		if (!c) continue;

		for (var m=0; m < c.length; m++) {

		    if (debug) alert('check col ' + m + ' link ' + c[m].l.getStartId() + ' ' +  c[m].l.getEndId() + ' ' + c[m].srcCol + ' ' + c[m].dstCol);

		    if (c[m].l == b[k].l) {
			
			if (debug) alert('equals mirror[' + b[0].l.getId() + '].push(' + b[k].l.getId() + ')');

			//
			// Push all common links into the node to the mirror
			//
			// Is [0] guaranteed ?
/*
			if (!colLinksOutMirror[b[0].l]) colLinksOutMirror[b[0].l] = new Array();
			colLinksOutMirror[b[0].l].push(b[k].l);
*/
			if (!colLinksOutMirror[b[0].l.getId()]) colLinksOutMirror[b[0].l.getId()] = new Array();
			colLinksOutMirror[b[0].l.getId()].push(b[k].l);
			// if (debug) alert(' colLinksOutMirror[b[0].l][0] ' + colLinksOutMirror[b[0].l][0].getId());
			if (debug) alert(' colLinksOutMirror[b[0].l][0] ' + colLinksOutMirror[b[0].l.getId()][0].getId());

			c.splice(m,1);  // remove from colLinksOut array
			break;
		    }
		}
	    }
	}
    }
}



function dumpAllocatedChannel(channel, j, a) {

    alert(' Link: ' + a[j].l.getId()  +  ' src-dst col/row: (' + a[j].srcCol + ', ' + a[j].dstCol + ') allocate Channel[' + j + ']: = ' + formatChannel(channel[j]));

}


// 
// Map linkIDs to channels.
// 
// 
// Input
//  
//   - grid
//   - rowLinksOut
// 
// Result of this is 
//
//   - linkMainChannel[], which maps link IDs to channels,
//   - channelLinkeCount[] stores the number of lines for each channel
//   - horizontal: boolean
// 
// Note: written as a row map, also used as a column map.
// 
// 
function mapLinksToChannel(grid, rowLinksOut, linkMainChannel, channelLineCount, horizontal) {

    if (!rowLinksOut) return;

    var debug = false;

    if (debug) alert('----------mapLinksToChannel ' + horizontal);
    
    for (var i=0; i<rowLinksOut.length; i++) {

	// one mapping channel per row (or column)
	linkMainChannel[i] = new Array();

	//
	// each row has a channel
	// 
	var channel = new Array();

	var a = rowLinksOut[i];
	if (!a) continue;

	// Init for mergeMap distinction.
	for (var j=0; j < a.length; j++) linkMainChannel[i][a[0].l.getId()] = -1;

	//
	// iterate over rowLinksOut[],
	// 
	for (var j=0; j < a.length; j++) {

	    // m15
	    if (debug) 
		alert('row ' + i + ' link ' + a[j].l.getStartId() + ' ' +  a[j].l.getEndId() + ' ' + a[j].srcCol + ' ' + a[j].dstCol);

	    // var srcIndex = grid.getGridIndex(srcID);
	    // var srcCol = grid.getCol(srcIndex);



	    if (j == 0) {

		var bitmap = new Array();
		if (horizontal) clearBitmap(bitmap, grid.getNumCols());
		else clearBitmap(bitmap, grid.getNumRows());
		// allocate space for first link.
		setBitmap(a[j], bitmap);

		// first channel stores bitmap
		channel[0] = bitmap;

		if (debug) dumpAllocatedChannel(channel, j, a);

		// point link id to allocated channel 0
		linkMainChannel[i][a[0].l.getId()] = 0;

		if (debug) alert(' linkMainChannel[' + a[j].l.getId() + '] = ' + linkMainChannel[i][a[j].l.getId()]);
		
	    } else {

		var found = true;
		// check all existing allocated channels for a slot

		for (var chIndex=0; chIndex < channel.length; chIndex++) {

		    if (debug) alert(' check channel ' + chIndex + ' ' + formatChannel(channel[chIndex]));

		    var startCol = a[j].srcCol;
		    var endCol = a[j].dstCol;

		    if (startCol > endCol) {
			var startCol = a[j].dstCol;
			var endCol = a[j].srcCol;
		    }

		    for (var k=startCol; k < endCol; k++) {
			if (channel[chIndex][k] != 0) { 
			    found = false;
			    // alert(' not found ' + chIndex);
			    break; 
			}
		    }
		    
		    if (found) {

			// 
			// claim part of an existing channel
			// 
			setBitmap(a[j], channel[chIndex]);
			
			// point link id to allocated channel
			linkMainChannel[i][a[j].l.getId()] = chIndex;

			if (debug) alert(i + ' claim ' + j + ' linkID ' + a[j].l.getId() + ' bitmap[ ' + chIndex + "] = " + bitmapToString(channel[chIndex]));
			if (debug) alert('f* linkMainChannel[' + i + '][' + a[j].l.getId() + '] = ' + linkMainChannel[a[j].l.getId()]);
			break;
		    }
		}

		if (!found) {

		    //
		    // Allocate a new channel.
		    //

		    var bitmap = new Array();
		    if (horizontal) clearBitmap(bitmap, grid.getNumCols());
		    else clearBitmap(bitmap, grid.getNumRows());

		    setBitmap(a[j], bitmap);

		    channel[channel.length] = bitmap;
		    linkMainChannel[i][a[j].l.getId()] = channel.length - 1;


		    if (debug) alert(i + ' claim ' + j + ' linkID ' + a[j].l.getId() + ' bitmap[ ' + chIndex + "] = " + bitmapToString(channel[chIndex]));
		    if (debug) alert('!f* linkMainChannel[' + i + '][' + a[j].l.getId() + '] = ' + linkMainChannel[a[j].l.getId()]);

		    if (debug) dumpAllocatedChannel(channel, j, a);

		}
	    }
	}

	// save this for the number of elements in the channel.
	channelLineCount[i] = channel.length;
	// alert(' i ' + i + ' cl ' + channel.length);

	// rowSegments[] 

    }
}

//
// allocate a range in a bitmap.
//
function setBitmap(segment, bitmap) {

    var startCol = segment.srcCol;
    var endCol = segment.dstCol;

    if (segment.srcCol > segment.dstCol) {
	startCol = segment.dstCol;
	endCol = segment.srcCol;
    }

    for (var k=startCol; k < endCol; k++) bitmap[k] = 1;

}

function bitmapToString(bitmap) {

    var bitmapString = "["; 

    for (var k=0; k < bitmap.length; k++) {
	if (k != 0) bitmapString += ".";
	if (bitmap[k] == 1) bitmapString += "1";
	else bitmapString += "0";
    }

    bitmapString += "]";

    return bitmapString;
    
}

function clearBitmap(bitmap, length) {
    // alert(' clearB ' +  length);
    for (var k=0; k < length; k++) bitmap[k] = 0;
}


function formatChannel(chan) {

    if (!chan) return "";

    var c = "[";

    for (var k=0; k < chan.length; k++) {
	if (k != 0) c += "."
	if (chan[k] == 0) c += '0';
	else c += '1';
    }

    c += "]";

    return c;

}


function sortIndex(a,b) {
    return (a.index - b.index);
}


//
// a node index contains a nodeID and an index.
// The index, such as dstCol, is used as a sort key.
// (this single index works for sorting forward links, or sorting backlinks).
// (it would not work for sorting both).
//
function nodeIndex(ID, index) {
    this.ID = ID;
    this.index = index;
}

//
// For horizontal segments
// Link segment data structure.
// srcCol and dstCol mark the length of the link within the grid.
//
function rowToRow(l, srcCol, dstCol, shortSeg) {
    this.l = l;
    this.srcCol = srcCol;
    this.dstCol = dstCol;
    this.shortSeg = shortSeg;
}

// m14

function sortColDistance(a,b) {

    //
    // force short segments to be in the outermost channel
    //
    if (a.shortSeg == 1) return(100);
    return (Math.abs(a.srcCol - a.dstCol) -  Math.abs(b.srcCol - b.dstCol));
}

// Cols are misnomers - use so we can use rowToRow interchangeably
function sortRowDistance(a,b) {
    if (a.shortSeg == 1) return(100);
    return (Math.abs(a.srcCol - a.dstCol) -  Math.abs(b.srcCol - b.dstCol));
}

//
// Return true if the src and dst rows are equal.
//
function isHorizontalRoute(l, layoutFlow, grid) {

    if (!grid) return false;

    var dstID = l.getEndId();
    var srcID = l.getStartId();

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    var srcCol = grid.getCol(srcIndex);
    var srcRow = grid.getRow(srcIndex);

    var dstCol = grid.getCol(dstIndex);
    var dstRow = grid.getRow(dstIndex);

    // alert(' src row/col ' + srcRow + ' ' + srcCol + ' dst row/col ' + dstRow + ' ' + dstCol);

    if (srcRow == dstRow) return true;

    return false;
}

function isVerticalRoute(l, layoutFlow, grid) {

    if (!grid) return false;

    var dstID = l.getEndId();
    var srcID = l.getStartId();

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    var srcCol = grid.getCol(srcIndex);
    var dstCol = grid.getCol(dstIndex);

    if (srcCol == dstCol) return true;

    return false;
}

//
// return true if the link is a long horizontal route.
//
LytChannelRouteUtil.isLongHorizontalRoute = function(l, layoutDesc, layoutFlow, grid) {

    var debug = false;

    if (!grid) return false;

    var srcID = l.getStartId();
    var dstID = l.getEndId();

    //
    // If there is a clear path to two horizontal nodes, return false
    // (so we route straight instead of channel)
    //
    if (layoutDesc instanceof LytSparseGridLayoutDesc) {
	if (layoutDesc.isClearPathX(srcID, dstID)) {
	    // alert(' isClearPathX ' + srcID + ' ' + dstID);
	    return false;
	}
    }

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    var srcCol = grid.getCol(srcIndex);
    var srcRow = grid.getRow(srcIndex);

    if (debug) alert(' srcID ' + srcID + ' dstID ' + dstID + ' srcIndex ' + srcIndex + ' dstIndex ' + dstIndex);

    var dstCol = grid.getCol(dstIndex);
    var dstRow = grid.getRow(dstIndex);

    if (debug) alert(' srcID ' + srcID + ' dstID ' + dstID + ' srcRow ' + srcRow + ' dstRow ' + dstRow + ' srcCol ' + srcCol + ' dstCol ' + dstCol);

    if (srcRow != dstRow) return false;
    
    if (debug) alert(' calc ' + Math.abs(srcCol - dstCol));

    if (Math.abs(srcCol - dstCol) > 1) return true;

    return false;
}

// 
// Note use of route parameter.
// 
LytChannelRouteUtil.isLongDiagonalRoute = function(l, layoutFlow, route, grid) {

    var debug = false;

    if (!grid) return false;

    var srcID = l.getStartId();
    var dstID = l.getEndId();

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    var srcCol = grid.getCol(srcIndex);
    var srcRow = grid.getRow(srcIndex);

    var dstCol = grid.getCol(dstIndex);
    var dstRow = grid.getRow(dstIndex);

    if (debug) alert(' call isLongD ' + srcCol + ' ' + srcRow + ' dstcol ' + dstCol + ' dstrow ' + dstRow + ' route ' + route);


    //
    // Enhancement - relax condition, use orthog routes for long row/adjacent col or visa versa
    //

    // j28

    if (Math.abs(srcCol - dstCol) > 1 && Math.abs(srcRow - dstRow) > 1) return true;

    switch(route) {

    case LytLayout.ROUTE_STRAIGHT:
    case LytLayout.ROUTE_CHANNEL_HYBRID:
    default:
	if (Math.abs(srcCol - dstCol) > 1 && Math.abs(srcRow - dstRow) > 1) return true;
	break;

    case LytLayout.ROUTE_CHANNEL:

	// 
	// This condition will render orthogonal for 1,1 also.
	// 
	if (Math.abs(srcCol - dstCol) >= 1 && Math.abs(srcRow - dstRow) >= 1) return true;

	// if (Math.abs(srcCol - dstCol) >= 1 && Math.abs(srcRow - dstRow) > 1) return true;
	// if (Math.abs(srcCol - dstCol) > 1 && Math.abs(srcRow - dstRow) >= 1) return true;

	break;
    }

    return false;
}

LytChannelRouteUtil.isLongVerticalRoute = function(l, layoutDesc, layoutFlow, grid) {

    var debug = false;

    if (!grid) return false;

    var srcID = l.getStartId();
    var dstID = l.getEndId();

    if (layoutDesc instanceof LytSparseGridLayoutDesc) {
	if (layoutDesc.isClearPathY(srcID, dstID)) return false;
    }

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    var srcCol = grid.getCol(srcIndex);
    var srcRow = grid.getRow(srcIndex);

    var dstCol = grid.getCol(dstIndex);
    var dstRow = grid.getRow(dstIndex);

    if (debug) alert(' isLongVerticalRoute:  srcIndex ' + srcIndex + ' dstIndex ' + dstIndex);
    if (debug) alert(' isLongVerticalRoute:  srcID ' + srcID + ' dstID ' + dstID + ' srcRow ' + srcRow + ' dstRow ' + srcRow);

    if (srcCol != dstCol) return false;

    // if (Math.abs(srcCol - dstCol) > 1) return false;
    
    if (Math.abs(srcRow - dstRow) > 1) return true;

    return false;
}



//
// for horizontal left-to-right layout.   Extend for vertical layout.
//
LytChannelRouteUtil.isForwardLink = function(srcCol, dstCol) {

    var forwardLink = false;
    if ((dstCol - srcCol) > 0) forwardLink = true;

    return forwardLink;

}

var CHANNEL_WIDTH = 0.4;   // entire channel width - max is half the padding.
var MIDDLE_SPACER = 0.05;
var CHANNEL_WIDTH_MIDDLE = 1.0 - (2 * CHANNEL_WIDTH) - MIDDLE_SPACER;


//
// Note - the arrow length is used as a basis for channel width determination
//
function channel(arrowLength, pad, initBase, channelWidth) {

    var debug = false;

    if (debug)
	alert('function channel ' + arrowLength + ' ' + pad + ' ' + initBase + ' ' + channelWidth);

    arrowLengthMin = Math.max(arrowLength, 2);

    this.pad = pad;
    this.channelBaseOffset = initBase;

    this.channelDelta = 0;
    this.channelTotalSpace = 0;
    this.channelSpace = 0;
    
    this.channelSpace = this.pad * 1 / 8;
    this.channelSpace = Math.max(this.channelSpace, 3 * arrowLengthMin);

    // alert(' cs* ' + this.channelSpace);

    this.channelBaseOffset += this.channelSpace;
    // this.channelTotalSpace = this.pad * 1 / 4;

    // total space is channelWidth minus the space
    // this.channelTotalSpace = (this.pad * channelWidth - this.channelSpace);
    this.channelTotalSpace = (this.pad * channelWidth);

    // alert(this.pad + ' pad times ' + (this.pad * channelWidth));

    // alert(' channelWidth ' + channelWidth + ' channelSpace ' + this.channelSpace);
    // alert(' channelTotalSpace ' + this.channelTotalSpace);

    this.channelTotalSpace = Math.max(2, this.channelTotalSpace);

}

function printChannel(ch) {

    alert(' channelSpace ' + ch.channelSpace + ' channelTotalSpace ' + ch.channelTotalSpace + ' channelBaseOffset ' + ch.channelBaseOffset);

}

//
// the middle channel is offset from the center
//
//
function channelMiddle(arrowLength, pad, initBase) {

    this.pad = pad;
    this.channelBaseOffset = initBase;

    this.channelDelta = 0;  // place holder, used later as a function of the index.
    this.channelTotalSpace = 0;
    this.channelSpace = 0;
    
    this.channelBaseOffset += this.channelSpace;
    
    this.channelTotalSpace = (this.pad * CHANNEL_WIDTH_MIDDLE);

}



function isDiag(srcRow, srcCol, dstRow, dstCol) {

    // j27
    // if (Math.abs(srcCol - dstCol) >= 2 && Math.abs(srcRow - dstRow) >= 2) return true;

    if (Math.abs(srcCol - dstCol) >= 1 && Math.abs(srcRow - dstRow) >= 2) return true;
    if (Math.abs(srcCol - dstCol) >= 2 && Math.abs(srcRow - dstRow) >= 1) return true;

    return false;
}

//
// When false, links that are close (adjacent rows or adjacent columns)
// are drawn straignt.
//
var routeCloseLinksOrthog = false;

// 313
LytChannelRouteUtil.isSpecialDiag = function(srcRow, dstRow, srcCol, dstCol) {

    if ((Math.abs(srcRow - dstRow) == 1)) return true;
    if ((Math.abs(srcCol - dstCol) == 1)) return true;

    return false;

}

LytChannelRouteUtil.isSpecialDiagVert = function(srcRow, dstRow, srcCol, dstCol) {

    if ((Math.abs(srcRow - dstRow) > 1) &&(Math.abs(srcCol - dstCol) == 1)) return true;

    return false;

}

LytChannelRouteUtil.isSpecialDiagHorz = function(srcRow, dstRow, srcCol, dstCol) {

    if ((Math.abs(srcRow - dstRow) == 1) &&(Math.abs(srcCol - dstCol) > 1)) return true;

    return false;

}

//
// another case where we need to allocate channels
// is when we call functions like gridRouteFullsquareDownLeft()
// These can be called when both row and column differences are equal to 1.
// (Not detected in isSpecialDiagVert()) ...
//
LytChannelRouteUtil.isSpecialDiagVertFS = function(grid, srcRow, dstRow, srcCol, dstCol) {

    if (Math.abs(srcRow - dstRow) != 1) return false;
    if (Math.abs(srcCol - dstCol) != 1) return false;

    if (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 ||
	grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)
	return false;

    return true;

}


//
// input Parameters:
//
// horzLinksOut: array of nodeIndex
//
// horz:boolean 
//
// Need another param to do a two-channel route.
//
function routeOrthog(layoutContext, l, layoutFlow, arrowLength, grid, 
		     horzLinksOut, linkHorzChannel, horzChannelLineCount,
		     horzLinksOutDst, linkHorzChannelDst, horzChannelLineCountDst,
		     vertLinksOut, linkVertChannel, vertChannelLineCount,
		     vertLinksOutDst, linkVertChannelDst, vertChannelLineCountDst,
		     horz, type, channelPadU, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, skewConstant, firstPass) {

    // alert('routeOrthog');

    // return value
    var debug = false;

    var ctlPoints=new Array();

    var dstID = l.getEndId();
    var srcID = l.getStartId();

    if (!dstID) return;
    if (!srcID) return;

    dstNode = layoutContext.getNodeById(dstID);
    srcNode = layoutContext.getNodeById(srcID);

    if (!dstNode) return;
    if (!srcNode) return;

    if (debug) alert('route ' + l.getId() + ' src ' + srcID + ' dst ' + dstID + ' horz ' + horz + ' type ' + type);

    // var srcPoint = srcNode.getPosition();
    // var dstPoint = dstNode.getPosition();
        
    var srcPoint = LytNodeUtil.getNodePosRel(layoutContext, srcNode, dstNode);
    var dstPoint = LytNodeUtil.getNodePosRel(layoutContext, dstNode, srcNode);

    var r1 = srcNode.getBounds();
    var r2 = dstNode.getBounds();

    var pt1 = LytLinkUtil.getSrcNodeLinkPosition(layoutContext, layoutFlow, srcID, dstID);
    var pt2 = LytLinkUtil.getDstNodeLinkPositionFlow(layoutContext, layoutFlow, srcID, dstID);

    var ctlPoints = new Array();

    var srcIndex = grid.getGridIndex(srcID);
    var dstIndex = grid.getGridIndex(dstID);

    // alert(srcID + ' grid index ' + grid.getGridIndex(srcID) + ' dstID ' +  dstID + ' grid index ' + grid.getGridIndex(dstID) );

    var srcCol = grid.getCol(srcIndex);
    var srcRow = grid.getRow(srcIndex);
    // alert(' src row/col ' + srcRow + ' ' + srcCol);

    var dstCol = grid.getCol(dstIndex);
    var dstRow = grid.getRow(dstIndex);
    // alert(' dst row/col ' + dstRow + ' ' + dstCol);

    // Check to make sure that we need to perform a channel route.
    // need to extend this condition when we handle vertical routes ?

    // if (horz && Math.abs(srcCol - dstCol) <= 1) return;
    // if (!horz && Math.abs(srcRow - dstRow) <= 1) return;

    //
    // New check, enables more orthog routes.
    //
    if (horz && Math.abs(srcCol - dstCol) < 1) return;
    // Return on a direct vertical link
    if (horz && Math.abs(srcCol - dstCol) <= 1 && (srcRow - dstRow) == 0) return;
    if (!horz && Math.abs(srcRow - dstRow) < 1) return;
    // Return on a direct horizontal link
    if (!horz && Math.abs(srcRow - dstRow) <= 1 && (srcCol - dstCol) == 0 ) return;

    var forwardLink;
    if (horz) forwardLink = LytChannelRouteUtil.isForwardLink(srcCol, dstCol);
    else forwardLink = LytChannelRouteUtil.isForwardLink(srcRow, dstRow);

    //
    //
    //  Forward link: (srcCol < dstCol)
    //         
    //   ------         ------ 
    //  |      |       |      |
    //  |srcCol|  ...  |dstCol| 
    //  |      |       |      |
    //   ------         ------ 
    //

    // var c1 = getNodeCenter(layoutContext, srcID);
    // var c2 = getNodeCenter(layoutContext, dstID);

    var c1 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, srcNode, dstNode);
    var c2 = LytNodeUtil.getNodeAbsoluteCenterConnectPointRel(layoutContext, dstNode, srcNode);

    //
    //
    //            |
    //   -----    |
    //  |     |   |
    //  |     |   |
    //  |     |   |
    //  |     |---   YConnectDelta 
    //  |     |
    //  |     |--- 
    //  |     |   |
    //  |     |   |
    //   -----    |
    //            |
    //
    // YConnectDelta is the node connection offset.
    // 

    var ySrcConnectBaseOffset = r1.h / 8;
    var yDstConnectBaseOffset = r2.h / 8;

    // forget it, place connectors on center

    var ySrcConnectBaseOffset = 0;
    var yDstConnectBaseOffset = 0;

    //
    // horzLinksOut[] maps a srcID to an array of dstID
    // The dstIDs are sorted, based on their distance from the srcID
    // So the index that matches dstID determines the linkOut slot.
    //

/*


    var kInverse = 0;

    if (horz) {

	for (k=0; k<horzLinksOut.length; k++) {
	    if (horzLinksOut[k].ID == dstID) {
		break;
	    }
	}

	kInverse = horzLinksOut.length - k - 1;

    } else {
	if (vertLinksOut) {
	for (k=0; k<vertLinksOut.length; k++) {
	    if (vertLinksOut[k].ID == dstID) {
		break;
	    }
	}
	kInverse = vertLinksOut.length - k - 1;

	}
    }

    //
    // use (k+1) as a scalar function ... 
    // 

    var kindex = k;
    if (!forwardLink) kindex = kInverse;
    if (srcConnectSingle) kindex = 0;

*/

    var kindex = LytChannelRouteUtil.getKIndex(horz, srcRow, dstRow, srcCol, dstCol, horzLinksOut, vertLinksOut);
    // alert('LinkUtil ' + srcID + ' ' + dstID + ' kindex ' + kindex);

    var srcNodeTotalVertConnectSpace;

    if (horz)
	srcNodeTotalVertConnectSpace = r1.h * 1/ 4;
    else
	srcNodeTotalVertConnectSpace = r1.w * 1/ 4;

/*

    var ySrcConnectDelta;



    if (horz)
	ySrcConnectDelta = getSlot(kindex, horzLinksOut.length, srcNodeTotalVertConnectSpace);
    else 
	ySrcConnectDelta = getSlot(kindex, vertLinksOut.length, srcNodeTotalVertConnectSpace);

    ySrcConnectDelta += ySrcConnectBaseOffset;

*/



    //             ---- 
    //            |  ---- 
    //            | |
    //   -----    | |
    //  |     |   | |
    //  |     |   | |
    //  |     |---  |
    //  |     |-----   
    //  |     |
    //  |     |  vertChannelDelta 
    //  |     |
    //  |     |
    //   ----- 
    //         
    // vertChannelDelta is the offset that separates the vertical channels.
    // 
    // 

    var channelSpace = 0.25
    var channelOffset = 0.125;
 
    var vertChannelBaseOffset;
    var vertChannelTotalSpace;

    if (horz) {
	vertChannelBaseOffset = grid.getPadWidth() * channelOffset;
	vertChannelTotalSpace = grid.getPadWidth() * channelSpace;
    }
    else {
	vertChannelBaseOffset = grid.getPadHeight() * channelOffset;
	vertChannelTotalSpace = grid.getPadHeight() * channelSpace;
    }


//    kindex = kInverse;
//     if (!forwardLink) kindex = k;

    // if (forwardLink) kindex = k;

    // fixed if srcConnectSingle
    // if (srcConnectSingle) kindex = 0;

    // 
    // Determine the y position of the main routing line.
    // 
    // get the row height without the padding.
    //

    var mainChannelSpace;
    var mainChannelBaseOffset;
    var mainChannelTotalSpace;

    var MAIN = 0;
    var MINOR_DST = 1;
    var MINOR_SRC = 2;

    var HORZ_SRC = 6;
    var HORZ_DST = 7;
    var VERT_SRC = 8;
    var VERT_DST = 9;

    var channelDelta = new Array();
    var channelTotalSpace = new Array();
    var channelBaseOffset = new Array();
    var channelSpace = new Array();
    var pad = new Array();
    
    // var pad;

    if (horz) {

	channelBaseOffset[MAIN] = grid.getRowHeightNoPad(srcIndex) / 2;
	// alert(' cbo ' + channelBaseOffset[MAIN]);

	// pad[MAIN] = grid.getPadHeight();
	// alert(pad[MAIN]);

	// alert(' pre ' + grid._getPadHeightPreInternal(srcIndex));

	if (forwardLink) 
	    pad[MAIN] = grid._getPadHeightPostInternal(srcIndex);
	else 
	    pad[MAIN] = grid._getPadHeightPreInternal(srcIndex);

	channelBaseOffset[MINOR_DST] = grid.getColWidthNoPad(dstIndex) / 2;

	pad[MINOR_DST] = grid.getPadWidth();
	// pad[MINOR_DST] = grid.getPadWidthCol(dstIndex);

	channelBaseOffset[MINOR_SRC] = grid.getColWidthNoPad(srcIndex) / 2;

	pad[MINOR_SRC] = grid.getPadWidth();
	// pad[MINOR_SRC] = grid.getPadWidthCol(srcIndex);

    } else {

	channelBaseOffset[MAIN] = grid.getColWidthNoPad(srcIndex) / 2;

	// pad[MAIN] = grid.getPadWidth();
	// pad[MAIN] = grid.getPadWidthCol(srcIndex);

	if (forwardLink) 
	    pad[MAIN] = grid._getPadWidthPostInternal(srcIndex);
	else 
	    pad[MAIN] = grid._getPadWidthPreInternal(srcIndex);

	channelBaseOffset[MINOR_DST] = grid.getRowHeightNoPad(dstIndex) / 2;

	pad[MINOR_DST] = grid.getPadHeight();
	// pad[MINOR_DST] = grid.getPadHeightRow(dstIndex);

	channelBaseOffset[MINOR_SRC] = grid.getRowHeightNoPad(srcIndex) / 2;

	pad[MINOR_SRC] = grid.getPadHeight();
	// pad[MINOR_SRC] = grid.getPadHeightRow(srcIndex);

    }


    var channelMain;

    channelMain = new channel(arrowLength, pad[MAIN], channelBaseOffset[MAIN], CHANNEL_WIDTH);
    // channelMain = new channel(arrowLength, pad[MAIN], channelBaseOffset[MAIN], 1.0);
    // printChannel(channelMain);

    // alert(' called const ' + channelMain.channelTotalSpace);

    var channelMinor;
    var channelMinorSrc;

    var channelHorzSrc;
    var channelHorzDst;
    var channelVertSrc;
    var channelVertDst;

    if (horz) {

	channelMinor = new channel(arrowLength, pad[MINOR_DST], channelBaseOffset[MINOR_DST], CHANNEL_WIDTH);
	channelMinorSrc = new channel(arrowLength, pad[MINOR_SRC], channelBaseOffset[MINOR_SRC], CHANNEL_WIDTH);

    }
    if (!horz) {

	channelMinor = new channel(arrowLength, pad[MINOR_DST], channelBaseOffset[MINOR_DST], CHANNEL_WIDTH);
	channelMinorSrc = new channel(arrowLength, pad[MINOR_SRC], channelBaseOffset[MINOR_SRC], CHANNEL_WIDTH);

    }

    var channelMinor2;

    if (type == "DIAG") {

	channelBaseOffset[HORZ_SRC] = grid.getRowHeightNoPad(srcIndex) / 2;

	pad[HORZ_SRC] = grid.getPadHeight();
	// pad[HORZ_SRC] = grid.getPadHeightRow(srcIndex);

	channelBaseOffset[HORZ_DST] = grid.getRowHeightNoPad(dstIndex) / 2;

	pad[HORZ_DST] = grid.getPadHeight();
	// pad[HORZ_DST] = grid.getPadHeightRow(dstIndex);

	channelBaseOffset[VERT_SRC] = grid.getColWidthNoPad(srcIndex) / 2;

	pad[VERT_SRC] = grid.getPadWidth();
	// pad[VERT_SRC] = grid.getPadWidthCol(srcIndex);

	channelBaseOffset[VERT_DST] = grid.getColWidthNoPad(dstIndex) / 2;

	pad[VERT_DST] = grid.getPadWidth();
	// pad[VERT_DST] = grid.getPadWidthCol(dstIndex);

    }

    if (type == "DIAG") {

	channelHorzSrc = new channelMiddle(arrowLength, pad[HORZ_SRC], channelBaseOffset[HORZ_SRC]);
	channelHorzDst = new channelMiddle(arrowLength, pad[HORZ_DST], channelBaseOffset[HORZ_DST]);

	channelVertSrc = new channelMiddle(arrowLength, pad[VERT_SRC], channelBaseOffset[VERT_SRC]);
	channelVertDst = new channelMiddle(arrowLength, pad[VERT_DST], channelBaseOffset[VERT_DST]);

	var srcRowTemp = srcRow;
	var dstRowTemp = dstRow;

	var srcColTemp = srcCol;
	var dstColTemp = dstCol;

	//
	// For adjacent rows or columns, we have mapped the used channel to the min.
	//
	if (LytChannelRouteUtil.isSpecialDiagHorz(srcRow, dstRow, srcCol, dstCol)) {
	    srcRowTemp = Math.min(srcRow, dstRow);
	    dstRowTemp = Math.max(srcRow, dstRow);
	}
	else if (LytChannelRouteUtil.isSpecialDiagVert(srcRow, dstRow, srcCol, dstCol)) {
	    srcColTemp = Math.min(srcCol, dstCol);
	    dstColTemp = Math.max(srcCol, dstCol);
	}
	else if (LytChannelRouteUtil.isSpecialDiagVertFS(grid, srcRow, dstRow, srcCol, dstCol)) {
	    srcColTemp = Math.min(srcCol, dstCol);
	    dstColTemp = Math.max(srcCol, dstCol);
	}
	else {

	    // adjustments for long diagonal runs.

	    if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
		srcRowTemp = srcRow - 1;
		dstColTemp = dstCol - 1;
	    }
	    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
		dstRowTemp = dstRow - 1;
	    }
	    if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
		dstRowTemp = dstRow - 1;
	    }

	    if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
		dstColTemp = dstCol - 1;
	    }

	}

	var debugIndexAssign = false;
	var index = 0;

	if (linkHorzChannel[srcRowTemp]) {

	    index = linkHorzChannel[srcRowTemp][l.getId()];
	    if (!isNaN(index))
		channelHorzSrc.channelDelta = getSlot(index, horzChannelLineCount[srcRowTemp], channelHorzSrc.channelTotalSpace);
	    else channelHorzSrc.channelDelta = 0;

	    // true on diag grid run
	    if (debugIndexAssign) alert(l.getId() + ' *** horz channel index src ' + index)
		// + ' cd ' + channelHorzSrc.channelDelta);

	}

	if (linkHorzChannelDst[dstRowTemp]) {

	    index = linkHorzChannelDst[dstRowTemp][l.getId()];
	    if (debugIndexAssign) alert(l.getId() + ' *** horz channel index dst ' + index);

	    if (!isNaN(index))
		channelHorzDst.channelDelta = getSlot(index, horzChannelLineCount[dstRowTemp], channelHorzDst.channelTotalSpace);
	    else channelHorzDst.channelDelta = 0;
	}

	if (linkVertChannel[srcColTemp]) {

	    index = linkVertChannel[srcColTemp][l.getId()];
	    if (debugIndexAssign) alert(l.getId() + ' vert channel index src ' + index);
	    if (!isNaN(index)) {
		channelVertSrc.channelDelta = getSlot(index, vertChannelLineCount[srcColTemp], channelVertSrc.channelTotalSpace);
		// alert(index + ' ' +  channelVertSrc.channelDelta);
	    }
	    else channelVertSrc.channelDelta = 0;
	}

	if (linkVertChannelDst[dstColTemp]) {

	    index = linkVertChannelDst[dstColTemp][l.getId()];
	    if (debugIndexAssign) alert(l.getId() + ' vert channel index dst ' + index);
	    if (!isNaN(index))
		channelVertDst.channelDelta = getSlot(index, vertChannelLineCount[dstColTemp], channelVertDst.channelTotalSpace);
	    else channelVertDst.channelDelta = 0;
	}

    }


    // mainChannelTotalSpace = grid.getPadHeight() - mainChannelSpace - 

    // alert(' arrow ' + arrowLength + ' mcd ' + mainChannelSpace);

    //
    // channelLineCount[srcRow]  - number of lines in the channel
    // linkHorzChannel[l.getId()] - the slot index
    //

    // channelDelta[MINOR_DST] = 0;
    // if (!horz) channelMinor.channelDelta = 0;

    // 
    // horz: main channel is first param, minor channel is third param.
    // 

    if (type != "DIAG") {

	if (horz) {

	    index = linkHorzChannel[srcRow][l.getId()];
	    // alert ('horz channelMain ' + ' [srcRow]: ' + srcRow + ' [l.getId()]  ' +  l.getId() + ' index ' + index);
	    // alert(' call getslot ' + channelMain.channelTotalSpace);
	    channelMain.channelDelta = getSlot(index, horzChannelLineCount[srcRow], channelMain.channelTotalSpace);


	    // 
	    // The channel slot position is calculated as the sum of the textHeights on the channels.
	    // 
	    if (forwardLink) {
		channelMain.channelDelta = 
		    LytChannelPadUtil.getChannelWidthSum(channelPadU.textHeightRowsPost[srcRow], index);
	    } else {
		channelMain.channelDelta = 
		    LytChannelPadUtil.getChannelWidthSumExclusive(channelPadU.textHeightRowsPre[srcRow], index);
	    }

	    // alert(nodeID + ' ' + index + ' ' + ' srcRow ' + srcRow + ' ' + channelMain.channelDelta);

	// alert(index + ' post ' + channelPadU.textHeightRowsPost[srcRow][index]);

	    // alert(' linkHorzChannel[index ' + index + ' l.getId()  ' +  l.getId() + ' channelMain.channelDelta ' + channelMain.channelDelta + ' srcRow ' + srcRow);
	    // alert(' index ' + index + ' l.getId()  ' +  l.getId());

	    channelMinor.channelDelta = 0;
	    if (linkVertChannelDst[dstCol]) {
		index = linkVertChannelDst[dstCol][l.getId()];
		// alert ('horz channelMinor ' + ' [dstCol]: ' + dstCol + ' [l.getId()]  ' +  l.getId() + ' index ' + index);
		// alert(' channelMinor index ' + index + ' l.getId()  ' +  l.getId());
		if (!isNaN(index)) {
		    channelMinor.channelDelta = getSlot(index, vertChannelLineCountDst[dstCol], channelMinor.channelTotalSpace);
		}
		// alert('dstCol ' + dstCol + ' ' + vertChannelLineCountDst[dstCol] + ' ' + channelMinor.channelTotalSpace + ' channelMinor.channelDelta ' + channelMinor.channelDelta );
	    }


	    channelMinorSrc.channelDelta = 0;
	    if (linkVertChannel[srcCol]) {
		index = linkVertChannel[srcCol][l.getId()];
		if (!isNaN(index)) 
		    channelMinorSrc.channelDelta = getSlot(index, vertChannelLineCount[srcCol], channelMinorSrc.channelTotalSpace);
	    }



	} else 
	    // 
	// vert: main channel is third param, minor channel is first param.
	// 
	{

	    index = linkVertChannel[srcCol][l.getId()];
	    // alert ('vert channelMain ' + ' [srcCol]: ' + srcCol + ' [l.getId()]  ' +  l.getId() + ' index ' + index);

	    channelMain.channelDelta = getSlot(index, vertChannelLineCount[srcCol], channelMain.channelTotalSpace);

	    if (forwardLink) {
		// alert('fore');
		channelMain.channelDelta = 
		    LytChannelPadUtil.getChannelWidthSumExclusive(channelPadU.textHeightColsPost[srcCol], index);
	    } else {

		// alert(srcCol + ' back ' + index);
		// alert(' len ' + channelPadU.textHeightColsPre[srcCol].length);
		// alert(' channelPadU.textHeightColsPre[srcCol][0] ' + channelPadU.textHeightColsPre[srcCol][0]);

		channelMain.channelDelta = 
		    LytChannelPadUtil.getChannelWidthSumExclusive(channelPadU.textHeightColsPre[srcCol], index);
	    }

	    // alert(' linkVertChannel[index ' + index + ' l.getId()  ' +  l.getId() + ' channelMain.channelDelta ' + channelMain.channelDelta);

	    channelMinor.channelDelta = 0;
	    if (linkHorzChannelDst[dstRow]) {

		index = linkHorzChannelDst[dstRow][l.getId()];

		// alert ('vert channelMinor ' + ' [dstRow]: ' + dstRow + ' [l.getId()]  ' +  l.getId() + ' index ' + index);

		if (!isNaN(index))
		    channelMinor.channelDelta = getSlot(index, horzChannelLineCountDst[dstRow], channelMinor.channelTotalSpace);
	    }
	    
	    // alert('srcRow ' + srcRow + ' linkid ' + l.getId());
	   // alert ('vert channelMinor[index ' + index + ' l.getId()  ' +  l.getId() + ' horzChannelLineCountDst[dstRow]  ' + horzChannelLineCountDst[dstRow] + ' cms ' + channelMinor.channelDelta + ' dstRow ' + dstRow);



	    // alert (' channelMinorSrc index ' + index + ' horzChannelLineCount[srcRow]  ' + horzChannelLineCount[srcRow] + ' cms ' + channelMinorSrc.channelDelta);

	    channelMinorSrc.channelDelta = 0;
	    if (linkHorzChannel[srcRow]) {
		index = linkHorzChannel[srcRow][l.getId()];

		if (!isNaN(index)) {
		    channelMinorSrc.channelDelta = getSlot(index, horzChannelLineCount[srcRow], channelMinorSrc.channelTotalSpace);
		    // alert(srcRow + ' SRC ROW index ' + index + ' ' +   channelMinorSrc.channelDelta );

		}
	    }
	}
    }



    if (type == "DIAG") {

	if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

	    //
	    //  Long Diagnol, fore/up
	    //
	    //
	    //   ---                               ---
	    //  |   |                             |   |
	    //  |   |                          -> |   |
	    //  |   |                         |   |   |
	    //   ---                          |    --- 
	    //                                |
	    //                                |
	    //                                |
	    //   ---                          |
	    //  |   |                         |
	    //  |   |                         |
	    //  |   |                         |
	    //   ---                          |
	    //                                |
	    //                                |
	    //         -----------------------
	    //   ---  |
	    //  |   | |
	    //  |   |- 
	    //  |   | 
	    //   ---  
	    //        


	    // special 4
	    // special 01

	    var d9 = false;

	    if (Math.abs(srcCol - dstCol) == 1) {

		// alert('special 4 ' + vertChannelLineCount[srcCol] + ' ' + channelVertSrc.channelDelta);

		// 
		// Special case where the rows are adjacent.
		// 
		//         
		//   ---        ---
		//  |   |      |   |
		//  |   |    ->|   |
		//  |   |   |  |   |
		//   ---    |   --- 
		//          |
		//   ---    |
		//  |   |   |
		//  |   |   |
		//  |   |   |
		//   ---    |
		//          |
		//   ---    |
		//  |   |   |
		//  |   |---
		//  |   |
		//   --- 
		//       

		
		if (d9) alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow) + ' ' + channelVertSrc.channelTotalSpace/2 + ' ' + channelVertSrc.channelDelta);

		if (d9) alert('upright');

		if ((Math.abs(srcRow - dstRow) == 1)
		    && (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0
			|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		    // alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow));

		    LytChannelRouteUtil.gridRouteCloseUpRight(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant,
						      gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints);


		    if (d9) alert('gridrouteclose');
		    // LytChannelRouteUtil.printGridMapperDst(gridMapperDstResult);

		// } else if ((Math.abs(srcRow - dstRow) == 1)) {
		} else {

		    if (d9) alert('fullsquare');
		    // alert('fs UpRight');

		    LytChannelRouteUtil.gridRouteFullsquareUpRight(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
							   gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc);

		} 

	    }
	    else if (Math.abs(srcRow - dstRow) == 1) {

		if (d9) alert('fullsquare B');
		if (d9) alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow) + ' V ' + channelVertSrc.channelTotalSpace/2 + ' ' + channelVertSrc.channelDelta);
		if (d9) alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow) + ' H ' + - channelHorzSrc.channelTotalSpace/2 + ' ' + channelHorzSrc.channelDelta);

		LytChannelRouteUtil.gridRouteFullsquareUpRightB(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
							gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc);

	    } else {

		// alert('UP RIGHT DIAG ' + channelHorzSrc.channelDelta);

		// upslot now allocated
		// ctlPoints[0] = c1.x + (grid.getColWidthNoPad(srcIndex) / 2) + channelMinor2.channelDelta + channelMinor2.channelSpace;
		ctlPoints[1] = c1.y;

		if (vertChannelLineCount[srcCol] == 1)
		    ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
		else 
		    // ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2) - channelVertSrc.channelTotalSpace/2 + channelVertSrc.channelDelta;
		    // This has less crossings when we have vertical runs.
		    ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2) + channelVertSrc.channelTotalSpace/2 - channelVertSrc.channelDelta;

		ctlPoints[2] = ctlPoints[0];

		//
		// Allocate in the PREVIOUS src row.
		// Use PadHeightPost to accomodate text space.
		// (Note that this space between rows is allocated in LytLabelUtil.js - look for !isDownRun())
		//
		if (horzChannelLineCount[srcRow - 1] == 1) {
		    // ctlPoints[3] = c1.y - (grid.getRowHeight(srcIndex) /2);
		    ctlPoints[3] = c1.y - (grid.getRowHeightNoPad(srcIndex) /2) - grid._getPadHeightPostInternal(srcIndex);;

		} else {

		    // ctlPoints[3] = c1.y - (grid.getRowHeight(srcIndex) /2) - channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;
		    ctlPoints[3] = c1.y - (grid.getRowHeightNoPad(srcIndex) /2) - grid._getPadHeightPostInternal(srcIndex)
			- channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;

		    // alert(' ctl point 3 B channelDelta ' + channelHorzSrc.channelDelta + ' total space ' + channelHorzSrc.channelTotalSpace);
		}

		//
		// Allocate in the PREVIOUS dst col.
		// Since the link is placed BEFORE the node, so we reverse the sign of the colWidth offset.
		//
		if (vertChannelLineCount[dstCol - 1] == 1)
		    ctlPoints[4] = c2.x - (grid.getColWidth(dstIndex) / 2);
		else 
		    ctlPoints[4] = c2.x - (grid.getColWidth(dstIndex) / 2) - channelVertDst.channelTotalSpace/2 + channelVertDst.channelDelta;

		ctlPoints[5] = ctlPoints[3];

		ctlPoints[6] = ctlPoints[4];
		ctlPoints[7] = c2.y;
	    
	    }
	}

	//
	//  Long Diagnol, back/down
	//
	//
	//   ---                               ---
	//  |   |                             |   |
	//  |   |                             |   |
	//  |   |                             |   |
	//   ---                               --- 
	//                                      | 
	//         -----------------------------
	//        |
	//   ---  |
	//  |   | |
	//  |   | |
	//  |   | |
	//   ---  |
	//        |
	//     ---   
	//    |
	//    \/   
	//   ---  
	//  |   | 
	//  |   | 
	//  |   | 
	//   ---  
	//        
	else if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {
	    // special 2
	    if (Math.abs(srcCol - dstCol) == 1) {

		// 
		// Special case where the rows are adjacent.
		// 
		//         
		//   ---        ---
		//  |   |      |   |
		//  |   |    --|   |
		//  |   |   |  |   |
		//   ---    |   --- 
		//          |
		//   ---    | 
		//  |   |   |
		//  |   |   |
		//  |   |   |
		//   ---    |
		//          |
		//   ---    | 
		//  |   |   | 
		//  |   |<--
		//  |   |
		//   --- 
		//       
		
		// claim10

		if ((Math.abs(srcRow - dstRow) == 1)
		    && (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0
			|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		    // alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow));

		    // alert('closeDownLeft');

		    LytChannelRouteUtil.gridRouteCloseDownLeft(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints);


		    // LytChannelRouteUtil.printGridMapperDst(gridMapperDstResult);

		} else 
		{
		    // alert(' full square DownLeft');

		    LytChannelRouteUtil.gridRouteFullsquareDownLeft(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc);

		}
		
	    }
	    else if (Math.abs(srcRow - dstRow) == 1) {

		// alert(' full square DownLeft B');
		LytChannelRouteUtil.gridRouteFullsquareDownLeftB(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
							 gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc);

	    } else {

		ctlPoints[0] = c1.x;

		if (horzChannelLineCount[srcRow] == 1) {
		    // ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) /2);
		    // ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPostInternal(srcIndex);;
		    ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPreInternal(srcRow+1, true);
		} else {
		    // ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) /2) - channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;
		    ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPreInternal(srcRow+1, true)
			- channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;
		}

		if (vertChannelLineCount[dstCol] == 1)
		    ctlPoints[2] = c2.x + (grid.getColWidth(dstIndex) / 2);
		else 
		    ctlPoints[2] = c2.x + (grid.getColWidth(dstIndex) / 2) - channelVertDst.channelTotalSpace/2 + channelVertDst.channelDelta;

		ctlPoints[3] = ctlPoints[1];
		ctlPoints[4] = ctlPoints[2];

		// Allocate previous row.
		if (horzChannelLineCount[dstRow - 1] == 1) {
		    // j4
		    ctlPoints[5] = c2.y - (grid.getRowHeight(dstIndex) /2) ;
		    // ctlPoints[5] = c2.y - (grid.getRowHeightNoPad(dstIndex) /2) - grid._getPadHeightPostInternal(dstIndex);;
		} else 
		    ctlPoints[5] = c2.y - (grid.getRowHeight(dstIndex) /2) - channelHorzDst.channelTotalSpace/2 + channelHorzDst.channelDelta;

		ctlPoints[6] = c2.x;
		ctlPoints[7] = ctlPoints[5];
	    }
	    
	}

	//
	//  Long Diaganol, down/fore
	//
	//
	//   ---  
	//  |   | 
	//  |   | 
	//  |   | 
	//   ---  
	//    |    
	//     ----   
	//         |
	//   ---   |
	//  |   |  |
	//  |   |  |
	//  |   |  |
	//   ---   |
	//         |
	//          ----------------------------
	//                                      |
	//                                      \/
	//   ---                               ---
	//  |   |                             |   |
	//  |   |                             |   |
	//  |   |                             |   |
	//   ---                               --- 
	//
	//
	//        

	else if (LytChannelRouteUtil.isDownRun(srcRow, dstRow) && LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

	    var d8 = false;
	    if (d8) alert('isdownrun');

	    // special 3
	    // special 11
	    if (Math.abs(srcCol - dstCol) == 1) {

		// 
		// Special case where the rows are adjacent.
		// 
		//
		//   ---  
		//  |   | 
		//  |   |-- 
		//  |   |  |
		//   ---   |
		//         |
		//   ---   |
		//  |   |  |
		//  |   |  |
		//  |   |  |
		//   ---   |
		//         |
		//   ---   |    ---
		//  |   |  |   |   |
		//  |   |   -> |   |
		//  |   |      |   |
		//   ---        --- 
		//

		if (Math.abs(srcRow - dstRow) == 1
		    && (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0
			|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		    // alert(' routeCloseDownRight ' +  dstCol + ' ' + dstRow + ' ' + ' close Rows ');
		    if (d8) alert('closedownright');

		    LytChannelRouteUtil.gridRouteCloseDownRight(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints);

		} else {

		    // claim11
		    if (d8) alert('fullsdownright');
		    // full square suitable for rowDiff > 1, but not for colDff > 1


		    LytChannelRouteUtil.gridRouteFullsquareDownRight(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc);

		}
	    }
	    else if (Math.abs(srcRow - dstRow) == 1) {
		    if (d8) alert(' else 2');

		/*
		ctlPoints[0] = c1.x;
		ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);
		ctlPoints[2] = c2.x;
		ctlPoints[3] = ctlPoints[1];
*/

		LytChannelRouteUtil.gridRouteFullsquareDownRightB(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
							  gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc);

	    }
	    else {

		    if (d8) alert(' else 3');
		ctlPoints[0] = c1.x;

		if (horzChannelLineCount[srcRow] == 1) 
		    ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) /2);
		else {
		    ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) /2) - channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;
		}

		if (vertChannelLineCount[srcCol] == 1)
		    ctlPoints[2] = c1.x + (grid.getColWidth(srcIndex) / 2);
		else 
		    ctlPoints[2] = c1.x + (grid.getColWidth(srcIndex) / 2) - channelVertSrc.channelTotalSpace/2 + channelVertSrc.channelDelta;

		ctlPoints[3] = ctlPoints[1];

		// alert(' CTL '  + ctlPoints[2] + ' ' + ctlPoints[3]);

		ctlPoints[4] = ctlPoints[2];

		// alert('h ' + horzChannelLineCount[dstRow])

		// Allocate previous row
		//
		// Route the destination link based on the Post pad height offset.
		// (since there may be a text string on the link)
		//
		// Note that currently we do not support multiple text strings in a channel.
		//
		if (horzChannelLineCount[dstRow - 1] == 1) {
		    // ctlPoints[5] = c2.y - (grid.getRowHeight(dstIndex) /2);
		    ctlPoints[5] = c2.y - (grid.getRowHeightNoPad(dstIndex) /2) - grid._getPadHeightPostInternal(dstIndex);;
		} else {
		    // ctlPoints[5] = c2.y - (grid.getRowHeight(dstIndex) /2) - channelHorzDst.channelTotalSpace/2 + channelHorzDst.channelDelta;
		    //
		    // This link would need extension to support multiple text strings in a channel
		    //
		    ctlPoints[5] = c2.y - (grid.getRowHeightNoPad(dstIndex) /2) - grid._getPadHeightPostInternal(dstIndex)
			- channelHorzDst.channelTotalSpace/2 + channelHorzDst.channelDelta;
		}

		// alert(' CTL '  + ctlPoints[4] + ' ' + ctlPoints[5]);

		ctlPoints[6] = c2.x;
		ctlPoints[7] = ctlPoints[5];

		// alert(' CTL '  + ctlPoints[6] + ' ' + ctlPoints[7]);
	    }

	}
	else if (!LytChannelRouteUtil.isDownRun(srcRow, dstRow) && !LytChannelRouteUtil.isRightRun(srcCol,dstCol)) {

	    var debug9 = false;
	    if (debug9) alert(' up left ');

	    // special !d!r
	    // special 00

	    if (Math.abs(srcCol - dstCol) == 1) {

		// 
		// Special case where the rows are adjacent.
		// 

		//
		//   ---  
		//  |   | 
		//  |   |<- 
		//  |   |  |
		//   ---   |
		//         |
		//   ---   |
		//  |   |  |
		//  |   |  |
		//  |   |  |
		//   ---   |
		//         |
		//   ---   |    ---
		//  |   |  |   |   |
		//  |   |   -- |   |
		//  |   |      |   |
		//   ---        --- 
		//
		// We should 
		//
		//  + routed flag OR
		//  check source connections 
		if ((Math.abs(srcRow - dstRow) == 1)
		    && (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0
			|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		    // alert('srcRow ' + srcRow + ' dstRowl ' +  dstRow + ' ' + Math.abs(srcRow - dstRow));

		    if (debug) alert('fs close up left');
		    LytChannelRouteUtil.gridRouteCloseUpLeft(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints);


		} else 
		{
		    if (debug) alert('fs up left');
		    // alert('fs up left');
		    LytChannelRouteUtil.gridRouteFullsquareUpLeft(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
					       gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc);

		}
		
		//  special case were rows are adjacent.
	    } else if (Math.abs(srcRow - dstRow) == 1) {

		if (debug) alert('fs up left B');
		LytChannelRouteUtil.gridRouteFullsquareUpLeftB(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant,
						      gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc);

	    } else {

		ctlPoints[0] = c1.x;

		if (horzChannelLineCount[srcRow] == 1) {
		    ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPreInternal(srcRow+1, true);
		}
		else {
		    ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPreInternal(srcRow+1, true)
			- channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta;
		}

		// Previous column
		// we don't have a spot for this one (if it is the righmost) in the bitmap - need to add a column.
		//

		ctlPoints[2] = c2.x - (grid.getColWidth(dstIndex) / 2);
		ctlPoints[3] = ctlPoints[1];

		ctlPoints[4] = ctlPoints[2];
		ctlPoints[5] = c2.y;
	    }
	}
    }

    if (type != "DIAG") {
	
	if (horz) {

	    var backright = false;
	    // (srcRow == dstRow) 

	    // alert(' gpw ' + grid.getPadWidth());

	    //alert(' (srcRow == dstRow) ');

	    if (forwardLink) {

		//
		//   ---                               ---
		//  |   |                             |   |
		//  |   |---                       -->|   |
		//  |   |   |                     |   |   |
		//   ---    |                     |    --- 
		//           ---------------------
		//

		// alert(nodeID + ' ' + channelMain.channelDelta + ' space ' + channelMain.channelTotalSpace);
		// alert(grid.getPadWidth());

		ctlPoints[0] = c1.x + channelMinorSrc.channelDelta + channelMinorSrc.channelBaseOffset;
		ctlPoints[1] = c1.y;

		ctlPoints[2] = ctlPoints[0];
		var rowSegmentWidth = grid.getRowSegmentWidthNoPad(srcIndex, dstIndex);

		// var rowSegmentWidth = grid.getRowSegmentWidthPostPad(srcIndex, dstIndex);
/*
		var postH = grid._getPadHeightPostInternal(srcIndex);
		// ctlPoints[3] = c1.y + channelMain.channelDelta + channelMain.channelBaseOffset;
		if (!isNaN(postH) && postH > 0)
		    ctlPoints[3] = c1.y + postH + channelMain.channelDelta + channelMain.channelSpace;
		// else ctlPoints[3] = c1.y + (rowSegmentWidth / 2) + postH + channelMain.channelDelta + channelMain.channelSpace;
		else 
*/

		ctlPoints[3] = c1.y + (rowSegmentWidth / 2) + channelMain.channelDelta + channelMain.channelSpace;

		// alert(nodeID + ' channelMain.channelDelta ' + channelMain.channelDelta  + ' channelMain.channelSpace ' + channelMain.channelSpace);

		// ctlPoints[1] = c1.y - (rowSegmentWidth / 2) - channelMain.channelDelta - channelMain.channelSpace;

		ctlPoints[4] = c2.x - channelMinor.channelDelta - channelMinor.channelBaseOffset;
		ctlPoints[5] = ctlPoints[3];

		ctlPoints[6] = ctlPoints[4];
		ctlPoints[7] = c2.y - yDstConnectBaseOffset;

		// alert(' channelMinor ' + channelMinor.channelDelta + ' ' + channelMinor.channelBaseOffset + ' c2.x ' + c2.x);
		// alert(' --- ' + pt1.x + ',' + vertChannelDelta);
		// alert(' ctlPoints ' + ctlPoints[0] + ',' + ctlPoints[1]);

	    } else { 

		//
		//     ---------------------------------
		//    |                                 | 
		//    \/                                |
		//   ---                               ---
		//  |   |                             |   |
		//  |   |                             |   |
		//  |   |                             |   |
		//   ---                               --- 
		//

		// ctlPoints[0] = c1.x;
		// ctlPoints[1] = pt1.y + r1.h;

		var rowSegmentWidth = grid.getRowSegmentWidthNoPad(srcIndex, dstIndex);

		ctlPoints[0] = c1.x;
		// ctlPoints[1] = c1.y - grid.getRowHeightNoPad(srcIndex) / 2 - channelMain.channelDelta - channelMain.channelSpace;
		ctlPoints[1] = c1.y - (rowSegmentWidth / 2) - channelMain.channelDelta - channelMain.channelSpace;
		// alert('srcID ' + srcID + ' dstID ' + dstID + ' channelDelta ' + channelMain.channelDelta + ' ' + channelMain.channelSpace + ' ' + rowSegmentWidth);

		ctlPoints[2] = c2.x;
		ctlPoints[3] = ctlPoints[1];

		// ctlPoints[0] = c2.x;
		// ctlPoints[1] = pt2.y + r2.h;

	    }
	}

	else {

	    //
	    //   --- 
	    //  |   |
	    //  |   |
	    //  |   |
	    //   --- 
	    //    |
	    //     ---
	    //        |
	    //   ---  |
	    //  |   | |
	    //  |   | |
	    //  |   | |
	    //   ---  |
	    //        |
	    //     ---
	    //    |
	    //    \/   
	    //   --- 
	    //  |   |
	    //  |   |
	    //  |   |
	    //   --- 
	    //

	    // fixx
	    // x1 = LytNodeUtil.getOriginX(srcNode)+ LytNodeUtil.getNodeCenterX(srcNode);
	    // y1 = LytNodeUtil.getOriginY(srcNode) + LytNodeUtil.getNodeBottomConnectY(srcNode);

	    if (forwardLink) {


		// alert(' vert FORWARD ' );

		ctlPoints[0] = c1.x;
		// ctlPoints[1] = srcPoint.y + r1.h + vertChannelDelta;
		// ctlPoints[1] = srcPoint.y + r1.h + vertChannelBaseOffset;
		// should add the label height
		ctlPoints[1] = c1.y + (grid.getRowHeightNoPad(srcIndex) /2) + channelMinorSrc.channelDelta + channelMinorSrc.channelSpace;
		// adjust for label height (assumes that label is on bottom of node)
		ctlPoints[1] += LytNodeUtil.getLabelHeight(srcNode)/2;

		// alert(' vertCh '  + vertChannelDelta);
		// alert(' CTL '  + ctlPoints[0] + ' ' + ctlPoints[1]);

		// 
		// Extension - need a getColWidthNoPad() function with (srcIndex,dstIndex) - only 
		// considers col widths between the indexes.
		// 
		// alert(grid.getColSegmentWidthNoPad(srcIndex, dstIndex));

		var colSegmentWidth = grid.getColSegmentWidthNoPad(srcIndex, dstIndex);

		// ctlPoints[2] = c1.x + (grid.getColWidthNoPad(srcIndex) / 2) + channelMain.channelDelta + channelMain.channelSpace;
		ctlPoints[2] = c1.x + (colSegmentWidth / 2) + channelMain.channelDelta + channelMain.channelSpace;
		ctlPoints[3] = ctlPoints[1];

		// alert(' CTL '  + ctlPoints[2] + ' ' + ctlPoints[3]);

		ctlPoints[4] = ctlPoints[2];
		// ctlPoints[5] = dstPoint.y - grid.getPadHeight() * 3/8;

		//
		// use minor channel map!
		//
		// ctlPoints[5] = dstPoint.y - grid.getPadHeight() * 3/8;
		// ctlPoints[5] = c2.y; good
		// alert(' di ' + dstIndex + ' srci ' + srcIndex);
		// alert(' gpw ' + grid.getRowHeightNoPad(dstIndex));

		ctlPoints[5] = c2.y - (grid.getRowHeightNoPad(dstIndex) /2) - channelMinor.channelDelta - channelMinor.channelSpace;

		// ctlPoints[5] = c2.y - (grid.getRowHeightNoPad(dstIndex) /2) ;

		//
		// m04
		// alert(' chdelta ' + channelDelta[MINOR_DST]);
		// alert(' chspace ' + channelSpace[MINOR_DST]);

		// alert(' CTL '  + ctlPoints[4] + ' ' + ctlPoints[5]);

		ctlPoints[6] = c2.x;
		ctlPoints[7] = ctlPoints[5];

		// alert(' CTL '  + ctlPoints[6] + ' ' + ctlPoints[7]);

		// alert(' --- ' + pt1.x + ',' + vertChannelDelta);
		// alert(' ctlPoints ' + ctlPoints[0] + ',' + ctlPoints[1]);

	    }

	    else { 

		// j27
		if (Math.abs(srcCol - dstCol) >= 2 && Math.abs(srcRow - dstRow) >= 2) {

		    ctlPoints[0] = c1.x -  (grid.getColWidthNoPad(srcIndex) / 2) - channelMain.channelDelta - channelMain.channelSpace;
		    ctlPoints[1] = c1.y;

		} else  
		{

		    //
		    //        --- 
		    //       |   |
		    //    -->|   |
		    //   |   |   |
		    //   |    --- 
		    //   |
		    //   |
		    //   |
		    //   |    ---  
		    //   |   |   | 
		    //   |   |   | 
		    //   |   |   | 
		    //   |    ---  
		    //   |
		    //   |
		    //   |
		    //   |    --- 
		    //   |   |   |
		    //    ---|   |
		    //       |   |
		    //        --- 
		    //
		    // mainChannel should take into account the arrow head width - as a min for the channelSpace[MAIN]
		    //

		    var colSegmentWidth = grid.getColSegmentWidthNoPad(srcIndex, dstIndex);

		    // ctlPoints[0] = c1.x - (grid.getColWidthNoPad(srcIndex) / 2) - channelMain.channelDelta - channelMain.channelSpace;
		    ctlPoints[0] = c1.x - (colSegmentWidth / 2) - channelMain.channelDelta - channelMain.channelSpace;
		    ctlPoints[1] = c1.y;

		    ctlPoints[2] = ctlPoints[0];
		    ctlPoints[3] = c2.y;

		}
	    }
	}
    }

    return ctlPoints;

}

LytChannelRouteUtil.printGridMapperDst = function(gridMapperDstResult) {

    var s = "printGridMapperDst: ";

    if (gridMapperDstResult.right) {
	s = s + 'gridMapperDstResult.right';
	alert(' is right');
    }

    alert(s);

}

//
// March 10 - need to check hi pri first
//
//
// Corner route a clode link, up/left.
// return connection results in gridMapperSrcResult and gridMapperDstResult.
//
LytChannelRouteUtil.gridRouteCloseUpLeft = function(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints) {

    var debug = false;
    
    if (debug) alert('gridRouteCloseUpLeft ' + dstCol + ' ' + dstRow + ' ' + ' close Rows ');

    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
	|| (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

	if (debug) alert(' cell width orig ');

	// 
	// flags available on second pass
	// 

	if (!firstPass) {

	    if (debug) alert(' pass2 ');

	    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
		&& (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		if (debug)  alert(dstCol + ' ' + srcRow + ' empty ' + srcCol + ' ' + dstRow);

		// 
		// there are two spots where we could route this link.
		// 
		// 
		// Case where there are two potential dst node connection points,
		// since both spaces are empty.
		// 
		// Route to the one that has the least inLinks.
		// 
		if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(srcCol, dstRow)) == 0 &&
		    gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {
		    
		    if (debug) alert(' first case');

		    gridMapperDstResult.right = 1;
		    gridMapperSrcResult.top = 1;

			// 
			// right route
			//  _
			// | |<----
			//  -      |
			//         |
			//         _
			//        | |
			//         -
			// 

			ctlPoints[0] = c1.x;
			ctlPoints[1] = c2.y;

		} else if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 &&
		    gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {

		    gridMapperDstResult.bottom = 1;
		    
		    if (debug) alert(' dst bottom src left');
		    
		    // alert(dstCol + ' ' + dstRow + ' ' + ' left ');
		    // 
		    // Connect dst bottom src left
		    // 
		    // bottom route
		    //  _
		    // | |
		    //  - 
		    //  /\  
		    //  |      _
		    //   -----| |
		    //         -
		    // 
		    // left route
		    ctlPoints[0] = c2.x;
		    ctlPoints[1] = c1.y;

		    gridMapperSrcResult.left = 1;

		} else if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0) {

		    gridMapperDstResult.right = 1;

		    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {

			if (debug) alert(' dst right src-left ' + dstCol + ' ' + dstRow + ' ' + ' top ');
			
			// 
			// Connect dst right, src left.
			//
			//  _
			// | |<-
			//  -   |
			//      |
			//      |  _
			//       -| |
			//         -
			// 
			// 
			ctlPoints[0] = c1.x - (grid.getColWidth(dstIndex) / 2);
			ctlPoints[1] = c1.y;

			ctlPoints[2] = ctlPoints[0];
			ctlPoints[3] = c2.y;

			gridMapperSrcResult.left = 1;

		    } else {

			if (debug) alert(' right src-skewed top ' + dstCol + ' ' + dstRow + ' ' + ' top ');

			//
			// Connect dst right, src skewed top.
			//
			//  _
			// | |<---
			//  -     |
			//        |
			//         _
			//        | |
			//         -
			// 

			ctlPoints[0] = c1.x - skewConstant;
			ctlPoints[1] = c2.y;

			gridMapperSrcResult.top_skew_left = 1;

		    }

		} else if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0) {

		    gridMapperDstResult.bottom = 1;

		    if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0)  {

			
			if (debug) alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst bottom src top
			//  _
			// | |
			//  - 
			//  /\
			//  |______
			//         |
			//         _
			//        | |
			//         -
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top = 1;


		    } else {

			// Connect dst bottom src top skew right
			//  _
			// | |
			//  - 
			//  /\
			//  |_____
			//        |
			//         _
			//        | |
			//         -
			// 
			ctlPoints[0] = c1.x - skewConstant;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top_skew_left = 1;

		    }

		}
		else {
		    
		    if (debug) alert(' else ');

		    // No empty spot on dst to connect, so connect to bottom skewed.

		    gridMapperDstResult.bottom_skew_right = 1;

		    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0)  {
			
			if (debug) alert(' dst bottom_skew_right src left');
			// alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst bottom skewed src left
			// 
			// bottom route
			//  _
			// | |
			//  - 
			//  /\  
			//   |     _
			//    ----| |
			//         -
			// 
			// 
			ctlPoints[0] = c2.x + skewConstant;
			ctlPoints[1] = c1.y;

			gridMapperSrcResult.left = 1;

		    }
		    else if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {
			
			// alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst bottom skewed src top
			//  _
			// | |
			//  - 
			//  /\
			//   | ____
			//         |
			//         _
			//        | |
			//         -
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x + skewConstant;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top = 1;


		    } else {

			// Connect dst bottom skewed src top
			//  _
			// | |
			//  - 
			//  /\
			//   |____
			//        |
			//         _
			//        | |
			//         -
			// 
			ctlPoints[0] = c1.x - skewConstant;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x + skewConstant;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top_skew_left = 1;

		    }

		}
	    }
	    else if (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) {
		// 
		// bottom route
		//  _      _
		// | |    | |
		//  -      -
		//  /\  
		//  |      _
		//   -----| |
		//         -
		// 
		ctlPoints[0] = c2.x;
		ctlPoints[1] = c1.y;

		gridMapperDstResult.bottom = 1;
		gridMapperSrcResult.left = 1;

	    }
	    else if (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {

		if (debug) alert('g');

		// 
		// right route
		//  _
		// | |<----
		//  -      |
		//         |
		//  _      _
		// | |    | |
		//  -      -
		// 
		ctlPoints[0] = c1.x;
		ctlPoints[1] = c2.y;		
		gridMapperDstResult.right = 1;

		gridMapperSrcResult.top = 1;
		// alert(dstCol + ' ' + dstRow + ' ' + ' top b');
		// 
		// alert(dstCol + ' ' + dstRow + ' ' + ' left b');

	    }
	}
    }

}


//
//
//
LytChannelRouteUtil.gridRouteCloseUpRight = function(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints) {

    var debug = false;
    
    if (debug) alert('gridRouteCloseUpLeft ' + dstCol + ' ' + dstRow + ' ' + ' close Rows ');

    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
	|| (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

	// 
	// flags available on second pass
	// 

	if (!firstPass) {

	    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
		&& (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

		if (debug) alert(dstCol + ' ' + srcRow + ' empty ' + srcCol + ' ' + dstRow);

		// 
		// there are two spots where we could route this link.
		// 
		// 
		// Case where there are two potential dst node connection points,
		// since both spaces are empty.
		// 
		// Route to the one that has the least inLinks.
		// 
		if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 &&
		    gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {
		    
		    if (debug) alert(' src right dst bottom ');

		    gridMapperDstResult.bottom = 1;
		    gridMapperSrcResult.right = 1;

		    // 
		    // bottom route
		    //        _
		    //       | |
		    //        -
		    //       /\
		    //        |
		    //   _    |
		    //  | |---
		    //   -
		    // 

		    ctlPoints[0] = c2.x;
		    ctlPoints[1] = c1.y;

		    return;

		} else if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 &&
		    gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {

		    gridMapperDstResult.left = 1;
		    gridMapperSrcResult.top = 1;
		    
		    if (debug) alert(' dst top src left');
		    
		    // alert(dstCol + ' ' + dstRow + ' ' + ' left ');
		    // 
		    // Connect dst top src left
		    // 
		    // top route
		    //        _
		    //    -->| |
		    //   |    -
		    //   |
		    //   -
		    //  | |
		    //   -
		    // 
		    // left route
		    ctlPoints[0] = c1.x;
		    ctlPoints[1] = c2.y;

		} else if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0) {

		    gridMapperDstResult.left = 1;

		    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {

			if (debug) alert(' dst right src-right ' + dstCol + ' ' + dstRow + ' ' + ' top ');
			
			// 
			// Connect dst right, src right.
			//          _
			//       ->| |
			//      |   -
			//      |
			//   -  |
			//  | |-
			//   -
			// 
			ctlPoints[0] = c1.x - (grid.getColWidth(dstIndex) / 2);
			ctlPoints[1] = c1.y;

			ctlPoints[2] = ctlPoints[0];
			ctlPoints[3] = c2.y;

			gridMapperSrcResult.right = 1;

		    } else {

			if (debug) alert(' right src-skewed top ' + dstCol + ' ' + dstRow + ' ' + ' top ');

			//
			// Connect dst left, src skewed top.
			//
			//         _
			//     -->| |
			//    |    -
			//    |
			//   - 
			//  | |
			//   -
			// 

			ctlPoints[0] = c1.x + skewConstant;
			ctlPoints[1] = c2.y;

			gridMapperSrcResult.top_skew_right = 1;

		    }

		} else if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0) {

		    gridMapperDstResult.bottom = 1;

		    if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0)  {

			
			// alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst bottom src top
			//
			//         _
			//        | |
			//         -
			//         /\
			//     ____|
			//    |
			//   - 
			//  | |
			//   -
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top = 1;


		    } else {

			// Connect dst bottom src top skew 
			//
			//         _
			//        | |
			//         -
			//         /\
			//         |
			//     ----
			//    |
			//   - 
			//  | |
			//   -
			// 
			// 
			ctlPoints[0] = c1.x + skewConstant;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top_skew_right = 1;

		    }

		}
		else {
		    
		    // No empty spot on dst to connect, so connect to bottom skewed.

		    gridMapperDstResult.bottom_skew_left = 1;

		    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0)  {
			
			if (debug) alert(' dst bottom_skew_right src right');
			// alert(dstCol + ' ' + dstRow + ' ' + ' right ');
			// 
			// Connect dst bottom skewed src right
			// 
			// bottom route
			//
			//         _
			//        | |
			//         -
			//        /\
			//   -    |
			//  | |---
			//   -
			// 
			// 
			ctlPoints[0] = c2.x - skewConstant;
			ctlPoints[1] = c1.y;

			gridMapperSrcResult.right = 1;

		    }
		    else if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {
			
			// alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst bottom skewed src top

			//
			//         _
			//        | |
			//         -
			//         /\
			//     ---
			//    |
			//   - 
			//  | |
			//   -
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x - skewConstant;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top = 1;


		    } else {

			// Connect dst bottom skewed src top skewed
			//
			//         _
			//        | |
			//         -
			//        /\
			//     ---
			//    |
			//   - 
			//  | |
			//   -
			// 
			// 
			ctlPoints[0] = c1.x + skewConstant;
			ctlPoints[1] = c1.y - (grid.getRowHeight(dstIndex) / 2);

			ctlPoints[2] = c2.x - skewConstant;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.top_skew_right = 1;

		    }

		}
	    }
	    else if (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) {

		//
		//  _      _
		// | |    | |
		//  -      -
		//        /\
		//  _     |
		// | |----    
		//  -     
		// 
		ctlPoints[0] = c2.x;
		ctlPoints[1] = c1.y;

		gridMapperDstResult.bottom = 1;
		gridMapperSrcResult.right = 1;

	    }
	    else if (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {

		if (debug) alert('g');


		//
		//         _
		//    --->| |
		//   |     -
		//   |
		//  _|     _
		// | |    | |
		//  -      -
		// 
		ctlPoints[0] = c1.x;
		ctlPoints[1] = c2.y;		
		gridMapperDstResult.left = 1;
		gridMapperSrcResult.top = 1;
		// alert(dstCol + ' ' + dstRow + ' ' + ' top b');
		// 
		// alert(dstCol + ' ' + dstRow + ' ' + ' left b');

	    }
	}
    }

}

//
// Route a full square down/left
//
// Route from the source left to dest right, checking for connection conflicts.
// Note, we could have implemented an alternative route (source top to dest bottom),
// supplementing the above route.
//
//
//  _      _
// | |   -| |
//  -   |  -
//      |
//  _   |  _
// | |<-  | |
//  -      -
// 

// claim10

LytChannelRouteUtil.gridRouteFullsquareDownLeft = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc) {

    if (firstPass) return;

    ctlPoints[0] = c2.x + LytChannelRouteUtil.getXChannelBase(grid,srcIndex) - LytChannelRouteUtil.getVertOffset(channelVertSrc);

    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {
	// ctlPoints[0] = c1.x - (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y; 
	gridMapperSrcResult.left = 1;
    } else {
	// ctlPoints[0] = c1.x - (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y + skewConstant; 
	gridMapperSrcResult.left_skew_bottom = 1;
    }
    if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0) {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y;
	gridMapperDstResult.right = 1;
    } else {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y - skewConstant;
	gridMapperDstResult.right_skew_top = 1;
    }

}

//
//  _                _
// | |              | |
//  -                -
//                   |
//   ----------------    
//  \/
//  _                _
// | |              | |
//  -                -
// 
LytChannelRouteUtil.gridRouteFullsquareDownLeftB = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc) {

    if (firstPass) return;

    ctlPoints[1] = c1.y + LytChannelRouteUtil.getYChannelBase(grid,srcIndex) + LytChannelRouteUtil.getHorzOffset(channelHorzSrc);

    if (gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {
	ctlPoints[0] = c1.x;
	// ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.bottom = 1;
    } else {
	ctlPoints[0] = c1.x - skewConstant;
	// ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.bottom_skew_left = 1;
    }
    if (gridMapperDst[dstIndex].top == 0 && gridMapperSrc[dstIndex].top == 0) {
	ctlPoints[2] = c2.x;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.top = 1;
    } else {
	ctlPoints[2] = c2.x + skewConstant;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.top_skew_right = 1;
    }

}



//
// We have a "full square".
// Route from the source left to dest right, checking for connection conflicts.
// Note, we could have implemented an alternative route (source top to dest bottom),
// supplementing the above route.
//
//  _      _
// | |  ->| |
//  -  |   -
//     |
//  _  |   _
// | |-   | |
//  -      -
// 
// claim01
LytChannelRouteUtil.gridRouteFullsquareUpRight = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc) {

    if (firstPass) return;

    var debug = false;

    ctlPoints[0] = c1.x + LytChannelRouteUtil.getXChannelBase(grid,srcIndex) - LytChannelRouteUtil.getVertOffset2(channelVertSrc);

    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {
	if (debug) alert(' right ');

	//ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y; 
	gridMapperSrcResult.right = 1;
	// gridMapperSrcResult.left = 1;
    } else {
	if (debug) alert(' right NOT ');
	// ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y - skewConstant; 
	gridMapperSrcResult.right_skew_top = 1;
    }
    if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0) {
	if (debug) alert(' left ');
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y;
	gridMapperDstResult.left = 1;
    } else {
	if (debug) alert(' left NOT');
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y + skewConstant;
	gridMapperDstResult.left_skew_bottom = 1;
    }
}


//
//  _                _
// | |              | |
//  -                -
//                  /\
//    ---------------
//  |
//  _                _
// | |              | |
//  -                -
// 
LytChannelRouteUtil.gridRouteFullsquareUpRightB = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc) {

    if (firstPass) return;

    ctlPoints[1] = c2.y + LytChannelRouteUtil.getYChannelBase(grid,srcIndex) + LytChannelRouteUtil.getHorzOffset(channelHorzSrc);

    if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {
	ctlPoints[0] = c1.x;
	// ctlPoints[1] = c1.y - (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.top = 1;
    } else {
	ctlPoints[0] = c1.x + skewConstant;
	// ctlPoints[1] = c1.y - (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.top_skew_right = 1;
    }

    if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0) {
	ctlPoints[2] = c2.x;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.bottom = 1;
    } else {
	ctlPoints[2] = c2.x - skewConstant;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.bottom_skew_left = 1;
    }

}

// 314

LytChannelRouteUtil.getYChannelBase = function(grid, srcIndex) {

    return (grid.getRowHeightNoPad(srcIndex) /2) + grid._getPadHeightPostInternal(srcIndex);
}

LytChannelRouteUtil.getXChannelBase = function(grid, srcIndex) {

    return (grid.getColWidthNoPad(srcIndex) /2) + grid._getPadWidthPostInternal(srcIndex);
}

LytChannelRouteUtil.getHorzOffset = function(channelHorzSrc) {

    return (channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta);
}

// like getHorzOffset, but flip the sign.
LytChannelRouteUtil.getHorzOffset2 = function(channelHorzSrc) {

    return (channelHorzSrc.channelTotalSpace/2 - channelHorzSrc.channelDelta);
}

LytChannelRouteUtil.getVertOffset = function(channelVertSrc) {

    return (channelVertSrc.channelTotalSpace/2 + channelVertSrc.channelDelta);
}


// like getVert, but flip the sign.
LytChannelRouteUtil.getVertOffset2 = function(channelVertSrc) {

    return (channelVertSrc.channelTotalSpace/2 - channelVertSrc.channelDelta);
}


//
// Route a full square up/left
//
// Route from the source left to dest right, checking for connection conflicts.
// Note, we could have implemented an alternative route (source top to dest bottom),
// supplementing the above route.
//
//
//  _      _
// | |<-  | |
//  -   |  -
//      |
//  _   |  _
// | |   -| |
//  -      -
// 

// claim00
LytChannelRouteUtil.gridRouteFullsquareUpLeft = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc) {

    ctlPoints[0] = c2.x + LytChannelRouteUtil.getXChannelBase(grid,srcIndex) - LytChannelRouteUtil.getVertOffset2(channelVertSrc);

    if (firstPass) return;

    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {
	// ctlPoints[0] = c1.x - (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y; 
	gridMapperSrcResult.left = 1;
    } else {
	// ctlPoints[0] = c1.x - (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y - skewConstant; 
	gridMapperSrcResult.left_skew_top = 1;
    }
    if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0) {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y;
	gridMapperDstResult.right = 1;
    } else {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y + skewConstant;
	gridMapperDstResult.right_skew_bottom = 1;
    }

}

//
//  _                _
// | |              | |
//  -                -
//  /\ 
//    ---------------
//                   |
//  _                _
// | |              | |
//  -                -
// 
LytChannelRouteUtil.gridRouteFullsquareUpLeftB = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc) {

    if (firstPass) return;

    ctlPoints[1] = c2.y + LytChannelRouteUtil.getYChannelBase(grid,srcIndex) + LytChannelRouteUtil.getHorzOffset(channelHorzSrc);

    // (channelHorzSrc.channelTotalSpace/2 + channelHorzSrc.channelDelta);

    if (gridMapperSrc[srcIndex].top == 0 && gridMapperDst[srcIndex].top == 0) {
	ctlPoints[0] = c1.x;
	// ctlPoints[1] = c1.y - (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.top = 1;
    } else {
	ctlPoints[0] = c1.x - skewConstant;
	// ctlPoints[1] = c1.y - (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.top_skew_left = 1;
    }
    if (gridMapperDst[dstIndex].bottom == 0 && gridMapperSrc[dstIndex].bottom == 0) {
	ctlPoints[2] = c2.x;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.bottom = 1;
    } else {
	ctlPoints[2] = c2.x + skewConstant;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.bottom_skew_right = 1;
    }

}


//
// Route a full square down/right
//
// Route from the source right to dest left, checking for connection conflicts.
// Note, as a future extension, we could add an alternative route (source bottom to dest top),
// supplementing the above route.
//
//  _       _
// | |--   | |
//  -   |   -
//      |
//  _   |   _
// | |   ->| |
//  -       -
// 
LytChannelRouteUtil.gridRouteFullsquareDownRight = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelVertSrc) {

    ctlPoints[0] = c1.x + LytChannelRouteUtil.getXChannelBase(grid,srcIndex) - LytChannelRouteUtil.getVertOffset(channelVertSrc);

    if (firstPass) return;

    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {
	// ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y; 
	gridMapperSrcResult.right = 1;
    } else {
	// ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
	ctlPoints[1] = c1.y + skewConstant; 
	gridMapperSrcResult.right_skew_bottom = 1;
    }

    if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0) {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y;
	gridMapperDstResult.left = 1;
    } else {
	ctlPoints[2] = ctlPoints[0];
	ctlPoints[3] = c2.y - skewConstant;
	gridMapperDstResult.left_skew_top = 1;
    }

}

//
// Alt rout, used for close rows.
//
//  _              _
// | |            | |
//  -              -
//  |     
//   -------------
//                |
//  _             \/
// | |            | |
//  -              -
// 
LytChannelRouteUtil.gridRouteFullsquareDownRightB = function(firstPass, grid, c1, c2, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints, channelHorzSrc) {

    if (firstPass) return;

    ctlPoints[1] = c1.y + LytChannelRouteUtil.getYChannelBase(grid,srcIndex) + LytChannelRouteUtil.getHorzOffset(channelHorzSrc);

    if (gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {
	ctlPoints[0] = c1.x;
	// ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.bottom = 1;
    } else {
	ctlPoints[0] = c1.x + skewConstant; 
	// ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);
	gridMapperSrcResult.bottom_skew_right = 1;
    }

    if (gridMapperDst[dstIndex].top == 0 && gridMapperSrc[dstIndex].top == 0) {
	ctlPoints[2] = c2.x;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.top = 1;
    } else {
	ctlPoints[2] = c2.x - skewConstant;
	ctlPoints[3] = ctlPoints[1];
	gridMapperDstResult.top_skew_left = 1;
    }

}

//
// Route orthogonal grid connections that are diagonnaly adjacent.
//
LytChannelRouteUtil.gridRouteCloseDownRight = function(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints) {

    // alert(dstCol + ' ' + dstRow + ' ' + ' close Rows ');

    var debug = false;

    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
	|| (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

	// 
	// flags available on second pass
	// 

	if (!firstPass) {

	    //
	    //
	    // Check for any empty grid locations to route through
	    //
	    if (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 
		|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {

		if (debug) alert(dstCol + ' ' + srcRow + ' empty ' + srcCol + ' ' + dstRow);

		// 
		// there are two spots where we could route this link.
		// 
		// 
		// Case where there are two potential dst node connection points,
		// since both spaces are empty.
		// 
		// Route to the one that has the least inLinks.
		// 

		//
		// Check one of the two preferred cases first.
		//
		if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0 &&
		    gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {
		    
		    gridMapperDstResult.left = 1;
		    gridMapperSrcResult.bottom = 1;

		    if (debug) alert(' dst left src bottom ' + dstCol + ' ' + dstRow + ' ' + ' left ');
		    // 
		    // Connect dst left src bottom
		    //  _
		    // | |
		    //  - 
		    //  |  
		    //  |      _
		    //   ---->| |
		    //         -
		    // 
		    // left route
		    ctlPoints[0] = c1.x;
		    ctlPoints[1] = c2.y;

		}
		else if (gridMapperDst[dstIndex].top == 0 && gridMapperSrc[dstIndex].top == 0 && 
			 grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) {

		    gridMapperDstResult.top = 1;

		    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {

			// alert(dstCol + ' ' + dstRow + ' ' + ' top ');
			// 
			// dst top src left
			//  _
			// | |-----  
			//  -      |
			//         \/
			//         _
			//        | |
			//         -
			// 
			ctlPoints[0] = c2.x;
			ctlPoints[1] = c1.y;

			gridMapperSrcResult.right = 1;


		    } else if (gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {

			
			// 
			// Connect dst top, src bottom
			//
			//  _
			// | |
			//  - 
			//  |  
			//   -----  
			//        |  
			//        \/
			//         _
			//        | |
			//         -
			// 
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.bottom = 1;

			if (debug) alert('dst top src bottom ');
  
		    } else {
			
			//
			// challenge 3 minute
			// She closed the book, placed it on the table, and finally decided to walk through door.
			// 600 words long.
			// 583 works left
			// npr.org/threeminutefiction
			// 
			
			if (debug) alert(' dst top * right skewed bottom ');
			// 
			// Connect dst top skewed, src bottom 
			//
			//  _
			// | |
			//  - ----
			//        |  
			//        \/
			//         _
			//        | |
			//         -
			// 
			// 
			ctlPoints[0] = c2.x;
			ctlPoints[1] = c1.y + skewConstant;

			// c11
			gridMapperSrcResult.right_skew_bottom = 1;

		    }

		} 
		else if (gridMapperDst[dstIndex].left == 0 && gridMapperSrc[dstIndex].left == 0 &&
			   grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {
		    
		    gridMapperDstResult.left = 1;

		    if (gridMapperSrc[srcIndex].right == 0 && gridMapperDst[srcIndex].right == 0) {

			gridMapperSrcResult.right = 1;

			if (debug) alert(dstCol + ' ' + dstRow + ' ' + ' dst left src right ');
			// 
			// Connect dst left src right
			//  _
			// | |-
			//  -  |
			//     |  
			//     |   _
			//      ->| |
			//         -
			// 

			ctlPoints[0] = c1.x + (grid.getColWidth(srcIndex) / 2);
			ctlPoints[1] = c1.y 

			ctlPoints[2] = ctlPoints[0];
			ctlPoints[3] = c2.y;

		    }
		    else {

			gridMapperSrcResult.bottom_skew_right = 1;

			if (debug) alert(' dst left src bottom ');
			// alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst left src bottom
			//  _
			// | |
			//  - 
			//   |  
			//   |     _
			//    --->| |
			//         -
			// 
			// left route
			ctlPoints[0] = c1.x + skewConstant;
			ctlPoints[1] = c2.y;

		    }
		}
		// added 3/12 
		else if (gridMapperDst[srcIndex].right == 0 && gridMapperSrc[srcIndex].right == 0 &&
			   grid.getCellWidthOrig(grid._getIndex(dstCol, srcRow)) == 0) {

		    // Check for an open source lhs spot
		    gridMapperSrcResult.right = 1;

		    gridMapperDstResult.top_skew_left = 1;

		    ctlPoints[0] = c2.x - skewConstant;
		    ctlPoints[1] = c1.y;

		}
 		else {

		    if (debug) alert(' both skewed');
		    // c11

		    gridMapperDstResult.top_skew_left = 1;
		    gridMapperSrcResult.right_skew_bottom = 1;

		    // both skewed
		    //  _
		    // | |
		    //  - ----
		    //        |
		    //        \/
		    //         _
		    //        | |
		    //         -
		    // 
		    ctlPoints[0] = c2.x - skewConstant;
		    ctlPoints[1] = c1.y + skewConstant;

		}
	    }
	}
    }
}



//
// Route orthogonal grid connections that are diagonnaly adjacent.
//
LytChannelRouteUtil.gridRouteCloseDownLeft = function(firstPass, grid, c1, c2, srcRow, srcCol, dstRow, dstCol, srcIndex, dstIndex, skewConstant, gridMapperSrc, gridMapperDst, gridMapperSrcResult, gridMapperDstResult, ctlPoints) {

    // alert(dstCol + ' ' + dstRow + ' ' + ' close Rows ');

    var debug = false;

    if (debug) alert('gridRouteCloseDownLeft ');


    if ((grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) 
	|| (grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0)) {

	// 
	// flags available on second pass
	// 

	if (!firstPass) {

	    //
	    //
	    // Check for any empty grid locations to route through
	    //
	    if (grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0 
		|| grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {

		if (debug) alert(dstCol + ' ' + srcRow + ' empty ' + srcCol + ' ' + dstRow);

		// 
		// there are two spots where we could route this link.
		// 
		// 
		// Case where there are two potential dst node connection points,
		// since both spaces are empty.
		// 
		// Route to the one that has the least inLinks.
		// 

		//
		// Check one of the two preferred cases first.
		//
		if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0 &&
		    grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0 &&
		    gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {
		    
		    gridMapperDstResult.right = 1;
		    gridMapperSrcResult.bottom = 1;

		    if (debug) alert(' ** dst left src bottom ' + dstCol + ' ' + dstRow + ' ' + ' left ');
		    // 
		    // Connect dst right src bottom
		    // 
		    //         _
		    //        | |
		    //         - 
		    //         |  
		    //   _     |
		    //  | |<---
		    //   -
		    // 
		    // xx
		    // 
		    ctlPoints[0] = c1.x;
		    ctlPoints[1] = c2.y;

		    return;

		}
		else if (gridMapperDst[dstIndex].top == 0 && gridMapperSrc[dstIndex].top == 0 && 
			 grid.getCellWidthOrig(grid._getIndex(srcRow, dstCol)) == 0) {

		    gridMapperDstResult.top = 1;

		    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {

			if (debug) alert(dstCol + ' ' + dstRow + ' ' + ' top ');
			// 
			// dst top src left
			//         _
			//   -----| |
			//  |      -
			//  \/       
			//  _   
			// | |
			//  -
			// 
			ctlPoints[0] = c2.x;
			ctlPoints[1] = c1.y;

			gridMapperSrcResult.left = 1;


		    } else if (gridMapperSrc[srcIndex].bottom == 0 && gridMapperDst[srcIndex].bottom == 0) {
			
			if (debug) alert(' dst top src bottom');
			
			// 
			// Connect dst top, src bottom
			//
			//        _
			//       | |
			//        - 
			//        |  
			//    ----  
			//   |  
			//   \/
			//   _
			//  | |
			//   -
			// 
			// 
			ctlPoints[0] = c1.x;
			ctlPoints[1] = c1.y + (grid.getRowHeight(srcIndex) / 2);

			ctlPoints[2] = c2.x;
			ctlPoints[3] = ctlPoints[1];

			gridMapperSrcResult.bottom = 1;

		    } else {

			if (debug) alert(' gridMapperSrcResult.left_skew_bottom = ')
			
			// 
			// Connect dst top skewed, src bottom 
			//
			//        _
			//       | |
			//     ---- 
			//    |  
			//   \/
			//   _

			//   -
			//
			// 
			ctlPoints[0] = c2.x;
			ctlPoints[1] = c1.y + skewConstant;

			gridMapperSrcResult.left_skew_bottom = 1;

		    }

		} 
		else if (gridMapperDst[dstIndex].right == 0 && gridMapperSrc[dstIndex].right == 0 &&
			   grid.getCellWidthOrig(grid._getIndex(dstRow, srcCol)) == 0) {
		    
		    gridMapperDstResult.right = 1;

		    if (gridMapperSrc[srcIndex].left == 0 && gridMapperDst[srcIndex].left == 0) {

			gridMapperSrcResult.left = 1;

			if (debug) alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst right src left
			// 
			//          _
			//        -| |
			//       |  - 
			//       |  
			//   _   |  
			//  | |<-
			//   -
			// 

			ctlPoints[0] = c1.x - (grid.getColWidth(srcIndex) / 2);
			ctlPoints[1] = c1.y 

			ctlPoints[2] = ctlPoints[0];
			ctlPoints[3] = c2.y;

		    }
		    else {

			gridMapperSrcResult.bottom_skew_left = 1;

			if (debug) alert(dstCol + ' ' + dstRow + ' ' + ' left ');
			// 
			// Connect dst right src bottom_skew
			//         _
			//        | |
			//         - 
			//         |  
			//   - <---
			//  | |
			//   -
			// 
			// left route
			ctlPoints[0] = c1.x + skewConstant;
			ctlPoints[1] = c2.y;

		    }
		}
		// added 3/12 
		else if (gridMapperDst[srcIndex].left == 0 && gridMapperSrc[srcIndex].left == 0 &&
			   grid.getCellWidthOrig(grid._getIndex(dstCol, srcRow)) == 0) {

		    // Check for an open source lhs spot
		    gridMapperSrcResult.left = 1;

		    gridMapperDstResult.top_skew_right = 1;

		    ctlPoints[0] = c2.x + skewConstant;
		    ctlPoints[1] = c1.y;

		}
 		else {

		    if (debug) alert('else else ');

		    gridMapperDstResult.top_skew_right = 1;
		    gridMapperSrcResult.left_skew_bottom = 1;

		    // both skewed
		    //         _
		    //        | |
		    //     --- - 
		    //    |
		    //    \/
		    //   | |
		    //    -
		    // 
		    ctlPoints[0] = c2.x + skewConstant;
		    ctlPoints[1] = c1.y + skewConstant;


		}
	    }
	}
    }
}



LytChannelRouteUtil.getKIndex = function(horz, srcRow, dstRow, srcCol, dstCol, horzLinksOut, vertLinksOut) {

    var forwardLink;

    if (horz) forwardLink = LytChannelRouteUtil.isForwardLink(srcCol, dstCol);
    else forwardLink = LytChannelRouteUtil.isForwardLink(srcRow, dstRow);

    var kInverse = 0;
    var k;

    if (horz) {

	for (k=0; k<horzLinksOut.length; k++) {
	    if (horzLinksOut[k].ID == dstID) {
		break;
	    }
	}
	kInverse = horzLinksOut.length - k - 1;

    } else {

	if (vertLinksOut) {
	    for (k=0; k<vertLinksOut.length; k++) {
		if (vertLinksOut[k].ID == dstID) {
		    break;
		}
	    }
	    kInverse = vertLinksOut.length - k - 1;

	}
    }

    //
    // use (k+1) as a scalar function ... 
    // 

    var kindex = k;
    if (!forwardLink) kindex = kInverse;

    return kindex;

}


//
//
// Given a slot index, the number of slots, and the total space,
// return the position of the slot.
//
//
function getSlot(slotIndex, numSlots, totalSpace) {

    // alert('getslot ' + slotIndex + ' numSlots ' + numSlots + ' totalSpace ' + totalSpace);

    var delta;

    // if (numSlots == 1) delta = totalSpace / 2;
    if (numSlots == 1) delta = 0;
    else {

	var slotWidth = totalSpace / (numSlots - 1);
	delta = slotIndex * slotWidth;
    }

    return delta;


}

