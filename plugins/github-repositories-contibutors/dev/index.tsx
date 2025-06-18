import { createDevApp } from '@backstage/dev-utils';
import { githubRepositoriesContibutorsPlugin, GithubRepositoriesContibutorsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(githubRepositoriesContibutorsPlugin)
  .addPage({
    element: <GithubRepositoriesContibutorsPage />,
    title: 'Root Page',
    path: '/github-repositories-contibutors',
  })
  .render();
