import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const testBackstagePluginPlugin = createPlugin({
  id: 'test-backstage-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export const TestBackstagePluginPage = testBackstagePluginPlugin.provide(
  createRoutableExtension({
    name: 'TestBackstagePluginPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
