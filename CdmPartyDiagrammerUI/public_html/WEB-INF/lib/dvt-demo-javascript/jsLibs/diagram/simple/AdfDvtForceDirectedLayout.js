var AdfDvtForceDirectedLayout = {};

AdfDvtForceDirectedLayout.forceDirectedLayout = function(layoutContext)
{
  //see algorithm in "Graph Drawing by Force-directed Placement" by 
  //Thomas M. J. Fruchterman and Edward M. Reingold
  
  var maxBounds = AdfDvtLayoutSupport.getMaxNodeBounds(layoutContext);
  var nodeCount = layoutContext.getNodeCount();
  var padFactor = 1.5;
  //pretend that the layout area is just big enough to fit the nodes
  var area = nodeCount * (padFactor * maxBounds.w) * (padFactor * maxBounds.h);
  
  //initialize the positions of the nodes (no two nodes should have the same
  //position)
  AdfDvtForceDirectedLayout._initForceDirectedPositions(layoutContext, area);
  
  //optimal link length - default is just the size of an ideal grid cell
  var k = Math.sqrt(area / nodeCount);
  //number of iterations to run
  var iter = 200;
  //initial temperature factor - percent of ideal viewport dimension
  var initialTempFactor = .25;
  var layoutAttrs = layoutContext.getLayoutAttributes();
  if (layoutAttrs)
  {
    if (layoutAttrs["optimalLinkLength"])
    {
      k = parseInt(layoutAttrs["optimalLinkLength"]);
    }
    if (layoutAttrs["iterations"])
    {
      iter = parseInt(layoutAttrs["iterations"]);
    }
    if (layoutAttrs["initialTempFactor"])
    {
      initialTempFactor = parseFloat(layoutAttrs["initialTempFactor"]);
    }
  }
  
  //calculate the initial temperature, which is just a percentage of the ideal 
  //viewport size
  var initialTemp = initialTempFactor * Math.sqrt(area);
  var t = initialTemp;
  for (var i = 0; i < iter; i++) 
  {
    AdfDvtForceDirectedLayout._runForceDirectedIteration(layoutContext, t, k, area);
    //after each iteration, decrease the temperature - we do it linearly
    t = initialTemp * (1 - ((i + 1)/iter));
  }
  
  //position links
  AdfDvtLayoutSupport.layoutLinks(layoutContext);
  //position labels
  AdfDvtLayoutSupport.positionNodeLabels(layoutContext);
};

AdfDvtForceDirectedLayout._runForceDirectedIteration = function(layoutContext, t, k, area)
{
  //calculate the repulsive force between each two nodes
  var nodeCount = layoutContext.getNodeCount();
  for (var ni = 0; ni < nodeCount; ni++) 
  {
    var node = layoutContext.getNodeByIndex(ni);
    node.disp = new DvtDiagramPoint(0, 0);
    for (var ni2 = 0; ni2 < nodeCount; ni2++) 
    {
      if (ni == ni2)
        continue;
      var node2 = layoutContext.getNodeByIndex(ni2);
      var diffVector = AdfDvtForceDirectedLayout._subtractVectors(node.getPosition(), node2.getPosition());
      var vecLength = AdfDvtForceDirectedLayout._calcVectorLength(diffVector);
      var adjustVector = AdfDvtForceDirectedLayout._scaleVector(diffVector,
                           AdfDvtForceDirectedLayout._calcForceDirectedRepulsion(vecLength, k) / vecLength);
      node.disp = AdfDvtForceDirectedLayout._addVectors(node.disp, adjustVector);
    }
  }
  
  //calculate the attractive force between linked nodes
  var linkCount = layoutContext.getLinkCount();
  for (var li = 0; li < linkCount; li++) 
  {
    var link = layoutContext.getLinkByIndex(li);
    var node = layoutContext.getNodeById(link.getStartId());
    var node2 = layoutContext.getNodeById(link.getEndId());
    var diffVector = AdfDvtForceDirectedLayout._subtractVectors(node.getPosition(), node2.getPosition());
    var vecLength = AdfDvtForceDirectedLayout._calcVectorLength(diffVector);
    var adjustVector = AdfDvtForceDirectedLayout._scaleVector(diffVector,
                         AdfDvtForceDirectedLayout._calcForceDirectedAttraction(vecLength, k) / vecLength);
    node.disp = AdfDvtForceDirectedLayout._subtractVectors(node.disp, adjustVector);
    node2.disp = AdfDvtForceDirectedLayout._addVectors(node2.disp, adjustVector);
  }
  
  //limit node displacement by the temperature t and set the position
  for (var ni = 0; ni < nodeCount; ni++) 
  {
    var node = layoutContext.getNodeByIndex(ni);
    var pos = node.getPosition();
    var vecLength = AdfDvtForceDirectedLayout._calcVectorLength(node.disp);
    var adjustVector = AdfDvtForceDirectedLayout._scaleVector(node.disp,
                         Math.min(vecLength, t) / vecLength);
    pos = AdfDvtForceDirectedLayout._addVectors(pos, adjustVector);
    node.setPosition(pos);
  }
};

AdfDvtForceDirectedLayout._calcForceDirectedAttraction = function(z, k) {
  return (z * z) / k;
};

AdfDvtForceDirectedLayout._calcForceDirectedRepulsion = function(z, k) {
  return (k * k) / z;
};

AdfDvtForceDirectedLayout._initForceDirectedPositions = function(layoutContext, area) {
  //node positions in force directed layout must be initialized such that no
  //two nodes have the same position
  
  //random positions result in different layout on each render
  /*
  var nodeCount = layoutContext.getNodeCount();
  var size = Math.sqrt(area);
  for (var ni = 0; ni < nodeCount; ni++) {
    var node = layoutContext.getNodeByIndex(ni);
    node.setPosition(new DvtDiagramPoint(Math.random() * size, Math.random() * size));
  }
  */
  
  //circle layout seems to work fine, and the layouts are stable across renders
  AdfDvtCircleLayout.circleLayout(layoutContext);
};

AdfDvtForceDirectedLayout._calcVectorLength = function(p) {
  return Math.sqrt(p.x * p.x + p.y * p.y);
};

AdfDvtForceDirectedLayout._scaleVector = function(p, scale) {
  return new DvtDiagramPoint(p.x * scale, p.y * scale);
};

AdfDvtForceDirectedLayout._addVectors = function(p1, p2) {
  return new DvtDiagramPoint(p1.x + p2.x, p1.y + p2.y);
};

AdfDvtForceDirectedLayout._subtractVectors = function(p1, p2) {
  return new DvtDiagramPoint(p1.x - p2.x, p1.y - p2.y);
};
