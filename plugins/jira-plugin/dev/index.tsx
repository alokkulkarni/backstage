import { createDevApp } from '@backstage/dev-utils';
import { jiraPluginPlugin, JiraPluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(jiraPluginPlugin)
  .addPage({
    element: <JiraPluginPage />,
    title: 'Root Page',
    path: '/jira-plugin',
  })
  .render();
