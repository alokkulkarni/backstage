package com.example.{{ values.name | replace('-', '') }}.repository;

import com.example.{{ values.name | replace('-', '') }}.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Permission entity.
 * 
 * This repository provides data access methods for Permission entities,
 * including custom queries for permission management operations.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /**
     * Find a permission by name (case-insensitive).
     * 
     * @param name the permission name to search for
     * @return Optional containing the permission if found
     */
    Optional<Permission> findByNameIgnoreCase(String name);

    /**
     * Find permissions by resource.
     * 
     * @param resource the resource name
     * @return List of permissions for the resource
     */
    List<Permission> findByResourceIgnoreCase(String resource);

    /**
     * Find permissions by action.
     * 
     * @param action the action name
     * @return List of permissions for the action
     */
    List<Permission> findByActionIgnoreCase(String action);

    /**
     * Find permission by resource and action.
     * 
     * @param resource the resource name
     * @param action the action name
     * @return Optional containing the permission if found
     */
    Optional<Permission> findByResourceIgnoreCaseAndActionIgnoreCase(String resource, String action);

    /**
     * Check if a permission name exists (case-insensitive).
     * 
     * @param name the permission name to check
     * @return true if the permission name exists
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Find permissions by role ID.
     * 
     * @param roleId the role ID
     * @return List of permissions assigned to the role
     */
    @Query("SELECT p FROM Permission p JOIN p.roles r WHERE r.id = :roleId")
    List<Permission> findByRoleId(@Param("roleId") Long roleId);

    /**
     * Find permissions by user ID (through roles).
     * 
     * @param userId the user ID
     * @return List of permissions assigned to the user through roles
     */
    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.id = :userId")
    List<Permission> findByUserId(@Param("userId") Long userId);

    /**
     * Find all permissions grouped by resource.
     * 
     * @return List of permissions ordered by resource then action
     */
    List<Permission> findAllByOrderByResourceAscActionAsc();

    /**
     * Count permissions by resource.
     * 
     * @param resource the resource name
     * @return count of permissions for the resource
     */
    long countByResourceIgnoreCase(String resource);

    /**
     * Find permissions without roles.
     * 
     * @return List of permissions not assigned to any role
     */
    @Query("SELECT p FROM Permission p WHERE p.roles IS EMPTY")
    List<Permission> findPermissionsWithoutRoles();
}
