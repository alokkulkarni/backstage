/**
 * Guest User Permission Policy Configuration
 * This file defines the permission policies for guest users through the permissions plugin
 */

import { PolicyRule } from '../types';

/**
 * Guest User Policy Rules for the Permissions Plugin
 * These policies will be created and stored in the permissions plugin storage
 */
export const GUEST_USER_POLICY_RULES: PolicyRule[] = [
  // Allow guest users to read catalog entities
  {
    id: 'guest-catalog-entity-read',
    name: 'Guest Catalog Entity Read',
    description: 'Allow guest users to read catalog entities',
    resource: 'catalog-entity',
    actions: ['read'],
    effect: 'allow' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'catalog', 'read-only']
    }
  },
  
  // Allow guest users to read catalog locations
  {
    id: 'guest-catalog-location-read',
    name: 'Guest Catalog Location Read',
    description: 'Allow guest users to read catalog locations',
    resource: 'catalog-location',
    actions: ['read'],
    effect: 'allow' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'catalog', 'read-only']
    }
  },
  
  // Allow guest users to read TechDocs
  {
    id: 'guest-techdocs-read',
    name: 'Guest TechDocs Read',
    description: 'Allow guest users to read technical documentation',
    resource: 'techdocs-doc',
    actions: ['read'],
    effect: 'allow' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'techdocs', 'read-only']
    }
  },
  
  // Allow guest users to read scaffolder templates
  {
    id: 'guest-scaffolder-template-read',
    name: 'Guest Scaffolder Template Read',
    description: 'Allow guest users to view scaffolder templates',
    resource: 'scaffolder-template',
    actions: ['read'],
    effect: 'allow' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'scaffolder', 'read-only']
    }
  },
  
  // Allow guest users to use search
  {
    id: 'guest-search-access',
    name: 'Guest Search Access',
    description: 'Allow guest users to search and query',
    resource: 'search',
    actions: ['query', 'read'],
    effect: 'allow' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'search', 'read-only']
    }
  },
  
  // === DENY POLICIES FOR GUESTS ===
  
  // Deny ephemeral environments access
  {
    id: 'guest-deny-ephemeral-environments',
    name: 'Guest Deny Ephemeral Environments',
    description: 'Deny guest users access to ephemeral environments',
    resource: 'ephemeralenvironments*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'ephemeral-environments', 'security']
    }
  },
  
  // Deny Terraform access
  {
    id: 'guest-deny-terraform',
    name: 'Guest Deny Terraform Access',
    description: 'Deny guest users access to all Terraform resources',
    resource: 'terraform*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'terraform', 'security']
    }
  },
  
  // Deny permissions plugin access
  {
    id: 'guest-deny-permissions',
    name: 'Guest Deny Permissions Access',
    description: 'Deny guest users access to permissions and RBAC management',
    resource: 'permissions*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'permissions', 'security']
    }
  },
  
  // Deny administrative functions
  {
    id: 'guest-deny-admin',
    name: 'Guest Deny Admin Access',
    description: 'Deny guest users access to administrative functions',
    resource: 'admin*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'admin', 'security']
    }
  },
  
  // Deny Kubernetes/Infrastructure access
  {
    id: 'guest-deny-kubernetes',
    name: 'Guest Deny Kubernetes Access',
    description: 'Deny guest users access to Kubernetes and infrastructure management',
    resource: 'kubernetes*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'kubernetes', 'security']
    }
  },
  
  // Deny CI/CD write operations
  {
    id: 'guest-deny-cicd-write',
    name: 'Guest Deny CI/CD Write Operations',
    description: 'Deny guest users write access to CI/CD systems',
    resource: 'jenkins*',
    actions: ['create', 'update', 'delete', 'execute', 'trigger', 'restart', 'stop'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'jenkins', 'cicd', 'security']
    }
  },
  
  // Deny scaffolder execution
  {
    id: 'guest-deny-scaffolder-execution',
    name: 'Guest Deny Scaffolder Execution',
    description: 'Deny guest users from executing scaffolder templates',
    resource: 'scaffolder*',
    actions: ['create', 'execute', 'update', 'delete', 'trigger'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'scaffolder', 'security']
    }
  },
  
  // Deny plugin configuration access
  {
    id: 'guest-deny-plugin-config',
    name: 'Guest Deny Plugin Configuration',
    description: 'Deny guest users access to plugin configuration and management',
    resource: 'plugin-*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'plugin-config', 'security']
    }
  },
  
  // Deny Jira Trends access
  {
    id: 'guest-deny-jira-trends',
    name: 'Guest Deny Jira Trends',
    description: 'Deny guest users access to Jira Trends and metrics',
    resource: 'jira.trends*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'jira-trends', 'security']
    }
  },
  
  // Deny Source Control Trends access
  {
    id: 'guest-deny-sourcecontrol-trends',
    name: 'Guest Deny Source Control Trends',
    description: 'Deny guest users access to Source Control Trends and metrics',
    resource: 'sourcecontrol.trends*',
    actions: ['*'],
    effect: 'deny' as const,
    subjects: [
      { type: 'user', identifier: 'user:guest' },
      { type: 'user', identifier: 'user:default/guest' }
    ],
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
      tags: ['guest', 'sourcecontrol-trends', 'security']
    }
  }
];

/**
 * Legacy configuration for backward compatibility
 * This can be used by the BackstagePermissionPolicy for pattern matching
 */
export const GUEST_USER_POLICY_CONFIG = {
  allowedPermissions: {
    catalog: ['catalog.entity.read', 'catalog.location.read'],
    techdocs: ['techdocs.doc.read'],
    scaffolder: ['scaffolder.template.read'],
    search: ['search.query', 'search.read']
  },
  deniedResourcePatterns: [
    'ephemeralenvironments*',
    'ephemeral-environments*',
    'terraform*',
    'permissions*',
    'permission-policy*',
    'rbac*',
    'admin*',
    'kubernetes*',
    'infrastructure*',
    'plugin-*',
    'jenkins*',
    'sonarqube*',
    'jira.trends*',
    'sourcecontrol.trends*'
  ],
  deniedActions: [
    'create', 'update', 'delete', 'execute', 'trigger', 'restart', 'stop'
  ]
};

/**
 * Guest User Role Definition for backward compatibility
 */
export const GUEST_USER_ROLE = {
  name: 'guest-users',
  description: 'Role for guest users with limited read-only access',
  members: ['user:guest', 'user:default/guest'],
  permissions: [
    'catalog.entity.read',
    'catalog.location.read',
    'techdocs.doc.read',
    'scaffolder.template.read',
    'search.query',
    'search.read'
  ]
};
