import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import type { 
  SprintMetrics, 
  SprintComplianceReport, 
  JiraBoard, 
  HealthStatus, 
  SprintBenchmark,
  TrendData,
  ComplianceChartData,
  FilterOptions 
} from '../types/index';
import type { JiraTrendsApi } from './index';

export class JiraTrendsApiClient implements JiraTrendsApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  private async getBaseUrl(): Promise<string> {
    const baseUrl = await this.discoveryApi.getBaseUrl('jira-trends');
    return baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10 second timeout
    
    try {
      const response = await this.fetchApi.fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        // Handle specific HTTP status codes
        if (response.status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): ${errorText || 'Internal server error'}`);
        } else {
          throw new Error(`API request failed (${response.status}): ${errorText}`);
        }
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out - please try again');
      }
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Boards
  async getBoards(): Promise<JiraBoard[]> {
    return this.request<JiraBoard[]>('/boards');
  }

  // Sprint metrics
  async getSprintMetrics(filters?: FilterOptions): Promise<SprintMetrics[]> {
    const params = new URLSearchParams();
    
    if (filters?.boardId) {
      params.append('boardId', filters.boardId.toString());
    }
    
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `/sprint-metrics${queryString ? `?${queryString}` : ''}`;
    
    // Backend returns a paginated response, extract the metrics array
    const response = await this.request<{
      metrics: SprintMetrics[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>(endpoint);
    
    return response.metrics;
  }

  async getSprintMetricsById(sprintId: number): Promise<SprintMetrics> {
    return this.request<SprintMetrics>(`/sprint-metrics/${sprintId}`);
  }

  // Compliance Reports
  async getComplianceReports(filters?: FilterOptions): Promise<SprintComplianceReport[]> {
    const params = new URLSearchParams();
    
    if (filters?.boardId) {
      params.append('boardId', filters.boardId.toString());
    }
    
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `/compliance-reports${queryString ? `?${queryString}` : ''}`;
    
    return this.request<SprintComplianceReport[]>(endpoint);
  }

  async getComplianceReportById(sprintId: number): Promise<SprintComplianceReport> {
    return this.request<SprintComplianceReport>(`/compliance-reports/${sprintId}`);
  }

  // Benchmarks
  async getBenchmarks(): Promise<SprintBenchmark[]> {
    return this.request<SprintBenchmark[]>('/benchmarks');
  }

  // Trends data
  async getTrends(filters?: FilterOptions): Promise<TrendData[]> {
    const params = new URLSearchParams();
    
    if (filters?.boardId) {
      params.append('boardId', filters.boardId.toString());
    }
    
    if (filters?.dateRange) {
      const days = Math.ceil((new Date(filters.dateRange.to).getTime() - new Date(filters.dateRange.from).getTime()) / (1000 * 60 * 60 * 24));
      params.append('days', days.toString());
    }

    const queryString = params.toString();
    const endpoint = `/trends${queryString ? `?${queryString}` : ''}`;
    
    return this.request<TrendData[]>(endpoint);
  }

  async getComplianceTrends(filters?: FilterOptions): Promise<ComplianceChartData[]> {
    const params = new URLSearchParams();
    
    if (filters?.boardId) {
      params.append('boardId', filters.boardId.toString());
    }
    
    if (filters?.dateRange) {
      const days = Math.ceil((new Date(filters.dateRange.to).getTime() - new Date(filters.dateRange.from).getTime()) / (1000 * 60 * 60 * 24));
      params.append('days', days.toString());
    }

    const queryString = params.toString();
    const endpoint = `/compliance-trends${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ComplianceChartData[]>(endpoint);
  }

  // Data refresh
  async refreshAllData(): Promise<void> {
    await this.request<{ success: boolean }>('/refresh/all', {
      method: 'POST',
    });
  }

  async refreshBoardData(boardId?: number): Promise<void> {
    await this.request<{ success: boolean }>('/refresh/board', {
      method: 'POST',
      body: JSON.stringify({ boardId }),
    });
  }

  async getRefreshStatus(): Promise<{
    isRefreshing: boolean;
    lastRefresh?: string;
    schedule?: string;
    isScheduled: boolean;
  }> {
    return this.request('/refresh/status');
  }
}
