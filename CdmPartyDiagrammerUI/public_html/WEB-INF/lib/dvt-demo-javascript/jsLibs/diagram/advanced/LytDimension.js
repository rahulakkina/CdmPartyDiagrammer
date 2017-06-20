/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytDimension.js

    Simple dimension class, used for calculating container dimensions.

    Description:
   
    Notes: 
   
    MODIFIED    (MM/DD/YY)
    lmolesky	11/04/11 - Created

*/

var LytDimension = function(xMin,yMin,xMax,yMax)
{
    this._xMin = xMin;
    this._yMin = yMin;

    this._xMax = xMax;
    this._yMax = yMax;

    // this.x = (x || 0) ;
    // this.y = (y || 0) ;

};

LytObj.createSubclass(LytDimension, LytObj, "LytDimension");

LytDimension.prototype.getWidth = function() {
    return this._xMax - this._xMin;
}

LytDimension.prototype.getHeight = function() {
    return this._yMax - this._yMin;
}

LytDimension.prototype.getXMin = function() {
    return this._xMin;
}

LytDimension.prototype.getYMin = function() {
    return this._yMin;
}

LytDimension.prototype.setXMin = function(xMin) {
    this._xMin = xMin;
}

LytDimension.prototype.setYMin = function(yMin) {
    this._yMin = yMin;
}


LytDimension.prototype.getXMax = function() {
    return this._xMax;
}

LytDimension.prototype.getYMax = function() {
    return this._yMax;
}

LytDimension.prototype.setXMax = function(xMax) {
    this._xMax = xMax;
}

LytDimension.prototype.setYMax = function(yMax) {
    this._yMax = yMax;
}

LytDimension.prototype.toString = function() {
    return(' (' + this._xMin + ',' + this._yMin + ') ' + ' (' + this._xMax + ',' + this._yMax + ') ');
}

