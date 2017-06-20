// Copyright (c) 2008, 2012, Oracle and/or its affiliates. 
// All rights reserved. 
/*
    DESCRIPTION
     
    LytObj.js

    MODIFIED    (MM/DD/YY)
    lmolesky	05/04/12 - Created

    Copied from DvtObj - avoids DvtObj dependency.

*/
/**
  *   Base object for HTML toolkit derivative objects.
  *   @class The base object for HTML toolkit derivative objects.
  *   @constructor  
  */
var  LytObj = function() {};

LytObj._GET_FUNCTION_NAME_REGEXP = /function\s+([\S^]+)\s*\(/;

LytObj.prototype = {};
LytObj.prototype.constructor = LytObj;

/**
 *  Provides inheritance by subclassing a class from a given base class.
 *  @param  {class} extendingClass  The class to be extended from the base class.
 *  @param  {class} baseClass  The base class
 *  @param  {string} typeName The type of the extending class
 */
LytObj.createSubclass = function (extendingClass, baseClass, typeName) {
  if (extendingClass === undefined || extendingClass === null) {
    return;
  }
  if (baseClass === undefined) {
    // assume Object
    baseClass = Object;
  }

  if (extendingClass == baseClass) {
    return;
  }

  // use a temporary constructor to get our superclass as our prototype
  // without out having to initialize the superclass
  var tempConstructor = LytObj._tempSubclassConstructor;

  tempConstructor.prototype = baseClass.prototype;
  extendingClass.prototype = new tempConstructor();

  extendingClass.prototype.constructor = extendingClass;
  extendingClass.superclass = baseClass.prototype;
  
  if(typeName)
    extendingClass._typeName = typeName;
} ;

/**  @private  */
LytObj._tempSubclassConstructor = function () {};

LytObj.getTypeName = function (clazz) {
  var typeName = clazz._typeName;
  if (typeName == null) {
    var constructorText = clazz.toString();
    var matches = LytObj._GET_FUNCTION_NAME_REGEXP.exec(constructorText);

    typeName = matches[1];

    clazz._typeName = typeName;
  }

  return typeName;
}

LytObj.prototype.getTypeName = function () {
  return LytObj.getTypeName(this.constructor);
}


/*-------------------------------------------------------------------*/
/*   clone()                                                         */
/*-------------------------------------------------------------------*/
/**
  *  Returns a copy of this object.  Abstract method, subclasses
  *   must implement.
  *  @type LytObj
  */
LytObj.prototype.clone = function()
{
   return null ;
};

/*-------------------------------------------------------------------*/
/*   mergeProps()                                                    */
/*-------------------------------------------------------------------*/
/**
  *   Merge properties in the current object into the supplied object.
  *   Abstract method, subclasses must implement. Used internally by clone().
  *   @param {LytObj}
  *   @private
  */
LytObj.prototype.mergeProps = function(obj)
{
} ;
