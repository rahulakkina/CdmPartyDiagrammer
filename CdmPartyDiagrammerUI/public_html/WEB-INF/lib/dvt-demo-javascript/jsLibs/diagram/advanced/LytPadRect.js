/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytPadRect.js

    Class for container padding.

    Description:
   
    Notes: 
   
    MODIFIED    (MM/DD/YY)
    lmolesky	11/04/11 - Created

*/

var LytPadRect = function(padLeft, padRight, padTop, padBottom)
{
    this._padLeft = padLeft;
    this._padTop = padTop;

    this._padRight = padRight;
    this._padBottom = padBottom;

};

LytObj.createSubclass(LytPadRect, LytObj, "LytPadRect");


LytPadRect.prototype.getPadLeft = function() {
    return this._padLeft;
}

LytPadRect.prototype.getPadTop = function() {
    return this._padTop;
}

LytPadRect.prototype.setPadLeft = function(padLeft) {
    this._padLeft = padLeft;
}

LytPadRect.prototype.setPadTop = function(padTop) {
    this._padTop = padTop;
}


LytPadRect.prototype.getPadRight = function() {
    return this._padRight;
}

LytPadRect.prototype.getPadBottom = function() {
    return this._padBottom;
}

LytPadRect.prototype.setPadRight = function(padRight) {
    this._padRight = padRight;
}

LytPadRect.prototype.setPadBottom = function(padBottom) {
    this._padBottom = padBottom;
}


