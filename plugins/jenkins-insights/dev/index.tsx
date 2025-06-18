import { createDevApp } from '@backstage/dev-utils';
import { jenkinsInsightsPlugin, JenkinsInsightsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(jenkinsInsightsPlugin)
  .addPage({
    element: <JenkinsInsightsPage />,
    title: 'Root Page',
    path: '/jenkins-insights',
  })
  .render();
