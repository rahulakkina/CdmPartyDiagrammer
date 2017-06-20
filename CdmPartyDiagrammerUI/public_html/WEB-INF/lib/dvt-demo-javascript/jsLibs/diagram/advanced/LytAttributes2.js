/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytAttributes2.js

    Simple class for managing two attributes.

    MODIFIED    (MM/DD/YY)
    lmolesky	12/13/11 - Created

*/

var LytAttributes2 = function(attr1,attr2)
{
    this._attr1 = attr1;
    this._attr2 = attr2;

    // this._attr = new Array();


};

LytObj.createSubclass(LytAttributes2, LytObj, "LytAttributes2");


LytAttributes2.prototype.setAttr = function(attr1) {
    this._attr1 = attr1;
}

LytAttributes2.prototype.getAttr1 = function() {
    return this._attr1;
}


LytAttributes2.prototype.setAttr2 = function(attr2) {
    this._attr2 = attr2;
}

LytAttributes2.prototype.getAttr2 = function() {
    return this._attr2;
}





