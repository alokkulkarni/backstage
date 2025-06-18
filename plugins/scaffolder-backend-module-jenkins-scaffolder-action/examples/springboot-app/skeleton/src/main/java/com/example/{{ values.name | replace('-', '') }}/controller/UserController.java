package com.example.{{ values.name | replace('-', '') }}.controller;

import com.example.{{ values.name | replace('-', '') }}.dto.CommonDTO;
import com.example.{{ values.name | replace('-', '') }}.dto.UserDTO;
import com.example.{{ values.name | replace('-', '') }}.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;

/**
 * REST Controller for User management operations.
 * 
 * This controller provides RESTful endpoints for user-related operations
 * including CRUD operations, search, and user management functions.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management operations")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(
        summary = "Create a new user",
        description = "Creates a new user account with the provided information"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "User created successfully",
            content = @Content(schema = @Schema(implementation = UserDTO.UserResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input or user already exists",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<UserDTO.UserResponse>> createUser(
            @Valid @RequestBody UserDTO.CreateUserRequest request) {
        
        logger.info("Creating user with username: {}", request.username());
        
        UserDTO.UserResponse response = userService.createUser(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(CommonDTO.ApiResponse.success("User created successfully", response));
    }

    @Operation(
        summary = "Get user by ID",
        description = "Retrieves a user by their unique identifier"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(schema = @Schema(implementation = UserDTO.UserResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<CommonDTO.ApiResponse<UserDTO.UserResponse>> getUserById(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id) {
        
        logger.debug("Getting user by ID: {}", id);
        
        UserDTO.UserResponse response = userService.getUserById(id);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success(response));
    }

    @Operation(
        summary = "Get user by username",
        description = "Retrieves a user by their username"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(schema = @Schema(implementation = UserDTO.UserResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @GetMapping("/username/{username}")
    @PreAuthorize("hasRole('ADMIN') or #username == authentication.principal.username")
    public ResponseEntity<CommonDTO.ApiResponse<UserDTO.UserResponse>> getUserByUsername(
            @Parameter(description = "Username", required = true)
            @PathVariable String username) {
        
        logger.debug("Getting user by username: {}", username);
        
        UserDTO.UserResponse response = userService.getUserByUsername(username);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success(response));
    }

    @Operation(
        summary = "Get all users",
        description = "Retrieves a paginated list of all users"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(schema = @Schema(implementation = CommonDTO.PagedResponse.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<CommonDTO.PagedResponse<UserDTO.UserResponse>>> getAllUsers(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") @Min(1) int size,
            
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort direction")
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        logger.debug("Getting all users - page: {}, size: {}, sortBy: {}, sortDir: {}", 
                    page, size, sortBy, sortDir);
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<UserDTO.UserResponse> users = userService.getAllUsers(pageable);
        
        CommonDTO.PageInfo pageInfo = new CommonDTO.PageInfo(
            users.getNumber(),
            users.getSize(),
            users.getTotalElements(),
            users.getTotalPages(),
            users.isFirst(),
            users.isLast(),
            users.getNumberOfElements(),
            users.isEmpty()
        );
        
        CommonDTO.PagedResponse<UserDTO.UserResponse> response = 
            new CommonDTO.PagedResponse<>(users.getContent(), pageInfo);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success(response));
    }

    @Operation(
        summary = "Search users",
        description = "Search users with various filters and pagination"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Search completed successfully",
            content = @Content(schema = @Schema(implementation = CommonDTO.PagedResponse.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<CommonDTO.PagedResponse<UserDTO.UserResponse>>> searchUsers(
            @Parameter(description = "Search term")
            @RequestParam(required = false) String searchTerm,
            
            @Parameter(description = "User status filter")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Role name filter")
            @RequestParam(required = false) String roleName,
            
            @Parameter(description = "Email verified filter")
            @RequestParam(required = false) Boolean emailVerified,
            
            @Parameter(description = "Account locked filter")
            @RequestParam(required = false) Boolean accountLocked,
            
            @Parameter(description = "Created after timestamp")
            @RequestParam(required = false) Instant createdAfter,
            
            @Parameter(description = "Created before timestamp")
            @RequestParam(required = false) Instant createdBefore,
            
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") @Min(1) int size,
            
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort direction")
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        logger.debug("Searching users with term: {}, status: {}, page: {}", 
                    searchTerm, status, page);
        
        UserDTO.UserSearchFilter filter = new UserDTO.UserSearchFilter(
            searchTerm, status, roleName, emailVerified, accountLocked,
            createdAfter, createdBefore
        );
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<UserDTO.UserResponse> users = userService.searchUsers(filter, pageable);
        
        CommonDTO.PageInfo pageInfo = new CommonDTO.PageInfo(
            users.getNumber(),
            users.getSize(),
            users.getTotalElements(),
            users.getTotalPages(),
            users.isFirst(),
            users.isLast(),
            users.getNumberOfElements(),
            users.isEmpty()
        );
        
        CommonDTO.PagedResponse<UserDTO.UserResponse> response = 
            new CommonDTO.PagedResponse<>(users.getContent(), pageInfo);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success(response));
    }

    @Operation(
        summary = "Update user",
        description = "Updates an existing user's information"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User updated successfully",
            content = @Content(schema = @Schema(implementation = UserDTO.UserResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<CommonDTO.ApiResponse<UserDTO.UserResponse>> updateUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id,
            
            @Valid @RequestBody UserDTO.UpdateUserRequest request) {
        
        logger.info("Updating user with ID: {}", id);
        
        UserDTO.UserResponse response = userService.updateUser(id, request);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("User updated successfully", response));
    }

    @Operation(
        summary = "Delete user",
        description = "Deletes a user account"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "User deleted successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> deleteUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id) {
        
        logger.info("Deleting user with ID: {}", id);
        
        userService.deleteUser(id);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("User deleted successfully", null));
    }

    @Operation(
        summary = "Change user password",
        description = "Changes a user's password"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Password changed successfully"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid password or passwords don't match",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PostMapping("/{id}/change-password")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> changePassword(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id,
            
            @Valid @RequestBody UserDTO.ChangePasswordRequest request) {
        
        logger.info("Changing password for user ID: {}", id);
        
        userService.changePassword(id, request);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("Password changed successfully", null));
    }

    @Operation(
        summary = "Lock user account",
        description = "Locks a user account"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User account locked successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PostMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> lockUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id) {
        
        logger.info("Locking user account with ID: {}", id);
        
        userService.lockUser(id);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("User account locked successfully", null));
    }

    @Operation(
        summary = "Unlock user account",
        description = "Unlocks a user account"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User account unlocked successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> unlockUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id) {
        
        logger.info("Unlocking user account with ID: {}", id);
        
        userService.unlockUser(id);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("User account unlocked successfully", null));
    }

    @Operation(
        summary = "Add role to user",
        description = "Assigns a role to a user"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Role added successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User or role not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @PostMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> addRoleToUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id,
            
            @Parameter(description = "Role name", required = true)
            @PathVariable String roleName) {
        
        logger.info("Adding role {} to user ID: {}", roleName, id);
        
        userService.addRoleToUser(id, roleName);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("Role added successfully", null));
    }

    @Operation(
        summary = "Remove role from user",
        description = "Removes a role from a user"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Role removed successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User or role not found",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = CommonDTO.ErrorDetails.class))
        )
    })
    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonDTO.ApiResponse<Void>> removeRoleFromUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id,
            
            @Parameter(description = "Role name", required = true)
            @PathVariable String roleName) {
        
        logger.info("Removing role {} from user ID: {}", roleName, id);
        
        userService.removeRoleFromUser(id, roleName);
        
        return ResponseEntity.ok(CommonDTO.ApiResponse.success("Role removed successfully", null));
    }
}
