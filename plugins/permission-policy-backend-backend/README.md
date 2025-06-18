# Permission Policy Backend Plugin

A comprehensive Backstage backend plugin that provides advanced permission management and access control capabilities, enabling fine-grained security policies and role-based access control (RBAC) for your Backstage instance.

## Features

- **Advanced Permission Policies**: Define complex permission rules beyond basic RBAC
- **Dynamic Policy Evaluation**: Real-time policy evaluation based on context and conditions
- **Multi-tenant Support**: Isolate permissions across different organizations and teams
- **Custom Policy Rules**: Create custom permission rules specific to your organization
- **Audit Logging**: Complete audit trail of all permission decisions and policy changes
- **Policy Inheritance**: Hierarchical permission inheritance from groups and roles
- **Conditional Access**: Context-aware permissions based on time, location, and other factors
- **API Protection**: Secure backend APIs with policy-driven access control
- **Integration Ready**: Seamless integration with external identity providers

## Installation

### 1. Install the Plugin

Add the backend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @internal/plugin-permission-policy-backend-backend
```

### 2. Add to Backend

Add the plugin to your backend configuration:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Add the Permission Policy backend plugin
backend.add(import('@internal/plugin-permission-policy-backend-backend'));

backend.start();
```

### 3. Alternative: Legacy Backend Setup

For legacy backend setup:

```typescript
// packages/backend/src/plugins/permission-policy.ts
import { createRouter } from '@internal/plugin-permission-policy-backend-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    permissions: env.permissions,
  });
}
```

```typescript
// packages/backend/src/index.ts
import permissionPolicy from './plugins/permission-policy';

async function main() {
  // ... existing setup
  
  const permissionPolicyEnv = useHotMemoize(module, () => createEnv('permission-policy'));
  apiRouter.use('/permission-policy', await permissionPolicy(permissionPolicyEnv));
}
```

## Configuration

### Basic Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
permission:
  enabled: true
  
permissionPolicy:
  # Policy engine configuration
  engine:
    type: 'rbac' # Options: rbac, abac, custom
    debug: false
    
  # Default policies
  defaultPolicies:
    # Allow catalog read access for all authenticated users
    - permission: 'catalog-entity'
      policy: 'allow'
      conditions:
        - rule: 'is-authenticated'
    
    # Restrict admin actions to admin users
    - permission: 'catalog.entity.delete'
      policy: 'conditional'
      conditions:
        - rule: 'has-role'
          params: ['admin']
  
  # Role definitions
  roles:
    - name: 'admin'
      description: 'System administrators'
      permissions:
        - 'catalog.entity.create'
        - 'catalog.entity.update'
        - 'catalog.entity.delete'
        - 'scaffolder.action.execute'
    
    - name: 'developer'
      description: 'Development team members'
      permissions:
        - 'catalog.entity.read'
        - 'catalog.entity.create'
        - 'scaffolder.template.use'
    
    - name: 'viewer'
      description: 'Read-only access'
      permissions:
        - 'catalog.entity.read'
  
  # Group mappings
  groups:
    - name: 'platform-team'
      roles: ['admin']
      members:
        - 'user:default/admin'
        - 'group:default/platform-engineers'
    
    - name: 'development-teams'
      roles: ['developer']
      members:
        - 'group:default/frontend-team'
        - 'group:default/backend-team'
  
  # Custom conditions
  conditions:
    - name: 'is-owner'
      description: 'Check if user owns the entity'
      rule: |
        resource.metadata?.annotations?.['backstage.io/owner'] === user.entity
    
    - name: 'in-business-hours'
      description: 'Only allow access during business hours'
      rule: |
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17;
  
  # Audit configuration
  audit:
    enabled: true
    logLevel: 'info'
    storage: 'database' # Options: database, file, external
    retention: '90d'
```

### Advanced Configuration

Configure advanced policy features:

```yaml
# app-config.yaml
permissionPolicy:
  # Multi-tenant configuration
  multiTenant:
    enabled: true
    isolation: 'strict' # Options: strict, soft, none
    tenantResolver: 'annotation' # How to determine tenant from entity
    
  # Dynamic policy loading
  dynamicPolicies:
    enabled: true
    sources:
      - type: 'database'
        refreshInterval: '5m'
      - type: 'file'
        path: '/etc/backstage/policies'
        watch: true
      - type: 'api'
        endpoint: 'https://policy-server.company.com/policies'
        auth:
          type: 'bearer'
          token: '${POLICY_API_TOKEN}'
  
  # Policy caching
  cache:
    enabled: true
    ttl: '15m'
    maxSize: 10000
  
  # Integration with external systems
  integrations:
    ldap:
      enabled: true
      server: 'ldap://company.com'
      bindDN: '${LDAP_BIND_DN}'
      bindPassword: '${LDAP_BIND_PASSWORD}'
      userBaseDN: 'ou=users,dc=company,dc=com'
      groupBaseDN: 'ou=groups,dc=company,dc=com'
    
    oauth:
      enabled: true
      providers:
        - name: 'azure-ad'
          clientId: '${AZURE_CLIENT_ID}'
          clientSecret: '${AZURE_CLIENT_SECRET}'
          tenantId: '${AZURE_TENANT_ID}'
```

### Environment Variables

Set up the required environment variables:

```bash
# .env
# Database configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=backstage
POSTGRES_PASSWORD=backstage_password
POSTGRES_DB=backstage_plugin_permission_policy

# External integrations
LDAP_BIND_DN=cn=backstage,ou=service-accounts,dc=company,dc=com
LDAP_BIND_PASSWORD=secure_password
POLICY_API_TOKEN=your_policy_api_token

# Azure AD (if using OAuth integration)
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id
```

## API Endpoints

The plugin exposes the following REST API endpoints:

### Policy Management

```http
# Get all policies
GET /api/permission-policy/policies

# Create a new policy
POST /api/permission-policy/policies
Content-Type: application/json

{
  "name": "custom-policy",
  "permission": "catalog.entity.update",
  "policy": "conditional",
  "conditions": [
    {
      "rule": "is-owner",
      "params": {}
    }
  ]
}

# Update an existing policy
PUT /api/permission-policy/policies/{policyId}

# Delete a policy
DELETE /api/permission-policy/policies/{policyId}
```

### Role Management

```http
# Get all roles
GET /api/permission-policy/roles

# Create a new role
POST /api/permission-policy/roles
Content-Type: application/json

{
  "name": "custom-role",
  "description": "Custom role for specific team",
  "permissions": [
    "catalog.entity.read",
    "catalog.entity.create"
  ]
}

# Assign role to user/group
POST /api/permission-policy/roles/{roleId}/assignments
Content-Type: application/json

{
  "principal": "user:default/john.doe",
  "type": "user"
}
```

### Policy Evaluation

```http
# Evaluate permission for current user
POST /api/permission-policy/evaluate
Content-Type: application/json

{
  "permission": "catalog.entity.delete",
  "resourceRef": "component:default/my-service"
}

# Batch permission evaluation
POST /api/permission-policy/evaluate/batch
Content-Type: application/json

{
  "evaluations": [
    {
      "permission": "catalog.entity.read",
      "resourceRef": "component:default/service-a"
    },
    {
      "permission": "catalog.entity.update",
      "resourceRef": "component:default/service-b"
    }
  ]
}
```

### Audit and Monitoring

```http
# Get audit logs
GET /api/permission-policy/audit?startDate=2024-01-01&endDate=2024-01-31

# Get policy statistics
GET /api/permission-policy/stats

# Health check
GET /api/permission-policy/health
```

## Usage with Frontend

This backend plugin works seamlessly with the corresponding frontend plugin:

```typescript
// Frontend usage example
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityDeletePermission } from '@backstage/plugin-catalog-common';

const MyComponent = () => {
  const { allowed } = usePermission({
    permission: catalogEntityDeletePermission,
    resourceRef: 'component:default/my-service',
  });

  return (
    <div>
      {allowed && (
        <Button onClick={handleDelete}>
          Delete Entity
        </Button>
      )}
    </div>
  );
};
```

## Custom Policy Rules

### Creating Custom Rules

Define custom policy rules for your organization:

```typescript
// packages/backend/src/policies/customRules.ts
import { PolicyRule } from '@internal/plugin-permission-policy-backend-backend';

export const isBusinessHours: PolicyRule = {
  name: 'is-business-hours',
  description: 'Check if current time is within business hours',
  evaluate: async (context) => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Business hours: Monday-Friday, 9 AM - 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }
};

export const isTeamMember: PolicyRule = {
  name: 'is-team-member',
  description: 'Check if user is member of specified team',
  evaluate: async (context) => {
    const { user, params, catalogApi } = context;
    const teamName = params.team;
    
    const userEntity = await catalogApi.getEntityByRef(user.entityRef);
    const userGroups = userEntity?.relations?.memberOf || [];
    
    return userGroups.some(group => 
      group.targetRef === `group:default/${teamName}`
    );
  }
};
```

### Registering Custom Rules

```typescript
// packages/backend/src/plugins/permission-policy.ts
import { createRouter } from '@internal/plugin-permission-policy-backend-backend';
import { isBusinessHours, isTeamMember } from '../policies/customRules';

export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    // ... other config
    customRules: [isBusinessHours, isTeamMember],
  });
}
```

## Database Schema

The plugin creates the following database tables:

```sql
-- Policies table
CREATE TABLE permission_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  permission VARCHAR(255) NOT NULL,
  policy VARCHAR(50) NOT NULL CHECK (policy IN ('allow', 'deny', 'conditional')),
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles table
CREATE TABLE permission_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Role assignments table
CREATE TABLE permission_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES permission_roles(id) ON DELETE CASCADE,
  principal VARCHAR(255) NOT NULL,
  principal_type VARCHAR(50) NOT NULL CHECK (principal_type IN ('user', 'group')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, principal)
);

-- Audit logs table
CREATE TABLE permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref VARCHAR(255) NOT NULL,
  permission VARCHAR(255) NOT NULL,
  resource_ref VARCHAR(255),
  decision VARCHAR(50) NOT NULL CHECK (decision IN ('allow', 'deny')),
  reason TEXT,
  context JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_policies_permission ON permission_policies(permission);
CREATE INDEX idx_role_assignments_principal ON permission_role_assignments(principal);
CREATE INDEX idx_audit_logs_user_timestamp ON permission_audit_logs(user_ref, timestamp);
CREATE INDEX idx_audit_logs_permission_timestamp ON permission_audit_logs(permission, timestamp);
```

## Performance Optimization

### Caching Strategy

The plugin implements multi-level caching:

```yaml
# app-config.yaml
permissionPolicy:
  cache:
    # Policy cache settings
    policies:
      ttl: '15m'
      maxSize: 1000
    
    # Role cache settings
    roles:
      ttl: '30m'
      maxSize: 500
    
    # User permission cache
    userPermissions:
      ttl: '5m'
      maxSize: 10000
    
    # Evaluation result cache
    evaluations:
      ttl: '1m'
      maxSize: 50000
```

### Database Optimization

Recommended database optimizations:

```sql
-- Additional indexes for complex queries
CREATE INDEX idx_policies_conditions_gin ON permission_policies USING GIN (conditions);
CREATE INDEX idx_roles_permissions_gin ON permission_roles USING GIN (permissions);

-- Partitioning audit logs by date
CREATE TABLE permission_audit_logs_y2024m01 PARTITION OF permission_audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Monitoring and Observability

### Metrics

The plugin exposes these metrics:

- `permission_policy_evaluations_total`: Total number of permission evaluations
- `permission_policy_evaluation_duration`: Time taken for permission evaluations
- `permission_policy_cache_hits_total`: Cache hit count
- `permission_policy_cache_misses_total`: Cache miss count
- `permission_policy_policy_loads_total`: Policy loading count

### Health Checks

```http
GET /api/permission-policy/health
```

Response:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "externalIntegrations": "ok"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Security Considerations

### Best Practices

- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Regular Audits**: Review and audit permission assignments regularly
- **Secure Defaults**: Use deny-by-default policies
- **Separation of Duties**: Separate administrative and operational permissions
- **Input Validation**: Validate all policy inputs and conditions

### Security Configuration

```yaml
# app-config.yaml
permissionPolicy:
  security:
    # Encrypt sensitive policy data
    encryption:
      enabled: true
      algorithm: 'aes-256-gcm'
      keyRotation: '30d'
    
    # Rate limiting
    rateLimit:
      enabled: true
      maxRequests: 100
      windowMs: 60000
    
    # CORS configuration
    cors:
      origin: ['https://backstage.company.com']
      credentials: true
```

## Troubleshooting

### Common Issues

**Permission Denied Errors**
- Check policy configuration and user role assignments
- Verify policy conditions are correctly defined
- Review audit logs for decision reasoning

**Performance Issues**
- Enable caching for frequently evaluated permissions
- Optimize database queries with proper indexes
- Consider policy simplification for complex rules

**Integration Failures**
- Verify external system connectivity (LDAP, OAuth)
- Check authentication credentials and timeouts
- Monitor integration health endpoints

### Debug Mode

Enable debug mode for detailed logging:

```yaml
# app-config.yaml
permissionPolicy:
  debug: true
  logLevel: debug
  tracing:
    enabled: true
    jaegerEndpoint: 'http://jaeger:14268/api/traces'
```

## Development

### Local Development

Run the plugin in standalone mode:

```bash
# From the plugin directory
cd plugins/permission-policy-backend-backend
yarn start
```

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# Load tests
yarn test:load
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with comprehensive tests
4. Update documentation and examples
5. Submit a pull request

## License

This plugin is licensed under the Apache License 2.0.
