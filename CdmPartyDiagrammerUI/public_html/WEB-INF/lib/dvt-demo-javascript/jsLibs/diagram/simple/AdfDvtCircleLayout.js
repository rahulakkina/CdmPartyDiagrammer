var AdfDvtCircleLayout = {
};

AdfDvtCircleLayout.circleLayout = function (layoutContext) {
  var anchor;
  var nodeCount = layoutContext.getNodeCount();
  var layoutAttrs = layoutContext.getLayoutAttributes();
  var center = layoutAttrs ? "true" == layoutAttrs["center"] : false;
  var sortAttr = layoutAttrs ? layoutAttrs["sortAttr"] : null;
  var radialLabels = layoutAttrs ? "true" == layoutAttrs["radialLabels"] : false;
  var curvedLinks = layoutAttrs ? "true" == layoutAttrs["curvedLinks"] : false;
  if (center) {
    for (ni = 0;ni < nodeCount;ni++) {
      var node = layoutContext.getNodeByIndex(ni);
      if ("true" == node.getLayoutAttributes()["anchor"]) {
        anchor = node.getId();
        break;
      }
    }
  }
  var maxNodeBounds = AdfDvtLayoutSupport.getMaxNodeBounds(layoutContext, radialLabels);
  var nodeSize = Math.max(maxNodeBounds.w, maxNodeBounds.h);
  if (nodeCount == 1) {
    AdfDvtLayoutSupport.centerNodeAndLabel(layoutContext.getNodeByIndex(0), 0, 0);
  }
  else {
    if (nodeCount == 2 && center) {
      center = false;
    }
    var angleStep = 2 * Math.PI / (nodeCount - (center ? 1 : 0));
    var extraSpaceFactor = center ? (3 / nodeCount) : (1 / nodeCount);
    var radius = (1 + extraSpaceFactor) * nodeSize / Math.sqrt(1 - Math.cos(angleStep));
    var sortedNodes = new Array();
    var ni;
    for (ni = 0;ni < nodeCount;ni++) {
      var node = layoutContext.getNodeByIndex(ni);
      sortedNodes.push(node);
    }
    if (sortAttr) {
      sortedNodes.sort(AdfDvtLayoutSupport.getNodeComparator(sortAttr));
    }
    var max = nodeCount;
    var offset = 0;
    for (ni = 0;ni < max;ni++) {
      var node = sortedNodes[ni];
      if (center && !anchor) {
        anchor = node.getId();
      }
      if (center && node.getId() == anchor) {
        AdfDvtLayoutSupport.centerNodeAndLabel(node, 0, 0);
        offset = 1;
        continue;
      }
      var angle = (ni - offset) * angleStep;
      var currX = radius * Math.cos(angle);
      var currY = radius * Math.sin(angle);
      if (radialLabels) {
        AdfDvtLayoutSupport.centerNode(node, currX, currY);
        AdfDvtCircleLayout.positionRadialNodeLabel(layoutContext, node, angle, radius);          
      }
      else {
        AdfDvtLayoutSupport.centerNodeAndLabel(node, currX, currY);
      }
    }
  }
  if (curvedLinks) {
    AdfDvtCircleLayout.layoutCurvedLinks(layoutContext);
  }
  else {
    AdfDvtLayoutSupport.layoutLinks(layoutContext);
  }
};

AdfDvtCircleLayout.layoutCurvedLinks = function (layoutContext) {
  for (var li = 0;li < layoutContext.getLinkCount();li++) {
    var link = layoutContext.getLinkByIndex(li);
    var endpoints = AdfDvtCircleLayout.getCurvedEndpoints(layoutContext, link);

    var startX = endpoints[0].x;
    var startY = endpoints[0].y;
    var endX = endpoints[1].x;
    var endY = endpoints[1].y;

    // Quadratic Bezier through center of circle
    link.setPoints(["M", startX, startY, "Q", 0, 0, endX, endY]);

    // No label support for now
  }
};

AdfDvtCircleLayout.getCurvedEndpoints = function(layoutContext, link) {
  var layoutAttrs = layoutContext.getLayoutAttributes();
  //support for laying out links to connect at the edges of node
  //bounding boxes instead of at the centers
  var bLinkToBounds = true;
  if (layoutAttrs) {
    bLinkToBounds = (layoutAttrs["linkToBounds"] !== "false");
  }

  var n1 = layoutContext.getNodeById(link.getStartId());
  var n2 = layoutContext.getNodeById(link.getEndId());

  var bCrossContainerLink = n1.getContainerId() || n2.getContainerId();

  var n1Position = n1.getPosition();
  var n2Position = n2.getPosition();
  if (bCrossContainerLink) {
    n1Position = layoutContext.localToGlobal(new DvtDiagramPoint(0, 0), n1);
    n2Position = layoutContext.localToGlobal(new DvtDiagramPoint(0, 0), n2);
  }

  var b1 = n1.getContentBounds();
  var b2 = n2.getContentBounds();

  var startX = n1Position.x + b1.x + .5 * b1.w;
  var startY = n1Position.y + b1.y + .5 * b1.h;
  var endX = n2Position.x + b2.x + .5 * b2.w;
  var endY = n2Position.y + b2.y + .5 * b2.h;

  //support for laying out links to connect at the edges of node
  //bounding boxes instead of at the centers
  if (bLinkToBounds) {
    b1 = new DvtDiagramRectangle(n1Position.x + b1.x, n1Position.y + b1.y, b1.w, b1.h);
    b2 = new DvtDiagramRectangle(n2Position.x + b2.x, n2Position.y + b2.y, b2.w, b2.h);

    var startP = AdfDvtLayoutSupport._intersectRect(b1, startX, startY, 0, 0, link.getStartConnectorOffset());
    var endP = AdfDvtLayoutSupport._intersectRect(b2, endX, endY, 0, 0, link.getEndConnectorOffset());
    startX = startP.x;
    startY = startP.y;
    endX = endP.x;
    endY = endP.y;
  }  
  var endpoints = [];
  endpoints.push(new DvtDiagramPoint(startX, startY));
  endpoints.push(new DvtDiagramPoint(endX, endY));
  return endpoints;
};

AdfDvtCircleLayout.positionRadialNodeLabel = function (layoutContext, node, angle, radius) {
  var nodeLabelBounds = node.getLabelBounds();
  if (nodeLabelBounds) {
    var flipLabel = angle > .5 * Math.PI && angle < 1.5 * Math.PI;
    var nodeBounds = node.getBounds();
    var radiusPadding = Math.max(nodeBounds.w, nodeBounds.h)*Math.sqrt(2)/2;
    var labelAttachPoint = new DvtDiagramPoint((radius + radiusPadding) * Math.cos(angle), (radius + radiusPadding) * Math.sin(angle));
    var rotationPoint = new DvtDiagramPoint(nodeLabelBounds.x + (flipLabel ? nodeLabelBounds.w : 0), nodeLabelBounds.y + .5*nodeLabelBounds.h);
    var labelPos = new DvtDiagramPoint(labelAttachPoint.x - rotationPoint.x, labelAttachPoint.y - rotationPoint.y);
    node.setLabelPosition(labelPos);
    node.setLabelRotationAngle(angle - (flipLabel ? Math.PI : 0));
    node.setLabelRotationPoint(rotationPoint);
  }
}
