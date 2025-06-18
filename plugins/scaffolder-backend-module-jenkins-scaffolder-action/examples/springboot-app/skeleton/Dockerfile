# Multi-stage Docker build for Spring Boot application
# Stage 1: Build stage
FROM maven:3.9-openjdk-${{ values.javaVersion }}-slim AS build

LABEL maintainer="${{ values.owner }}"
LABEL description="Build stage for ${{ values.name }}"

# Set working directory
WORKDIR /app

# Copy Maven configuration files first (for better layer caching)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Verify the JAR file was created
RUN ls -la target/

# Stage 2: Runtime stage
FROM ${{ values.baseImage }} AS runtime

LABEL maintainer="${{ values.owner }}"
LABEL description="${{ values.description }}"
LABEL version="1.0.0"
LABEL component="microservice"
LABEL tier="application"

# Create application user for security
RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser

# Set working directory
WORKDIR /app

# Install required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -XX:+PrintGCDetails \
    -XX:+PrintGCTimeStamps \
    -Xloggc:/app/logs/gc.log \
    -XX:+UseGCLogFileRotation \
    -XX:NumberOfGCLogFiles=5 \
    -XX:GCLogFileSize=10M"

# Spring Boot specific environment variables
ENV SPRING_PROFILES_ACTIVE=docker
ENV MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics,prometheus
ENV MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when_authorized

# Application arguments
ENV APP_ARGS="--spring.output.ansi.enabled=ALWAYS"

# Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar $APP_ARGS"]

# Optional: Add debugging capability
# Uncomment the following lines for debugging
# ENV JAVA_DEBUG_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
# EXPOSE 5005
# To enable debugging, set environment variable: JAVA_OPTS="$JAVA_OPTS $JAVA_DEBUG_OPTS"
