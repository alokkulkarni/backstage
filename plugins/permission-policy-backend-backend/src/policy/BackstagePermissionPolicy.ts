import { 
  PermissionPolicy, 
  PolicyQuery 
} from '@backstage/plugin-permission-node';
import { 
  PolicyDecision,
  DefinitivePolicyDecision,
  AuthorizeResult
} from '@backstage/plugin-permission-common';
import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import { LoggerService } from '@backstage/backend-plugin-api';
import { PermissionPolicyService } from '../service/PermissionPolicyService';
import { GUEST_USER_POLICY_CONFIG } from './GuestUserPolicy';

/**
 * Enhanced Permission Policy that integrates with the custom RBAC system
 * while following Backstage permission framework patterns.
 */
export class BackstagePermissionPolicy implements PermissionPolicy {
  constructor(
    private readonly policyService: PermissionPolicyService,
    private readonly adminUsers: string[],
    private readonly logger: LoggerService,
  ) {}

  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    this.logger.debug(`Permission check: ${request.permission.name} for user ${user?.identity.userEntityRef || 'anonymous'}`);

    // If no user, deny by default
    if (!user?.identity) {
      this.logger.debug('No user identity found, denying access');
      return { result: AuthorizeResult.DENY };
    }

    const userEntityRef = user.identity.userEntityRef;
    
    // Admin users have full access
    if (this.adminUsers.includes(userEntityRef)) {
      this.logger.debug(`Admin user ${userEntityRef} granted access`);
      return { result: AuthorizeResult.ALLOW };
    }

    // Handle guest users with specific policy
    if (this.isGuestUser(userEntityRef)) {
      return await this.handleGuestUserPermission(request, userEntityRef);
    }

    // Check against custom policy rules for authenticated users
    try {
      const result = await this.policyService.evaluate({
        user: {
          entityRef: userEntityRef,
          claims: user.identity.ownershipEntityRefs ? {
            ':backstageUser': user.identity.userEntityRef,
            ':backstageOwnership': user.identity.ownershipEntityRefs,
          } : { ':backstageUser': user.identity.userEntityRef },
          groups: user.identity.ownershipEntityRefs?.filter(ref => ref.startsWith('group:')) || [],
        },
        resource: {
          type: this.extractResourceFromPermission(request.permission.name),
          identifier: request.permission.name,
          attributes: request.permission.attributes || {},
        },
        action: this.extractActionFromPermission(request.permission.name),
        environment: {
          permission: request.permission.name,
          ...request.permission.attributes,
        },
      });

      this.logger.debug(`Policy evaluation result for ${userEntityRef}: ${result.decision}`, {
        permission: request.permission.name,
        decision: result.decision,
        reason: result.reason,
      });

      return {
        result: result.decision === 'allow' ? AuthorizeResult.ALLOW : AuthorizeResult.DENY,
      } as DefinitivePolicyDecision;
    } catch (error) {
      this.logger.error(`Error evaluating policy for ${userEntityRef}:`, error instanceof Error ? error : new Error(String(error)));
      return { result: AuthorizeResult.DENY };
    }
  }

  /**
   * Check if a user is a guest user
   */
  private isGuestUser(userEntityRef: string): boolean {
    const guestUserPatterns = ['user:guest', 'user:default/guest'];
    return guestUserPatterns.includes(userEntityRef);
  }

  /**
   * Handle permission requests for guest users with specific policies
   */
  private async handleGuestUserPermission(
    request: PolicyQuery,
    userEntityRef: string,
  ): Promise<PolicyDecision> {
    this.logger.debug(`Evaluating guest user permission: ${request.permission.name} for ${userEntityRef}`);

    const permissionName = request.permission.name;
    const resourceType = this.extractResourceFromPermission(permissionName);
    const action = this.extractActionFromPermission(permissionName);

    try {
      // Use the policy service to evaluate guest user permissions using the PolicyRule objects
      const result = await this.policyService.evaluate({
        user: {
          entityRef: userEntityRef,
          claims: {
            ':backstageUser': userEntityRef,
          },
          groups: [],
        },
        resource: {
          type: resourceType,
          identifier: permissionName,
          attributes: request.permission.attributes || {},
        },
        action: action,
        environment: {
          permission: permissionName,
          ...request.permission.attributes,
        },
      });

      this.logger.debug(`Guest user policy evaluation result for ${userEntityRef}: ${result.decision}`, {
        permission: permissionName,
        decision: result.decision,
        reason: result.reason,
      });

      return {
        result: result.decision === 'allow' ? AuthorizeResult.ALLOW : AuthorizeResult.DENY,
      } as DefinitivePolicyDecision;

    } catch (error) {
      this.logger.error(`Error evaluating guest user policy for ${userEntityRef}:`, error instanceof Error ? error : new Error(String(error)));
      
      // Fallback to legacy configuration as safety net
      this.logger.debug('Falling back to legacy guest user configuration');
      
      // Check if this is an explicitly denied resource pattern
      for (const deniedPattern of GUEST_USER_POLICY_CONFIG.deniedResourcePatterns) {
        if (this.matchesPattern(resourceType, deniedPattern) || this.matchesPattern(permissionName, deniedPattern)) {
          this.logger.debug(`Guest user ${userEntityRef} denied access to ${permissionName} - matches denied pattern: ${deniedPattern}`);
          return { result: AuthorizeResult.DENY };
        }
      }

      // Check if this is an explicitly denied action
      if (GUEST_USER_POLICY_CONFIG.deniedActions.includes(action)) {
        this.logger.debug(`Guest user ${userEntityRef} denied access to ${permissionName} - action '${action}' is denied for guests`);
        return { result: AuthorizeResult.DENY };
      }

      // Check if this is an explicitly allowed permission
      const allAllowedPermissions = [
        ...GUEST_USER_POLICY_CONFIG.allowedPermissions.catalog,
        ...GUEST_USER_POLICY_CONFIG.allowedPermissions.techdocs,
        ...GUEST_USER_POLICY_CONFIG.allowedPermissions.scaffolder,
        ...GUEST_USER_POLICY_CONFIG.allowedPermissions.search,
      ];

      if (allAllowedPermissions.includes(permissionName)) {
        this.logger.debug(`Guest user ${userEntityRef} granted access to ${permissionName} - explicitly allowed`);
        return { result: AuthorizeResult.ALLOW };
      }

      // Default deny for guest users
      this.logger.debug(`Guest user ${userEntityRef} denied access to ${permissionName} - not in allowed permissions list`);
      return { result: AuthorizeResult.DENY };
    }
  }

  /**
   * Check if a resource type matches a pattern (supports wildcards)
   */
  private matchesPattern(resourceType: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return resourceType.startsWith(prefix);
    }
    return resourceType === pattern;
  }

  private extractResourceFromPermission(permissionName: string): string {
    // Convert permission names like 'catalog.entity.read' to 'catalog.entity'
    const parts = permissionName.split('.');
    if (parts.length >= 2) {
      return parts.slice(0, -1).join('.');
    }
    return permissionName;
  }

  private extractActionFromPermission(permissionName: string): string {
    // Extract action from permission names like 'catalog.entity.read' -> 'read'
    const parts = permissionName.split('.');
    return parts[parts.length - 1] || 'unknown';
  }
}

export function createEnhancedPermissionPolicy(
  policyService: PermissionPolicyService,
  adminUsers: string[],
  logger: LoggerService,
): PermissionPolicy {
  return new BackstagePermissionPolicy(policyService, adminUsers, logger);
}
