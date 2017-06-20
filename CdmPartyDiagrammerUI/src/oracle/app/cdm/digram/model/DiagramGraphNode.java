package oracle.app.cdm.digram.model;

import java.io.Serializable;

import java.util.HashMap;
import java.util.Map;

public class DiagramGraphNode implements Serializable, Comparable<DiagramGraphNode> {

    @SuppressWarnings("compatibility:4612722756330266857")
    private static final long serialVersionUID = 2132150440162383636L;

    private final long id;
    private String label;
    private final String type;
    private final transient Map<String, Object> attributes;

    public DiagramGraphNode(long id, String label, String type) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.attributes = new HashMap<String, Object>();
    }

    public Long getId() {
        return id;
    }

    public String getIdentifier() {
        return "Node : " + getId();
    }

    void setLabel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label.trim();
    }

    public String getType() {
        return type.trim();
    }

    public void set(String attribute, Object value) {
        attributes.put(attribute, value);
    }

    public Object get(String attribute) {
        return attributes.get(attribute);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        DiagramGraphNode other = (DiagramGraphNode) obj;
        if (getId() == null) {
            if (other.getId() != null)
                return false;
        } else if (!getId().equals(other.getId()))
            return false;
        return true;

    }

    @Override
    public int hashCode() {
        final int seed = 71;
        int re = 1;
        re = seed * re + ((getId() == null) ? 0 : getId().hashCode());
        return re;
    }

    @Override
    public String toString() {
        return "{id : " + getId() + ", label : " + getLabel() + ", type : " + getType() + ", hash : " + hashCode() +
               "}";
    }


    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public int compareTo(DiagramGraphNode o) {
        Long curr = getId();
        Long cmp = o.getId();
        return curr.compareTo(cmp);
    }
}
