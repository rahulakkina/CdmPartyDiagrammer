
/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    Grid pad descriptors are used to set grid padding.

    LytGridPadDesc objects are passed to a workflow layout with LytWorkflowLayout.setLayoutDesc()

    MODIFIED    (MM/DD/YY)
    lmolesky	11/23/11 - Created

*/


var LytGridPadDesc = function()
{
    this.Init();

};

LytObj.createSubclass(LytGridPadDesc, LytObj, "LytGridPadDesc");

LytGridPadDesc.prototype.Init = function()
{
    // default pad width/height
    this.setPad(20,20);

};

LytGridPadDesc.prototype.setPad = function(w,h) {
    this._padWidth = w;
    this._padHeight = h;
    // alert('nodecount ' + this._numRows);
}

LytGridPadDesc.prototype.getPad = function() {
    return new Array(this._padWidth, this._padHeight);
}
