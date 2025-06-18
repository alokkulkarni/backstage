package com.example.{{ values.name | replace('-', '') }}.repository;

import com.example.{{ values.name | replace('-', '') }}.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity.
 * 
 * This repository provides data access methods for User entities,
 * including custom queries for business operations.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /**
     * Find a user by username (case-insensitive).
     * 
     * @param username the username to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByUsernameIgnoreCase(String username);

    /**
     * Find a user by email (case-insensitive).
     * 
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Find a user by username or email (case-insensitive).
     * 
     * @param username the username to search for
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    /**
     * Check if a username exists (case-insensitive).
     * 
     * @param username the username to check
     * @return true if the username exists
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * Check if an email exists (case-insensitive).
     * 
     * @param email the email to check
     * @return true if the email exists
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Find users by status.
     * 
     * @param status the user status
     * @param pageable pagination information
     * @return Page of users with the specified status
     */
    Page<User> findByStatus(User.UserStatus status, Pageable pageable);

    /**
     * Find users by role name.
     * 
     * @param roleName the role name
     * @param pageable pagination information
     * @return Page of users with the specified role
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Page<User> findByRoleName(@Param("roleName") String roleName, Pageable pageable);

    /**
     * Find users created after a specific date.
     * 
     * @param date the date threshold
     * @return List of users created after the date
     */
    List<User> findByCreatedAtAfter(Instant date);

    /**
     * Find users with failed login attempts greater than threshold.
     * 
     * @param threshold the threshold for failed attempts
     * @return List of users with high failed login attempts
     */
    List<User> findByFailedLoginAttemptsGreaterThan(Integer threshold);

    /**
     * Find locked users.
     * 
     * @return List of locked users
     */
    List<User> findByAccountLockedTrue();

    /**
     * Find users with unverified emails.
     * 
     * @return List of users with unverified emails
     */
    List<User> findByEmailVerifiedFalse();

    /**
     * Search users by name or username.
     * 
     * @param searchTerm the search term
     * @param pageable pagination information
     * @return Page of matching users
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Count users by status.
     * 
     * @param status the user status
     * @return count of users with the status
     */
    long countByStatus(User.UserStatus status);

    /**
     * Count users created today.
     * 
     * @param startOfDay start of the current day
     * @return count of users created today
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startOfDay")
    long countUsersCreatedToday(@Param("startOfDay") Instant startOfDay);

    /**
     * Find top active users by role.
     * 
     * @param roleName the role name
     * @param limit the maximum number of results
     * @return List of top active users
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.status = 'ACTIVE' ORDER BY u.createdAt DESC")
    List<User> findTopActiveUsersByRole(@Param("roleName") String roleName, org.springframework.data.domain.Pageable pageable);
}
