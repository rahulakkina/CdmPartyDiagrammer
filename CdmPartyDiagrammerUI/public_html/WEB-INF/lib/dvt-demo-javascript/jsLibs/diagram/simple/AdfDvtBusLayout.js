var AdfDvtBusLayout = {};

AdfDvtBusLayout.busLayout = function(layoutContext) {
  var totalNodeCount = layoutContext.getNodeCount();
  var arNodes = [];
  var arConnectors = [];
  var mapNodesById = {};
  for (var ni = 0; ni < totalNodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    var nodeLayoutAttrs = node.getLayoutAttributes();
    if (nodeLayoutAttrs["relNodeId"] && nodeLayoutAttrs["relNodeId"] != "null") {
      arConnectors.push(node);
    }
    else {
      arNodes.push(node);
      if (nodeLayoutAttrs["nodeId"]) {
        mapNodesById[nodeLayoutAttrs["nodeId"]] = node;
      }
    }
  }
  
  var nodeCount = arNodes.length;
  
  var maxWidth = 0;
  var maxHeight = 0;
  for (var ni2 = 0; ni2 < nodeCount; ni2++) {
    var node = arNodes[ni2];
    var bounds = node.getBounds();
    if (bounds.w > maxWidth) {
      maxWidth = bounds.w;
    }
    if (bounds.h > maxHeight) {
      maxHeight = bounds.h;
    }
  }
  
  var link = null;
  var linkPoints = [];
  if (layoutContext.getLinkCount() > 0) {
    link = layoutContext.getLinkByIndex(0);
  }
  
  var padding = 25;
  
  //var gridCols = Math.floor(Math.sqrt(nodeCount));
  var gridCols = Math.min(Math.floor(layoutContext.getComponentSize().w / (maxWidth + padding)), nodeCount);
  //var gridRows = Math.ceil(nodeCount / gridCols);
  var currY = 0;
  var bBackward = false;
  var index = 0;
  var rowLinkPoints = [];
  for (var ni = 0; ni < nodeCount; ni+=2) {
    var col = index % gridCols;
    var row = Math.floor(index / gridCols);
    
    var oldBBackward = bBackward;
    bBackward = (row % 2) > 0;
    
    if (bBackward != oldBBackward) {
      if (linkPoints.length < 1) {
        linkPoints.push("M");
      }
      else {
        linkPoints.push("L");
      }
      linkPoints.push(rowLinkPoints[0]);
      linkPoints.push(rowLinkPoints[1]);
      linkPoints.push("L");
      var endX = 0;
      var endY = 0;
      if (!oldBBackward) {
        endX = rowLinkPoints[2] + .5 * (maxWidth + padding);
        endY = rowLinkPoints[3];
      }
      else {
        endX = rowLinkPoints[2] - .5 * (maxWidth + padding);
        endY = rowLinkPoints[3];
      }
      linkPoints.push(endX);
      linkPoints.push(endY);
      
      rowLinkPoints = [];
      rowLinkPoints.push(endX);
      rowLinkPoints.push(endY + 2 * (maxHeight + padding));
    }
    
    var node1 = arNodes[ni];
    var bounds = node1.getContentBounds();
    var tx = 0;
    var ty = 0;
    if (!bBackward) {
      tx = col * (maxWidth + padding);
      ty = currY;
    }
    else {
      tx = (gridCols - 1 - col) * (maxWidth + padding);
      ty = currY;
    }
    tx += .5 * (maxWidth - bounds.w);
    ty += (maxHeight - bounds.h);
    node1.setPosition({x: tx, y: ty});
    node1.connectorPos = "bottom";
    
    if (rowLinkPoints.length < 2) {
      rowLinkPoints.push(tx + .5 * bounds.w);
      rowLinkPoints.push(ty + bounds.h + .5 * padding);
    }
    if (rowLinkPoints.length < 4) {
      rowLinkPoints.push(tx + .5 * bounds.w);
      rowLinkPoints.push(ty + bounds.h + .5 * padding);
    }
    else {
      rowLinkPoints[2] = tx + .5 * bounds.w;
      rowLinkPoints[3] = ty + bounds.h + .5 * padding;
    }
    
    if (ni+1 < nodeCount) {
      var node2 = arNodes[ni+1];
      bounds = node2.getContentBounds();
      if (!bBackward) {
        tx = col * (maxWidth + padding);
        ty = currY + maxHeight + padding;
      }
      else {
        tx = (gridCols - 1 - col) * (maxWidth + padding);
        ty = currY + maxHeight + padding;
      }
      tx += .5 * (maxWidth - bounds.w);
      node2.setPosition({x: tx, y: ty});
      node2.connectorPos = "top";
    }
    
    if (((col + 1) % gridCols) == 0) {
      currY += 2 * (maxHeight + padding);
    }
    index++;
  }
  
  if (linkPoints.length < 1) {
    linkPoints.push("M");
  }
  else {
    linkPoints.push("L");
  }
  linkPoints.push(rowLinkPoints[0]);
  linkPoints.push(rowLinkPoints[1]);
  linkPoints.push("L");
  linkPoints.push(rowLinkPoints[2]);
  linkPoints.push(rowLinkPoints[3]);
  
  for (var ni = 0; ni < nodeCount && arConnectors[ni]; ni++) {
    var connector = arConnectors[ni];
    var connectorBounds = connector.getBounds();
    
    var node = mapNodesById[connector.getLayoutAttributes()["relNodeId"]];
    var nodeBounds = node.getContentBounds();
    var connectorPos = node.connectorPos;
    
    var connX = node.getPosition().x + .5 * (nodeBounds.w - connectorBounds.w);
    var connY = 0;
    if (connectorPos == "bottom") {
      connY = node.getPosition().y + nodeBounds.h;
      
      linkPoints.push("M");
      linkPoints.push(connX + .5 * connectorBounds.w);
      linkPoints.push(connY + connectorBounds.h);
      linkPoints.push("L");
      linkPoints.push(connX + .5 * connectorBounds.w);
      linkPoints.push(connY + .5 * padding);
    }
    else {
      connY = node.getPosition().y - connectorBounds.h;
      
      linkPoints.push("M");
      linkPoints.push(connX + .5 * connectorBounds.w);
      linkPoints.push(connY);
      linkPoints.push("L");
      linkPoints.push(connX + .5 * connectorBounds.w);
      linkPoints.push(connY + connectorBounds.h - .5 * padding);
    }
    connector.setPosition({x: connX, y: connY});
  }
  
  if (link)
    link.setPoints(linkPoints);
};