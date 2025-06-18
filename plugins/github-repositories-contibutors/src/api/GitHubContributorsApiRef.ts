import { createApiRef } from '@backstage/core-plugin-api';
import { GitHubContributorsApi } from './types';

export const githubContributorsApiRef = createApiRef<GitHubContributorsApi>({
  id: 'plugin.github-repositories-contributors.service',
});
