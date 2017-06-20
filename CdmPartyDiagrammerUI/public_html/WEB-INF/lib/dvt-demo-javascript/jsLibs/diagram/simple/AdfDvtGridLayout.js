var AdfDvtGridLayout = {
};

AdfDvtGridLayout.gridLayout = function (layoutContext) {
  var maxNodeBounds = AdfDvtLayoutSupport.getMaxNodeBounds(layoutContext);
  var nodeSize = Math.max(maxNodeBounds.w, maxNodeBounds.h);
  var nodeCount = layoutContext.getNodeCount();
  var linkCount = layoutContext.getLinkCount();
  var size = Math.floor(Math.sqrt(nodeCount));

  //var space = linkCount > 0 ? 2*nodeSize : 1.25*nodeSize;
  var padding = 0;
  var layoutAttrs = layoutContext.getLayoutAttributes();
  if (layoutAttrs && layoutAttrs["padding"]) {
    padding = layoutAttrs["padding"];
  }
  else {
    padding = linkCount > 0 ? nodeSize : .25 * nodeSize;
  }
  var space = nodeSize + padding;

  var rows = Math.ceil(nodeCount / size);
  var cols = size;
  var startx =  - (cols - 1) * space / 2;
  var starty =  - (rows - 1) * space / 2;
  for (var ni = 0;ni < nodeCount;ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    var row = Math.floor(ni / size);
    var col = ni % size;
    var currX = startx + space * col;
    var currY = starty + space * row;
    AdfDvtLayoutSupport.centerNodeAndLabel(node, currX, currY);
  }
  AdfDvtLayoutSupport.layoutLinks(layoutContext);
};