package oracle.app.cdm.digram.model;

import java.io.Serializable;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import org.apache.myfaces.trinidad.model.CollectionModel;
import org.apache.myfaces.trinidad.model.ModelUtils;

/**
 * @version
 */
public class DiagramGraph implements Serializable {


    @SuppressWarnings("compatibility:-8354651611478671670")
    private static final long serialVersionUID = -662978157131671037L;
    private Set<DiagramGraphLink> links;
    private Map<DiagramGraphNode, Set<DiagramGraphLink>> graphModel;
    private DiagramGraphNode rootNode;
    private boolean iFlag = false;

    public DiagramGraph(DiagramGraphNode rootNode, Set<DiagramGraphLink> links) {
        this.links = links;
        this.rootNode = rootNode;
        load(this.rootNode, this.links);
    }


    protected void load(DiagramGraphNode rootNode, Set<DiagramGraphLink> links) {

        Comparator<DiagramGraphNode> cmp = new Comparator<DiagramGraphNode>() {
            public int compare(DiagramGraphNode o1, DiagramGraphNode o2) {
                return o1.getId().compareTo(o2.getId());
            }
        };

        this.graphModel = new TreeMap<DiagramGraphNode, Set<DiagramGraphLink>>(cmp);

        if (links != null) {
            for (DiagramGraphLink link : links)
                addLink(link);
            iFlag = true;
        }

    }

    public int getNodesSize() {
        return graphModel.size();
    }

    public int getLinksSize() {
        return links != null ? links.size() : 0;
    }
    
    public int getLnkSize(){
        return getLinksSize() > 10?10:getLinksSize();
    }

    public DiagramGraphNode getRootNode() {
        return rootNode;
    }

    public int getRootNodeIndex() {
        int i = getDiagramGraphNodes().indexOf(getRootNode());
        return i > -1 ? i:0;
    }

    public CollectionModel getNodes() {
        return ModelUtils.toCollectionModel(getDiagramGraphNodes());
    }

    public List<DiagramGraphLink> getDiagramGraphLinks() {
        return Arrays.asList(links.toArray(new DiagramGraphLink[0]));
    }

    public List<DiagramGraphNode> getDiagramGraphNodes() {
        return Arrays.asList(graphModel.keySet().toArray(new DiagramGraphNode[0]));
    }

    public DiagramGraphNode getNode(int index) {
        return getDiagramGraphNodes().get(index);
    }

    public CollectionModel getLinks() {
        return ModelUtils.toCollectionModel(getDiagramGraphLinks());
    }

    public Set<DiagramGraphLink> getConnectedEdges(DiagramGraphNode node) {
        return graphModel.get(node);
    }

    protected void addNode(DiagramGraphNode node) {

        if (graphModel.containsKey(node))
            graphModel.put(node, graphModel.get(node));
        else
            graphModel.put(node, new TreeSet<DiagramGraphLink>());

    }

    public void addLink(DiagramGraphLink link) {
        if (iFlag)
            links.add(link);

        addNode(link.getFrom());
        addNode(link.getTo());
        graphModel.get(link.getFrom()).add(link);
        graphModel.get(link.getTo()).add(link);
    }


    /* (non-Javadoc)
             * @see java.lang.Object#hashCode()
             */

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((links == null) ? 0 : links.hashCode());
        result = prime * result + ((getNodes() == null) ? 0 : getNodes().hashCode());
        return result;
    }

    /* (non-Javadoc)
             * @see java.lang.Object#equals(java.lang.Object)
             */

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (!(obj instanceof DiagramGraph)) {
            return false;
        }
        DiagramGraph other = (DiagramGraph) obj;
        if (links == null) {
            if (other.links != null) {
                return false;
            }
        } else if (!links.equals(other.links)) {
            return false;
        }
        if (getNodes() == null) {
            if (other.getNodes() != null) {
                return false;
            }
        } else if (!getNodes().equals(other.getNodes())) {
            return false;
        }
        return true;
    }

    public void clear() {
        graphModel.clear();
        links.clear();
        rootNode = null;
        iFlag = false;
    }

    @Override
    protected void finalize() throws Throwable {
        // TODO Implement this method
        super.finalize();
        clear();
    }

}
