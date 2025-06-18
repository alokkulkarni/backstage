package com.example.{{ values.name | replace('-', '') }}.service.impl;

import com.example.{{ values.name | replace('-', '') }}.dto.UserDTO;
import com.example.{{ values.name | replace('-', '') }}.entity.Role;
import com.example.{{ values.name | replace('-', '') }}.entity.User;
import com.example.{{ values.name | replace('-', '') }}.repository.RoleRepository;
import com.example.{{ values.name | replace('-', '') }}.repository.UserRepository;
import com.example.{{ values.name | replace('-', '') }}.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import javax.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementation of UserService interface.
 * 
 * This service implements all user-related business logic operations,
 * including user management, authentication, and authorization.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, 
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDTO.UserResponse createUser(UserDTO.CreateUserRequest request) {
        logger.debug("Creating user with username: {}", request.username());

        // Validate unique constraints
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Username already exists: " + request.username());
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }

        // Create user entity
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setBio(request.bio());

        // Assign roles
        if (request.roleNames() != null && !request.roleNames().isEmpty()) {
            Set<Role> roles = request.roleNames().stream()
                .map(roleName -> roleRepository.findByNameIgnoreCase(roleName)
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName)))
                .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        User savedUser = userRepository.save(user);
        logger.info("User created successfully with ID: {}", savedUser.getId());

        return convertToUserResponse(savedUser);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public UserDTO.UserResponse updateUser(Long id, UserDTO.UpdateUserRequest request) {
        logger.debug("Updating user with ID: {}", id);

        User user = getUserEntityById(id);

        // Update fields if provided
        if (request.email() != null) {
            // Check if email is already taken by another user
            userRepository.findByEmailIgnoreCase(request.email())
                .filter(existingUser -> !existingUser.getId().equals(id))
                .ifPresent(existingUser -> {
                    throw new IllegalArgumentException("Email already exists: " + request.email());
                });
            user.setEmail(request.email());
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }

        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }

        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }

        if (request.bio() != null) {
            user.setBio(request.bio());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        User savedUser = userRepository.save(user);
        logger.info("User updated successfully with ID: {}", savedUser.getId());

        return convertToUserResponse(savedUser);
    }

    @Override
    @Cacheable(value = "users", key = "#id")
    @Transactional(readOnly = true)
    public UserDTO.UserResponse getUserById(Long id) {
        logger.debug("Getting user by ID: {}", id);
        User user = getUserEntityById(id);
        return convertToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO.UserResponse getUserByUsername(String username) {
        logger.debug("Getting user by username: {}", username);
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
        return convertToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO.UserResponse getUserByEmail(String email) {
        logger.debug("Getting user by email: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return convertToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO.UserResponse> getAllUsers(Pageable pageable) {
        logger.debug("Getting all users with pagination: {}", pageable);
        Page<User> users = userRepository.findAll(pageable);
        return users.map(this::convertToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO.UserResponse> searchUsers(UserDTO.UserSearchFilter filter, Pageable pageable) {
        logger.debug("Searching users with filter: {}", filter);

        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.searchTerm() != null && !filter.searchTerm().trim().isEmpty()) {
                String searchPattern = "%" + filter.searchTerm().toLowerCase() + "%";
                Predicate searchPredicate = criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            if (filter.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), User.UserStatus.valueOf(filter.status())));
            }

            if (filter.emailVerified() != null) {
                predicates.add(criteriaBuilder.equal(root.get("emailVerified"), filter.emailVerified()));
            }

            if (filter.accountLocked() != null) {
                predicates.add(criteriaBuilder.equal(root.get("accountLocked"), filter.accountLocked()));
            }

            if (filter.createdAfter() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.createdAfter()));
            }

            if (filter.createdBefore() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.createdBefore()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(this::convertToUserResponse);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        logger.debug("Deleting user with ID: {}", id);
        
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with ID: " + id);
        }

        userRepository.deleteById(id);
        logger.info("User deleted successfully with ID: {}", id);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public void changePassword(Long id, UserDTO.ChangePasswordRequest request) {
        logger.debug("Changing password for user ID: {}", id);

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }

        User user = getUserEntityById(id);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        
        logger.info("Password changed successfully for user ID: {}", id);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public void lockUser(Long id) {
        logger.debug("Locking user with ID: {}", id);
        
        User user = getUserEntityById(id);
        user.lockAccount();
        userRepository.save(user);
        
        logger.info("User locked successfully with ID: {}", id);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public void unlockUser(Long id) {
        logger.debug("Unlocking user with ID: {}", id);
        
        User user = getUserEntityById(id);
        user.unlockAccount();
        userRepository.save(user);
        
        logger.info("User unlocked successfully with ID: {}", id);
    }

    @Override
    @CacheEvict(value = "users", key = "#id")
    public void verifyEmail(Long id) {
        logger.debug("Verifying email for user ID: {}", id);
        
        User user = getUserEntityById(id);
        user.setEmailVerified(true);
        userRepository.save(user);
        
        logger.info("Email verified successfully for user ID: {}", id);
    }

    @Override
    @CacheEvict(value = "users", key = "#userId")
    public void addRoleToUser(Long userId, String roleName) {
        logger.debug("Adding role {} to user ID: {}", roleName, userId);

        User user = getUserEntityById(userId);
        Role role = roleRepository.findByNameIgnoreCase(roleName)
            .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        user.addRole(role);
        userRepository.save(user);

        logger.info("Role {} added to user ID: {}", roleName, userId);
    }

    @Override
    @CacheEvict(value = "users", key = "#userId")
    public void removeRoleFromUser(Long userId, String roleName) {
        logger.debug("Removing role {} from user ID: {}", roleName, userId);

        User user = getUserEntityById(userId);
        Role role = roleRepository.findByNameIgnoreCase(roleName)
            .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        user.removeRole(role);
        userRepository.save(user);

        logger.info("Role {} removed from user ID: {}", roleName, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsernameIgnoreCase(username);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserEntityById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findUserEntityByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }

    /**
     * Convert User entity to UserResponse DTO.
     * 
     * @param user user entity
     * @return user response DTO
     */
    private UserDTO.UserResponse convertToUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(permission -> permission.getName())
            .collect(Collectors.toSet());

        return new UserDTO.UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getPhoneNumber(),
            user.getBio(),
            user.getAvatarUrl(),
            user.getStatus().name(),
            user.getEmailVerified(),
            user.getAccountLocked(),
            user.getFailedLoginAttempts(),
            roleNames,
            permissions,
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
