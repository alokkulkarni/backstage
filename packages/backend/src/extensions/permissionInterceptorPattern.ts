/**
 * Universal Permission Interceptor Pattern for Backstage
 * 
 * This module provides a comprehensive interceptor pattern that ensures all
 * components, resources, and plugins inherit permissions without requiring
 * individual code changes to each plugin or component.
 */

import { 
  createBackendModule, 
  coreServices,
} from '@backstage/backend-plugin-api';
import { 
  policyExtensionPoint,
} from '@backstage/plugin-permission-node/alpha';
import { 
  PermissionPolicy, 
  PolicyQuery 
} from '@backstage/plugin-permission-node';
import { 
  PolicyDecision,
  DefinitivePolicyDecision,
  AuthorizeResult,
  Permission
} from '@backstage/plugin-permission-common';
import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import { CatalogClient } from '@backstage/catalog-client';
import { PermissionPolicyService } from '@internal/plugin-permission-policy-backend-backend';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

/**
 * Permission Metadata Registry
 * Tracks all permission requests and their context
 */
interface PermissionMetadata {
  name: string;
  pluginId: string;
  resourceType: string;
  action: string;
  attributes: Record<string, any>;
  registeredAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

/**
 * Cached Permission Decision
 */
interface CachedPolicyDecision {
  result: AuthorizeResult;
  timestamp: number;
}

/**
 * Universal Permission Interceptor
 * Intercepts ALL permission checks across the entire Backstage instance
 */
class UniversalPermissionInterceptor implements PermissionPolicy {
  private permissionRegistry = new Map<string, PermissionMetadata>();
  private policyCache = new Map<string, CachedPolicyDecision>();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly policyService: PermissionPolicyService,
    private readonly adminUsers: string[],
    private readonly logger: LoggerService,
  ) {
    this.logger.info('Universal Permission Interceptor initialized with policy-based guest access');
  }

  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    const startTime = Date.now();
    const permissionName = request.permission.name;
    
    // Register this permission in our metadata registry
    this.registerPermission(request.permission);
    
    this.logger.debug(`🔒 Permission intercept: ${permissionName}`, {
      user: user?.identity.userEntityRef || 'anonymous',
      permission: permissionName,
      attributes: request.permission.attributes,
    });

    // Check cache first
    const cacheKey = this.getCacheKey(request, user);
    const cached = this.getCachedDecision(cacheKey);
    if (cached) {
      this.logger.debug(`📋 Cache hit for ${permissionName}`, { cacheKey });
      return cached;
    }

    let decision: PolicyDecision;

    try {
      // 1. Guest users - apply guest access policy
      if (this.isGuestUser(user?.identity)) {
        decision = await this.handleGuestUser(request);
      }
      // 2. Admin users - grant full access
      else if (user?.identity?.userEntityRef && this.isAdminUser(user.identity.userEntityRef)) {
        decision = await this.handleAdminUser(request, user);
      }
      // 3. Regular users - apply policy evaluation
      else if (user) {
        decision = await this.handleRegularUser(request, user);
      }
      // 4. No user context - deny access
      else {
        this.logger.warn(`🚫 No user context for permission ${permissionName}`);
        decision = { result: AuthorizeResult.DENY };
      }

      // Cache the decision
      this.cacheDecision(cacheKey, decision);

      // Log metrics
      const duration = Date.now() - startTime;
      this.logPermissionMetrics(permissionName, decision, duration);

      return decision;

    } catch (error) {
      this.logger.error(`❌ Permission evaluation failed for ${permissionName}:`, error as Error);
      
      // Fail-safe: deny access on errors
      decision = { result: AuthorizeResult.DENY };
      this.cacheDecision(cacheKey, decision);
      return decision;
    }
  }

  /**
   * Handle admin users with full access
   */
  private async handleAdminUser(
    _request: PolicyQuery, 
    user: BackstageIdentityResponse
  ): Promise<PolicyDecision> {
    this.logger.debug(`👑 Admin access granted for ${user.identity.userEntityRef}`);
    return { result: AuthorizeResult.ALLOW };
  }

  /**
   * Handle regular users with policy evaluation
   */
  private async handleRegularUser(
    request: PolicyQuery, 
    user: BackstageIdentityResponse
  ): Promise<PolicyDecision> {
    const userEntityRef = user.identity.userEntityRef;
    
    // Prepare evaluation context
    const evaluationContext = {
      user: {
        entityRef: userEntityRef,
        claims: this.buildUserClaims(user),
        groups: this.extractUserGroups(user),
      },
      resource: {
        type: this.extractResourceType(request.permission.name),
        identifier: request.permission.name,
        attributes: request.permission.attributes || {},
      },
      action: this.extractAction(request.permission.name),
      environment: {
        permission: request.permission.name,
        timestamp: new Date().toISOString(),
        ...request.permission.attributes,
      },
    };

    // Evaluate using custom policy service
    const result = await this.policyService.evaluate(evaluationContext);
    
    this.logger.debug(`📊 Policy evaluation result for ${userEntityRef}:`, {
      permission: request.permission.name,
      decision: result.decision,
      reason: result.reason,
    });

    return {
      result: result.decision === 'allow' ? AuthorizeResult.ALLOW : AuthorizeResult.DENY,
    } as DefinitivePolicyDecision;
  }

  /**
   * Handle guest users with policy-based permissions
   */
  private async handleGuestUser(request: PolicyQuery): Promise<PolicyDecision> {
    const permissionName = request.permission.name;
    
    // Explicit security check: DENY access to sensitive plugins immediately
    const restrictedPatterns = [
      'ephemeral', 'terraform', 'permissions', 'rbac', 'bazaar', 'copilot', 'co-pilot',
      'admin', 'kubernetes', 'argocd', 'gitops', 'dynatrace', 'nexus-iq', 'launchdarkly',
      'sonarqube', 'plugin-management', 'plugin-config', 'backend-config', 'app-config',
      'integration', 'proxy', 'azure', 'microsoft', 'user-management', 'role-management'
    ];
    
    const isRestrictedPermission = restrictedPatterns.some(pattern => 
      permissionName.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isRestrictedPermission) {
      this.logger.debug(`🚨 Guest access explicitly denied for restricted permission: ${permissionName}`);
      return { result: AuthorizeResult.DENY };
    }
    
    try {
      // Use policy service to evaluate permission for guest user
      const result = await this.policyService.evaluate({
        user: {
          entityRef: 'user:default/guest',
          claims: {
            ':backstageUser': 'user:default/guest',
          },
          groups: [],
        },
        resource: {
          type: this.extractResourceType(permissionName),
          identifier: permissionName,
          attributes: request.permission.attributes || {},
        },
        action: this.extractAction(permissionName),
        environment: {
          permission: permissionName,
          ...request.permission.attributes,
        },
      });

      if (result.decision === 'allow') {
        this.logger.debug(`✅ Guest access granted for ${permissionName} via policy`);
        return { result: AuthorizeResult.ALLOW };
      } else {
        this.logger.debug(`🚫 Guest access denied for ${permissionName} via policy: ${result.reason || 'No reason provided'}`);
        return { result: AuthorizeResult.DENY };
      }
    } catch (error) {
      this.logger.error(`Error evaluating guest permission for ${permissionName}:`, error instanceof Error ? error : new Error(String(error)));
      
      // Fallback: Check if it's a read-only permission as a safety net
      if (this.isReadOnlyPermission(permissionName)) {
        this.logger.debug(`✅ Guest access granted for ${permissionName} via read-only fallback`);
        return { result: AuthorizeResult.ALLOW };
      }
      
      return { result: AuthorizeResult.DENY };
    }
  }

  /**
   * Register permission metadata for analytics and debugging
   */
  private registerPermission(permission: Permission): void {
    const existing = this.permissionRegistry.get(permission.name);
    
    if (existing) {
      existing.lastAccessed = new Date();
      existing.accessCount++;
    } else {
      this.permissionRegistry.set(permission.name, {
        name: permission.name,
        pluginId: this.extractPluginId(permission.name),
        resourceType: this.extractResourceType(permission.name),
        action: this.extractAction(permission.name),
        attributes: permission.attributes || {},
        registeredAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
      });
    }
  }

  /**
   * Helper methods
   */
  private isAdminUser(userEntityRef: string): boolean {
    return this.adminUsers.includes(userEntityRef);
  }

  private isGuestUser(identity?: any): boolean {
    return !identity || identity.userEntityRef === 'guest';
  }

  private isReadOnlyPermission(permissionName: string): boolean {
    return permissionName.includes('.read') || 
           permissionName.includes('.get') || 
           permissionName.includes('.list') ||
           permissionName.includes('.view');
  }

  private buildUserClaims(user: BackstageIdentityResponse): Record<string, any> {
    return user.identity.ownershipEntityRefs ? {
      ':backstageUser': user.identity.userEntityRef,
      ':backstageOwnership': user.identity.ownershipEntityRefs,
    } : { 
      ':backstageUser': user.identity.userEntityRef 
    };
  }

  private extractUserGroups(user: BackstageIdentityResponse): string[] {
    return user.identity.ownershipEntityRefs?.filter(ref => 
      ref.startsWith('group:')
    ) || [];
  }

  private extractPluginId(permissionName: string): string {
    return permissionName.split('.')[0] || 'unknown';
  }

  private extractResourceType(permissionName: string): string {
    const parts = permissionName.split('.');
    return parts.length >= 2 ? parts.slice(0, -1).join('.') : permissionName;
  }

  private extractAction(permissionName: string): string {
    const parts = permissionName.split('.');
    return parts[parts.length - 1] || 'unknown';
  }

  private getCacheKey(request: PolicyQuery, user?: BackstageIdentityResponse): string {
    const userKey = user?.identity.userEntityRef || 'anonymous';
    const permissionKey = request.permission.name;
    const attributesKey = JSON.stringify(request.permission.attributes || {});
    return `${userKey}:${permissionKey}:${attributesKey}`;
  }

  private getCachedDecision(cacheKey: string): PolicyDecision | null {
    const cached = this.policyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return { result: cached.result } as DefinitivePolicyDecision;
    }
    this.policyCache.delete(cacheKey);
    return null;
  }

  private cacheDecision(cacheKey: string, decision: PolicyDecision): void {
    this.policyCache.set(cacheKey, {
      result: decision.result,
      timestamp: Date.now(),
    });
  }

  private logPermissionMetrics(
    permissionName: string, 
    decision: PolicyDecision, 
    duration: number
  ): void {
    this.logger.debug(`📈 Permission metrics:`, {
      permission: permissionName,
      result: decision.result,
      duration: `${duration}ms`,
      cacheSize: this.policyCache.size,
      registrySize: this.permissionRegistry.size,
    });
  }

  /**
   * Get permission analytics
   */
  getPermissionAnalytics(): {
    totalPermissions: number;
    byPlugin: Record<string, number>;
    byResourceType: Record<string, number>;
    byAction: Record<string, number>;
    mostAccessed: PermissionMetadata[];
  } {
    const permissions = Array.from(this.permissionRegistry.values());
    
    return {
      totalPermissions: permissions.length,
      byPlugin: this.groupBy(permissions, 'pluginId'),
      byResourceType: this.groupBy(permissions, 'resourceType'),
      byAction: this.groupBy(permissions, 'action'),
      mostAccessed: permissions
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10),
    };
  }

  private groupBy(items: PermissionMetadata[], key: keyof PermissionMetadata): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

/**
 * HTTP Router Interceptor
 * Automatically applies auth policies to ALL routes
 */
class HttpRouterInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {}

  /**
   * Apply default auth policies to any HTTP router
   */
  interceptHttpRouter(httpRouter: any, pluginId: string): void {
    this.logger.debug(`🔗 Intercepting HTTP router for plugin: ${pluginId}`);
    
    // Get default auth policy from config
    const defaultPolicy = this.config.getOptionalString(
      'permission.policy.defaultHttpAuth'
    ) || 'unauthenticated';

    // Apply comprehensive auth policies
    const commonPaths = [
      '/health',
      '/status', 
      '/metrics',
      '/info',
      '/ready',
      '/live',
    ];

    // Allow unauthenticated access to health/status endpoints
    commonPaths.forEach(path => {
      try {
        httpRouter.addAuthPolicy({
          path,
          allow: 'unauthenticated',
        });
      } catch (error) {
        // Ignore if policy already exists
      }
    });

    // Apply default policy to all other paths
    try {
      httpRouter.addAuthPolicy({
        path: '/*',
        allow: defaultPolicy as any,
      });
    } catch (error) {
      this.logger.debug(`Policy already exists for ${pluginId}/*`);
    }
  }
}

/**
 * Universal Permission Interceptor Module
 * Automatically intercepts ALL permission checks across Backstage
 */
export const universalPermissionInterceptorModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'universal-interceptor',
  register(reg) {
    reg.registerInit({
      deps: { 
        policy: policyExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
      },
      async init({ policy, config, logger, discovery }) {
        logger.info('🚀 Initializing Universal Permission Interceptor...');

        // Get admin users from config
        const adminUsers = [
          ...(config.getOptionalStringArray('permission.rbac.authorizedUsers') || []),
          ...(config.getOptionalStringArray('permissions.adminUsers') || []),
        ];
        
        logger.info('Universal Permission Interceptor configured', { 
          adminUserCount: adminUsers.length,
          cacheEnabled: true,
        });

        // Create catalog client
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
        });

        // Create permission policy service
        const policyService = new PermissionPolicyService(
          logger,
          { getOptionalConfig: (key: string) => config.getOptionalConfig(key) } as any,
          catalogClient,
        );

        // Create and register the universal interceptor
        const _interceptor = new UniversalPermissionInterceptor(
          policyService,
          adminUsers,
          logger,
        );
        
        policy.setPolicy(_interceptor);
        
        logger.info('✅ Universal Permission Interceptor activated - All components now inherit permissions');

        // Expose analytics endpoint
        if (config.getOptionalBoolean('permission.analytics.enabled')) {
          logger.info('📊 Permission analytics enabled');
          // You can add an HTTP endpoint here to expose analytics
        }
      },
    });
  },
});

/**
 * Auto HTTP Auth Policy Module
 * Automatically applies auth policies to all plugin routers
 */
export const autoHttpAuthPolicyModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'auto-http-auth',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
      },
      async init({ logger }) {
        logger.info('🔒 Auto HTTP Auth Policy module initialized');
        
        // This module can be extended to automatically wrap httpRouter.use()
        // calls to apply auth policies. For now, it's a placeholder for future enhancement.
      },
    });
  },
});

export default universalPermissionInterceptorModule;

// Export types for external use
export type { PermissionMetadata };
export { UniversalPermissionInterceptor, HttpRouterInterceptor };
