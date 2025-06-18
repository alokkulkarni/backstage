package com.example.{{ values.name | replace('-', '') }}.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;

/**
 * Common Data Transfer Objects used across the application.
 * 
 * This class contains shared DTOs for common operations like
 * API responses, pagination, error handling, etc.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
public class CommonDTO {

    /**
     * Generic API response wrapper.
     */
    @Schema(description = "Generic API response")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ApiResponse<T>(
        @Schema(description = "Response status", example = "success")
        String status,

        @Schema(description = "Response message", example = "Operation completed successfully")
        String message,

        @Schema(description = "Response data")
        T data,

        @Schema(description = "Error details")
        ErrorDetails error,

        @Schema(description = "Response timestamp")
        Instant timestamp,

        @Schema(description = "Request ID for tracking")
        String requestId
    ) {
        public static <T> ApiResponse<T> success(T data) {
            return new ApiResponse<>("success", "Operation completed successfully", data, null, Instant.now(), null);
        }

        public static <T> ApiResponse<T> success(String message, T data) {
            return new ApiResponse<>("success", message, data, null, Instant.now(), null);
        }

        public static <T> ApiResponse<T> error(String message, ErrorDetails error) {
            return new ApiResponse<>("error", message, null, error, Instant.now(), null);
        }

        public static <T> ApiResponse<T> error(String message) {
            return new ApiResponse<>("error", message, null, null, Instant.now(), null);
        }
    }

    /**
     * Error details for API responses.
     */
    @Schema(description = "Error details")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorDetails(
        @Schema(description = "Error code", example = "VALIDATION_ERROR")
        String code,

        @Schema(description = "Error message", example = "Invalid input provided")
        String message,

        @Schema(description = "Field-specific errors")
        Set<FieldError> fieldErrors,

        @Schema(description = "Additional error details")
        Object details
    ) {}

    /**
     * Field error for validation errors.
     */
    @Schema(description = "Field validation error")
    public record FieldError(
        @Schema(description = "Field name", example = "email")
        String field,

        @Schema(description = "Rejected value", example = "invalid-email")
        Object rejectedValue,

        @Schema(description = "Error message", example = "Email must be valid")
        String message
    ) {}

    /**
     * Paginated response wrapper.
     */
    @Schema(description = "Paginated response")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PagedResponse<T>(
        @Schema(description = "Response data")
        java.util.List<T> content,

        @Schema(description = "Page information")
        PageInfo page
    ) {}

    /**
     * Page information for paginated responses.
     */
    @Schema(description = "Page information")
    public record PageInfo(
        @Schema(description = "Current page number (0-based)", example = "0")
        int number,

        @Schema(description = "Page size", example = "20")
        int size,

        @Schema(description = "Total number of elements", example = "100")
        long totalElements,

        @Schema(description = "Total number of pages", example = "5")
        int totalPages,

        @Schema(description = "Is first page", example = "true")
        boolean first,

        @Schema(description = "Is last page", example = "false")
        boolean last,

        @Schema(description = "Number of elements in current page", example = "20")
        int numberOfElements,

        @Schema(description = "Is empty page", example = "false")
        boolean empty
    ) {}

    /**
     * Health check response.
     */
    @Schema(description = "Health check response")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record HealthCheckResponse(
        @Schema(description = "Overall status", example = "UP")
        String status,

        @Schema(description = "Service details")
        java.util.Map<String, ServiceHealth> services,

        @Schema(description = "Check timestamp")
        Instant timestamp,

        @Schema(description = "Application version", example = "1.0.0")
        String version,

        @Schema(description = "Environment", example = "production")
        String environment
    ) {}

    /**
     * Individual service health status.
     */
    @Schema(description = "Service health status")
    public record ServiceHealth(
        @Schema(description = "Service status", example = "UP")
        String status,

        @Schema(description = "Service details")
        java.util.Map<String, Object> details,

        @Schema(description = "Response time in milliseconds", example = "25")
        Long responseTime
    ) {}

    /**
     * Request for batch operations.
     */
    @Schema(description = "Batch operation request")
    public record BatchRequest<T>(
        @Schema(description = "Operation type", example = "DELETE")
        String operation,

        @Schema(description = "Items to process")
        java.util.List<T> items,

        @Schema(description = "Batch options")
        java.util.Map<String, Object> options
    ) {}

    /**
     * Response for batch operations.
     */
    @Schema(description = "Batch operation response")
    public record BatchResponse<T>(
        @Schema(description = "Operation type", example = "DELETE")
        String operation,

        @Schema(description = "Total items processed", example = "10")
        int totalItems,

        @Schema(description = "Successfully processed items", example = "8")
        int successCount,

        @Schema(description = "Failed items", example = "2")
        int failureCount,

        @Schema(description = "Processing results")
        java.util.List<BatchItemResult<T>> results,

        @Schema(description = "Processing timestamp")
        Instant timestamp
    ) {}

    /**
     * Result for individual batch operation item.
     */
    @Schema(description = "Batch item result")
    public record BatchItemResult<T>(
        @Schema(description = "Item that was processed")
        T item,

        @Schema(description = "Processing status", example = "SUCCESS")
        String status,

        @Schema(description = "Error message if failed")
        String errorMessage
    ) {}

    /**
     * Search request with filters and sorting.
     */
    @Schema(description = "Search request")
    public record SearchRequest(
        @Schema(description = "Search query")
        String query,

        @Schema(description = "Search filters")
        java.util.Map<String, Object> filters,

        @Schema(description = "Sort criteria")
        java.util.List<SortCriteria> sort,

        @Schema(description = "Page number (0-based)", example = "0")
        int page,

        @Schema(description = "Page size", example = "20")
        int size
    ) {}

    /**
     * Sort criteria for search requests.
     */
    @Schema(description = "Sort criteria")
    public record SortCriteria(
        @Schema(description = "Field to sort by", example = "createdAt")
        String field,

        @Schema(description = "Sort direction", example = "DESC")
        String direction
    ) {}
}
