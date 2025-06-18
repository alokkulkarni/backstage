import { createPermission } from '@backstage/plugin-permission-common';

/**
 * Critical Plugin Permission Definitions
 * These permissions control access to critical plugins that should be restricted for guest users
 */

// Ephemeral Environments Permissions (Critical)
export const ephemeralEnvironmentsReadPermission = createPermission({
  name: 'ephemeral.environments.read',
  attributes: { action: 'read' },
});

export const ephemeralEnvironmentsWritePermission = createPermission({
  name: 'ephemeral.environments.write',
  attributes: { action: 'update' },
});

// Terraform Permissions (Critical)
export const terraformReadPermission = createPermission({
  name: 'terraform.read',
  attributes: { action: 'read' },
});

export const terraformWritePermission = createPermission({
  name: 'terraform.write',
  attributes: { action: 'update' },
});

// Permissions Management Permissions (Critical)
export const permissionsReadPermission = createPermission({
  name: 'permissions.read',
  attributes: { action: 'read' },
});

export const permissionsWritePermission = createPermission({
  name: 'permissions.write',
  attributes: { action: 'update' },
});

export const rbacReadPermission = createPermission({
  name: 'rbac.read',
  attributes: { action: 'read' },
});

export const rbacWritePermission = createPermission({
  name: 'rbac.write',
  attributes: { action: 'update' },
});

// Kubernetes Permissions (Critical)
export const kubernetesReadPermission = createPermission({
  name: 'kubernetes.read',
  attributes: { action: 'read' },
});

export const kubernetesWritePermission = createPermission({
  name: 'kubernetes.write',
  attributes: { action: 'update' },
});

// Admin Dashboard Permissions (Critical)
export const adminDashboardAccessPermission = createPermission({
  name: 'admin.dashboard.access',
  attributes: { action: 'read' },
});

// Bazaar Permissions (Restricted)
export const bazaarReadPermission = createPermission({
  name: 'bazaar.read',
  attributes: { action: 'read' },
});

export const bazaarWritePermission = createPermission({
  name: 'bazaar.write',
  attributes: { action: 'update' },
});

// Copilot Permissions (Restricted)
export const copilotReadPermission = createPermission({
  name: 'copilot.read',
  attributes: { action: 'read' },
});

export const copilotWritePermission = createPermission({
  name: 'copilot.write',
  attributes: { action: 'update' },
});

// ArgoCD/GitOps Permissions (Critical)
export const argoCdReadPermission = createPermission({
  name: 'argocd.read',
  attributes: { action: 'read' },
});

export const argoCdWritePermission = createPermission({
  name: 'argocd.write',
  attributes: { action: 'update' },
});

// Dynatrace Permissions (Restricted)
export const dynatraceReadPermission = createPermission({
  name: 'dynatrace.read',
  attributes: { action: 'read' },
});

// Nexus IQ Permissions (Restricted)
export const nexusIqReadPermission = createPermission({
  name: 'nexus-iq.read',
  attributes: { action: 'read' },
});

// LaunchDarkly Permissions (Restricted)
export const launchDarklyReadPermission = createPermission({
  name: 'launchdarkly.read',
  attributes: { action: 'read' },
});

// SonarQube Permissions (Restricted)
export const sonarQubeReadPermission = createPermission({
  name: 'sonarqube.read',
  attributes: { action: 'read' },
});

// Tech Radar Permissions (Restricted)
export const techRadarReadPermission = createPermission({
  name: 'tech-radar.read',
  attributes: { action: 'read' },
});

// Jira Trends Permissions (Restricted for guest users)
export const jiraTrendsReadPermission = createPermission({
  name: 'jira.trends.read',
  attributes: { action: 'read' },
});

export const jiraTrendsWritePermission = createPermission({
  name: 'jira.trends.write',
  attributes: { action: 'update' },
});

// Source Control Trends Permissions (Restricted for guest users)
export const sourceControlTrendsReadPermission = createPermission({
  name: 'sourcecontrol.trends.read',
  attributes: { action: 'read' },
});

export const sourceControlTrendsWritePermission = createPermission({
  name: 'sourcecontrol.trends.write',
  attributes: { action: 'update' },
});

// Plugin Management Permissions (Critical)
export const pluginManagementReadPermission = createPermission({
  name: 'plugin-management.read',
  attributes: { action: 'read' },
});

export const pluginManagementWritePermission = createPermission({
  name: 'plugin-management.write',
  attributes: { action: 'update' },
});

// Backend Configuration Permissions (Critical)
export const backendConfigReadPermission = createPermission({
  name: 'backend-config.read',
  attributes: { action: 'read' },
});

export const backendConfigWritePermission = createPermission({
  name: 'backend-config.write',
  attributes: { action: 'update' },
});

// Integration Permissions (Critical)
export const integrationReadPermission = createPermission({
  name: 'integration.read',
  attributes: { action: 'read' },
});

export const integrationWritePermission = createPermission({
  name: 'integration.write',
  attributes: { action: 'update' },
});

// Azure/Microsoft Permissions (Critical)
export const azureReadPermission = createPermission({
  name: 'azure.read',
  attributes: { action: 'read' },
});

export const azureWritePermission = createPermission({
  name: 'azure.write',
  attributes: { action: 'update' },
});

export const microsoftReadPermission = createPermission({
  name: 'microsoft.read',
  attributes: { action: 'read' },
});

export const microsoftWritePermission = createPermission({
  name: 'microsoft.write',
  attributes: { action: 'update' },
});

// User Management Permissions (Critical)
export const userManagementReadPermission = createPermission({
  name: 'user-management.read',
  attributes: { action: 'read' },
});

export const userManagementWritePermission = createPermission({
  name: 'user-management.write',
  attributes: { action: 'update' },
});

// Role Management Permissions (Critical)
export const roleManagementReadPermission = createPermission({
  name: 'role-management.read',
  attributes: { action: 'read' },
});

export const roleManagementWritePermission = createPermission({
  name: 'role-management.write',
  attributes: { action: 'update' },
});

/**
 * Permission Categories for easy management
 */
export const criticalPermissions = [
  ephemeralEnvironmentsReadPermission,
  ephemeralEnvironmentsWritePermission,
  terraformReadPermission,
  terraformWritePermission,
  permissionsReadPermission,
  permissionsWritePermission,
  rbacReadPermission,
  rbacWritePermission,
  kubernetesReadPermission,
  kubernetesWritePermission,
  adminDashboardAccessPermission,
  argoCdReadPermission,
  argoCdWritePermission,
  pluginManagementReadPermission,
  pluginManagementWritePermission,
  backendConfigReadPermission,
  backendConfigWritePermission,
  integrationReadPermission,
  integrationWritePermission,
  azureReadPermission,
  azureWritePermission,
  microsoftReadPermission,
  microsoftWritePermission,
  userManagementReadPermission,
  userManagementWritePermission,
  roleManagementReadPermission,
  roleManagementWritePermission,
];

export const restrictedPermissions = [
  bazaarReadPermission,
  bazaarWritePermission,
  copilotReadPermission,
  copilotWritePermission,
  techRadarReadPermission,
  dynatraceReadPermission,
  nexusIqReadPermission,
  launchDarklyReadPermission,
  sonarQubeReadPermission,
  jiraTrendsReadPermission,
  jiraTrendsWritePermission,
  sourceControlTrendsReadPermission,
  sourceControlTrendsWritePermission,
];

export const allRestrictedPermissions = [
  ...criticalPermissions,
  ...restrictedPermissions,
];
