package com.example.{{ values.name | replace('-', '') }}.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

/**
 * Cache configuration for the application.
 * 
 * This configuration provides both local (in-memory) and distributed (Redis) caching
 * options based on the application profile and configuration.
 * 
 * @author {{ values.owner }}
 * @version 1.0.0
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Local cache manager using ConcurrentHashMap.
     * Used for development and when Redis is not available.
     * 
     * @return CacheManager for local caching
     */
    @Bean
    @ConditionalOnProperty(
        value = "app.cache.enable-distributed-cache",
        havingValue = "false",
        matchIfMissing = true
    )
    @Primary
    public CacheManager localCacheManager() {
        return new ConcurrentMapCacheManager(
            "users",
            "products",
            "categories",
            "health-checks"
        );
    }

    /**
     * Redis cache manager for distributed caching.
     * Used in production environments with Redis.
     * 
     * @param redisConnectionFactory Redis connection factory
     * @return CacheManager for distributed caching
     */
    @Bean
    @ConditionalOnProperty(
        value = "app.cache.enable-distributed-cache",
        havingValue = "true"
    )
    @Primary
    public CacheManager redisCacheManager(RedisConnectionFactory redisConnectionFactory) {
        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(
                org.springframework.data.redis.cache.RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(java.time.Duration.ofMinutes(10))
                    .serializeKeysWith(
                        org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                            .fromSerializer(new org.springframework.data.redis.serializer.StringRedisSerializer())
                    )
                    .serializeValuesWith(
                        org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                            .fromSerializer(new org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer())
                    )
            )
            .build();
    }
}
