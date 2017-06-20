var AdfDvtContainerPaddingLayout = {};

AdfDvtContainerPaddingLayout.containerPaddingLayout = function(layoutContext) {
  var nodeCount = layoutContext.getNodeCount();
  var currY = 0;
  var maxWidth = 0;
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    node.setPosition({x: 0, y: currY});
    currY += node.getBounds().h + 5;
    if (node.isDisclosed()) {
      node.setContainerPadding(10, 10, 10, 30);
    }
    if (node.getBounds().w > maxWidth) {
      maxWidth = node.getBounds().w;
    }
  }
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    if (node.isDisclosed()) {
      if (node.getBounds().w < maxWidth) {
          var currPad = node.getContainerPadding();
          node.setContainerPadding(currPad.top, currPad.right + maxWidth - node.getBounds().w, currPad.bottom, currPad.left);
      }
    }
  }
};