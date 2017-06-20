package oracle.app.cdm.digram.backing;

import java.util.Iterator;

import javax.faces.component.UISelectItems;
import javax.faces.event.ActionEvent;
import javax.faces.event.ValueChangeEvent;

import oracle.adf.model.BindingContext;
import oracle.adf.model.binding.DCBindingContainer;
import oracle.adf.view.faces.bi.component.diagram.UIDiagram;
import oracle.adf.view.faces.bi.component.diagram.UIDiagramLinks;
import oracle.adf.view.faces.bi.component.diagram.UIDiagramNodes;
import oracle.adf.view.rich.component.rich.RichDocument;
import oracle.adf.view.rich.component.rich.RichForm;
import oracle.adf.view.rich.component.rich.RichPopup;
import oracle.adf.view.rich.component.rich.input.RichInputText;
import oracle.adf.view.rich.component.rich.input.RichSelectItem;
import oracle.adf.view.rich.component.rich.input.RichSelectManyChoice;
import oracle.adf.view.rich.component.rich.input.RichSelectOneChoice;
import oracle.adf.view.rich.component.rich.layout.RichPanelAccordion;
import oracle.adf.view.rich.component.rich.layout.RichPanelFormLayout;
import oracle.adf.view.rich.component.rich.layout.RichPanelGroupLayout;
import oracle.adf.view.rich.component.rich.layout.RichPanelSplitter;
import oracle.adf.view.rich.component.rich.layout.RichShowDetailItem;
import oracle.adf.view.rich.component.rich.output.RichImage;
import oracle.adf.view.rich.component.rich.output.RichMessages;
import oracle.adf.view.rich.component.rich.output.RichOutputFormatted;
import oracle.adf.view.rich.component.rich.output.RichOutputLabel;
import oracle.adf.view.rich.component.rich.output.RichSeparator;
import oracle.adf.view.rich.component.rich.output.RichSpacer;

import oracle.app.cdm.digram.model.DiagramGraph;
import oracle.app.cdm.digram.model.DiagramGraphBuilder;
import oracle.app.cdm.digram.model.DiagramGraphNode;

import org.apache.myfaces.trinidad.event.RowDisclosureEvent;
import org.apache.myfaces.trinidad.model.RowKeySet;
import org.apache.myfaces.trinidad.model.RowKeySetImpl;

public class PartyRelationGraph {


    private RichPanelSplitter ps1;
    private RichPanelSplitter ps2;
    private RichForm f1;
    private RichDocument d1;
    private RichPanelAccordion pa1;
    private RichShowDetailItem sdi1;
    private UIDiagram dg1;
    private UIDiagramNodes dn1;
    private UIDiagramLinks dl1;
    private RichMessages m1;
    private UIDiagramLinks dl3;
    private DiagramGraph partyGraph;
    private DCBindingContainer bindings;


    private Long partyId;
    private Integer depth;
    private RichInputText it1;
    private RichInputText it2;
    private RichPanelGroupLayout pgl1;
    private RichPanelFormLayout pfl1;

    private RichInputText it3;
    private RichPanelSplitter ps3;
    private RichSpacer s1;
    private RichPanelFormLayout pfl2;
    private RichSeparator s2;
    private RichSpacer s3;
    private RichSelectManyChoice smc1;
    private UISelectItems si1;
    private RichSelectOneChoice soc1;
    private RichSelectItem si7;
    private RichSelectItem si2;
    private RichSelectItem si3;
    private RichSelectItem si4;
    private RichSelectItem si5;
    private RichSelectItem si6;
    private RichSelectOneChoice soc2;
    private RichPanelAccordion pa2;
    private RichShowDetailItem sdi2;
    private RichPanelAccordion pa3;
    private RichShowDetailItem sdi3;
    private RichSelectOneChoice soc3;
    private String diagramLayout = "network";
    private RichSelectOneChoice soc4;
    private RichSelectItem si9;
    private RichImage i1;
    private RichPopup p1;
    private RichPopup dianp;
    private RichOutputLabel ol1;
    private RichOutputFormatted of1;
    private RichOutputFormatted of2;
    private RichOutputFormatted of3;
    private Object popupNode;


    public void setPopupNode(Object popupNode) {
        this.popupNode = popupNode;
    }

    public Object getPopupNode() {
        return popupNode;
    }

    public PartyRelationGraph() {
        if (bindings == null)
            bindings = (DCBindingContainer) BindingContext.getCurrent().getCurrentBindingsEntry();
    }

    public void setPartyId(Long partyId) {
        this.partyId = partyId;
    }

    public Long getPartyId() {
        return partyId;
    }

    public void setDepth(Integer depth) {
        this.depth = depth;
    }

    public Integer getDepth() {
        return depth;
    }


    public void setPartyGraph(DiagramGraph partyGraph) {
        this.partyGraph = partyGraph;
    }

    public DiagramGraph getPartyGraph() {
        if (this.partyGraph == null)
            createGraph();

        return partyGraph;
    }


    public void setPs1(RichPanelSplitter ps1) {
        this.ps1 = ps1;
    }

    public RichPanelSplitter getPs1() {
        return ps1;
    }

    public void setPs2(RichPanelSplitter ps2) {
        this.ps2 = ps2;
    }

    public RichPanelSplitter getPs2() {
        return ps2;
    }

    public void setF1(RichForm f1) {
        this.f1 = f1;
    }

    public RichForm getF1() {
        return f1;
    }

    public void setD1(RichDocument d1) {
        this.d1 = d1;
    }

    public RichDocument getD1() {
        return d1;
    }

    public void setPa1(RichPanelAccordion pa1) {
        this.pa1 = pa1;
    }

    public RichPanelAccordion getPa1() {
        return pa1;
    }

    public void setSdi1(RichShowDetailItem sdi1) {
        this.sdi1 = sdi1;
    }

    public RichShowDetailItem getSdi1() {
        return sdi1;
    }

    public void setDg1(UIDiagram dg1) {
        this.dg1 = dg1;
    }

    public UIDiagram getDg1() {
        return dg1;
    }

    public void setDn1(UIDiagramNodes dn1) {
        this.dn1 = dn1;
    }

    public UIDiagramNodes getDn1() {
        return dn1;
    }

    public void setDl1(UIDiagramLinks dl1) {
        this.dl1 = dl1;
    }

    public UIDiagramLinks getDl1() {
        return dl1;
    }

    public void setM1(RichMessages m1) {
        this.m1 = m1;
    }

    public RichMessages getM1() {
        return m1;
    }

    public void setDl3(UIDiagramLinks dl3) {
        this.dl3 = dl3;
    }

    public UIDiagramLinks getDl3() {
        return dl3;
    }

    protected void createGraph() {

        Object graphValues[] = new Object[2];
        graphValues[0] = getPartyId();
        graphValues[1] = getDepth();

        setPartyGraph(DiagramGraphBuilder.buildGraph(getDCBindingContainer(), graphValues));

    }

    public DCBindingContainer getDCBindingContainer() {
        return bindings;
    }

    public void setIt1(RichInputText it1) {
        this.it1 = it1;
    }

    public RichInputText getIt1() {
        return it1;
    }

    public void setIt2(RichInputText it2) {
        this.it2 = it2;
    }

    public RichInputText getIt2() {
        return it2;
    }

    public void onValueChange(ValueChangeEvent vce) {

        String source = vce.getComponent().getId();

        if ("soc2".equals(source)) {
            setDepth((Integer) vce.getNewValue());
        }

        if ("soc3".equals(source)) {
            setPartyId((Long) vce.getNewValue());
        }

        if ("soc4".equals(source)) {
            setDiagramLayout((String) vce.getNewValue());
        }

        createGraph();

        if (getDn1() != null)
            getDn1().setSelectedRowKeys(getSelectedRows());
    }

    public void setPgl1(RichPanelGroupLayout pgl1) {
        this.pgl1 = pgl1;
    }

    public RichPanelGroupLayout getPgl1() {
        return pgl1;
    }

    public void setPfl1(RichPanelFormLayout pfl1) {
        this.pfl1 = pfl1;
    }

    public RichPanelFormLayout getPfl1() {
        return pfl1;
    }


    public void setIt3(RichInputText it3) {
        this.it3 = it3;
    }

    public RichInputText getIt3() {
        return it3;
    }

    public void setPs3(RichPanelSplitter ps3) {
        this.ps3 = ps3;
    }

    public RichPanelSplitter getPs3() {
        return ps3;
    }

    public void setS1(RichSpacer s1) {
        this.s1 = s1;
    }

    public RichSpacer getS1() {
        return s1;
    }

    public void setPfl2(RichPanelFormLayout pfl2) {
        this.pfl2 = pfl2;
    }

    public RichPanelFormLayout getPfl2() {
        return pfl2;
    }

    public void setS2(RichSeparator s2) {
        this.s2 = s2;
    }

    public RichSeparator getS2() {
        return s2;
    }

    public void setS3(RichSpacer s3) {
        this.s3 = s3;
    }

    public RichSpacer getS3() {
        return s3;
    }

    public void setSmc1(RichSelectManyChoice smc1) {
        this.smc1 = smc1;
    }

    public RichSelectManyChoice getSmc1() {
        return smc1;
    }

    public void setSi1(UISelectItems si1) {
        this.si1 = si1;
    }

    public UISelectItems getSi1() {
        return si1;
    }

    public void setSoc1(RichSelectOneChoice soc1) {
        this.soc1 = soc1;
    }

    public RichSelectOneChoice getSoc1() {
        return soc1;
    }

    public void setSi7(RichSelectItem si7) {
        this.si7 = si7;
    }

    public RichSelectItem getSi7() {
        return si7;
    }

    public void setSi2(RichSelectItem si2) {
        this.si2 = si2;
    }

    public RichSelectItem getSi2() {
        return si2;
    }

    public void setSi3(RichSelectItem si3) {
        this.si3 = si3;
    }

    public RichSelectItem getSi3() {
        return si3;
    }

    public void setSi4(RichSelectItem si4) {
        this.si4 = si4;
    }

    public RichSelectItem getSi4() {
        return si4;
    }

    public void setSi5(RichSelectItem si5) {
        this.si5 = si5;
    }

    public RichSelectItem getSi5() {
        return si5;
    }

    public void setSi6(RichSelectItem si6) {
        this.si6 = si6;
    }

    public RichSelectItem getSi6() {
        return si6;
    }

    public void setSoc2(RichSelectOneChoice soc2) {
        this.soc2 = soc2;
    }

    public RichSelectOneChoice getSoc2() {
        return soc2;
    }


    public void setPa2(RichPanelAccordion pa2) {
        this.pa2 = pa2;
    }

    public RichPanelAccordion getPa2() {
        return pa2;
    }

    public void setSdi2(RichShowDetailItem sdi2) {
        this.sdi2 = sdi2;
    }

    public RichShowDetailItem getSdi2() {
        return sdi2;
    }

    public void setPa3(RichPanelAccordion pa3) {
        this.pa3 = pa3;
    }

    public RichPanelAccordion getPa3() {
        return pa3;
    }

    public void setSdi3(RichShowDetailItem sdi3) {
        this.sdi3 = sdi3;
    }

    public RichShowDetailItem getSdi3() {
        return sdi3;
    }

    public void setSoc3(RichSelectOneChoice soc3) {
        this.soc3 = soc3;
    }

    public RichSelectOneChoice getSoc3() {
        return soc3;
    }

    public void setDiagramLayout(String diagramLayout) {
        this.diagramLayout = diagramLayout;
    }

    public String getDiagramLayout() {
        return diagramLayout;
    }

    public void setSoc4(RichSelectOneChoice soc4) {
        this.soc4 = soc4;
    }

    public RichSelectOneChoice getSoc4() {
        return soc4;
    }

    public void setSi9(RichSelectItem si9) {
        this.si9 = si9;
    }

    public RichSelectItem getSi9() {
        return si9;
    }

    public void setI1(RichImage i1) {
        this.i1 = i1;
    }

    public RichImage getI1() {
        return i1;
    }

    public void nodeListener(ActionEvent actionEvent) {
        UIDiagramNodes nodes = (UIDiagramNodes) actionEvent.getComponent();
        DiagramGraphNode node = (DiagramGraphNode) nodes.getCurrentRowData();
        System.out.println(nodes.getRowData() + "," + nodes.getRowCount() + "," + node);
        System.out.println(nodes.getSelectedRowKeys());

        if (node != null) {
            setPartyId(node.getId());
        }
    }

    public void onSelection(org.apache.myfaces.trinidad.event.SelectionEvent event) {
        int index = -1;
        Iterator itr = event.getAddedSet().iterator();
        UIDiagramNodes nodes = (UIDiagramNodes) event.getComponent();

        while (itr.hasNext())
            index = (Integer) itr.next();

        if (index > -1 && index < nodes.getRowCount()) {

            DiagramGraphNode node = (DiagramGraphNode) nodes.getRowData(index);
            if (node != null) {
                setPartyId(node.getId());
                getPartyGraph().clear();
                createGraph();
                nodes.setSelectedRowKeys(getSelectedRows());
            }

        }

    }

    public void nodeListener(RowDisclosureEvent rowDisclosureEvent) {
        System.out.println("Row Disclosed - " + rowDisclosureEvent.getComponent());
    }

    public RowKeySet getSelectedRows() {
        RowKeySet selectedNodes = new RowKeySetImpl();
        selectedNodes.add(0);
        selectedNodes =
            getPartyGraph() != null ?
            (getPartyGraph().getRootNode() != null ? (RowKeySet) getPartyGraph().getRootNode().get("selectedRowKeys") :
             selectedNodes) : selectedNodes;
        System.out.println(selectedNodes);
        return selectedNodes;
    }

    public void setP1(RichPopup p1) {
        this.p1 = p1;
    }

    public RichPopup getP1() {
        return p1;
    }

    public void setBindings(DCBindingContainer bindings) {
        this.bindings = bindings;
    }

    public void setDianp(RichPopup dianp) {
        this.dianp = dianp;
    }

    public RichPopup getDianp() {
        return dianp;
    }

    public void setOl1(RichOutputLabel ol1) {
        this.ol1 = ol1;
    }

    public RichOutputLabel getOl1() {
        return ol1;
    }

    public void setOf1(RichOutputFormatted of1) {
        this.of1 = of1;
    }

    public RichOutputFormatted getOf1() {
        return of1;
    }

    public void setOf2(RichOutputFormatted of2) {
        this.of2 = of2;
    }

    public RichOutputFormatted getOf2() {
        return of2;
    }

    public void setOf3(RichOutputFormatted of3) {
        this.of3 = of3;
    }

    public RichOutputFormatted getOf3() {
        return of3;
    }
}
