import { ConfigApi, DiscoveryApi } from '@backstage/core-plugin-api';
import {
  SourceControlTrendsApi,
  SourceControlRepository,
  SourceControlBenchmark,
  SourceControlMetrics,
  SourceControlComplianceReport,
  SourceControlPullRequest,
  SourceControlVulnerability,
  ApiListResponse,
  RepositoryFilter,
  MetricsFilter,
  ComplianceFilter,
  VulnerabilityFilter,
  PullRequestFilter,
  DashboardOverview,
  DashboardTrends,
} from '../types';

export class SourceControlTrendsApiClient implements SourceControlTrendsApi {
  private readonly discoveryApi: DiscoveryApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    configApi: ConfigApi;
  }) {
    this.discoveryApi = options.discoveryApi;
  }

  private async getBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('sourcecontrol-trends')}/`;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  // Repositories
  async getRepositories(filter?: RepositoryFilter): Promise<ApiListResponse<SourceControlRepository>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`repositories${queryString}`);
  }

  async getRepository(id: string): Promise<SourceControlRepository> {
    return this.request(`repositories/${id}`);
  }

  // Metrics
  async getMetrics(filter?: MetricsFilter): Promise<ApiListResponse<SourceControlMetrics>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`metrics${queryString}`);
  }

  async getRepositoryMetrics(
    id: string, 
    filter?: { startDate?: string; endDate?: string }
  ): Promise<SourceControlMetrics[]> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`repositories/${id}/metrics${queryString}`);
  }

  // Compliance
  async getComplianceReports(filter?: ComplianceFilter): Promise<ApiListResponse<SourceControlComplianceReport>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`compliance/reports${queryString}`);
  }

  async getRepositoryComplianceReport(id: string): Promise<SourceControlComplianceReport> {
    return this.request(`repositories/${id}/compliance`);
  }

  // Benchmarks
  async getBenchmarks(): Promise<ApiListResponse<SourceControlBenchmark>> {
    return this.request('benchmarks');
  }

  async getBenchmark(metric: string): Promise<SourceControlBenchmark> {
    return this.request(`benchmarks/${metric}`);
  }

  async createBenchmark(data: Partial<SourceControlBenchmark>): Promise<SourceControlBenchmark> {
    return this.request('benchmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBenchmark(
    metric: string, 
    data: Partial<SourceControlBenchmark>
  ): Promise<SourceControlBenchmark> {
    return this.request(`benchmarks/${metric}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBenchmark(metric: string): Promise<boolean> {
    try {
      await this.request(`benchmarks/${metric}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Vulnerabilities and PRs
  async getRepositoryVulnerabilities(
    id: string, 
    filter?: VulnerabilityFilter
  ): Promise<ApiListResponse<SourceControlVulnerability>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`repositories/${id}/vulnerabilities${queryString}`);
  }

  async getRepositoryPullRequests(
    id: string, 
    filter?: PullRequestFilter
  ): Promise<ApiListResponse<SourceControlPullRequest>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`repositories/${id}/pull-requests${queryString}`);
  }

  // Dashboard
  async getDashboardOverview(owner?: string): Promise<DashboardOverview> {
    const queryString = owner ? `?${this.buildQueryString({ owner })}` : '';
    return this.request(`dashboard/overview${queryString}`);
  }

  async getDashboardTrends(owner?: string, days?: number): Promise<DashboardTrends> {
    const params: any = {};
    if (owner) params.owner = owner;
    if (days) params.days = days;
    
    const queryString = Object.keys(params).length > 0 ? `?${this.buildQueryString(params)}` : '';
    return this.request(`dashboard/trends${queryString}`);
  }

  // Data refresh
  async refreshData(repositoryId?: string, force?: boolean): Promise<{ success: boolean; message: string }> {
    const body: any = {};
    if (repositoryId) body.repositoryId = repositoryId;
    if (force) body.force = force;

    return this.request('refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getRefreshStatus(): Promise<{ status: string; lastRefresh?: string; nextRefresh?: string }> {
    return this.request('refresh/status');
  }

  // Data source
  async getDataSourceInfo(): Promise<{ useMockData: boolean; dataSource: string }> {
    return this.request('datasource');
  }

  // User-specific methods
  async getUserOrganizations(): Promise<ApiListResponse<string>> {
    return this.request('user/organizations');
  }

  async getUserRepositories(filter?: RepositoryFilter): Promise<ApiListResponse<SourceControlRepository>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`user/repositories${queryString}`);
  }

  async getRepositoriesForOrganization(
    organization: string, 
    filter?: RepositoryFilter
  ): Promise<ApiListResponse<SourceControlRepository>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`organizations/${organization}/repositories${queryString}`);
  }

  async getUserRepositoryMetrics(
    id: string, 
    filter?: { startDate?: string; endDate?: string }
  ): Promise<SourceControlMetrics[]> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`user/repositories/${id}/metrics${queryString}`);
  }

  async getUserComplianceReports(filter?: ComplianceFilter): Promise<ApiListResponse<SourceControlComplianceReport>> {
    const queryString = filter ? `?${this.buildQueryString(filter)}` : '';
    return this.request(`user/compliance/reports${queryString}`);
  }
}
