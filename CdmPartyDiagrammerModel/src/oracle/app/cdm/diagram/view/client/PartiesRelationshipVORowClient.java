package oracle.app.cdm.diagram.view.client;

import java.math.BigDecimal;

import oracle.jbo.client.remote.RowImpl;
// ---------------------------------------------------------------------
// ---    File generated by Oracle ADF Business Components Design Time.
// ---    Fri Dec 14 00:56:21 PST 2012
// ---    Custom code may be added to this class.
// ---    Warning: Do not modify method signatures of generated methods.
// ---------------------------------------------------------------------
public class PartiesRelationshipVORowClient extends RowImpl {
    /**
     * This is the default constructor (do not remove).
     */
    public PartiesRelationshipVORowClient() {
    }

    public Long getSubjectId() {
        return (Long) getAttribute("SubjectId");
    }

    public String getSubjectType() {
        return (String) getAttribute("SubjectType");
    }

    public String getSubjectPartyUniqueName() {
        return (String) getAttribute("SubjectPartyUniqueName");
    }

    public String getSubjectPartyName() {
        return (String) getAttribute("SubjectPartyName");
    }

    public String getRelationshipCode() {
        return (String) getAttribute("RelationshipCode");
    }

    public Long getObjectId() {
        return (Long) getAttribute("ObjectId");
    }

    public String getObjectType() {
        return (String) getAttribute("ObjectType");
    }

    public String getPObjectType() {
        return (String) getAttribute("PObjectType");
    }

    public String getObjectPartyUniqueName() {
        return (String) getAttribute("ObjectPartyUniqueName");
    }

    public String getObjectPartyName() {
        return (String) getAttribute("ObjectPartyName");
    }

    public BigDecimal getDepth() {
        return (BigDecimal) getAttribute("Depth");
    }
}

