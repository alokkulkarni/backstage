package com.example.{{ values.name | replace('-', '') }}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * 
 * This configuration sets up comprehensive API documentation with
 * proper metadata, contact information, and server details.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:{{ values.name }}}")
    private String applicationName;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * Configure OpenAPI documentation.
     * 
     * @return OpenAPI configuration
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title(applicationName + " API")
                .description("{{ values.description }}")
                .version("1.0.0")
                .contact(new Contact()
                    .name("{{ values.owner }}")
                    .email("{{ values.owner }}@example.com")
                    .url("https://github.com/your-org/{{ values.name }}"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0")))
            .servers(List.of(
                new Server()
                    .url("http://localhost:" + serverPort)
                    .description("Local Development Server"),
                new Server()
                    .url("https://api-dev.example.com")
                    .description("Development Environment"),
                new Server()
                    .url("https://api-staging.example.com")
                    .description("Staging Environment"),
                new Server()
                    .url("https://api.example.com")
                    .description("Production Environment")
            ));
    }
}
