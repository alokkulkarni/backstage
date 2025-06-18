package com.example.{{ values.name | replace('-', '') }}.service;

import com.example.{{ values.name | replace('-', '') }}.dto.UserDTO;
import com.example.{{ values.name | replace('-', '') }}.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Service interface for User operations.
 * 
 * This interface defines the business logic operations for User entities,
 * providing a contract for user management functionality.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
public interface UserService {

    /**
     * Create a new user.
     * 
     * @param request user creation request
     * @return created user response
     * @throws IllegalArgumentException if username or email already exists
     */
    UserDTO.UserResponse createUser(UserDTO.CreateUserRequest request);

    /**
     * Update an existing user.
     * 
     * @param id user ID
     * @param request user update request
     * @return updated user response
     * @throws EntityNotFoundException if user not found
     */
    UserDTO.UserResponse updateUser(Long id, UserDTO.UpdateUserRequest request);

    /**
     * Get user by ID.
     * 
     * @param id user ID
     * @return user response
     * @throws EntityNotFoundException if user not found
     */
    UserDTO.UserResponse getUserById(Long id);

    /**
     * Get user by username.
     * 
     * @param username username
     * @return user response
     * @throws EntityNotFoundException if user not found
     */
    UserDTO.UserResponse getUserByUsername(String username);

    /**
     * Get user by email.
     * 
     * @param email email address
     * @return user response
     * @throws EntityNotFoundException if user not found
     */
    UserDTO.UserResponse getUserByEmail(String email);

    /**
     * Get all users with pagination.
     * 
     * @param pageable pagination parameters
     * @return page of user responses
     */
    Page<UserDTO.UserResponse> getAllUsers(Pageable pageable);

    /**
     * Search users with filters.
     * 
     * @param filter search filters
     * @param pageable pagination parameters
     * @return page of user responses
     */
    Page<UserDTO.UserResponse> searchUsers(UserDTO.UserSearchFilter filter, Pageable pageable);

    /**
     * Delete user by ID.
     * 
     * @param id user ID
     * @throws EntityNotFoundException if user not found
     */
    void deleteUser(Long id);

    /**
     * Change user password.
     * 
     * @param id user ID
     * @param request password change request
     * @throws EntityNotFoundException if user not found
     * @throws IllegalArgumentException if current password is incorrect
     */
    void changePassword(Long id, UserDTO.ChangePasswordRequest request);

    /**
     * Lock user account.
     * 
     * @param id user ID
     * @throws EntityNotFoundException if user not found
     */
    void lockUser(Long id);

    /**
     * Unlock user account.
     * 
     * @param id user ID
     * @throws EntityNotFoundException if user not found
     */
    void unlockUser(Long id);

    /**
     * Verify user email.
     * 
     * @param id user ID
     * @throws EntityNotFoundException if user not found
     */
    void verifyEmail(Long id);

    /**
     * Add role to user.
     * 
     * @param userId user ID
     * @param roleName role name
     * @throws EntityNotFoundException if user or role not found
     */
    void addRoleToUser(Long userId, String roleName);

    /**
     * Remove role from user.
     * 
     * @param userId user ID
     * @param roleName role name
     * @throws EntityNotFoundException if user or role not found
     */
    void removeRoleFromUser(Long userId, String roleName);

    /**
     * Check if username exists.
     * 
     * @param username username to check
     * @return true if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists.
     * 
     * @param email email to check
     * @return true if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Get user entity by ID (for internal use).
     * 
     * @param id user ID
     * @return user entity
     * @throws EntityNotFoundException if user not found
     */
    User getUserEntityById(Long id);

    /**
     * Find user entity by username (for internal use).
     * 
     * @param username username
     * @return optional user entity
     */
    Optional<User> findUserEntityByUsername(String username);
}
