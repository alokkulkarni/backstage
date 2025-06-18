package com.example.{{ values.name | replace('-', '') }}.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;

/**
 * Data Transfer Objects for User entity.
 * 
 * This class contains all DTOs related to User operations,
 * including creation, update, and response DTOs.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
public class UserDTO {

    /**
     * DTO for user creation requests.
     */
    @Schema(description = "User creation request")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CreateUserRequest(
        @Schema(description = "Username", example = "john_doe", required = true)
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
        String username,

        @Schema(description = "Email address", example = "john.doe@example.com", required = true)
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @Schema(description = "Password", example = "SecurePassword123!", required = true)
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
        String password,

        @Schema(description = "First name", example = "John", required = true)
        @NotBlank(message = "First name is required")
        @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
        String firstName,

        @Schema(description = "Last name", example = "Doe", required = true)
        @NotBlank(message = "Last name is required")
        @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
        String lastName,

        @Schema(description = "Phone number", example = "+1-555-123-4567")
        @Size(max = 20, message = "Phone number must not exceed 20 characters")
        String phoneNumber,

        @Schema(description = "Bio/Description", example = "Software developer with 5 years of experience")
        @Size(max = 500, message = "Bio must not exceed 500 characters")
        String bio,

        @Schema(description = "Role names to assign", example = "[\"USER\", \"DEVELOPER\"]")
        Set<String> roleNames
    ) {}

    /**
     * DTO for user update requests.
     */
    @Schema(description = "User update request")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UpdateUserRequest(
        @Schema(description = "Email address", example = "john.doe@example.com")
        @Email(message = "Email must be valid")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @Schema(description = "First name", example = "John")
        @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
        String firstName,

        @Schema(description = "Last name", example = "Doe")
        @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
        String lastName,

        @Schema(description = "Phone number", example = "+1-555-123-4567")
        @Size(max = 20, message = "Phone number must not exceed 20 characters")
        String phoneNumber,

        @Schema(description = "Bio/Description", example = "Senior software developer")
        @Size(max = 500, message = "Bio must not exceed 500 characters")
        String bio,

        @Schema(description = "Avatar URL", example = "https://example.com/avatar.jpg")
        @Size(max = 255, message = "Avatar URL must not exceed 255 characters")
        String avatarUrl
    ) {}

    /**
     * DTO for password change requests.
     */
    @Schema(description = "Password change request")
    public record ChangePasswordRequest(
        @Schema(description = "Current password", required = true)
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @Schema(description = "New password", required = true)
        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 50, message = "New password must be between 8 and 50 characters")
        String newPassword,

        @Schema(description = "Confirm new password", required = true)
        @NotBlank(message = "Password confirmation is required")
        String confirmPassword
    ) {}

    /**
     * DTO for user response.
     */
    @Schema(description = "User response")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserResponse(
        @Schema(description = "User ID", example = "1")
        Long id,

        @Schema(description = "Username", example = "john_doe")
        String username,

        @Schema(description = "Email address", example = "john.doe@example.com")
        String email,

        @Schema(description = "First name", example = "John")
        String firstName,

        @Schema(description = "Last name", example = "Doe")
        String lastName,

        @Schema(description = "Full name", example = "John Doe")
        String fullName,

        @Schema(description = "Phone number", example = "+1-555-123-4567")
        String phoneNumber,

        @Schema(description = "Bio/Description")
        String bio,

        @Schema(description = "Avatar URL")
        String avatarUrl,

        @Schema(description = "User status", example = "ACTIVE")
        String status,

        @Schema(description = "Email verified", example = "true")
        Boolean emailVerified,

        @Schema(description = "Account locked", example = "false")
        Boolean accountLocked,

        @Schema(description = "Failed login attempts", example = "0")
        Integer failedLoginAttempts,

        @Schema(description = "User roles")
        Set<String> roles,

        @Schema(description = "User permissions")
        Set<String> permissions,

        @Schema(description = "Creation timestamp")
        Instant createdAt,

        @Schema(description = "Last update timestamp")
        Instant updatedAt
    ) {}

    /**
     * DTO for user summary (lightweight response).
     */
    @Schema(description = "User summary")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserSummary(
        @Schema(description = "User ID", example = "1")
        Long id,

        @Schema(description = "Username", example = "john_doe")
        String username,

        @Schema(description = "Full name", example = "John Doe")
        String fullName,

        @Schema(description = "Email address", example = "john.doe@example.com")
        String email,

        @Schema(description = "User status", example = "ACTIVE")
        String status,

        @Schema(description = "Avatar URL")
        String avatarUrl,

        @Schema(description = "Creation timestamp")
        Instant createdAt
    ) {}

    /**
     * DTO for user search filters.
     */
    @Schema(description = "User search filters")
    public record UserSearchFilter(
        @Schema(description = "Search term for name, username, or email")
        String searchTerm,

        @Schema(description = "User status filter")
        String status,

        @Schema(description = "Role name filter")
        String roleName,

        @Schema(description = "Email verified filter")
        Boolean emailVerified,

        @Schema(description = "Account locked filter")
        Boolean accountLocked,

        @Schema(description = "Created after date")
        Instant createdAfter,

        @Schema(description = "Created before date")
        Instant createdBefore
    ) {}
}
