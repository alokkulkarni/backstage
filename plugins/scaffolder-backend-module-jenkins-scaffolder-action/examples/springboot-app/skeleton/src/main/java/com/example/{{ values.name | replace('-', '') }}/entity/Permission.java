package com.example.{{ values.name | replace('-', '') }}.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Permission entity representing specific permissions in the system.
 * 
 * This entity defines granular permissions that can be assigned to roles,
 * enabling fine-grained access control.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Entity
@Table(name = "permissions", indexes = {
    @Index(name = "idx_permission_name", columnList = "name"),
    @Index(name = "idx_permission_resource", columnList = "resource")
})
public class Permission extends BaseEntity {

    @NotBlank
    @Size(min = 2, max = 100)
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @NotBlank
    @Size(min = 2, max = 50)
    @Column(name = "resource", nullable = false, length = 50)
    private String resource;

    @NotBlank
    @Size(min = 2, max = 50)
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    private Set<Role> roles = new HashSet<>();

    // Constructors
    public Permission() {
        super();
    }

    public Permission(String name, String resource, String action) {
        this();
        this.name = name;
        this.resource = resource;
        this.action = action;
    }

    public Permission(String name, String description, String resource, String action) {
        this(name, resource, action);
        this.description = description;
    }

    // Business methods
    public String getFullPermissionName() {
        return resource + ":" + action;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        Permission that = (Permission) o;
        return Objects.equals(name, that.name) &&
               Objects.equals(resource, that.resource) &&
               Objects.equals(action, that.action);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), name, resource, action);
    }

    // toString
    @Override
    public String toString() {
        return "Permission{" +
               "id=" + getId() +
               ", name='" + name + '\'' +
               ", resource='" + resource + '\'' +
               ", action='" + action + '\'' +
               ", description='" + description + '\'' +
               '}';
    }
}
