var AdfDvtTierLayout = {};

AdfDvtTierLayout.tierLayout = function(layoutContext) {
  var tiers = {};
  var maxTier = -1;
  var maxNodeBounds = AdfDvtLayoutSupport.getMaxNodeBounds(layoutContext);
  var nodeSize = Math.max(maxNodeBounds.w, maxNodeBounds.h);
  var nodeCount = layoutContext.getNodeCount();
  var space = 2*nodeSize;
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    var tier = 0;
    if (node.getLayoutAttributes() && node.getLayoutAttributes()["tier"]) {
      tier = node.getLayoutAttributes()["tier"];
    }
    if (!tiers[tier]) {
      tiers[tier] = [];
      if (tier > maxTier) {
        maxTier = tier;
      }
    }
    tiers[tier].push(ni);
  }
  var starty = -(maxTier)*space/2;
  var realTier = 0;
  for (var i = 0; i <= maxTier; i++) {
    var tierNodes = tiers[i];
    if (tierNodes) {
      var tierNodeCount = tierNodes.length;
      var startx = -(tierNodeCount - 1)*space/2;
      for (var j = 0; j < tierNodeCount; j++) {
        var node = layoutContext.getNodeByIndex(tierNodes[j]);
        var currX = startx + space*j;
        var currY = starty + space*realTier;
        AdfDvtLayoutSupport.centerNodeAndLabel(node, currX, currY);      
      }
      realTier++;
    }
  }
  AdfDvtLayoutSupport.layoutLinks(layoutContext);
}