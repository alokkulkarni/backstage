# Jira Trends Frontend Plugin

A comprehensive Backstage frontend plugin that provides rich visualizations and analytics dashboards for Jira project data, enabling teams to track performance, identify bottlenecks, and make data-driven decisions.

## Features

- **Interactive Dashboards**: Rich, interactive charts and visualizations for Jira data
- **Velocity Tracking**: Sprint velocity charts and team performance metrics
- **Burndown Charts**: Real-time sprint and epic burndown visualizations
- **Issue Lifecycle Analysis**: Track issue flow through your workflow stages
- **Custom Metrics**: Configurable KPIs and performance indicators
- **Trend Analysis**: Historical trend analysis with predictive insights
- **Multi-Project Support**: Compare metrics across multiple Jira projects
- **Export Capabilities**: Export charts and data for reporting
- **Responsive Design**: Mobile-friendly responsive interface
- **Real-time Updates**: Live data updates with WebSocket support

## Installation

### 1. Install the Plugin

Add the frontend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-jira-trends-frontend
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { jiraTrendsFrontendPlugin } from '@internal/plugin-jira-trends-frontend';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { JiraTrendsPage } from '@internal/plugin-jira-trends-frontend';

// Add to your app routes
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/jira-trends" element={<JiraTrendsPage />} />
  </FlatRoutes>
);
```

### 4. Add to Navigation

Add Jira Trends to your sidebar navigation:

```typescript
// packages/app/src/components/Root/Root.tsx
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ...existing items... */}
      <SidebarItem icon={TrendingUpIcon} to="jira-trends" text="Jira Trends" />
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Prerequisites

This frontend plugin requires the corresponding backend plugin to be installed and configured:

```bash
# Install the backend plugin
yarn add --cwd packages/backend @internal/plugin-jira-trends-backend
```

See the [Jira Trends Backend Plugin README](../jira-trends-backend/README.md) for backend setup instructions.

## Configuration

### Frontend Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
jiraTrends:
  # Frontend specific settings
  frontend:
    # Default project to load
    defaultProject: 'MYPROJ'
    # Chart refresh interval (in seconds)
    refreshInterval: 300
    # Number of sprints to show in velocity charts
    defaultSprintCount: 10
    # Default date range for trend analysis (in days)
    defaultDateRange: 90
    # Enable real-time updates
    realTimeUpdates: true
    
  # Chart configuration
  charts:
    # Color scheme for charts
    colorScheme: 'default' # options: default, dark, colorful
    # Animation settings
    animations: true
    # Export formats
    exportFormats: ['png', 'svg', 'pdf', 'csv']
    
  # Dashboard layout
  dashboard:
    # Default widgets to show
    defaultWidgets:
      - 'velocity-chart'
      - 'burndown-chart'
      - 'issue-trends'
      - 'cycle-time'
    # Allow widget customization
    customizable: true
```

## Usage

### Homepage Integration

Add Jira Trends components to your Backstage homepage:

```tsx
// packages/app/src/components/home/HomePage.tsx
import { Grid } from '@material-ui/core';
import {
  VelocityCard,
  IssueTrendsCard,
  BurndownCard,
  CycleTimeCard
} from '@internal/plugin-jira-trends-frontend';

export const homePage = (
  <Page themeId="home">
    <Header title="Welcome to Backstage" />
    <Content>
      <Grid container spacing={3}>
        {/* Velocity Metrics */}
        <Grid item xs={12} md={6}>
          <VelocityCard project="MYPROJ" />
        </Grid>
        
        {/* Issue Trends */}
        <Grid item xs={12} md={6}>
          <IssueTrendsCard project="MYPROJ" />
        </Grid>
        
        {/* Sprint Burndown */}
        <Grid item xs={12} md={6}>
          <BurndownCard sprintId="123" />
        </Grid>
        
        {/* Cycle Time Analysis */}
        <Grid item xs={12} md={6}>
          <CycleTimeCard project="MYPROJ" />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
```

### Entity Integration

Add trend data to your entity pages:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Link to Jira project for trends
    jira-trends.io/project-key: "MYPROJ"
    # Specify relevant metrics
    jira-trends.io/metrics: "velocity,cycle-time,defect-rate"
spec:
  type: service
  lifecycle: production
```

```tsx
// Custom entity page with trends
import { EntityLayout } from '@backstage/plugin-catalog';
import { JiraTrendsContent } from '@internal/plugin-jira-trends-frontend';

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {/* Service overview content */}
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/jira-trends" title="Jira Trends">
      <JiraTrendsContent />
    </EntityLayout.Route>
  </EntityLayout>
);
```

### Available Components

#### Chart Components
- **`VelocityChart`**: Sprint velocity visualization with trend lines
- **`BurndownChart`**: Sprint/Epic burndown with ideal and actual progress
- **`CycleTimeChart`**: Issue cycle time analysis and distribution
- **`CumulativeFlowChart`**: Work in progress and flow metrics
- **`ThroughputChart`**: Issue completion rate over time

#### Card Components
- **`VelocityCard`**: Compact velocity metrics card
- **`IssueTrendsCard`**: Issue creation/resolution trends
- **`BurndownCard`**: Current sprint burndown summary
- **`CycleTimeCard`**: Average cycle time metrics
- **`DefectRateCard`**: Bug ratio and quality metrics

#### Dashboard Components
- **`JiraTrendsPage`**: Full dashboard page with all charts
- **`JiraTrendsContent`**: Content component for entity pages
- **`ProjectSelector`**: Project selection dropdown
- **`DateRangePicker`**: Date range selection component

## API Reference

The plugin exposes the following components and APIs:

```typescript
import {
  jiraTrendsFrontendPlugin,
  JiraTrendsPage,
  JiraTrendsContent,
  VelocityChart,
  BurndownChart,
  CycleTimeChart,
  VelocityCard,
  IssueTrendsCard,
  BurndownCard,
  jiraTrendsApiRef,
  type JiraTrendsApi,
  type VelocityData,
  type BurndownData,
  type TrendData
} from '@internal/plugin-jira-trends-frontend';
```

### Custom Component Example

```tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { jiraTrendsApiRef, VelocityChart } from '@internal/plugin-jira-trends-frontend';

const CustomVelocityDashboard = ({ projectKey }: { projectKey: string }) => {
  const jiraTrendsApi = useApi(jiraTrendsApiRef);
  const [velocityData, setVelocityData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await jiraTrendsApi.getVelocity({
        project: projectKey,
        sprintCount: 10
      });
      setVelocityData(data);
    };
    
    fetchData();
  }, [projectKey, jiraTrendsApi]);

  return (
    <Card>
      <CardHeader title="Team Velocity" />
      <CardContent>
        {velocityData && (
          <VelocityChart 
            data={velocityData}
            showTrendLine
            showAverage
            height={300}
          />
        )}
      </CardContent>
    </Card>
  );
};
```

## Advanced Configuration

### Custom Themes

Configure custom chart themes:

```typescript
// packages/app/src/themes/jiraTrendsTheme.ts
import { createTheme } from '@material-ui/core/styles';

export const jiraTrendsTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  charts: {
    colors: [
      '#1976d2', '#dc004e', '#00acc1', '#ff6f00',
      '#7b1fa2', '#388e3c', '#f57c00', '#5d4037'
    ],
    grid: {
      color: '#e0e0e0',
    },
    tooltip: {
      backgroundColor: '#fafafa',
      borderColor: '#e0e0e0',
    }
  }
});
```

### Widget Customization

Create custom dashboard widgets:

```tsx
import React from 'react';
import { Widget } from '@internal/plugin-jira-trends-frontend';

const CustomMetricWidget = ({ project }: { project: string }) => {
  return (
    <Widget
      title="Custom Metric"
      subtitle="Your custom business metric"
      size="medium"
    >
      {/* Your custom metric visualization */}
    </Widget>
  );
};

// Register the widget
import { widgetRegistry } from '@internal/plugin-jira-trends-frontend';

widgetRegistry.register('custom-metric', {
  component: CustomMetricWidget,
  title: 'Custom Metric',
  description: 'Shows custom business metrics',
  defaultSize: 'medium',
  configurable: true,
});
```

### Data Transformation

Configure custom data transformations:

```typescript
// Custom data transformer
import { DataTransformer } from '@internal/plugin-jira-trends-frontend';

const customTransformer: DataTransformer = {
  transformVelocityData: (data) => {
    // Custom transformation logic
    return data.map(point => ({
      ...point,
      normalizedValue: point.value / point.capacity
    }));
  },
  
  transformBurndownData: (data) => {
    // Custom burndown calculations
    return {
      ...data,
      predictedCompletion: calculatePredictedCompletion(data)
    };
  }
};

// Apply transformer
import { setDataTransformer } from '@internal/plugin-jira-trends-frontend';
setDataTransformer(customTransformer);
```

## Performance Optimization

### Lazy Loading

Components support lazy loading for better performance:

```tsx
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@material-ui/core';

const JiraTrendsPage = lazy(() => 
  import('@internal/plugin-jira-trends-frontend').then(m => ({ 
    default: m.JiraTrendsPage 
  }))
);

const LazyJiraTrends = () => (
  <Suspense fallback={<CircularProgress />}>
    <JiraTrendsPage />
  </Suspense>
);
```

### Caching Configuration

Configure client-side caching:

```typescript
// packages/app/src/App.tsx
import { JiraTrendsApi, createJiraTrendsApi } from '@internal/plugin-jira-trends-frontend';

const app = createApp({
  apis: [
    createApiFactory({
      api: jiraTrendsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        createJiraTrendsApi({
          discoveryApi,
          fetchApi,
          cache: {
            ttl: 300, // 5 minutes
            maxSize: 100, // Maximum cache entries
          }
        }),
    }),
  ],
});
```

## Troubleshooting

### Common Issues

**Charts Not Loading**
- Verify backend plugin is installed and running
- Check API connectivity between frontend and backend
- Ensure proper CORS configuration

**Performance Issues**
- Enable caching for frequently accessed data
- Consider lazy loading for large datasets
- Optimize chart rendering with appropriate data limits

**Theme Issues**
- Check Material-UI theme compatibility
- Verify custom theme configuration
- Ensure chart colors are properly defined

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
localStorage.setItem('jira-trends-debug', 'true');

// View debug information
console.log('Jira Trends Debug Info:', window.jiraTrendsDebug);
```

### Network Monitoring

Monitor API requests:

```typescript
// Add request interceptor
import { interceptApiRequests } from '@internal/plugin-jira-trends-frontend';

interceptApiRequests((request, response) => {
  console.log('API Request:', request);
  console.log('API Response:', response);
});
```

## Development

### Local Development

Run the plugin in isolation for development:

```bash
# From the plugin directory
cd plugins/jira-trends-frontend
yarn start
```

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

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Optimize chart data before rendering
- Use virtual scrolling for large datasets

### Accessibility
- Ensure charts have proper ARIA labels
- Provide alternative text for visual data
- Support keyboard navigation
- Use sufficient color contrast

### User Experience
- Provide clear loading indicators
- Show meaningful error messages
- Implement proper empty states
- Enable data export capabilities

## License

This plugin is licensed under the Apache License 2.0.
