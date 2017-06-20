/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytTreeLayoutDesc.js

    Descriptor for tree layouts.
    Encapsulates all parameters used in the invocation of tree layouts.

    Setter functions (e.g., setBetweenLevelSpace()) would be used in application API.
    Getter functions (e.b., getBetweenLevelSpace()) are used internally, in LytTreeLayout.js   

    Instances of LytTreeLayoutDesc are created in the application API, and passed to LytLayout.js using LytLayout.setLayoutDescContainer().

    MODIFIED    (MM/DD/YY)
    lmolesky	11/09/11 - Created
    lmolesky	02/17/12 - Added optimizeNodePositions and minimizeCrossings


    NOTES

    We may want to create LytLayoutDesc, and have this class extend it.

*/

//
// 
//

var LytTreeLayoutDesc = function()
{
    this.Init();

};


LytObj.createSubclass(LytTreeLayoutDesc, LytObj, "LytTreeLayoutDesc");

//
// Set default parameters.
//
LytTreeLayoutDesc.prototype.Init = function()
{

    // LytTreeLayoutDesc.superclass.Init.call(this);

    this._betweenLevelSpace = 25;
    this._rowSpace = 15;
    
    //
    // alignment of layout
    // also "FLUSH"
    //
    this._layoutAlign = LytLayout.NODE_ALIGNMENT_CENTER;

    // 
    // Change to true once we have fully tested
    // 
    this._optimizeNodePositions = true;

    // 
    // 
    // 
    this._minimizeCrossings = false;

};

//
// sets the spacing between levels (in pixels)
//
LytTreeLayoutDesc.prototype.setBetweenLevelSpace = function(betweenLevelSpace) {
    this._betweenLevelSpace = betweenLevelSpace;
}

LytTreeLayoutDesc.prototype.getBetweenLevelSpace = function() {
    return this._betweenLevelSpace;
}

//
// set the spacing between rows (in pixels)
//
LytTreeLayoutDesc.prototype.setRowSpace = function(rowSpace) {
    this._rowSpace = rowSpace;
}

LytTreeLayoutDesc.prototype.getRowSpace = function() {
    return this._rowSpace;
}

//
// Set the layout alignment (NODE_ALIGNMENT_CENTER or NODE_FLUSH)
//
LytTreeLayoutDesc.prototype.setLayoutAlign = function(layoutAlign) {
    this._layoutAlign = layoutAlign;
}

LytTreeLayoutDesc.prototype.getLayoutAlign = function() {
    return this._layoutAlign;
}


/**
Optimize node positions.  By default, this is true.
*/
LytTreeLayoutDesc.prototype.setOptimizeNodePositions = function(enable) {
    this._optimizeNodePositions = enable;
}

/**
Return the optimizeNodePosition boolean.
*/
LytTreeLayoutDesc.prototype.getOptimizeNodePositions = function() {
    return this._optimizeNodePositions;
}
    

/**
 Minimize crossings.  By default, this is true.
*/
LytTreeLayoutDesc.prototype.setMinimizeCrossings = function(enable) {
    this._minimizeCrossings = enable;
}

/**
  Return the minimizeCrossings boolean.
*/
LytTreeLayoutDesc.prototype.getMinimizeCrossings = function() {
    return this._minimizeCrossings;
}
    
