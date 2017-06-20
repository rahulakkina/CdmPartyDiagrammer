
/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION

    SparseGridLayout.as

    Code for the sparse grid layout descriptor.
     
    LytSparseGridLayoutDesc objects extend GridLayoutDesc,
    and are used by the application to define explicit grid coordinates for each node.
	
    LytSparseGridLayoutDesc objects allow the definition 
    of node grids with application-defined coordinates for nodes.
    These grids are sparse, for example, by defining nodes along coordinates
    (0,0), (1,1), (2,2) ..., the positions of the nodes would be along
    the diagonal of a grid.

    The application uses setGridLoc() to set the grid location of each node.
    LytSparseGridLayoutDesc objects are passed to the setTopLevelLayoutMethod():

    var gl:LytSparseGridLayoutDesc = new LytSparseGridLayoutDesc();
    topCanvas.setTopLevelLayoutMethod(Layout.LAYOUT_SPARSE_GRID, gl); 

    MODIFIED    (MM/DD/YY)
    lmolesky	09/14/11 - Created

*/

//
// Grid layouts
//
//

var LytSparseGridLayoutDesc = function()
{
    this.Init();

};

LytObj.createSubclass(LytSparseGridLayoutDesc, LytGridLayoutDesc, "LytSparseGridLayoutDesc");

LytSparseGridLayoutDesc.prototype.Init = function()
{

    LytSparseGridLayoutDesc.superclass.Init.call(this);

    //
    // Maps a nodeID key to a grid location (Point)
    //
    this._nodeToGridLocMap = new Array();

    //
    // Maps a Point key to a to a nodeID
    //
    this._gridLocToNodeMap = new Array();

};


LytSparseGridLayoutDesc.prototype.getNodeToGridLocMap = function() {
    return this._nodeToGridLocMap;
}

LytSparseGridLayoutDesc.prototype.getGridLocToNodeMap = function() {
    return this._gridLocToNodeMap;
}

//
// set the grid location of nodeID to Point pt.
// e.g. setGridLoc('n0', new LytPoint(1,1))
// 
// Possible extensions - handle case where two or more nodes map to the same point.
// 
LytSparseGridLayoutDesc.prototype.setGridLoc = function(nodeID, pt) {

    var debug = false;


    // 
    // clear the nodeToGridLocMap if it has already been set
    // (this allows the support of updates)
    // 
    if (this._nodeToGridLocMap[nodeID]) {
	var tempPt = this._nodeToGridLocMap[nodeID];
	if (debug) alert(' setGridLoc reset ' + nodeID + ' old point ' + tempPt.getString() + ' prev mapping ' + this._gridLocToNodeMap[tempPt.getString()]);
	//
	// Erase the mapping if it still points to the old node.
	//
	if (this._gridLocToNodeMap[tempPt.getString()] == nodeID)
	    this._gridLocToNodeMap[tempPt.getString()] = null;
    }

    // push onto nodeList if not already in map.
    this._nodeToGridLocMap[nodeID] = pt;
    this._gridLocToNodeMap[pt.getString()] = nodeID;

}

//
// Return the nodeID that is at the passed location (pt).
//
LytSparseGridLayoutDesc.prototype.getNodeFromLoc = function(pt) {

    return(this._gridLocToNodeMap[pt.getString()]);
}


LytSparseGridLayoutDesc.prototype.getGridLoc = function(nodeID) {

    if (this._nodeToGridLocMap[nodeID])
	return this._nodeToGridLocMap[nodeID];
    else
	return new LytPoint(0,0);
    
}

LytSparseGridLayoutDesc.prototype.getGridLocOrNull = function(nodeID) {

    if (this._nodeToGridLocMap[nodeID])
	return this._nodeToGridLocMap[nodeID];
    else
	return null;
    
}

//
// Return true if there is a clear x path between points pt1 and pt2.
// Used in channel routing.
//
// For example, 
//
//    isClearPathX(n0, n2) returns true
//    isClearPathX(n3, n5) returns false
//
//  n0 -----------> n2
//  
//  n3 --   n4   -> n5
//       |      |
//        ------
//
LytSparseGridLayoutDesc.prototype.isClearPathX = function(srcID, dstID) {

    // alert(' clearpath ' + srcID + ' ' + dstID);
    var debug = false;

    // if (srcID == 'n0' && dstID == 'n5') debug = true;

/*
    if (debug) {
	var ptTemp = this.getGridLocOrNull('n4');
	alert(' ptTemp ' + ptTemp.getString());
	alert(' ptTemp2 ' + this.getNodeFromLoc(ptTemp));
    }
*/

    var pt1 = this.getGridLocOrNull(dstID);
    var pt2 = this.getGridLocOrNull(srcID);

    if (!pt1) return false;
    if (!pt2) return false;

    //
    // y values must match - we are checking horizontal segments
    //
    if (pt1._y != pt2._y) return false;

    var x1 = Math.min(pt1._x, pt2._x);
    var x2 = Math.max(pt1._x, pt2._x);

    if (debug) alert('isClear check ' + pt1._x + ' ' + pt2._x + ' ' + x1 + ' ' + x2);


    // Adjacent segments are always true
    if ((x2 - x1) < 2) return true;

    //
    // Check if there are any nodes defined along x between the two points 
    //
    for (var i=x1+1; i<x2; i++) {

	if (this.getNodeFromLoc(new LytPoint(i, pt1._y))) {
	    if (debug) alert(' node at ' + i);
	    return false;
	}
	else if (debug) alert (' clear at ' + i + ',' + pt1._y);
    }

    return true;
}

//
// return the max x in the row specified by y
// (return -1 if no cells are occupied)
//
LytSparseGridLayoutDesc.prototype.getMaxX = function(yLoc) {

    var maxX = this.getMaxLocXInternal();
    var foundX = -1;

    for (var i=0; i<=maxX; i++) {

	if (this.getNodeFromLoc(new LytPoint(i, yLoc))) {
	    foundX = i;
	}
    }

    return foundX;

}

LytSparseGridLayoutDesc.prototype.getMaxY = function(xLoc) {

    var maxY = this.getMaxLocYInternal();
    var foundY = -1;

    for (var i=0; i<=maxY; i++) {

	if (this.getNodeFromLoc(new LytPoint(xLoc, i))) {
	    foundY = i;
	}
    }

    return foundY;

}

//
// isClearPathY() - analog to isClearPathX()
//
LytSparseGridLayoutDesc.prototype.isClearPathY = function(srcID, dstID) {

    // alert(' clearpath ' + srcID + ' ' + dstID);

    var pt1 = this.getGridLocOrNull(dstID);
    var pt2 = this.getGridLocOrNull(srcID);

    if (!pt1) return false;
    if (!pt2) return false;

    // alert(' clearpath got pts ');

    // x values must match - we are checking vertical segments
    if (pt1._x != pt2._x) return false;

    var y1 = Math.min(pt1._y, pt2._y);
    var y2 = Math.max(pt1._y, pt2._y);

    // Adjacent segments are always true
    if ((y2 - y1) < 2) return true;

    //
    // Check if there are any nodes defined along x between the two points 
    //
    for (var i=y1+1; i<y2; i++) {

	if (this.getNodeFromLoc(new LytPoint(pt1._x, i))) {
	    return false;
	}
    }

    return true;
}



//
// Return true if the nodeID is a member of the sparse grid.
//
LytSparseGridLayoutDesc.prototype.isMemberInternal = function() {

    if (this._nodeToGridLocMap[nodeID]) return true;
    else return false;

}

//
// Return the maximum x coordinate.
//
LytSparseGridLayoutDesc.prototype.getMaxLocXInternal = function() {
					
    var x = 0;
    var pt;
			
    for (var nodeID in this._nodeToGridLocMap) {
	pt = this._nodeToGridLocMap[nodeID];
	if (pt._x > x) x = pt._x;
    }
		      	
    return x;
}

//
// Return the maximum y coordinate.
//
LytSparseGridLayoutDesc.prototype.getMaxLocYInternal = function(nodeID) {
					
    var y = 0;
    var pt;
			
    for (var nodeID in this._nodeToGridLocMap) {
	pt = this._nodeToGridLocMap[nodeID];
	if (pt._y > y) y = pt._y;
    }
		      	
    return y;
}

//
// Print the sparse grid.
//

LytSparseGridLayoutDesc.prototype.print = function() {

    var printBuffer = "";
    var pt;
    var nodeID;

    // 
    // Iterate over assocative array,
    // creating a printBuffer for each node-to-gridLocation mapping
    // 
    for (var nodeID in this._nodeToGridLocMap) {

	pt = this._nodeToGridLocMap[nodeID];
    
	printBuffer += nodeID;
	printBuffer += ':';
	printBuffer += pt.getString();
	printBuffer += ' ';

    }

    alert(printBuffer);


}

// LytSparseGridLayoutDesc.TESTVAR = 0;
