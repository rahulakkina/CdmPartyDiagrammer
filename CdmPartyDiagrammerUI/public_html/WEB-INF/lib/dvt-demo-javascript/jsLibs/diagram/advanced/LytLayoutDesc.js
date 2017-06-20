/* Copyright (c) 2006, 2012, Oracle and/or its affiliates. 
All rights reserved. */

/*
    DESCRIPTION
     
    LytLayoutDesc.js

    Descriptor for layouts.

    This class allows customization of layout parameters.
    The following properties are supported:

       - layoutClass: The layout class used to layout the container.
   
       - layoutFlow: The flow used in the container.

       - arrowLength: Length of arrow used in container.

    MODIFIED    (MM/DD/YY)
    lmolesky	05/04/12 - Code Refactor
    lmolesky	11/11/11 - Created

    NOTES

*/

//
// 
//

var LytLayoutDesc = function()
{
    this.Init();

};


LytObj.createSubclass(LytLayoutDesc, LytObj, "LytLayoutDesc");

//
// Set default parameters.
//
LytLayoutDesc.prototype.Init = function()
{

    this._cid = null;

    this._layoutClass = null;
    this._layoutFlow = LytLayout.FLOW_TOP_DOWN;
    
    this._arrowLength = 3;

    // this._route = LytLayout.ROUTE_STRAIGHT;
    this._route = LytLayout.ROUTE_CHANNEL;

};

/**
 Set the layout flow 
*/
LytLayoutDesc.prototype.setLayoutFlow = function(layoutFlow) {

    this._layoutFlow = layoutFlow;

}

LytLayoutDesc.prototype.getLayoutFlow = function() {

    return this._layoutFlow;
}


/**
 Set the layout class
 @param layoutClass - TreeLayout(), ...
*/
LytLayoutDesc.prototype.setLayoutClass = function(layoutClass) {

   this._layoutClass = layoutClass;

}


/**
 return the layout class
*/
LytLayoutDesc.prototype.getLayoutClass = function() {

    return this._layoutClass;

}


/**
 Set the arrow length for all links in the layout
 This effects the padding between parallel links.
*/
LytLayoutDesc.prototype.setArrowLength = function(arrowLength) {

    if (isNaN(arrowLength)) return;
    this._arrowLength = arrowLength;
}

LytLayoutDesc.prototype.getArrowLength = function() {
    if (isNaN(this._arrowLength)) return 1;
    return this._arrowLength;
}

/**
 Routing style.
@param route: LytLayout.ROUTE_STRAIGHT, LytLayout.ROUTE_CHANNEL or LytLayout.ROUTE_CHANNEL_HYBRID
*/
LytLayoutDesc.prototype.setRoute = function(route) {
    this._route = route;
}

LytLayoutDesc.prototype.getRoute = function() {
    return this._route;
}


/**
Set the routing style for the layout.  
@param route LytLayout.ROUTE_STRAIGHT, LytLayout.ROUTE_CHANNEL, or LytLayout.ROUTE_CHANNEL_HYBRID
*/
LytLayoutDesc.prototype.setRoute = function(route) {

    switch(route) {

    case LytLayout.ROUTE_STRAIGHT:
    case LytLayout.ROUTE_CHANNEL:
    case LytLayout.ROUTE_CHANNEL_HYBRID:

    this._route = route;

	break;
    }

}

LytLayoutDesc.prototype.getRoute = function() {
    return this._route;
}

/**
Utility function called by application.
Sets the layout class and the layout flow
*/
LytLayoutDesc.createLayoutDesc = function(L, layoutClass, layoutFlow) {

    var layoutD = new LytLayoutDesc();

    if (!layoutFlow) {
      layoutFlow = LytLayout.FLOW_TOP_DOWN;
    }
    layoutD.setLayoutFlow(layoutFlow);

    layoutD.setLayoutClass(layoutClass);

    L.setLayoutDesc(layoutD);

    return layoutD;
};
