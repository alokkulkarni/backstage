package com.example.{{ values.name | replace('-', '') }};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application class for {{ values.name }}.
 * 
 * This application provides a comprehensive microservice template with:
 * - RESTful API endpoints
 * - Database integration with JPA
 * - Caching support
 * - Security configuration
 * - Monitoring and health checks
 * - API documentation with OpenAPI/Swagger
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 * @since 1.0.0
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableJpaAuditing
@ConfigurationPropertiesScan
public class {{ values.name | replace('-', '') | title }}Application {

    /**
     * Main method to start the Spring Boot application.
     * 
     * @param args command line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run({{ values.name | replace('-', '') | title }}Application.class, args);
    }
}
