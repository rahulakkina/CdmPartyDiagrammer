/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytChannelPadUtil.js

    Class for storing channel pad values.

    Usage: call constuctor followed by init(numRows, numCols);

    MODIFIED    (MM/DD/YY)
    lmolesky	01/10/12 - Created

    should rename these to textHeightColsPre/ etc.

*/

LytObj.createSubclass(LytChannelPadUtil, LytObj, "LytChannelPadUtil");

var LytChannelPadUtil = function() {

    // 
    // Arrays are two-dimensional.
    // The first dimension maps to the channel column or row.
    // The second dimension maps to the link within the column or row.
    // 
    // These arrays are used to store the textHeight padding for each link.
    // And thus they are indexed by [column][linkSlot]
    // 

    this.textHeightColsPre = new Array();
    this.textHeightColsPost = new Array();

    this.textHeightRowsPre = new Array();
    this.textHeightRowsPost = new Array();
}

LytChannelPadUtil.prototype.init = function(numRows, numCols)
{

    this.textHeightColsPre = new Array();
    this.textHeightColsPost = new Array();

    this.textHeightRowsPre = new Array();
    this.textHeightRowsPost = new Array();

    for (var i=0; i<numCols+1; i++) {

	this.textHeightColsPre[i] = new Array();
	this.textHeightColsPost[i] = new Array();
    }

    for (var i=0; i<numRows+1; i++) {

	this.textHeightRowsPre[i] = new Array();
	this.textHeightRowsPost[i] = new Array();

    }
};

// this should be accessed from a single code area
var channekWhiteSpace = 3;

//
// @param rcIndex - row or column index
// @param chIndex - channel index
//
// @param measure - width or height
//
LytChannelPadUtil.assignMaxVal = function(rcIndex, chIndex, textHeightArray, measure) {

    if (isNaN(textHeightArray[rcIndex][chIndex]))
	textHeightArray[rcIndex][chIndex] = measure;
    else
	textHeightArray[rcIndex][chIndex] = Math.max(textHeightArray[rcIndex][chIndex], measure);

    // 
    // If we have previous indexes that are unassigned, assign channel whitespace.
    // This fixes a bug where we have a vertical arrow crossing a horizontal long link.
    // 
    for (var i=0; i<chIndex; i++) {
	if (isNaN(textHeightArray[rcIndex][i]))
	    textHeightArray[rcIndex][i] = channelWhiteSpace;
    }
}


//
// note - the rcIndex is implicit here.
// 
LytChannelPadUtil.getChannelWidthSum = function(textHeightArray, chIndex) {

    var channelSum = 0;

    for (var i=0; i<=chIndex; i++) {

	channelSum += textHeightArray[i];
    }

    return channelSum;

}

//
// Like getChannelWidthSum, but we don't sum the last element.
//
LytChannelPadUtil.getChannelWidthSumExclusive = function(textHeightArray, chIndex) {

    var channelSum = 0;

    for (var i=0; i<chIndex; i++) {
	channelSum += textHeightArray[i];
    }

    return channelSum;

}


