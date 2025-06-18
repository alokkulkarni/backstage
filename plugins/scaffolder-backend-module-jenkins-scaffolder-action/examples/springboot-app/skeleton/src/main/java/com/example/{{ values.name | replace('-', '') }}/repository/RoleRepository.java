package com.example.{{ values.name | replace('-', '') }}.repository;

import com.example.{{ values.name | replace('-', '') }}.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Role entity.
 * 
 * This repository provides data access methods for Role entities,
 * including custom queries for role management operations.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Find a role by name (case-insensitive).
     * 
     * @param name the role name to search for
     * @return Optional containing the role if found
     */
    Optional<Role> findByNameIgnoreCase(String name);

    /**
     * Check if a role name exists (case-insensitive).
     * 
     * @param name the role name to check
     * @return true if the role name exists
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Find roles by user ID.
     * 
     * @param userId the user ID
     * @return List of roles assigned to the user
     */
    @Query("SELECT r FROM Role r JOIN r.users u WHERE u.id = :userId")
    List<Role> findByUserId(@Param("userId") Long userId);

    /**
     * Find roles with specific permission.
     * 
     * @param permissionName the permission name
     * @return List of roles with the permission
     */
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.name = :permissionName")
    List<Role> findByPermissionName(@Param("permissionName") String permissionName);

    /**
     * Find all roles ordered by name.
     * 
     * @return List of all roles ordered by name
     */
    List<Role> findAllByOrderByNameAsc();

    /**
     * Count roles with users.
     * 
     * @return count of roles that have users assigned
     */
    @Query("SELECT COUNT(DISTINCT r) FROM Role r JOIN r.users u")
    long countRolesWithUsers();

    /**
     * Find roles without users.
     * 
     * @return List of roles without any users assigned
     */
    @Query("SELECT r FROM Role r WHERE r.users IS EMPTY")
    List<Role> findRolesWithoutUsers();
}
