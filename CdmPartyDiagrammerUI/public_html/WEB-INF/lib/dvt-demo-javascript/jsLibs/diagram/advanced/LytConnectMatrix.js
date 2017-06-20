/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytConnectMatrix.js

    Class for link interconnection vectors, used to reduce link crossings.

    MODIFIED    (MM/DD/YY)
    lmolesky	02/07/12 - Created

    NOTES

*/

var LytConnectMatrix = function()
{
    this.Init();

};


LytObj.createSubclass(LytConnectMatrix, LytObj, "LytConnectMatrix");

// function clone(source) {

LytConnectMatrix.prototype.clone = function(source) {

    for (i in source) {
        if (typeof source[i] == 'source') {
            this[i] = new clone(source[i]);
        }
        else{
            this[i] = source[i];
	}
    }
}

/*
    var newObj = (this instanceof Array) ? [] : {};
    for (i in this) {
	if (i == 'clone') continue;
	if (this[i] && typeof this[i] == "object") {
	    newObj[i] = this[i].clone();
	} else newObj[i] = this[i]
    } return newObj;
*/




//
// Set default parameters.
//
LytConnectMatrix.prototype.Init = function()
{

    this._colNodeID = new Array();
    this._rowNodeID = new Array();

    this._connectMatrix = new Array();  // 2d array

    this._rowMetric = new Array();
    this._colMetric = new Array();

};

/**
*
* Return true if the metric vectors are ordered (ascending).
*
*/
LytConnectMatrix.prototype.isOrdered = function() {

    for (var i=1; i<this._rowMetric.length; i++)
	if (this._rowMetric[i-1] > this._rowMetric[i])
	    return false;

    for (var i=1; i<this._colMetric.length; i++)
	if (this._colMetric[i-1] > this._colMetric[i])
	    return false;

    return true;
}

LytConnectMatrix.prototype.reOrderRows = function(b) {

    var rowMetricNew = new Array;
    var connectMatrixNew = new Array;

    // colNodeIDNew = new Array();
    rowNodeIDNew = new Array();

    // 
    // Copy reordered values into temporary matricies
    // 
    for (var i=0; i<b.length; i++) {

	var newIndex = b[i].index;

	rowMetricNew[i] = this._rowMetric[newIndex];
	connectMatrixNew[i] = this._connectMatrix[newIndex];

	// colNodeIDNew[i] = this._colNodeID[newIndex];
	rowNodeIDNew[i] = this._rowNodeID[newIndex];

    }

    this._connectMatrix = connectMatrixNew;
    this._rowMetric = rowMetricNew;

    // this._colNodeID = colNodeIDNew;
    this._rowNodeID = rowNodeIDNew;
}


LytConnectMatrix.prototype.reOrderCols = function(b) {

    var debug = false;

    var colMetricNew = new Array;
    var connectMatrixNew = new Array;

    colNodeIDNew = new Array();

    // 
    // Copy reordered values into temporary matricies
    // 
    if (debug) alert(' lenths ' + b.length + ' ' + this._connectMatrix.length);

    // iterate over all rows of connect matrix.
    for (var g=0; g<this._connectMatrix.length; g++) {

	// iterate over all columns of connect matrix.
	connectMatrixNew[g] = new Array;

	for (var h=0; h<this._connectMatrix[g].length; h++) {

	    // 
	    // Copy swapped columns into connecMatrixNew[g]
	    // 
	    var newIndex = b[h].index;

	    connectMatrixNew[g][h] = this._connectMatrix[g][newIndex];

	}
    }

    for (var i=0; i<b.length; i++) {

	var newIndex = b[i].index;

	colMetricNew[i] = this._colMetric[newIndex];
	colNodeIDNew[i] = this._colNodeID[newIndex];

    }

    // 
    // copy back 
    // 
    this._connectMatrix = connectMatrixNew;
    this._colMetric = colMetricNew;
    this._colNodeID = colNodeIDNew;
}


LytConnectMatrix.sortByNumericValue = function(A) 
{

    var debug = false;

    var tempArray = new Array();

    for (i in A) {
        tempArray.push({index: i, c: A[i]});
    }

    // reverse function - for testing.
    // tempArray.sort(function (x, y) {return y.c - x.c;});

    tempArray.sort(function (x, y) {return x.c - y.c;});

    s = "";
    for (i in tempArray) {
        s += tempArray[i].index + ":" + tempArray[i].c + ' ';
    }

    if (debug) alert(s);

    return tempArray;
}


// 
// Return a random int between 0 and max
// 
function randomInt(max)
{
    return Math.round(Math.random() * max);
}


// 
// Not currently used.
// Call if we want to check different orders on equal metrics.
// 
// Call this on a sorted associative array.
// {index: i, c: A[i]});
// 
LytConnectMatrix.swapEqualValues = function(tempArray, swapIndex) 
{

    // 
    // Count the number of equal matrics.
    // 

    var numEquals = 0;

    for (j=0; j<tempArray.length-1; j++) {
	if (tempArray[j].c == tempArray[j+1].c) numEquals++;
    }

    if (numEquals == 0) return tempArray;

    // 
    // Randomize the swap index.
    // 
    var randomizedSwapIndex;

    numEquals = 0;

    for (j=0; j<tempArray.length-1; j++) {

	if (tempArray[j].c == tempArray[j+1].c) numEquals++;

	if (numEquals == swapIndex) {

	    // alert(' swap ' + j);

	    var saveIndex = tempArray[j].index;
	    var saveValue = tempArray[j].c;

	    tempArray[j].index = tempArray[j+1].index;
	    tempArray[j].c = tempArray[j+1].c;

	    tempArray[j+1].index = saveIndex;
	    tempArray[j+1].c = saveValue;

	    break;
	}
    }

    return tempArray;
}

LytConnectMatrix.sortByNumericValueInverse = function(A) 
{

    var debug = true;

    var tempArray = new Array();

    for (i in A) {
        tempArray.push({index: i, c: A[i]});
    }

    // reverse function - for testing.
    // tempArray.sort(function (x, y) {return y.c - x.c;});

    tempArray.sort(function (x, y) {return y.c - x.c;});

    LytConnectMatrix.swapEqualValues(tempArray, 0);

    s = "Inverse sort Array: ";
    for (i in tempArray) {
        s += tempArray[i].index + ":" + tempArray[i].c + ' ';
    }

    if (debug) alert(s);
    return tempArray;
}



LytConnectMatrix.prototype.getCrossings = function() {

    var debug = false;

    var j;
    var k;
    var kk;

    var crossings = 0;

    var m = this._connectMatrix;

    //
    // Iterate over all pairs (i,j) of row vectors
    //
    for (i=0; i<m.length - 1; i++) {

	for (j=i+1; j<m.length; j++) {

	    if (debug) alert('check ' + i + ' ' + j);

	    //
	    // Compare elements of the j'th and i'th row vector
	    //

	    for (kk=0; kk<m[i].length - 1; kk++) {
		for (k=kk+1; k<m[j].length; k++) {
		    // alert(j + ' compare ' + kk + ' ' + k);
		    if (m[j][kk] == 1 && m[i][k] == 1) {
			crossings++;
		    }
		}
	    }
	}
    }

    return crossings;
}

LytConnectMatrix.prototype.printConnectionMatrix = function() {

    var rowVector = '';
    var colHeader = 'cols: ';
    var rowHeader = 'rows: ';

    var j;
    var k;

    for (j=0; j<this._rowNodeID.length; j++) {
	rowHeader += this._rowNodeID[j];
	rowHeader += ' ';
    }
    alert(rowHeader);

    for (j=0; j<this._connectMatrix.length; j++) {

	var srcID = this._rowNodeID[j];
	    
	rowVector = srcID + ' [';

	if (j == 0) {
	    for (k=0; k<this._connectMatrix[j].length; k++) {
		colHeader += this._colNodeID[k];
		colHeader += ' ';
	    }
	    alert(colHeader);
	}

	for (k=0; k<this._connectMatrix[j].length; k++) {

	    // alert(k + ' k ');

	    rowVector += this._connectMatrix[j][k];
	    rowVector += ' ';
	}

	rowVector += ']';
	alert(rowVector);

    }
}


//
// Calculate the row metrics and column metrics.
// The metric evaluation function used is based on baricenters
//
LytConnectMatrix.prototype.calcMetrics = function() {

    var debug = false;

    var j;
    var k;

    var m = this._connectMatrix;

    if (debug) var rOut = 'rOut: ';

    for (j=0; j<m.length; j++) {
    
	this._rowMetric[j]  = 0;

	var sum1 = 0;
	var sum2 = 0;

	for (k=0; k<m[j].length; k++) {
	    sum1 += (k+1) * m[j][k];
	    sum2 += m[j][k];
	}

	this._rowMetric[j] = sum1 / sum2;

	if (debug) {
	    rOut += roundNumber(this._rowMetric[j], 1);
	    rOut += ' ' ;
	}
    }

    if (debug) alert(rOut);

    if (debug) var pOut = 'pOut: ';

    if (m.length > 0) {

	for (k=0; k<m[0].length; k++) {
	    
	    this._colMetric[k] = 0;
	    
	    var sum1 = 0;
	    var sum2 = 0;

	    for (j=0; j<m.length; j++) {

		sum1 += (j+1) * m[j][k];
		sum2 += m[j][k];

	    }

	    this._colMetric[k] = sum1 / sum2;

	    if (debug) {
		pOut += roundNumber(this._colMetric[k], 1);
		pOut += ' ' ;
	    }
	}

	if (debug) alert(pOut);

    }
}
