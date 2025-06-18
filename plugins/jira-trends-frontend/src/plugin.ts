import { 
  createPlugin, 
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { jiraTrendsRouteRef } from './routes';
import { jiraTrendsApiRef } from './api';
import { JiraTrendsApiClient } from './api/JiraTrendsApi';

export const jiraTrendsFrontendPlugin = createPlugin({
  id: 'jira-trends-frontend',
  routes: {
    root: jiraTrendsRouteRef,
  },
  apis: [
    createApiFactory({
      api: jiraTrendsApiRef,
      deps: { 
        discoveryApi: discoveryApiRef, 
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new JiraTrendsApiClient(discoveryApi, fetchApi),
    }),
  ],
});

// Export the component directly instead of using createRoutableExtension
export { JiraTrendsDashboard as JiraTrendsPage } from './pages/JiraTrendsDashboard';
