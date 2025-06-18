# Test Backstage Plugin

A comprehensive testing and development plugin for Backstage that provides essential utilities for plugin development, testing workflows, and system validation. This plugin serves as both a testing tool and a reference implementation for Backstage plugin development best practices.

## Features

- **Plugin Development Testing**: Complete testing framework for Backstage plugin development
- **Component Library**: Reusable test components and utilities for other plugins
- **API Testing Tools**: Utilities for testing backend APIs and integrations
- **Mock Data Providers**: Configurable mock data for development and testing scenarios
- **Performance Testing**: Built-in performance benchmarking and monitoring tools
- **Integration Testing**: End-to-end testing capabilities for complex workflows
- **Development Utilities**: Debugging tools and development helpers
- **Reference Implementation**: Best practices demonstration for plugin architecture

## Installation

### 1. Install the Plugin

Add the plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-test-backstage-plugin
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { testBackstagePluginPlugin } from '@internal/plugin-test-backstage-plugin';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { TestBackstagePluginPage } from '@internal/plugin-test-backstage-plugin';

// Add to your app routes
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/test-backstage-plugin" element={<TestBackstagePluginPage />} />
  </FlatRoutes>
);
```

### 4. Add to Navigation (Development Only)

Add the test plugin to your sidebar navigation for development:

```typescript
// packages/app/src/components/Root/Root.tsx
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import BugReportIcon from '@material-ui/icons/BugReport';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ...existing items... */}
      {process.env.NODE_ENV === 'development' && (
        <SidebarItem icon={BugReportIcon} to="test-backstage-plugin" text="Test Plugin" />
      )}
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Configuration

### Development Configuration

Configure the test plugin for development use in `app-config.yaml`:

```yaml
# app-config.yaml
testBackstagePlugin:
  # Enable/disable the plugin
  enabled: true
  
  # Development features
  development:
    # Enable debug mode
    debug: true
    # Show performance metrics
    showPerformanceMetrics: true
    # Enable mock data
    enableMockData: true
    
  # Testing configuration
  testing:
    # Mock data configuration
    mockData:
      # Number of mock entities to generate
      entityCount: 100
      # Mock API response delay (ms)
      apiDelay: 200
      # Enable random errors for testing
      enableRandomErrors: false
      
    # Performance testing
    performance:
      # Enable performance monitoring
      enabled: true
      # Sampling rate (0-1)
      samplingRate: 0.1
      # Performance thresholds
      thresholds:
        componentRender: 100  # ms
        apiResponse: 500      # ms
        pageLoad: 1000       # ms
        
  # Integration testing
  integration:
    # Test endpoints
    endpoints:
      catalog: '/api/catalog'
      auth: '/api/auth'
      proxy: '/api/proxy'
    # Test scenarios
    scenarios:
      - name: 'catalog-read'
        description: 'Test catalog read operations'
        enabled: true
      - name: 'auth-flow'
        description: 'Test authentication flow'
        enabled: true
```

### Production Configuration

For production environments, disable or restrict the plugin:

```yaml
# app-config.production.yaml
testBackstagePlugin:
  enabled: false
  
# Alternative: Enable only for admin users
testBackstagePlugin:
  enabled: true
  access:
    restrictToRoles: ['admin', 'developer']
    restrictToUsers: ['admin@company.com']
```

## Usage

### Development Testing

Use the plugin for development and testing scenarios:

```typescript
// Example component testing
import { TestUtils } from '@internal/plugin-test-backstage-plugin';

const MyComponentTest = () => {
  const { mockCatalogApi, mockAuthApi } = TestUtils.createMockApis();
  
  return (
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <MyComponent />
    </TestApiProvider>
  );
};
```

### Performance Monitoring

Monitor plugin performance during development:

```typescript
import { PerformanceMonitor } from '@internal/plugin-test-backstage-plugin';

const MyComponent = () => {
  const monitor = PerformanceMonitor.usePerformanceMonitor('MyComponent');
  
  useEffect(() => {
    monitor.startTiming('data-fetch');
    
    fetchData().then(() => {
      monitor.endTiming('data-fetch');
    });
  }, []);
  
  return <div>My Component</div>;
};
```

### Mock Data Generation

Generate mock data for testing:

```typescript
import { MockDataGenerator } from '@internal/plugin-test-backstage-plugin';

const mockEntities = MockDataGenerator.generateCatalogEntities({
  count: 50,
  types: ['Component', 'API', 'Resource'],
  randomizeOwners: true,
});

const mockUsers = MockDataGenerator.generateUsers({
  count: 10,
  includeGroups: true,
});
```

## Available Components

### Testing Components
- **`TestBackstagePluginPage`**: Main testing dashboard and utilities page
- **`MockDataViewer`**: Browse and manage generated mock data
- **`PerformanceMonitor`**: Real-time performance monitoring interface
- **`APITester`**: Interactive API testing and debugging tool
- **`ComponentPlayground`**: Test and preview Backstage components

### Utility Components
- **`DebugPanel`**: Debug information display for development
- **`ErrorBoundaryTester`**: Test error boundary implementations
- **`ThemeTester`**: Test plugin components with different themes
- **`ResponsiveTester`**: Test responsive design across different screen sizes

### Mock Providers
- **`MockCatalogProvider`**: Mock catalog API implementation
- **`MockAuthProvider`**: Mock authentication API implementation
- **`MockConfigProvider`**: Mock configuration API implementation

## API Reference

The plugin exposes the following APIs and utilities:

```typescript
import {
  testBackstagePluginPlugin,
  TestBackstagePluginPage,
  TestUtils,
  MockDataGenerator,
  PerformanceMonitor,
  APITester,
  type TestConfiguration,
  type MockDataOptions,
  type PerformanceMetrics
} from '@internal/plugin-test-backstage-plugin';
```

### Test Utilities

```typescript
// Create mock APIs for testing
const mockApis = TestUtils.createMockApis({
  catalogApi: {
    entities: mockEntities,
    responseDelay: 100,
  },
  authApi: {
    mockUser: mockUser,
    authenticated: true,
  },
});

// Create test wrappers
const TestWrapper = TestUtils.createTestWrapper({
  apis: mockApis,
  theme: 'light',
  config: mockConfig,
});

// Utilities for component testing
const { waitForElement, fireEvent, screen } = TestUtils.testingLibrary;
```

### Performance Monitoring

```typescript
// Component-level performance monitoring
const useComponentPerformance = (componentName: string) => {
  const monitor = PerformanceMonitor.usePerformanceMonitor(componentName);
  
  return {
    startTiming: monitor.startTiming,
    endTiming: monitor.endTiming,
    getMetrics: monitor.getMetrics,
    reset: monitor.reset,
  };
};

// Global performance tracking
PerformanceMonitor.trackGlobalPerformance({
  pageLoad: true,
  componentRender: true,
  apiCalls: true,
});
```

## Development Features

### Hot Reload Testing

Test hot reload functionality during development:

```typescript
// Enable hot reload for specific components
if (process.env.NODE_ENV === 'development') {
  TestUtils.enableHotReload(['MyComponent', 'AnotherComponent']);
}
```

### Error Simulation

Simulate errors for testing error boundaries:

```typescript
import { ErrorSimulator } from '@internal/plugin-test-backstage-plugin';

const TestComponent = () => {
  const simulateError = ErrorSimulator.useErrorSimulator();
  
  return (
    <button onClick={() => simulateError('network-error')}>
      Simulate Network Error
    </button>
  );
};
```

### State Management Testing

Test state management and context providers:

```typescript
import { StateTestUtils } from '@internal/plugin-test-backstage-plugin';

const testStateChanges = StateTestUtils.createStateTest({
  initialState: { count: 0 },
  actions: [
    { type: 'increment' },
    { type: 'decrement' },
  ],
  expectedFinalState: { count: 0 },
});
```

## Best Practices

### Testing Guidelines

1. **Component Testing**: Use the provided test utilities for consistent component testing
2. **API Mocking**: Leverage mock providers for reliable API testing
3. **Performance Testing**: Monitor performance during development to catch regressions early
4. **Error Testing**: Test error scenarios using the error simulation tools
5. **Accessibility Testing**: Use built-in accessibility testing utilities

### Development Workflow

1. **Setup**: Configure the test plugin in your development environment
2. **Mock Data**: Generate appropriate mock data for your testing scenarios
3. **Component Development**: Use the component playground for iterative development
4. **Performance Monitoring**: Enable performance monitoring during development
5. **Integration Testing**: Use the API tester for backend integration validation

## Security Considerations

### Production Safety

- **Disable in Production**: Ensure the plugin is disabled in production environments
- **Access Control**: Restrict access to authorized users only
- **Data Security**: Mock data should not contain real sensitive information
- **Audit Logging**: Monitor usage in development environments

### Development Security

```yaml
# Secure development configuration
testBackstagePlugin:
  security:
    # Restrict to development environment
    allowedEnvironments: ['development', 'staging']
    # Require authentication
    requireAuth: true
    # Log all activities
    auditLogging: true
    # Disable sensitive features
    disableSensitiveFeatures: true
```

## Troubleshooting

### Common Issues

**Plugin Not Loading**
- Verify the plugin is properly installed and configured
- Check console for JavaScript errors
- Ensure the route is correctly configured

**Mock Data Issues**
- Verify mock data configuration is correct
- Check that mock APIs are properly initialized
- Ensure data generators are working correctly

**Performance Issues**
- Check performance monitoring configuration
- Verify that performance thresholds are reasonable
- Monitor memory usage during testing

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
localStorage.setItem('test-backstage-plugin-debug', 'true');

// View debug information
console.log('Test Plugin Debug Info:', window.testBackstagePluginDebug);
```

## Development

### Local Development

Run the plugin in isolation for development:

```bash
# From the plugin directory
cd plugins/test-backstage-plugin
yarn start
```

This provides faster iteration with hot reloads and isolated testing.

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# Performance tests
yarn test:performance
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with comprehensive tests
4. Update documentation and examples
5. Submit a pull request

## License

This plugin is licensed under the Apache License 2.0.
