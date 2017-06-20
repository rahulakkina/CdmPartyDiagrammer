
/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    Grid layout descriptors are used to set grid attributes.
    These attributes include the number of rows or columns, node count, and padding.

    LytGridLayoutDesc objects are passed to a layout with LytLayout.setLayoutMethod()

    LytGridLayoutDesc.js

    MODIFIED    (MM/DD/YY)
    lmolesky	09/26/11 - minor updates
    lmolesky	09/13/11 - Created

*/


var LytGridLayoutDesc = function()
{
    this.Init();

};

LytObj.createSubclass(LytGridLayoutDesc, LytObj, "LytGridLayoutDesc");

LytGridLayoutDesc.prototype.Init = function()
{
    // LytGridLayoutDesc.superclass.Init.call(this);

    // default pad width/height
    this.setPad(20,20);

    this._nodeCount = 0;
    this._numCols = 0;
    this._numRows = 0;

    this._routingStyle = LytLayout.ROUTE_STRAIGHT;

    // 
    // Define some minimum values for cell widths.
    // Attempt to diagnose a non-determinstic layout/render bug where some or all node clump to (0,0)
    // 
    this._cellWidthMin = 10;
    this._cellHeightMin = 10;

};


LytGridLayoutDesc.prototype.setNodeCount = function(count) {

    if (isNaN(count)) return;

    this._nodeCount = count;
}

LytGridLayoutDesc.prototype.getNodeCount = function() {
    return this._nodeCount;
}

LytGridLayoutDesc.prototype.setNumCols = function(count) {

    if (isNaN(count)) return;

    this._numCols = count;
    // alert('nodecount ' + this._numCols);
}

LytGridLayoutDesc.prototype.getNumCols = function() {
    return this._numCols;
}

LytGridLayoutDesc.prototype.setNumRows = function(count) {
    this._numRows = count;
    // alert('nodecount ' + this._numRows);
}

LytGridLayoutDesc.prototype.getNumRows = function() {
    return this._numRows;
}

LytGridLayoutDesc.prototype.setPad = function(w,h) {
    this._padWidth = w;
    this._padHeight = h;
    // alert('nodecount ' + this._numRows);
}

LytGridLayoutDesc.prototype.getPad = function() {
    return new Array(this._padWidth, this._padHeight);
}

