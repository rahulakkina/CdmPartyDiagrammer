var AdfDvtSquareLayout = {};

AdfDvtSquareLayout.squareLayout = function(layoutContext) {
  AdfDvtSquareLayout.SquareLayout(layoutContext, false);
}

AdfDvtSquareLayout.sortedSquareLayout = function(layoutContext) {
 AdfDvtSquareLayout.SquareLayout(layoutContext, true, false);
}

AdfDvtSquareLayout.centeredSquareLayout = function(layoutContext) {
  AdfDvtSquareLayout.SquareLayout(layoutContext, true, true);
}

AdfDvtSquareLayout.SquareLayout = function(layoutContext, sort, center) {
  var anchor;
  var nodeCount = layoutContext.getNodeCount();
  if (center) {
    for (ni = 0; ni < nodeCount; ni++) {
      var node = layoutContext.getNodeByIndex(ni);
      if ("true" == node.getLayoutAttributes()["anchor"]) {
        anchor = node.getId();
        break;
      }
    }
  }
  var maxNodeBounds = AdfDvtLayoutSupport.getMaxNodeBounds(layoutContext);
  var nodeSize = Math.max(maxNodeBounds.w, maxNodeBounds.h);
  if (nodeCount == 1) {
    AdfDvtLayoutSupport.centerNodeAndLabel(layoutContext.getNodeByIndex(0), 0, 0);
  }
  else {
    if (nodeCount == 2 && center) {
      center = false;
    }
    var angleStep = 2*Math.PI/(nodeCount - (center ? 1 : 0));
    var extraSpaceFactor = center ? (3/nodeCount) : (1/nodeCount);
    var halfSide = (1 + extraSpaceFactor)*nodeSize/Math.sqrt(1-Math.cos(angleStep));
    var sortedNodes = new Array();
    var ni;
    for (ni = 0; ni < nodeCount; ni++) {
      var node = layoutContext.getNodeByIndex(ni);
      sortedNodes.push(node);
    }
    if (sort) {
      sortedNodes.sort(AdfDvtLayoutSupport.getNodeComparator("tier"));
    }
    var max = nodeCount;
    var offset = 0;
    for (ni = 0; ni < max; ni++) {
      var node = sortedNodes[ni];
      if (center && !anchor) {
        anchor = node.getId();
      }
      if (center && node.getId() == anchor) {
        AdfDvtLayoutSupport.centerNodeAndLabel(node, 0, 0);
        offset = 1;
        continue;
      }
      var angle = (ni-offset)*angleStep;
      var currX;
      var currY;    
      if (angle > 7*Math.PI/4 || angle <= Math.PI/4) {
        currX = halfSide;
        currY = halfSide * Math.tan(angle);
      }
      else if (angle > 5*Math.PI/4) {    
        currX = -halfSide * Math.tan(Math.PI/2 - angle);
        currY = -halfSide;
      }
      else if (angle > 3*Math.PI/4) {
        currX = -halfSide;
        currY = halfSide * Math.tan(Math.PI - angle);
      }
      else if (angle > Math.PI/4) {
        currX = halfSide * Math.tan(3*Math.PI/2 - angle);
        currY = halfSide;
  
      }
      AdfDvtLayoutSupport.centerNodeAndLabel(node, currX, currY);
    }
  }
  AdfDvtLayoutSupport.layoutLinks(layoutContext);
}
