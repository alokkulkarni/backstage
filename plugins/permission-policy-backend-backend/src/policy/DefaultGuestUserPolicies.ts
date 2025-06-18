/**
 * Default Guest User Policies Configuration
 * This file defines the default policies that should be loaded into the permissions plugin
 * to handle guest user access control properly.
 */

import { GUEST_USER_POLICY_RULES } from './GuestUserPolicy';
import { PermissionPolicyService } from '../service/PermissionPolicyService';

/**
 * Default policy configuration that should be loaded during plugin initialization
 */
export const DEFAULT_GUEST_USER_POLICIES = {
  // Policy rules for guest users
  rules: GUEST_USER_POLICY_RULES,
  
  // Default policy templates for guest users
  templates: [
    {
      name: 'Guest Read-Only Access Template',
      description: 'Template for creating read-only access policies for guest users',
      category: 'security',
      variables: [
        {
          name: 'resource',
          description: 'The resource to grant read access to',
          type: 'string' as const,
          required: true,
          defaultValue: 'catalog.entity',
          options: ['catalog.entity', 'catalog.location', 'techdocs.doc', 'scaffolder.template', 'search']
        }
      ],
      template: {
        name: 'Guest {{resource}} Read Access',
        description: 'Provides read-only access to {{resource}} for guest users',
        resource: '{{resource}}',
        actions: ['read'],
        effect: 'allow' as const,
        conditions: [
          {
            field: 'user.identity.userEntityRef',
            operator: 'in' as const,
            value: ['user:guest', 'user:default/guest']
          }
        ],
        metadata: {
          priority: 100,
          category: 'guest-access',
          tags: ['guest', 'read-only']
        }
      }
    },
    {
      name: 'Guest Access Denial Template',
      description: 'Template for creating denial policies for sensitive resources',
      category: 'security',
      variables: [
        {
          name: 'resource_pattern',
          description: 'The resource pattern to deny access to',
          type: 'string' as const,
          required: true,
          defaultValue: 'terraform*',
          options: ['terraform*', 'kubernetes*', 'admin*', 'permissions*', 'plugin-*']
        }
      ],
      template: {
        name: 'Guest {{resource_pattern}} Access Denial',
        description: 'Denies guest users access to {{resource_pattern}} resources',
        resource: '{{resource_pattern}}',
        actions: ['*'],
        effect: 'deny' as const,
        conditions: [
          {
            field: 'user.identity.userEntityRef',
            operator: 'in' as const,
            value: ['user:guest', 'user:default/guest']
          }
        ],
        metadata: {
          priority: 200,
          category: 'guest-security',
          tags: ['guest', 'security', 'deny']
        }
      }
    }
  ]
};

/**
 * Initialize guest user policies
 * This function should be called during plugin startup to ensure guest user policies are loaded
 */
export async function initializeGuestUserPolicies(policyService: PermissionPolicyService): Promise<void> {
  try {
    // Check if guest user policies already exist
    const existingRules = await policyService.listRules();
    const guestPoliciesExist = existingRules.some((rule) => 
      rule.name.includes('Guest') || 
      rule.description.includes('guest') ||
      rule.id.startsWith('guest-')
    );

    if (!guestPoliciesExist) {
      console.log('Initializing default guest user policies...');
      
      // Load default guest user policy rules
      for (const rule of DEFAULT_GUEST_USER_POLICIES.rules) {
        try {
          await policyService.createRule(rule);
          console.log(`Created guest policy rule: ${rule.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Failed to create guest policy rule '${rule.name}': ${errorMessage}`);
        }
      }
      
      // Load default policy templates
      for (const template of DEFAULT_GUEST_USER_POLICIES.templates) {
        try {
          await policyService.createTemplate(template);
          console.log(`Created guest policy template: ${template.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Failed to create guest policy template '${template.name}': ${errorMessage}`);
        }
      }
      
      console.log('Guest user policies initialized successfully');
    } else {
      console.log('Guest user policies already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize guest user policies:', error);
    throw error;
  }
}

/**
 * Migration function to move policies from fallback RBAC to permissions plugin
 */
export async function migrateGuestUserPoliciesFromRBAC(policyService: PermissionPolicyService): Promise<void> {
  try {
    console.log('Migrating guest user policies from fallback RBAC to permissions plugin...');
    
    // Initialize the guest user policies in the permissions plugin
    await initializeGuestUserPolicies(policyService);
    
    console.log('Migration completed successfully');
    console.log('Note: You can now remove the "Guest Users" role from fallback-rbac-policy.yaml');
    
  } catch (error) {
    console.error('Failed to migrate guest user policies:', error);
    throw error;
  }
}
