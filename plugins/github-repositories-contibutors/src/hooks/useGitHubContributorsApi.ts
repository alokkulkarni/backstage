import { useApi } from '@backstage/core-plugin-api';
import { githubContributorsApiRef } from '../api';

export function useGitHubContributorsApi() {
  return useApi(githubContributorsApiRef);
}
