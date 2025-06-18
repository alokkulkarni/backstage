import { createApiRef } from '@backstage/core-plugin-api';
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

export const jiraTrendsApiRef = createApiRef<JiraTrendsApi>({
  id: 'plugin.jira-trends.service',
});

export interface JiraTrendsApi {
  // Health check
  getHealth(): Promise<HealthStatus>;
  
  // Boards
  getBoards(): Promise<JiraBoard[]>;
  
  // Sprint metrics
  getSprintMetrics(filters?: FilterOptions): Promise<SprintMetrics[]>;
  getSprintMetricsById(sprintId: number): Promise<SprintMetrics>;
  
  // Compliance reports
  getComplianceReports(filters?: FilterOptions): Promise<SprintComplianceReport[]>;
  getComplianceReportById(sprintId: number): Promise<SprintComplianceReport>;
  
  // Benchmarks
  getBenchmarks(): Promise<SprintBenchmark[]>;
  
  // Trends data
  getTrends(filters?: FilterOptions): Promise<TrendData[]>;
  getComplianceTrends(filters?: FilterOptions): Promise<ComplianceChartData[]>;
  
  // Data refresh
  refreshAllData(): Promise<void>;
  refreshBoardData(boardId?: number): Promise<void>;
  getRefreshStatus(): Promise<{
    isRefreshing: boolean;
    lastRefresh?: string;
    schedule?: string;
    isScheduled: boolean;
  }>;
}

export * from './JiraTrendsApi';
export { JiraTrendsApiClient } from './JiraTrendsApi';
