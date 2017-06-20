/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytGridUtil.js

    Utility function for grid layouts.

    NOTES

    Need to address border padding
    Need to extend this with a pre and post pad array.  
    This will allow us to (a) center variable sized nodes,
    and (b) allocate space text on one side of a column (or row).

    MODIFIED    (MM/DD/YY)
    lmolesky	01/31/12 - Add getGridCoordCellContentHeightDiff() (for node content alignment support).
    lmolesky	01/24/12 - Bug fix for getGridCoordCentered()
    lmolesky	12/29/11 - Code cleanup/comment
    lmolesky	12/19/11 - Extend with per column and per row padding
    lmolesky	11/28/11 - Added _getColSegmentWidth and getIndex() to support better column and row routes.
    lmolesky	11/19/11 - Refinements - added __cid (for diagnostics).
    lmolesky	09/13/11 - Created

*/

//
// Storing Dimensions of Input Nodes
// --------------------------------
//
// Input nodes may have varying wxh dimensions:
//
//
//   ----------  
//  |          |     ----
//  |          |    |    |
//  |          |    |    |
//  |          |     ----
//   ----------  
//               
//      ----         ----
//     |    |       |    |
//     |    |       |    |
//      ----         ----
//               
//               
//
// The input dimensions of these nodes are stored as arrays:
//
//   - cellWidthOrig[index]
//   - cellHeightOrig[index]
//
// These values are set at the invocation of
// 
//    setCellSize(index, w, h)
//
//
// Maintaining Row Heights and Column Widths
// --------------------------------
//
// 
// In order to utilize space effectively, the GridUtil maintains the maximum width and height of each cell
// in its column and row respectively.
//
// Below is an example of _rowHeights[row]
//
// ..................................
//        ---------- 
//       |          |     ----
//       |          |    |    |
//       |          |    |    |
//       |          |     ----
// .......---------- ................
//                    
// ..................................
//           ----         ----  
//          |    |       |    |
//          |    |       |    |
// ..........----.........----.......
//               
//
// Similarly, _colWidths[col] is maintained
//
// The _rowHeights[] and _colHeights[] are set on the invocation of:
// 
//    _setMaxWidthAndHeight()
//
//
// Padding
// -------
// 
// Padding may be uniform
//               
//  ==========
//  !        !
//  !  ----  !      
//  ! |    | !     
//  ! |    | !     
//  !  ----  !     
//  !        !
//  ==========
//               
//               
// Padding may be non-uniform
//               
//  ==========
//  !        !
//  !        !
//  !        !
//  !  ----  !      
//  ! |    | !     
//  ! |    | !     
//  !  ----  !     
//  !        !
//  ==========
//               
//  Non-uniform padding is used for the following purposes:
//               
//  To make space for text on direct links:
//               
//  =====================================
//  !            !             !        !
//  !            !             !        !
//  !            !             !        !
//  !  ----      !       ----  !  ----  !     
//  ! |    | Link Text  |    | ! |    | !    
//  ! |    |----------->|    |-->|    | !           
//  !  ----      !       ----  !  ----  !
//  !            !             !        !
//  =====================================
//               
//               
// To make space for text on channel routed links:
//               
//  =============================
//  !                           !
//  !        Link Text          !
//  !     ----------------      !
//  !    |                |     !
//  !  ----     ----     ----   !    
//  ! |    |   |    |   |    |  ! 
//  ! |    | ! |    | ! |    |  !
//  !  ----  !  ----  !  ----   ! 
//  !        !        !         !
//  =============================
//               
// 
// The following arrays are maintained to support non-uniform padding
//               
// per column:              
// _widthPadArrayPre[]
// _widthPadArrayPost[]
// 
// per row:
// _heightPadArrayPre[]
// _heightPadArrayPost[]
//               
//               
// API
// ---           
//               
// The API used to set padding is row/column based (NOT index based).
//               
// Here is an example invocation:
//               
//    setPadHeightArrayPreRow(row, h)
// 
//               
// Thus, the caller sets (non-uniform) padding AFTER _setMaxWidthAndHeight() is called
// (after the rows and columns have been fixed).
//               
//               
//               
// Index Order
// -----------
// 
// rowMajor order is the default.
//

var LytGridUtil = function() {

    this.Init();
}

LytGridUtil.prototype.Init = function()
{
    this._layoutMethod = LytLayout.LAYOUT_GRID;
    this._rowMajor = true;
    this.__cid = null;

    this._numRows = 0;
    this._numCols = 0;

    this._nodeCount = 0;

    this.id = "";

    this._colWidths = new Array();
    this._rowHeights = new Array();

    this._colWidthsPadded = new Array();
    this._rowHeightsPadded = new Array();

    this._colWidthsPaddedCume = new Array();
    this._rowHeightsPaddedCume = new Array();

    this._colWidthsContent = new Array();
    this._rowHeightsContent = new Array();

    this._cellWidthMax = 0;
    this._cellHeightMax = 0;

    // this._cellHeightContentsMax = 0;

    this._cellWidthOrig = new Array();
    this._cellHeightOrig = new Array(); 

    this._cellHeightContentOrig = new Array(); 
    this._cellWidthContentOrig = new Array(); 

    // this.cellWidth = new Array();
    // this.cellHeight = new Array();

    this._widthPad = 16;
    this._heightPad = 16;

    // this._widthPad = 0;
    // this._heightPad = 0;

    // per column/row padding
    this._cellPadW = new Array();
    this._cellPadH = new Array();   

    this._widthPadArray = new Array();
    this._heightPadArray =  new Array();

    this._widthPadArrayPre = new Array();
    this._heightPadArrayPre =  new Array();

    this._widthPadArrayPost = new Array();
    this._heightPadArrayPost =  new Array();

    this._borderPadTop = this._heightPad/2;
    this._borderPadLeft = this._widthPad/2;


}


LytGridUtil.prototype.setLayoutMethod = function(layoutMethod, layoutDesc) {

    // groupID is a placeholder for now.
    // this.groupID = groupID;
    this._layoutMethod = layoutMethod;
}


LytGridUtil.prototype.setNodeCount = function(count) {
    this._nodeCount = count;
    // alert('nodecount ' + this._nodeCount);
}

LytGridUtil.prototype.getNodeCount = function () {
    return this._nodeCount;
}

//
// Dimensions of the columns and rows of the grid cells.
//

LytGridUtil.prototype.getNumCols = function() { return this._numColsZ; }
LytGridUtil.prototype.getNumRows = function() { return this._numRowsZ; }


/* return the column width of the cell at the specfied index */
LytGridUtil.prototype.getColWidth = function(index) {
    
    var col = this.getCol(index);
    return this._colWidthsPadded[col];
}

/* return the column width of the cell at the specfied index */
LytGridUtil.prototype.getColWidthNoPad = function(index) {
    
    var col = this.getCol(index);
    // return this._colWidthsPadded[col] - this._getPadWidthInternal(index);
    return this._colWidths[col];

}

//
// Segment widths are used to run tight channel routes.
// 
// For example, when we have variable width cell sizes in a grid,
// We need to know the maximum width of in a column segment:
// 
// 
//         /\
//       /    \
//     /        \
//   /            \
//   \            /
//     \        /
//       \    /
//         \/
//          
//          
//        ---
//       |   | -
//        ---   |
//              |
//        ---   |
//       |   |  |
//        ---   |
//              |
//        ---   |
//       |   | _|
//        ---
//
// (This avoids running the link further away from the thinner nodes)
// 
//
//

//
// Return the width of one column segment.
// The segment is between row1 and row2 inclusive.
//
LytGridUtil.prototype.getColSegmentWidthNoPad = function(index1, index2) {
    
    var debug = false;

    var col = this.getCol(index1);
    var row1 = this.getRow(index1);
    var row2 = this.getRow(index2);

    if (debug) alert('getColSegmentWidthNoPad col ' + col + ' row1 ' + row1 + ' row2 ' + row2);

    return this._getColSegmentWidth(col, row1, row2);

}

LytGridUtil.prototype.getRowSegmentWidthNoPad = function(index1, index2) {
    
    var debug = false;

    var row = this.getRow(index1);
    var col1 = this.getCol(index1);
    var col2 = this.getCol(index2);

    return this._getRowSegmentWidth(row, col1, col2);

}
LytGridUtil.prototype.getRowSegmentWidthPostPad = function(index1, index2) {
    
    var debug = false;

    var row = this.getRow(index1);
    var col1 = this.getCol(index1);
    var col2 = this.getCol(index2);

    alert(this._getPadHeightPostInternal(index1));

    return this._getRowSegmentWidth(row, col1, col2) +
	this._getPadHeightPostInternal(index1);

}

//
// Return the width of one column segment.
// The segment is between row1 and row2 inclusive.
//
LytGridUtil.prototype._getColSegmentWidth = function(col, row1, row2) {
    
    var i;
    
    var r1 = Math.min(row1, row2);
    var r2 = Math.max(row1, row2);

    var colSegWidth = 0;

    for (i=r1; i<=r2; i++) {
        
	var j = this._getIndex(i, col);
	if (colSegWidth < this._cellWidthOrig[j]) colSegWidth = this._cellWidthOrig[j];
    }

    return colSegWidth;

}   

LytGridUtil.prototype._getRowSegmentWidth = function(row, col1, col2) {
    
    var i;
    
    var c1 = Math.min(col1, col2);
    var c2 = Math.max(col1, col2);

    var rowSegWidth = 0;

    for (i=c1; i<=c2; i++) {

	var j = this._getIndex(row, i);
	if (rowSegWidth < this._cellHeightOrig[j]) rowSegWidth = this._cellHeightOrig[j];

    }

    return rowSegWidth;

}   

/* return the row height of the cell at the specfied index */
LytGridUtil.prototype.getRowHeight = function(index) {
    
    row = this.getRow(index);
    return this._rowHeightsPadded[row];
}

/* return the row height of the cell at the specfied index */
LytGridUtil.prototype.getRowHeightNoPad = function(index) {
    
    row = this.getRow(index);
    // return this._rowHeightsPadded[row] - this._heightPad;
    return this._rowHeights[row];

}

//
// Return the grid index from the point param.
//
LytGridUtil.prototype.getIndexFromPoint = function(pt) {

    if (this._rowMajor) {
	// alert(' rowMajor ' + this._numColsZ);
	return(this._numColsZ * pt._y + pt._x);
    } else {
	// alert(' colMajor! ' + this._numColsZ);
	return(this._numRowsZ * pt._x + pt._y);
    }
}


//
// Return the index from the row,col
//
LytGridUtil.prototype._getIndex = function(row, col) {

    var debug = false;

    if (this._rowMajor) {

	if (debug) alert(' row major ' + row + ' ' + col);

	index = row * this._numColsZ;
	index += col;
    } else {
	index = col * this._numRowsZ;
	index += row;
    }

    return index;

}

LytGridUtil.prototype.getRow = function(index) {

    if (this._rowMajor)
	return(Math.floor(index / this._numColsZ));
    else
	return(Math.floor(index % this._numRowsZ));

}

LytGridUtil.prototype.getCol = function(index, debug) {

    // var debug = true;

    // if (debug) alert(this.__cid + ' nodeCount ' + this._nodeCount + ' getCol rowMajor ' + this._rowMajor + ' index ' + index + ' this._numRowsZ ' + this._numRowsZ + ' this._numColsZ ' + this._numColsZ);
    if (debug) alert(this.__cid + ' nodeCount ' + this._nodeCount + ' this._numRowsZ ' + this._numRowsZ + ' this._numColsZ ' + this._numColsZ);

    if (this._rowMajor)
	return(Math.floor(index % this._numColsZ));
    else 
	return(Math.floor(index / this._numRowsZ));
}

//
// Set the padding for each cell.
// default padding is 16.
//
LytGridUtil.prototype.setPad = function(w, h) {

    this._widthPad = w;
    this._heightPad = h;
    // alert(' setPad ' + w + ' ' + h);
    // this._widthPad = 0;
    // this._heightPad = 0;

}

LytGridUtil.prototype.getPad = function() {

    return (new Array(this._widthPad,this._heightPad));
}

LytGridUtil.prototype.getPadWidth = function() {

    return this._widthPad;
}

LytGridUtil.prototype.getPadHeight = function() {

    return this._heightPad;
}

LytGridUtil.prototype.initPad = function() {

    this._widthPadArray = new Array();
    this._heightPadArray =  new Array();

    this._widthPadArrayPre = new Array();
    this._heightPadArrayPre =  new Array();

    this._widthPadArrayPost = new Array();
    this._heightPadArrayPost =  new Array();

}

//
// Set the padding for one pad column
//
// deprecated
/*
LytGridUtil.prototype.setPadWidthArrayCol = function(col, w) {
    this._widthPadArray[col] = w;
}
*/

LytGridUtil.prototype.setPadWidthArrayPreCol = function(col, w) {
    this._widthPadArrayPre[col] = w;
}

LytGridUtil.prototype.setPadWidthArrayPostCol = function(col, w) {
    this._widthPadArrayPost[col] = w;
}

//
// Set the padding for one pad row
//
// deprecated
/*
LytGridUtil.prototype.setPadHeightArrayRow = function(row, h) {
    this._heightPadArray[row] = h;
}
*/

LytGridUtil.prototype.setPadHeightArrayPreRow = function(row, h) {
    this._heightPadArrayPre[row] = h;
}

LytGridUtil.prototype.setPadHeightArrayPostRow = function(row, h) {
    this._heightPadArrayPost[row] = h;
}


//
// Return the width pad at the specified index.
//
LytGridUtil.prototype._getPadWidthInternal = function(index) {
    
    var col = this.getCol(index);

    if (isNaN(this._widthPadArray[col])) return this._widthPad;

    return Math.max(this._widthPad, this._widthPadArray[col]);

}

//
// Return the width pad at the specified index.
// Note that the minimum value defaults to a HALF pad width -
// since there is a pre and a post padding value.
//
//
LytGridUtil.prototype._getPadWidthPreInternal = function(index) {
    
    var col = this.getCol(index);

    if (isNaN(this._widthPadArrayPre[col])) return this._widthPad/2;

    // return Math.max(this._widthPad/2, this._widthPadArrayPre[col]);
    return (this._widthPad/2 + this._widthPadArrayPre[col]);

}

LytGridUtil.prototype._getPadWidthPostInternal = function(index) {
    
    var col = this.getCol(index);

    if (isNaN(this._widthPadArrayPost[col])) return this._widthPad/2;

    // return Math.max(this._widthPad/2, this._widthPadArrayPost[col]);
    return (this._widthPad/2 + this._widthPadArrayPost[col]);

}


//
// Return the height pad at the specified index.
//
LytGridUtil.prototype._getPadHeightInternal = function(index) {
    
    var row = this.getRow(index);

    if (isNaN(this._heightPadArray[row])) return this._heightPad;

    return Math.max(this._heightPad, this._heightPadArray[row]);

}

//
// Return the height pad pre at the specified index.
// Note that if usRow is true, the the parameter index is treated as a row.
//
LytGridUtil.prototype._getPadHeightPreInternal = function(indexOrRow, useRow) {
    
    var row = this.getRow(indexOrRow);
    if (useRow) row = indexOrRow;

    if (isNaN(this._heightPadArrayPre[row])) return this._heightPad/2

    // return Math.max(this._heightPad/2, this._heightPadArrayPre[row]);
    return (this._heightPad/2 + this._heightPadArrayPre[row]);

}

LytGridUtil.prototype._getPadHeightPostInternal = function(indexOrRow, useRow) {

    var row = this.getRow(indexOrRow);
    if (useRow) row = indexOrRow;

    if (isNaN(this._heightPadArrayPost[row])) return this._heightPad/2

    // if (this._heightPadArrayPost[row] > 0)  alert(indexOrRow + ' ' + row + ' padarraypost ' + this._heightPadArrayPost[row]);

    // return Math.max(this._heightPad/2, this._heightPadArrayPost[row]);
    return (this._heightPad/2 +  this._heightPadArrayPost[row]);

}


LytGridUtil.prototype.getCellWidthOrig = function(index) {

    var cellWidthOrig = this._cellWidthOrig[index];
    if (isNaN(cellWidthOrig)) cellWidthOrig = 0;

    return cellWidthOrig;
}


//
// Return the width of a padded cell.
//
LytGridUtil.prototype.getCellWidthPadded = function(index) {

    var debug = false;

    //
    // Need to make sure that cellWidth has been set,
    // if not, use zero.
    //
    // This can happen when fixNumCols() is called prior to setting the cell sizes.
    // This (premature call) is done in order to getNumRows() and getNumCols() to return proper values.
    // See LytGridLayout.positionAllNodes() for an example.
    //

    var cellWidthOrig = this._cellWidthOrig[index];
    if (isNaN(cellWidthOrig)) cellWidthOrig = 0;

    var cellWidth = cellWidthOrig + 
	this._getPadWidthPreInternal(index) +
	this._getPadWidthPostInternal(index);

    if (debug && !isNaN(this._cellWidthOrig[index]))
	alert('getCellwidthPadded: ' + index + ' ' + cellWidthOrig + ' ' + this._getPadWidthPreInternal(index) + ' ' + this._getPadWidthPostInternal(index));
	
    return cellWidth;
	
}

//
// Return the height of a padded cell.
//
LytGridUtil.prototype.getCellHeightPadded = function(index) {

    var cellHeightOrig = this._cellHeightOrig[index];
    if (isNaN(cellHeightOrig)) cellHeightOrig = 0;

    var cellHeight = cellHeightOrig +
	this._getPadHeightPreInternal(index) +
	this._getPadHeightPostInternal(index);

/*
    alert(index + 'chp ' + cellHeightOrig + ' ' + 
	this._getPadHeightPreInternal(index) + ' ' + 
	  this._getPadHeightPostInternal(index));
*/


    return cellHeight;
	
}

/**
 Set the size of a cell.
 This is normally called with the dimensions of a node.
*/
LytGridUtil.prototype.setCellSize = function(index, w, h) {

    var debug = false;

    if (debug) alert(index + ' setCellSize ' + w + ' ' + h);

    if (isNaN(w)) return;
    if (isNaN(h)) return;

    // save the original values (w/o padding)
    this._cellWidthOrig[index] = w;
    this._cellHeightOrig[index] = h;

    var wPlus = w + this._getPadWidthPreInternal(index) + this._getPadWidthPostInternal(index);
    var hPlus = h + this._getPadHeightPreInternal(index) + this._getPadHeightPostInternal(index);

    if (this._cellWidthMax < wPlus) this._cellWidthMax = wPlus;
    if (this._cellHeightMax < hPlus) this._cellHeightMax = hPlus;


}

/**
Set the size of the cell content.
Used for aligning nodes that have text.
Call with nodeContents.h
@param h Height of node contents.
*/
LytGridUtil.prototype.setCellContent = function(index, w, h) {

    var debug = false;

    if (isNaN(h)) return;
    this._cellHeightContentOrig[index] = h;

    if (isNaN(w)) return;
    this._cellWidthContentOrig[index] = w;

    // if (this._cellHeightsContentMax < hPlus) this._cellHeightsContentMax = hPlus;
    // if (this._cellWidthsContentMax < hPlus) this._cellWidthsContentMax = hPlus;


}

//
// Reapply padding.
//
// Approach: Iterate over all cell dimenions (cellWidthOrig and cellHeightOrig),
// calling setCellSize().
// setCellSize recomputes cellWidthMax and cellHeightMax.
//
LytGridUtil.prototype.refreshPadding = function() {

    var i;
    for (i=0; i<this._cellWidthOrig.length; i++) {

	if (isNaN(this._cellWidthOrig[i])) continue;
	if (isNaN(this._cellHeightOrig[i])) continue;

	this.setCellSize(i, this._cellWidthOrig[i], this._cellHeightOrig[i]);
    }
    for (i=0; i<this._cellWidthContentOrig.length; i++) {

	if (isNaN(this._cellWidthContentOrig[i])) continue;
	if (isNaN(this._cellHeightContentOrig[i])) continue;

	this.setCellContent(i, this._cellWidthContentOrig[i], this._cellHeightContentOrig[i]);

    }

    // 
    // recalculate max width and height.
    // 
    this._setMaxWidthAndHeight();
    this._calculateCumulative();

}

//
// Indexed version of getPadWidth()
//
LytGridUtil.prototype.getPadWidthCol = function(index) {
    return this._getPadWidthPreInternal(index) + this._getPadWidthPostInternal(index);
}
//
// Indexed version of getPadHeight()
//
LytGridUtil.prototype.getPadHeightRow = function(index) {
    return this._getPadHeightPreInternal(index) + this._getPadHeightPostInternal(index);
}

LytGridUtil.prototype.getDefaultPadHeightRow = function(index) {
    return ;
    // return this._getPadHeightPreInternal(index) + this._getPadHeightPostInternal(index);
}




//
// Automatically fix the number of columns and rows, attempting to balance the aspect ratio.
// (Calculation is based on the this._cellWidthMax and this._cellHeightMax).
//
// Also sets the maximum column width and cell height.
// Calculate the cumulative column and row positions.
//

LytGridUtil.prototype.fixCols = function() {

    var debug = false;

    if (debug) alert(this.__cid + ' fixCols this._nodeCount ' + this._nodeCount);

    //test1();
    // this.test2();

    this._numRowsZ = Math.floor(Math.sqrt(this._nodeCount));

    if (this._numRowsZ < 1) this._numRowsZ = 1;

    // alert(' this._numRowsZ ' + this._numRowsZ);

    this._numColsZ = Math.floor(this._nodeCount / this._numRowsZ);

    // alert('this._numColsZ ' + this._numColsZ);

    if (Math.floor(this._nodeCount % this._numRowsZ) > 0) this._numColsZ++;
    
    this._adjustNumRows(this._nodeCount);

    this._setMaxWidthAndHeight();

    this._calculateCumulative();

}


LytGridUtil.prototype.fixSingleRow = function() {

    this._numRowsZ = 1;
    // hh
    this._numColsZ = this._nodeCount;

    this._setMaxWidthAndHeight();
    this._calculateCumulative();
}       

LytGridUtil.prototype.fixSingleCol = function() {

    this._numColsZ = 1;
    this._numRowsZ = this._nodeCount;

    this._setMaxWidthAndHeight();
    this._calculateCumulative();
}    

/**
    *
    * Set the number of columns.
    * Used by bus layouts and user-defined grid layouts.
    * Second parameter - rowMajorParam - sets rowMajor ordering if true.
    */
LytGridUtil.prototype.fixNumCols = function(numColsParam, rowMajorParam) {

    var debug = false;
    if (debug) alert(this.__cid + ' fixNumCols:numcols ' + numColsParam + ' ' + this._nodeCount);

    if (isNaN(numColsParam)) {this.fixCols(); return;}
    if (numColsParam <= 0) {this.fixCols(); return;}

    if (rowMajorParam)
	this._rowMajor = rowMajorParam;

    // rowMajor = false;
    // rowMajor = true;

    this._numColsZ = numColsParam;         
    
    if (this._numColsZ < 1) this._numColsZ = 1;
    if (this._numColsZ > this._nodeCount) this._numColsZ = this._nodeCount;

    this._numRowsZ = Math.floor(this._nodeCount / this._numColsZ);

    this._adjustNumRows(this._nodeCount);
    
    this._setMaxWidthAndHeight();
    this._calculateCumulative();
}

//
// Fix the number of rows.
// Similar to fixNumCols()
//
LytGridUtil.prototype.fixNumRows = function(numRowsParam, rowMajorParam) {
    
    var debug = false;
    // if (debug) alert(this.__cid + ' fixNumRows:this._numRowsZ ' + numRowsParam + ' nodesCount ' + this._nodeCount);

    if (isNaN(numRowsParam)) {this.fixCols(); return;}
    if (numRowsParam <= 0) {this.fixCols(); return;}

    if (rowMajorParam)
	this._rowMajor = rowMajorParam;

    // rowMajor = false;
    this._numRowsZ = numRowsParam;         
    
    if (this._numRowsZ < 1) this._numRowsZ = 1;
    if (this._numRowsZ > this._nodeCount) this._numRowsZ = this._nodeCount;

    this._numColsZ = Math.floor(this._nodeCount / this._numRowsZ);
    
    this._adjustNumCols(this._nodeCount);
    
    if (debug) alert(this.__cid + ' +++ fixNumRows this._numRowsZ ' + this._numColsZ + ' this._numRowsZ ' + this._numRowsZ + ' ' +  this._nodeCount);

    this._setMaxWidthAndHeight();
    this._calculateCumulative();
}       


// function _adjustNumRows(nodeCountParam) {
LytGridUtil.prototype._adjustNumRows = function(nodeCountParam) {
    
    // alert(' adjust ' + ' nodecount  ' + nodeCountParam);

    switch (this._layoutMethod) {
        
    case LytLayout.LAYOUT_BUS:  

        var numCols2 = this._numColsZ * 2;
        if ((nodeCountParam % numCols2) != 0) {
	    this._numRowsZ = Math.floor((nodeCountParam + numCols2) / this._numColsZ);
        }
        break;
        
    case LytLayout.LAYOUT_GRID:  
    case LytLayout.LAYOUT_SPARSE_GRID:  
        if (Math.floor(nodeCountParam % this._numColsZ) > 0) this._numRowsZ++;

        break;
        
    }    
}   



//
// Shouldn't use this for BUS
//
// function _adjustNumCols(nodeCountParam) {
LytGridUtil.prototype._adjustNumCols = function(nodeCountParam) {

    // alert(' this._numColsZ ' + this.this._numColsZ);
    
    switch (this._layoutMethod) {

    case LytLayout.LAYOUT_GRID:  
    case LytLayout.LAYOUT_SPARSE_GRID:  
        if (Math.floor(nodeCountParam % this._numRowsZ) > 0) this._numColsZ++;

        break;              
    }              
}   


//
// similar to fixSingleCol, but with padding.
// used to match group heights (FMW small topology)
//
LytGridUtil.prototype.fixSingleColWithPadding = function(pad) {
    
    this._numColsZ = 1;
    // hh
    this._numRowsZ = this._nodeCount;

    // this.clearWidthAndHeight();         
    this._setMaxWidthAndHeight();
    
    var padEachRow = pad;
    
    if (this._numRowsZ >= 1)
	padEachRow = pad/(this._numRowsZ - 1);
    
    var i;
    for (i=0; i< this._numRowsZ; i++) {
	this._rowHeightsPadded[i] += padEachRow;      
    }   
    this._calculateCumulative();
}

//
//
//
LytGridUtil.prototype._clearWidthAndHeight = function() {
// function clearWidthAndHeight() {

    //this.clearWidthAndHeight = function() {
    
    var i;
    
    for (i=0; i< this._numColsZ; i++) {
	this._colWidthsPadded[i] = 0;            
	this._colWidths[i] = 0;            
	this._colWidthsContent[i] = 0;            
	// colWidthsShape[i] = 0;            
    }
    
    for (i=0; i< this._numRowsZ; i++) {
	this._rowHeightsPadded[i] = 0;            
	this._rowHeights[i] = 0;            
	this._rowHeightsContent[i] = 0;            
	// rowHeightsPaddedShape[i] = 0;            
    }         
}


//
// set the _colWidths[] and _rowHeightsPadded[]
// The _colWidths[col] is the max of the padded cells in each col.
//
LytGridUtil.prototype._setMaxWidthAndHeight = function() {
    
    var col;
    var row;
    var i;
    
    this._clearWidthAndHeight();

    for (i=0; i< this._nodeCount; i++) {
        
	col = this.getCol(i);
	row = this.getRow(i);
        
	var cellWidthPadded = this.getCellWidthPadded(i);
	var cellHeightPadded = this.getCellHeightPadded(i);

	// alert('cwp ' + cellWidthPadded);

	if (this._colWidthsPadded[col] < cellWidthPadded) this._colWidthsPadded[col] = cellWidthPadded;
	if (this._rowHeightsPadded[row] < cellHeightPadded) this._rowHeightsPadded[row] = cellHeightPadded;
	
	// if (this._colWidthsPadded[col] < this.cellWidth[i]) this._colWidthsPadded[col] = this.cellWidth[i];
	// if (this._rowHeightsPadded[row] < this.cellHeight[i]) this._rowHeightsPadded[row] = this.cellHeight[i];

	// 
	// Save unpadded values.
	// 
	// Calculate the row heights and column widths.
	// 
	if (this._rowHeights[row] < this._cellHeightOrig[i]) this._rowHeights[row] = this._cellHeightOrig[i];
	if (this._colWidths[col] < this._cellWidthOrig[i]) this._colWidths[col] = this._cellWidthOrig[i];

	// 
	// Calculate the row contents heights and column content widths
	// 
	if (this._rowHeightsContent[row] < this._cellHeightContentOrig[i]) this._rowHeightsContent[row] = this._cellHeightContentOrig[i];
	if (this._colWidthsContent[col] < this._cellWidthContentOrig[i]) this._colWidthsContent[col] = this._cellWidthContentOrig[i];

	// alert('*** setmaxWH i ' + i + ' this.cellWidth[i] ' + this.cellWidth[i]);
	//      alert('setmaxWH col ' + col + ' this._colWidths[col] ' + this._colWidths[col]);
	//      alert('setmaxWH col ' + col + ' ' + row + ' this._colWidths ' + this._colWidths[col] + ' ' + this._rowHeightsPadded[row]);
    }
}   


function getGridWidth()
{
    var w = 0;

    for (var i =0; i< this._numColsZ; i++) {
	w += this._colWidthsPadded[i];
    }
    return w;   
}


function getGridHeight() 
{
    var h = 0;

    for (var i=0; i< this._numRowsZ; i++) {
	h += this._rowHeightsPadded[i];
    }
    return h;   
}

/*
Calculate the cumulative heights and widths of rows and columns.
*/
LytGridUtil.prototype._calculateCumulative = function() {
    
    var i;
    
    // fix - do we need borderPad?
    //
    // Padding around the border.
    //
    // this._colWidthsPaddedCume[0] = this._borderPadLeft;
    // this._rowHeightsPaddedCume[0] = this._borderPadTop;

    this._colWidthsPaddedCume[0] = 0;
    this._rowHeightsPaddedCume[0] = 0;

    for (i=1; i< this._numColsZ; i++) {
	this._colWidthsPaddedCume[i] = this._colWidthsPaddedCume[i-1] + this._colWidthsPadded[i-1];
	//      alert(' cc ' + i + ' width ' + this._colWidthsPaddedCume[i+1]);
    }

    for (i=1; i< this._numRowsZ; i++) {
	this._rowHeightsPaddedCume[i] = this._rowHeightsPaddedCume[i-1] + this._rowHeightsPadded[i-1];
	// alert(' cc ' + i + ' height ' + this._rowHeightsPaddedCume[i]);
    }

}


// 
// Return the grid coordinate 
// of the element at index.
// Note that we return the top/left aligned
// corners of the grid location.
// This convention best preserves space for hierarchies 
// within the grid.
//
//   -------------------------------- 
//   |(c0,r0)   |(c1,r0)   |(c2,r0)  |
//   |          |          |         |
//   -------------------------------- 
//   |(c1,r0)   | ...      |         |
//   |          |          |         |         
//   -------------------------------- 
//
LytGridUtil.prototype.getGridCoord = function(index) {
    
    var col = this.getCol(index);
    var row = this.getRow(index);
    
    //   alert(index + ' getCol ' + col);
    //   alert(index + ' getRow ' + row);

    if (this._colWidthsPaddedCume.length > col && this._rowHeightsPaddedCume.length > row) {
        
	
	//      alert('getGridCoord ' + index + ' this._colWidthsPaddedCume ' + this._colWidthsPaddedCume[col]);
	//      alert('getGridCoord ' + index + ' this._rowHeightsPaddedCume  ' + this._rowHeightsPaddedCume[col]);


        return new LytPoint(
	    this._colWidthsPaddedCume[col], 
	    this._rowHeightsPaddedCume[row]
        );
        
    } else {
	alert("ERROR  0 0 RETURN");
	return new LytPoint(0, 0);
    }

}


//
// Return the centered grid coordinate.
//
LytGridUtil.prototype.getGridCoordCentered = function(index) {
    
    var debug = false;

    var col = this.getCol(index);
    var row = this.getRow(index);
    
    // alert(' getGridCoordCentered ' + index + ' ' + row + ' col ' + col);

    var halfWidthPad = this._widthPad/2;
    var halfHeightPad = this._heightPad/2;

    if (this._colWidthsPaddedCume.length > col && this._rowHeightsPaddedCume.length > row) {
        
	// alert(' colWidthsPadded ' + col + ' ' + colWidthsPadded[col] + ' this._numColsZ ' + this._numColsZ);
	
	//  prePadWidth = Math.max(this._widthPadArrayPre[col] + halfWidthPad);
	//  prePadHeight = Math.max(this._heightPadArrayPre[row] + halfHeightPad);

	var prePadWidth = this._getPadWidthPreInternal(index);
	var prePadHeight = this._getPadHeightPreInternal(index);

	if (debug) alert('getGridCoordCentered: prePadWidth ' + prePadWidth + ' ppHeight  ' + prePadHeight + ' index ' + index);
	// alert('getGridCoordCentered: prePadWidth ' + prePadWidth + ' ppHeight  ' + prePadHeight + ' index ' + index);

	var shapeWidthDiff = this._colWidths[col] - this._cellWidthOrig[index];
	var shapeHeightDiff = this._rowHeights[row] - this._cellHeightOrig[index];

	// alert(' xdiff sh ' + shapeWidthDiff + ' ' + this._colWidths[col] + ' ' + this._cellWidthOrig[index]);

	//
	// Calculate the offset based on the non-padded width/heights
	//
        // var offsetX = prePadWidth + (this._colWidths[col] /2);
        // var offsetY = prePadHeight + (this._rowHeights[row] /2);

        var offsetX = prePadWidth + shapeWidthDiff;
        // var offsetX = prePadWidth + shapeWidthDiff/2;
        // var offsetY = prePadHeight + shapeHeightDiff/2;
        var offsetY = prePadHeight;   // top align looks better.  We may need to make this an option.

	// alert(index + ' swd  ' + shapeWidthDiff + ' ' + prePadWidth);

	if (debug) alert(offsetX + ' off  ' + offsetY);

        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;

	// alert(' row ' + row + ' gcc:  ' + this._rowHeightsPaddedCume[row] + ' off ' + offsetY);

	return new LytPoint(
	    this._colWidthsPaddedCume[col] + offsetX,
	    this._rowHeightsPaddedCume[row] + offsetY
        );
        
    } else {
	return new LytPoint(0, 0);
    }

}

/**
Return the column difference of a grid shape.
*/
LytGridUtil.prototype.getGridCoordCellWidthDiff = function(index) {
    
    var col = this.getCol(index);
    
    if (this._colWidths.length > col) {
        
	var shapeWidthDiff = this._colWidths[col] - this._cellWidthOrig[index];
	return shapeWidthDiff;

    } else {
	return 0;
    }
}

/**
Return the row difference of a grid shape.
*/
LytGridUtil.prototype.getGridCoordCellHeightDiff = function(index) {
    
    var row = this.getRow(index);
    
    if (this._rowHeights.length > row) {
        
	var shapeHeightDiff = this._rowHeights[row] - this._cellHeightOrig[index];
	return shapeHeightDiff;

    } else {
	return 0;
    }
}

//
// Objective: Center Align node contents.
// 
//   Cells are allocated based on the sum of the node and node label dimensions.
//   However, alignment is based on the dimensions of the node CONTENT.
//
//   getGridCoordCellContentHeightDiff() returns the difference of the maximum 
//   node content height and the specified node content height.
// 
//   This is called by LytSparseGridLayout.positionAllNodes() to center align node contents.
//
//                                                     ----
//       ----                   ----                  |    |
//      |    |                 |    |                 |    |
//......|    |.................|    |.................|    |.......
//      |    |                 |    |                 |    |
//       ----                   ----                  |    |
//   --------------        ----------------            ----
//  | Label Bounds |      |    Multi Line  |         ---------
//   --------------       |      Label     |        |  Label  |
//                         ----------------          ---------

/**
Return the row difference of a grid shape.
*/
LytGridUtil.prototype.getGridCoordCellContentHeightDiff = function(index) {
    
    if (isNaN(this._cellHeightContentOrig[index])) return 0;

    var row = this.getRow(index);
    
    if (this._rowHeightsContent.length > row) {
        
	if (isNaN(this._rowHeightsContent[row])) return 0;

	var shapeHeightDiff = this._rowHeightsContent[row] - this._cellHeightContentOrig[index];
	return shapeHeightDiff;

    } else {
	return 0;
    }
}


function getRowBus(index) 
{
    
    var r = 0;
    
    if (index >= this._numColsZ * 2) 
        r = (index / (this._numColsZ * 2));

    r *= 2;
    r += index % 2;            
    
    return(r);
    
}

function getColBus(index) 
{
    var r = index /2 % this._numColsZ;
    var rowPair = (index / (this._numColsZ * 2));
    
    // for busses, we go right to left on odd pairs.
    if ((rowPair % 2) != 0) {       
        return(this._numColsZ -1 - r);
    }
    
    return r;
    
    
}         

LytGridUtil.prototype.setID = function(id) {
    this.id = id;
}

LytGridUtil.prototype.getID = function() {
    return id;
}

//
// Maintain the grid index for each node id.
//
var nodeToGridIndex = new Array();

LytGridUtil.prototype.setGridIndex = function(nodeID, index) {

    nodeToGridIndex[nodeID] = index;

}

LytGridUtil.prototype.getGridIndex = function(nodeID) {
    
    return nodeToGridIndex[nodeID];
}



//
// 
//
/*
function point(x,y) {
    this.x = x;
    this.y = y;
}
*/
