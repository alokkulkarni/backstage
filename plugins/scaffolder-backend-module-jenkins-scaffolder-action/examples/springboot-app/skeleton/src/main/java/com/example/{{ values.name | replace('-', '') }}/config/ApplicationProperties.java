package com.example.{{ values.name | replace('-', '') }}.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

/**
 * Application configuration properties.
 * 
 * This class holds all the custom configuration properties for the application,
 * providing type-safe configuration with validation.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@ConfigurationProperties(prefix = "app")
@Validated
public record ApplicationProperties(
    
    /**
     * Application information.
     */
    @NotNull
    Info info,
    
    /**
     * Security configuration.
     */
    @NotNull
    Security security,
    
    /**
     * Cache configuration.
     */
    @NotNull
    Cache cache,
    
    /**
     * API configuration.
     */
    @NotNull
    Api api
) {
    
    /**
     * Application information properties.
     */
    public record Info(
        @NotBlank String name,
        @NotBlank String version,
        @NotBlank String description,
        @NotBlank String contact
    ) {}
    
    /**
     * Security configuration properties.
     */
    public record Security(
        @NotBlank String jwtSecret,
        @Positive long jwtExpiration,
        boolean enableCors,
        String[] allowedOrigins
    ) {}
    
    /**
     * Cache configuration properties.
     */
    public record Cache(
        @Positive int defaultTtlMinutes,
        @Positive int maxEntriesLocalHeap,
        boolean enableDistributedCache
    ) {}
    
    /**
     * API configuration properties.
     */
    public record Api(
        @NotBlank String basePath,
        @NotBlank String version,
        @Positive int maxPageSize,
        @Positive int defaultPageSize
    ) {}
}
