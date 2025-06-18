import { createDevApp } from '@backstage/dev-utils';
import { testBackstagePluginPlugin, TestBackstagePluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(testBackstagePluginPlugin)
  .addPage({
    element: <TestBackstagePluginPage />,
    title: 'Root Page',
    path: '/test-backstage-plugin',
  })
  .render();
