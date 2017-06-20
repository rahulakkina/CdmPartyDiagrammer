package oracle.app.cdm.digram.model;

import java.awt.Color;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import oracle.adf.model.binding.DCBindingContainer;
import oracle.adf.model.binding.DCIteratorBinding;

import oracle.app.cdm.diagram.module.PartyRelationshipAMImpl;
import oracle.app.cdm.diagram.view.PartiesRelationshipVOImpl;
import oracle.app.cdm.diagram.view.PartiesRelationshipVORowImpl;

import org.apache.myfaces.trinidad.model.RowKeySet;
import org.apache.myfaces.trinidad.model.RowKeySetImpl;


public abstract class DiagramGraphBuilder {

    private static final String GRAPH_ATTR[] = { "PartyId", "Depth" };
    private static final float SATURATION = .9f;
    private static final float BRIGHTNESS = .9f;

    private static final String DEPTH = "DEPTH";
    private static final String COLOR = "COLOR";
    private static final String ICON = "ICON";
    private static final String UNIQUENAME = "UNIQUENAME";
    private static final String EMAIL = "EMAIL";
    private static final String ADDRESS1 = "ADDRESS1";
    private static final String ADDRESS2 = "ADDRESS2";
    private static final String ADDRESS3 = "ADDRESS3";
    private static final String ADDRESS4 = "ADDRESS4";
    private static final String CITY = "CITY";
    private static final String POSTALCODE = "POSTALCODE";
    private static final String STATE = "STATE";
    private static final String COUNTRY = "COUNTRY";
    private static final String SELECT = "SELECT";
    private static final Map<String, String> markerMap = new HashMap<String, String>();

    static {
        markerMap.put("PERSON", "person.png");
        markerMap.put("PARTY_RELATIONSHIP", "rel.png");
        markerMap.put("ORGANIZATION", "org.png");
        markerMap.put("GROUP", "group.png");
    }

    public static DiagramGraph buildGraph(DCBindingContainer bindings, Object graphValues[]) {


        DiagramGraphNode node = null;
        DiagramGraphLink link = null;
        Set<DiagramGraphLink> links = new TreeSet<DiagramGraphLink>();

        DCIteratorBinding itr = bindings.findIteratorBinding("PartyRelationshipVO1Iterator");


        PartyRelationshipAMImpl partyRelAM = (PartyRelationshipAMImpl) itr.getDataControl().getDataProvider();
        PartiesRelationshipVOImpl ritr = partyRelAM.getPartiesRelationshipVO1();


        ritr.setPartyId((Long) graphValues[0]);
        ritr.setGraphDepth((Integer) graphValues[1]);

        ritr.executeQuery();

        while (ritr.hasNext()) {
            PartiesRelationshipVORowImpl row = (PartiesRelationshipVORowImpl) ritr.next();

            DiagramGraphNode subjectNode =
                new DiagramGraphNode(row.getSubjectId(), row.getSubjectPartyName(), row.getSubjectType());
            DiagramGraphNode objectNode =
                new DiagramGraphNode(row.getObjectId(), row.getObjectPartyName(), row.getObjectType());

            subjectNode.getAttributes().put(UNIQUENAME, row.getSubjectPartyUniqueName());
            objectNode.getAttributes().put(UNIQUENAME, row.getObjectPartyUniqueName());

            subjectNode.getAttributes().put(SELECT, true);
            objectNode.getAttributes().put(SELECT, true);
            
            subjectNode.getAttributes().put(EMAIL, row.getSubjectEmailAddress() != null ?row.getSubjectEmailAddress():"");
            objectNode.getAttributes().put(EMAIL, row.getObjectEmailAddress() != null ? row.getObjectEmailAddress():"");
            
            subjectNode.getAttributes().put(ADDRESS1, row.getSubjectAddress1() != null ?row.getSubjectAddress1():"");
            objectNode.getAttributes().put(ADDRESS1, row.getObjectAddress1() != null ? row.getObjectAddress1():"");

            subjectNode.getAttributes().put(ADDRESS2, row.getSubjectAddress2() != null ?row.getSubjectAddress2():"");
            objectNode.getAttributes().put(ADDRESS2, row.getObjectAddress2() != null ? row.getObjectAddress2():"");

            subjectNode.getAttributes().put(ADDRESS3, row.getSubjectAddress3() != null ?row.getSubjectAddress3():"");
            objectNode.getAttributes().put(ADDRESS3, row.getObjectAddress3() != null ? row.getObjectAddress3():"");

            subjectNode.getAttributes().put(ADDRESS4, row.getSubjectAddress4() != null ?row.getSubjectAddress4():"");
            objectNode.getAttributes().put(ADDRESS4, row.getObjectAddress4() != null ? row.getObjectAddress4():"");
            
            subjectNode.getAttributes().put(CITY, row.getSubjectCity() != null ?row.getSubjectCity():"");
            objectNode.getAttributes().put(CITY, row.getObjectCity() != null ? row.getObjectCity():"");

            subjectNode.getAttributes().put(POSTALCODE, row.getSuobjectPostalCode() != null ?row.getSuobjectPostalCode():"");
            objectNode.getAttributes().put(POSTALCODE, row.getObjectPostalCode() != null ? row.getObjectPostalCode():"");   

            subjectNode.getAttributes().put(STATE, row.getSubjectState() != null ?row.getSubjectState():(row.getSubjectProvince() != null?row.getSubjectProvince():""));
            objectNode.getAttributes().put(STATE, row.getObjectState() != null ? row.getObjectState():(row.getObjectProvince() != null?row.getObjectProvince():""));   
  
            subjectNode.getAttributes().put(COUNTRY, row.getSubjectCountry() != null ?row.getSubjectCountry():"");
            objectNode.getAttributes().put(COUNTRY, row.getObjectCountry() != null ? row.getObjectCountry():"");


            if (ritr.getPartyId().equals(row.getSubjectId()))
                node = subjectNode;

            if (ritr.getPartyId().equals(row.getObjectId()))
                node = objectNode;

            link = new DiagramGraphLink(subjectNode, objectNode, row.getRelationshipCode());
            link.getAttributes().put(DEPTH, row.getDepth());


            links.add(link);
        }

        System.out.println("Links : " + links + "\n Size : " + links.size() + "\n Root Node : " + node);

      
        DiagramGraph graph = new DiagramGraph(node, links);

        addColor(graph.getDiagramGraphNodes(), graph.getDiagramGraphLinks());
        
        RowKeySet selectedNodes = new RowKeySetImpl();
        selectedNodes.add(graph.getRootNodeIndex());
        
        node.getAttributes().put("selectedRowKeys",selectedNodes);

        return graph;

    }

    protected static void addColor(List<DiagramGraphNode> digramNodes, List<DiagramGraphLink> diagramLinks) {
        int i = 0;
        int size = digramNodes.size();

        for (DiagramGraphNode n : digramNodes) {
            n.getAttributes().put(COLOR,
                                  "#" +
                                  Integer.toHexString(Color.HSBtoRGB(i * 1.0f / size, SATURATION, BRIGHTNESS) &
                                                      0xFFFFFF));
            n.getAttributes().put(ICON, markerMap.containsKey(n.getType()) ? markerMap.get(n.getType()) : "circle");
            i++;
        }

        i = 0;
        size = diagramLinks.size();

        for (DiagramGraphLink l : diagramLinks) {
            l.getAttributes().put(COLOR,
                                  "#" +
                                  Integer.toHexString(Color.HSBtoRGB(i * 1.0f / size, SATURATION, BRIGHTNESS) &
                                                      0xFFFFFF));
            i++;
        }
    }

}
