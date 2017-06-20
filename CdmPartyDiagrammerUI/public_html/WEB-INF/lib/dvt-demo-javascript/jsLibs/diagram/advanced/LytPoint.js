/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    Point.js

    Simple Point class.  
    Use to pass a cartesian coordinate to a function.

    Description:
   
    Notes: 
   
    MODIFIED    (MM/DD/YY)
    lmolesky	09/14/11 - Created

*/

var LytPoint = function(x,y)
{
    this._x = x;
    this._y = y;

    // this.x = (x || 0) ;
    // this.y = (y || 0) ;


};

LytObj.createSubclass(LytPoint, LytObj, "LytPoint");

LytPoint.prototype.getX = function() {
    return this._x;
}

LytPoint.prototype.getY = function() {
    return this._y;
}

LytPoint.prototype.setX = function(x) {
    this._x = x;
}

LytPoint.prototype.setY = function(y) {
    this._y = y;
}


//
// Return a string representation of a point.
// Useful for using a LytPoint as a hash key.
//
LytPoint.prototype.getString = function()
{
    return(this._x + ',' + this._y);
}

LytPoint.prototype.getStringParens = function()
{
    return('(' + this._x + ',' + this._y + ')');
}
