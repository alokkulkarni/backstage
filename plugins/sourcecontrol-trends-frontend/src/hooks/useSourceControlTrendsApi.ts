import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../api';

export function useSourceControlTrendsApi() {
  return useApi(sourceControlTrendsApiRef);
}
