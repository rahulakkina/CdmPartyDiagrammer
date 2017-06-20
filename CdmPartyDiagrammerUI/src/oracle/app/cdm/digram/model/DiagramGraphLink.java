package oracle.app.cdm.digram.model;

import java.io.Serializable;

import java.util.HashMap;
import java.util.Map;


public class DiagramGraphLink implements Serializable, Comparable<DiagramGraphLink> {

    @SuppressWarnings({ "compatibility:4955371897787437687", "oracle.jdeveloper.java.serialversionuid-stale" })
    private static final long serialVersionUID = 8930114736727619301L;

    private final DiagramGraphNode from;
    private final DiagramGraphNode to;
    private String label;
    private final transient Map<String, Object> attributes;

    public DiagramGraphLink(DiagramGraphNode from, DiagramGraphNode to, String label) {
        this.from = from;
        this.to = to;
        this.label = label;
        this.attributes = new HashMap<String, Object>();
    }


    public DiagramGraphNode getFrom() {
        return from;
    }

    public DiagramGraphNode getTo() {
        return to;
    }


    public void setLabel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        DiagramGraphLink other = (DiagramGraphLink) obj;
        if (getTo() == null) {
            if (other.getTo() != null)
                return false;
        } else if (!getTo().equals(other.getTo()))
            return false;
        if (getLabel() == null) {
            if (other.getLabel() != null)
                return false;
        } else if (!getLabel().equals(other.getLabel()))
            return false;
        if (getFrom() == null) {
            if (other.getFrom() != null)
                return false;
        } else if (!getFrom().equals(other.getFrom()))
            return false;

        return true;
    }

    @Override
    public int hashCode() {
        final int prime = 71;
        int result = 1;
        result = prime * result + ((getTo() == null) ? 0 : getTo().hashCode());
        result = prime * result + ((getFrom() == null) ? 0 : getFrom().hashCode());
        result = prime * result + ((getLabel() == null) ? 0 : getLabel().hashCode());
        return result;
    }

    public void set(String attribute, Object value) {
        attributes.put(attribute, value);
    }

    public Object get(String attribute) {
        return attributes.get(attribute);
    }


    @Override
    public String toString() {
        return "{" + getFrom().getId() + "," + getLabel() + "," + getTo().getId() + "}";
    }

    @Override
    public int compareTo(DiagramGraphLink o) {
        long curr = getFrom().getId() - o.getFrom().getId();
        long cmp = getTo().getId() - o.getTo().getId();

        if (curr == 0 && cmp == 0)
            return 0;
        else
            return (int) (curr + cmp);
    }
}
