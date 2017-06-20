var AdfDvtDbSchemaLayout = {};

AdfDvtDbSchemaLayout.dbSchemaLayout = function(layoutContext) {
  var nodeCount = layoutContext.getNodeCount();
  var nodes = {};
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    nodes[node.getId()] = node;
    //console.log("laying out node " + node.getId());
  }
  var linkCount = layoutContext.getLinkCount();
  var nodesWithInLinks = [];
  for (var li = 0; li < linkCount; li++) {
    var link = layoutContext.getLinkByIndex(li);
    var n1id = link.getStartId();
    var n2id = link.getEndId();
    var bCrossContainerLink = false;
    var n1 = nodes[n1id];
    var n2 = nodes[n2id];
    if (!n1) {
      n1 = layoutContext.getNodeById(n1id);
      bCrossContainerLink = true;
    }
    if (!n2) {
      n2 = layoutContext.getNodeById(n2id);
      bCrossContainerLink = true;
    }
    
    if (bCrossContainerLink) {
      var tcId = AdfDvtDbSchemaLayout.FindTopContainer(layoutContext, n2id);
      if (DvtArrayUtils.indexOf(nodesWithInLinks,tcId) < 0) {
        //console.log("nodesWithInLinks (cross) + " + tcId);
        nodesWithInLinks.push(tcId);
      }
    }
    else {
      if (DvtArrayUtils.indexOf(nodesWithInLinks,n2id) < 0) {
        //console.log("nodesWithInLinks + " + n2id);
        nodesWithInLinks.push(n2id);
      }
    }
  }
  
  var rows = [];
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    var nId = node.getId();
    if (DvtArrayUtils.indexOf(nodesWithInLinks,nId) < 0) {
      rows.push([nId]);
    }
  }
  //console.log("rows = " + rows);
  AdfDvtDbSchemaLayout.CreateChains(layoutContext, rows);
  //console.log("chain rows = " + rows);
  
  var currY = 0;
  var maxWidth = 0;
  for (var rowI = 0; rowI < rows.length; rowI++) {
    var row = rows[rowI];
    var maxHeight = 0;
    for (var ni = 0; ni < row.length; ni++) {
      var nodeId = row[ni];
      var node = layoutContext.getNodeById(nodeId);
      var bounds = node.getBounds();
      if (bounds.h > maxHeight) {
        maxHeight = bounds.h;
      }
    }
    var currX = 0;
    for (var ni = 0; ni < row.length; ni++) {
      var nodeId = row[ni];
      var node = layoutContext.getNodeById(nodeId);
      var bounds = node.getBounds();
      
      node.setPosition(new DvtDiagramPoint(currX, currY + .5 * (maxHeight - bounds.h)));
      //console.log("position " + nodeId + ": " + currX + ", " + currY);
      if (currX + bounds.w > maxWidth) {
        maxWidth = currX + bounds.w;
    }
      currX += bounds.w + 20;
    }
    currY += maxHeight + 5;
  }
  for (var rowI = 0; rowI < rows.length; rowI++) {
    var row = rows[rowI];
    var currWidth = 0;
    for (var ni = 0; ni < row.length; ni++) {
      var nodeId = row[ni];
      var node = layoutContext.getNodeById(nodeId);
      var bounds = node.getBounds();
      if (node.getPosition().x + bounds.w > currWidth) {
        currWidth = node.getPosition().x + bounds.w;
      }
    }
    for (var ni = 0; ni < row.length; ni++) {
      var nodeId = row[ni];
      var node = layoutContext.getNodeById(nodeId);
      node.getPosition().x += .5 * (maxWidth - currWidth);
    }
  }
  
  for (var i = 0; i < layoutContext.getLinkCount(); i++) {
    var link = layoutContext.getLinkByIndex(i);
    var n1Id = link.getStartId();
    var n2Id = link.getEndId();
    var node1 = layoutContext.getNodeById(n1Id);
    var node2 = layoutContext.getNodeById(n2Id);
    var n1Position = node1.getPosition();
    var n2Position = node2.getPosition();
    if (node1.getContainerId()) {
      //console.log(n1Id);
      n1Position = layoutContext.localToGlobal(new DvtDiagramPoint(0, 0), node1);
    }
    if (node2.getContainerId()) {
      //console.log(n2Id);
      n2Position = layoutContext.localToGlobal(new DvtDiagramPoint(0, 0), node2);
    }
    var startX = n1Position.x + node1.getBounds().w;
    var startY = n1Position.y + .5 * node1.getBounds().h;
    var endX = n2Position.x;
    var endY = n2Position.y + .5 * node2.getBounds().h;
    link.setPoints(AdfDvtDbSchemaLayout.CreateLinkPath(startX, startY, endX, endY));
  }
  
  ///AdfDvtDbSchemaLayout._positionNodeLabels(layoutContext);
};

AdfDvtDbSchemaLayout.CreateChains = function(layoutContext, nodes) {
  for (var i = 0; i < nodes.length; i++) {
    var chainNodes = nodes[i];
    for (var j = 0; j < chainNodes.length; j++) {
      var nId = chainNodes[j];
      var outLinkNodes = AdfDvtDbSchemaLayout.FindOutLinkNodes(layoutContext, nId);
      //console.log("outLinkNodes = " + outLinkNodes);
      for (var k = 0; k < outLinkNodes.length; k++) {
        var n2Id = outLinkNodes[k];
        if (k == 0) {
          if (DvtArrayUtils.indexOf(chainNodes,n2Id) < 0) {
            chainNodes.push(n2Id);
          }
        }
        else {
          nodes.splice(i+1, 0, [n2Id]);
        }
      }
    }
  }
};

AdfDvtDbSchemaLayout.FindOutLinkNodes = function(layoutContext, nodeId) {
  var linkCount = layoutContext.getLinkCount();
  var array = [];
  for (var li = 0; li < linkCount; li++) {
    var link = layoutContext.getLinkByIndex(li);
    var n1id = link.getStartId();
    if (n1id == nodeId ||
        AdfDvtDbSchemaLayout.FindTopContainer(layoutContext, n1id) == nodeId) {
      var n2id = AdfDvtDbSchemaLayout.FindTopContainer(layoutContext, link.getEndId());
      if (DvtArrayUtils.indexOf(array,n2id) < 0) {
        array.push(n2id);
      }
    }
  }
  return array;
};

AdfDvtDbSchemaLayout.FindTopContainer = function(layoutContext, nodeId) {
  var node = layoutContext.getNodeById(nodeId);
  var containerId = node.getContainerId();
  while (containerId) {
    node = layoutContext.getNodeById(containerId);
    containerId = node.getContainerId();
  }
  return node.getId();
};

AdfDvtDbSchemaLayout.CreateLinkPath = function(startX, startY, endX, endY) {
  var path = ["M", startX, startY];
  
  var midX = startX + .5 * (endX - startX);
  var midY = startY + .5 * (endY - startY);
  var c1X = midX;
  var c1Y = startY;
  var c2X = midX;
  var c2Y = endY;
  path.push("Q");
  path.push(c1X);
  path.push(c1Y);
  path.push(midX);
  path.push(midY);
  path.push("Q");
  path.push(c2X);
  path.push(c2Y);
  path.push(endX);
  path.push(endY);
  
  return path;
};
