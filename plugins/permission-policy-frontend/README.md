# Permission Policy Frontend Plugin

A comprehensive Backstage frontend plugin that provides an intuitive user interface for managing permissions, roles, and access control policies. This plugin works seamlessly with the Permission Policy Backend plugin to deliver a complete permission management solution.

## Features

- **Policy Management UI**: Create, edit, and delete permission policies with a user-friendly interface
- **Role Administration**: Manage roles and their associated permissions
- **User/Group Assignment**: Assign roles to users and groups with visual feedback
- **Permission Viewer**: Browse and search through available permissions
- **Audit Dashboard**: View permission evaluation history and access logs
- **Policy Testing**: Test policy configurations before deployment
- **Visual Policy Builder**: Drag-and-drop policy creation interface
- **Bulk Operations**: Perform bulk role assignments and policy updates
- **Real-time Updates**: Live updates of permission changes
- **Import/Export**: Import and export policy configurations

## Installation

### 1. Install the Plugin

Add the frontend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-permission-policy-frontend
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { permissionPolicyFrontendPlugin } from '@internal/plugin-permission-policy-frontend';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { PermissionPolicyPage } from '@internal/plugin-permission-policy-frontend';

// Add to your app routes
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/permission-policy" element={<PermissionPolicyPage />} />
  </FlatRoutes>
);
```

### 4. Add to Navigation

Add Permission Policy to your sidebar navigation:

```typescript
// packages/app/src/components/Root/Root.tsx
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import SecurityIcon from '@material-ui/icons/Security';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ...existing items... */}
      <SidebarItem icon={SecurityIcon} to="permission-policy" text="Permissions" />
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Prerequisites

This frontend plugin requires the corresponding backend plugin to be installed and configured:

```bash
# Install the backend plugin
yarn add --cwd packages/backend @internal/plugin-permission-policy-backend-backend
```

See the [Permission Policy Backend Plugin README](../permission-policy-backend-backend/README.md) for backend setup instructions.

## Configuration

### Frontend Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
permissionPolicy:
  # Frontend specific settings
  frontend:
    # Enable/disable features
    features:
      policyEditor: true
      roleManager: true
      auditViewer: true
      bulkOperations: true
      policyTesting: true
    
    # UI preferences
    ui:
      # Default page size for lists
      defaultPageSize: 25
      # Enable dark mode support
      darkMode: true
      # Show advanced options by default
      showAdvanced: false
      # Auto-refresh interval (in seconds)
      autoRefresh: 30
    
    # Permissions for the permission management UI itself
    permissions:
      # Who can view policies
      viewPolicies: ['role:admin', 'role:security-admin']
      # Who can edit policies
      editPolicies: ['role:admin']
      # Who can manage roles
      manageRoles: ['role:admin']
      # Who can view audit logs
      viewAudit: ['role:admin', 'role:security-admin', 'role:auditor']
  
  # Notification settings
  notifications:
    enabled: true
    # Show notifications for policy changes
    policyChanges: true
    # Show notifications for role assignments
    roleAssignments: true
```

## Usage

### Main Permission Policy Page

The main page provides a comprehensive dashboard for permission management:

```typescript
// Access the full permission policy interface
import { PermissionPolicyPage } from '@internal/plugin-permission-policy-frontend';

// Use in your routes
<Route path="/permission-policy" element={<PermissionPolicyPage />} />
```

### Individual Components

Use individual components for specific functionality:

```tsx
// Homepage integration
import { Grid } from '@material-ui/core';
import {
  PolicySummaryCard,
  RoleAssignmentCard,
  AuditActivityCard,
  PermissionRequestCard
} from '@internal/plugin-permission-policy-frontend';

export const homePage = (
  <Page themeId="home">
    <Header title="Welcome to Backstage" />
    <Content>
      <Grid container spacing={3}>
        {/* Policy Overview */}
        <Grid item xs={12} md={6}>
          <PolicySummaryCard />
        </Grid>
        
        {/* Role Assignments */}
        <Grid item xs={12} md={6}>
          <RoleAssignmentCard />
        </Grid>
        
        {/* Recent Audit Activity */}
        <Grid item xs={12} md={6}>
          <AuditActivityCard />
        </Grid>
        
        {/* Permission Requests */}
        <Grid item xs={12} md={6}>
          <PermissionRequestCard />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
```

### Entity Integration

Add permission management to entity pages:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Link to specific permission policies
    permission-policy.io/policies: "service-read,service-write"
    # Specify owning team for permissions
    permission-policy.io/owner-team: "platform-team"
spec:
  type: service
  lifecycle: production
```

```tsx
// Add to entity page
import { EntityLayout } from '@backstage/plugin-catalog';
import { EntityPermissionPolicyContent } from '@internal/plugin-permission-policy-frontend';

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {/* Service overview content */}
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/permissions" title="Permissions">
      <EntityPermissionPolicyContent />
    </EntityLayout.Route>
  </EntityLayout>
);
```

### Available Components

#### Management Components
- **`PermissionPolicyPage`**: Full permission management dashboard
- **`PolicyEditor`**: Create and edit permission policies
- **`RoleManager`**: Manage roles and permissions
- **`UserRoleAssignment`**: Assign roles to users and groups
- **`PolicyTester`**: Test policy configurations

#### Display Components
- **`PolicySummaryCard`**: Overview of active policies
- **`RoleAssignmentCard`**: Current role assignments
- **`AuditActivityCard`**: Recent permission activity
- **`PermissionRequestCard`**: Pending permission requests
- **`PolicyViewer`**: Read-only policy display

#### Utility Components
- **`PermissionChecker`**: Check if user has specific permissions
- **`RoleSelector`**: Dropdown for role selection
- **`PolicyImportExport`**: Import/export policy configurations

## API Reference

The plugin exposes the following components and APIs:

```typescript
import {
  permissionPolicyFrontendPlugin,
  PermissionPolicyPage,
  PolicyEditor,
  RoleManager,
  PolicySummaryCard,
  RoleAssignmentCard,
  AuditActivityCard,
  permissionPolicyApiRef,
  type PermissionPolicyApi,
  type PolicyDefinition,
  type RoleDefinition,
  type AuditEntry
} from '@internal/plugin-permission-policy-frontend';
```

### Custom Component Example

```tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { permissionPolicyApiRef } from '@internal/plugin-permission-policy-frontend';

const CustomPermissionDashboard = () => {
  const permissionPolicyApi = useApi(permissionPolicyApiRef);
  const [policies, setPolicies] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [policiesData, rolesData] = await Promise.all([
        permissionPolicyApi.getPolicies(),
        permissionPolicyApi.getRoles()
      ]);
      setPolicies(policiesData);
      setRoles(rolesData);
    };
    
    fetchData();
  }, [permissionPolicyApi]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title={`${policies.length} Active Policies`} />
          <CardContent>
            {/* Custom policy visualization */}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title={`${roles.length} Defined Roles`} />
          <CardContent>
            {/* Custom role visualization */}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
```

## Advanced Features

### Custom Policy Templates

Create reusable policy templates:

```typescript
// Define custom policy templates
import { PolicyTemplate } from '@internal/plugin-permission-policy-frontend';

const customTemplates: PolicyTemplate[] = [
  {
    id: 'service-owner-template',
    name: 'Service Owner Policy',
    description: 'Standard permissions for service owners',
    template: {
      permission: 'catalog.entity.update',
      policy: 'conditional',
      conditions: [
        {
          rule: 'is-owner',
          params: {}
        }
      ]
    }
  },
  {
    id: 'team-lead-template',
    name: 'Team Lead Policy',
    description: 'Permissions for team leads',
    template: {
      permission: 'scaffolder.action.execute',
      policy: 'conditional',
      conditions: [
        {
          rule: 'has-role',
          params: { role: 'team-lead' }
        },
        {
          rule: 'is-business-hours',
          params: {}
        }
      ]
    }
  }
];

// Register templates
import { registerPolicyTemplates } from '@internal/plugin-permission-policy-frontend';
registerPolicyTemplates(customTemplates);
```

### Custom Themes

Customize the appearance of the permission management interface:

```typescript
// packages/app/src/themes/permissionPolicyTheme.ts
import { createTheme } from '@material-ui/core/styles';

export const permissionPolicyTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

### Bulk Operations

Perform bulk operations on permissions and roles:

```tsx
import { BulkOperationDialog } from '@internal/plugin-permission-policy-frontend';

const MyComponent = () => {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setBulkDialogOpen(true)}>
        Bulk Assign Roles
      </Button>
      
      <BulkOperationDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        operation="assign-roles"
        title="Bulk Role Assignment"
        description="Assign roles to multiple users at once"
      />
    </>
  );
};
```

## Workflow Integration

### Approval Workflows

Integrate with approval workflows for policy changes:

```yaml
# app-config.yaml
permissionPolicy:
  workflows:
    enabled: true
    approvals:
      # Require approval for policy changes
      policyChanges:
        required: true
        approvers: ['role:admin', 'role:security-admin']
        minimumApprovals: 2
      
      # Require approval for role assignments
      roleAssignments:
        required: true
        approvers: ['role:admin']
        minimumApprovals: 1
```

### Integration with External Systems

Connect with external identity providers and approval systems:

```typescript
// Custom approval integration
import { ApprovalProvider } from '@internal/plugin-permission-policy-frontend';

const customApprovalProvider: ApprovalProvider = {
  requestApproval: async (request) => {
    // Integrate with external approval system
    const response = await fetch('/api/approvals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  },
  
  checkApprovalStatus: async (requestId) => {
    // Check approval status
    const response = await fetch(`/api/approvals/${requestId}`);
    return response.json();
  }
};
```

## Testing and Validation

### Policy Testing

Test policies before deployment:

```tsx
import { PolicyTester } from '@internal/plugin-permission-policy-frontend';

const TestMyPolicies = () => {
  return (
    <PolicyTester
      policies={[
        {
          permission: 'catalog.entity.delete',
          policy: 'conditional',
          conditions: [{ rule: 'is-owner' }]
        }
      ]}
      testCases={[
        {
          user: 'user:default/john.doe',
          resource: 'component:default/my-service',
          expectedResult: 'allow'
        }
      ]}
    />
  );
};
```

### Validation Rules

Implement custom validation for policies:

```typescript
import { PolicyValidator } from '@internal/plugin-permission-policy-frontend';

const customValidator: PolicyValidator = {
  validatePolicy: (policy) => {
    const errors = [];
    
    // Custom validation logic
    if (!policy.permission) {
      errors.push('Permission is required');
    }
    
    if (policy.conditions && policy.conditions.length === 0) {
      errors.push('At least one condition is required for conditional policies');
    }
    
    return errors;
  }
};
```

## Performance Optimization

### Lazy Loading

Components support lazy loading for better performance:

```tsx
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@material-ui/core';

const PermissionPolicyPage = lazy(() => 
  import('@internal/plugin-permission-policy-frontend').then(m => ({ 
    default: m.PermissionPolicyPage 
  }))
);

const LazyPermissionPolicy = () => (
  <Suspense fallback={<CircularProgress />}>
    <PermissionPolicyPage />
  </Suspense>
);
```

### Caching

Configure client-side caching:

```typescript
// packages/app/src/App.tsx
import { createApiFactory } from '@backstage/core-plugin-api';
import { permissionPolicyApiRef } from '@internal/plugin-permission-policy-frontend';

const app = createApp({
  apis: [
    createApiFactory({
      api: permissionPolicyApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        createPermissionPolicyApi({
          discoveryApi,
          fetchApi,
          cache: {
            policies: { ttl: 300 }, // 5 minutes
            roles: { ttl: 600 }, // 10 minutes
            audit: { ttl: 60 }, // 1 minute
          }
        }),
    }),
  ],
});
```

## Troubleshooting

### Common Issues

**Permission Denied for Management UI**
- Verify user has appropriate permissions to access permission management
- Check role assignments and policy configurations
- Review audit logs for access denials

**Policies Not Loading**
- Verify backend plugin is installed and running
- Check API connectivity and CORS configuration
- Ensure proper authentication is configured

**Slow Performance**
- Enable caching for frequently accessed data
- Optimize API queries and reduce payload sizes
- Consider pagination for large datasets

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
localStorage.setItem('permission-policy-debug', 'true');

// View debug information
console.log('Permission Policy Debug Info:', window.permissionPolicyDebug);
```

## Development

### Local Development

Run the plugin in isolation for development:

```bash
# From the plugin directory
cd plugins/permission-policy-frontend
yarn start
```

This provides faster iteration with hot reloads and isolated testing.

### Storybook Integration

The plugin includes Storybook stories for component development:

```bash
# Run Storybook
yarn storybook
```

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Component tests
yarn test:components

# Integration tests
yarn test:integration
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper tests
4. Update Storybook stories for new components
5. Update documentation
6. Submit a pull request

## Best Practices

### Security
- Always validate user inputs in policy configurations
- Use principle of least privilege for management UI access
- Regularly audit permission assignments and policy changes
- Implement proper session management

### User Experience
- Provide clear feedback for all actions
- Use progressive disclosure for complex features
- Implement proper loading states and error handling
- Offer contextual help and documentation

### Performance
- Use React.memo for expensive components
- Implement proper pagination for large datasets
- Cache frequently accessed data
- Optimize re-renders with proper dependencies

## License

This plugin is licensed under the Apache License 2.0.
