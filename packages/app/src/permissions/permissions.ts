import { createPermission } from '@backstage/plugin-permission-common';

/**
 * Permission definitions for frontend components
 */

// GitHub Repository Permissions
export const githubRepositoryReadPermission = createPermission({
  name: 'github.repository.read',
  attributes: { action: 'read' },
});

export const githubPullRequestReadPermission = createPermission({
  name: 'github.pullrequest.read',
  attributes: { action: 'read' },
});

// Source Control Trends Permissions
export const sourceControlReadPermission = createPermission({
  name: 'sourcecontrol.repository.read',
  attributes: { action: 'read' },
});

export const sourceControlMetricsReadPermission = createPermission({
  name: 'sourcecontrol.metrics.read',
  attributes: { action: 'read' },
});

// Jira Permissions
export const jiraBoardReadPermission = createPermission({
  name: 'jira.board.read',
  attributes: { action: 'read' },
});

export const jiraSprintReadPermission = createPermission({
  name: 'jira.sprint.read',
  attributes: { action: 'read' },
});

// Jenkins Permissions
export const jenkinsJobReadPermission = createPermission({
  name: 'jenkins.job.read',
  attributes: { action: 'read' },
});

export const jenkinsInsightsReadPermission = createPermission({
  name: 'jenkins.insights.read',
  attributes: { action: 'read' },
});

// System Metrics Permissions
export const systemMetricsReadPermission = createPermission({
  name: 'system.metrics.read',
  attributes: { action: 'read' },
});

// Platform Metrics Permissions
export const platformMetricsReadPermission = createPermission({
  name: 'platform.metrics.read',
  attributes: { action: 'read' },
});

// Quick Links Permissions
export const quickLinksReadPermission = createPermission({
  name: 'quicklinks.read',
  attributes: { action: 'read' },
});

// System Status Permissions
export const systemStatusReadPermission = createPermission({
  name: 'system.status.read',
  attributes: { action: 'read' },
});

// Starred Entities Permissions (for HomePageStarredEntities)
export const starredEntitiesReadPermission = createPermission({
  name: 'catalog.starred.read',
  attributes: { action: 'read' },
});

// Admin Dashboard Permissions
export const adminDashboardReadPermission = createPermission({
  name: 'admin.dashboard.read',
  attributes: { action: 'read' },
});

// Tech Radar Permission
export const techRadarReadPermission = createPermission({
  name: 'tech-radar.read',
  attributes: { action: 'read' },
});

// Re-export critical plugin permissions for easy access
export {
  // Critical plugins - should be denied for guest users
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
  bazaarReadPermission,
  bazaarWritePermission,
  copilotReadPermission,
  copilotWritePermission,
  argoCdReadPermission,
  argoCdWritePermission,
  dynatraceReadPermission,
  nexusIqReadPermission,
  launchDarklyReadPermission,
  sonarQubeReadPermission,
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
  jiraTrendsReadPermission,
  jiraTrendsWritePermission,
  sourceControlTrendsReadPermission,
  sourceControlTrendsWritePermission,
  criticalPermissions,
  restrictedPermissions,
  allRestrictedPermissions,
} from './criticalPluginPermissions';
