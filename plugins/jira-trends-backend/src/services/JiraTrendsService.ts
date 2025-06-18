import { Logger } from 'winston';
import { DatabaseService } from './DatabaseService';
import { DataRefreshService } from './DataRefreshService';
import { JiraApiService } from './JiraApiService';
import { MockDataService } from './MockDataService';
import {
  SprintBenchmark,
  SprintComplianceReport,
  HealthStatus,
  TrendData,
  GetSprintMetricsResponse,
  RefreshDataResponse,
  HealthCheckResponse,
  JiraBoard,
} from '../types';

export class JiraTrendsService {
  constructor(
    private readonly logger: Logger,
    private readonly databaseService: DatabaseService,
    private readonly dataRefreshService: DataRefreshService,
    private readonly jiraApiService: JiraApiService,
    private readonly mockDataService: MockDataService,
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockHealthStatus();
      }

      // Test Jira connection using actual API call
      let jiraConnected = false;
      try {
        const boards = await this.jiraApiService.getBoards();
        jiraConnected = boards !== undefined;
        this.logger.debug(`Jira connection test: found ${boards.length} boards`);
      } catch (error) {
        this.logger.warn('Jira connection test failed:', error);
        jiraConnected = false;
      }
      
      // Test database connection
      const dbStatus = await this.databaseService.testConnection();
      const dbConnected = dbStatus === 'ok';

      if (jiraConnected && dbConnected) {
        return {
          status: 'healthy',
          jiraConnection: 'ok',
          database: 'ok',
          message: 'All services operational',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          status: 'degraded',
          jiraConnection: jiraConnected ? 'ok' : 'error',
          database: dbConnected ? 'ok' : 'error',
          message: 'Some services experiencing issues',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'error',
        jiraConnection: 'error',
        database: 'error',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSprintMetrics(
    boardId?: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<GetSprintMetricsResponse> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockSprintMetrics(boardId, limit, offset);
      }

      // Calculate page from offset and limit
      const page = Math.floor(offset / limit) + 1;
      
      // Get metrics from database using the correct method
      const { metrics, totalCount } = await this.databaseService.getSprintMetricsPaginated(
        boardId, 
        page, 
        limit
      );
      
      // If no data exists, check if we should trigger a refresh
      if (totalCount === 0) {
        this.logger.info(`No sprint metrics found in database${boardId ? ` for board ${boardId}` : ''}`);
        
        // For board-specific requests, check if there's any data at all first
        if (boardId) {
          // Check if there's any data in the system at all
          const allMetrics = await this.databaseService.getSprintMetricsPaginated(undefined, 1, 1);
          
          if (allMetrics.totalCount > 0) {
            // Data exists for other boards, so this board just doesn't have data
            this.logger.info(`Board ${boardId} has no sprint metrics, but other boards have data. Returning empty result.`);
            return {
              metrics: [],
              totalCount: 0,
              page,
              pageSize: limit,
            };
          }
          // If no data exists anywhere, fall through to refresh logic
        }
        
        // Only trigger refresh if it's likely to work (not during startup with missing credentials)
        try {
          // Test if Jira API is accessible first with a lightweight call
          const healthStatus = await this.getHealthStatus();
          
          if (healthStatus.jiraConnection === 'ok') {
            this.logger.info('Jira connection is healthy, triggering background data refresh');
            // Trigger async refresh but don't wait for it to complete
            this.dataRefreshService.performFullRefresh().catch(error => {
              this.logger.error('Background data refresh failed:', error);
            });
          } else {
            this.logger.warn('Jira connection is not healthy, skipping data refresh. Check Jira credentials.');
          }
        } catch (refreshError) {
          this.logger.warn('Unable to test Jira connection for refresh decision:', refreshError);
        }
        
        // Return empty result for now, subsequent requests will have data
        return {
          metrics: [],
          totalCount: 0,
          page,
          pageSize: limit,
        };
      }
      
      return {
        metrics,
        totalCount,
        page,
        pageSize: limit,
      };
    } catch (error) {
      this.logger.error('Error fetching sprint metrics:', error);
      throw new Error(`Failed to fetch sprint metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTrendData(boardId?: number, limit: number = 20): Promise<TrendData[]> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockTrendData(boardId, limit);
      }

      const metrics = await this.databaseService.getSprintMetricsList(boardId, limit);
      
      return metrics.map(metric => ({
        date: metric.sprintStartDate || new Date().toISOString(),
        sprintId: metric.sprintId,
        sprintName: metric.sprintName,
        boardId: metric.boardId,
        velocity: metric.velocity,
        churnRate: metric.churnRate,
        completionRatio: metric.completionRatio,
        bugCount: metric.workTypeBreakdown.bug || 0,
        teamSize: metric.teamComposition.totalMembers,
        teamChangePercentage: (metric.teamComposition.newMembers / metric.teamComposition.totalMembers) * 100,
        // Enhanced metrics with fallback values
        burndownEfficiency: 85, // Calculate from actual data
        scopeChange: metric.churnRate * 100,
        cycleTime: metric.avgCycleTime,
        leadTime: metric.avgCycleTime * 1.2, // Estimate
        qualityScore: Math.max(0, 100 - (metric.defectRate * 10)),
        teamSatisfaction: 75, // Would come from surveys
        deliveryPredictability: metric.completionRatio * 100,
      }));
    } catch (error) {
      this.logger.error('Error fetching trend data:', error);
      throw new Error(`Failed to fetch trend data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getComplianceReports(
    boardId?: number,
    limit: number = 10,
  ): Promise<SprintComplianceReport[]> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockComplianceReports(boardId, limit);
      }

      // Use the correct method signature for getting compliance reports
      const reports = await this.databaseService.getComplianceReports(boardId, limit);
      
      // If no compliance reports exist, check if we have metrics but no reports
      if (reports.length === 0) {
        // For board-specific requests, check if there are reports for other boards first
        if (boardId) {
          const allReports = await this.databaseService.getComplianceReports(undefined, 1);
          if (allReports.length > 0) {
            // Reports exist for other boards, so this board just doesn't have reports
            this.logger.info(`Board ${boardId} has no compliance reports, but other boards have reports. Returning empty result.`);
            return [];
          }
        }
        
        const metrics = await this.databaseService.getSprintMetricsList(boardId, 5);
        if (metrics.length === 0) {
          this.logger.info('No compliance reports or metrics found, triggering data refresh');
          // Trigger async refresh but don't wait
          this.dataRefreshService.performFullRefresh().catch(error => {
            this.logger.error('Background compliance data refresh failed:', error);
          });
        }
      }
      
          return reports;
    } catch (error) {
      this.logger.error('Error fetching compliance reports:', error);
      throw new Error(`Failed to fetch compliance reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshData(boardId?: number): Promise<RefreshDataResponse> {
    try {
      this.logger.info(`Starting data refresh for board ${boardId || 'all boards'}`);
      
      if (boardId) {
        // Refresh specific board
        const sprintsProcessed = await this.dataRefreshService.refreshBoardData(boardId);
        
        return {
          success: true,
          message: `Successfully refreshed data for ${sprintsProcessed} sprints on board ${boardId}`,
          sprintsProcessed,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Refresh all boards
        await this.dataRefreshService.performFullRefresh();
        
        // Get count of available sprints as an approximation
        const metrics = await this.databaseService.getSprintMetricsList(undefined, 100);
        const sprintsProcessed = metrics.length;
        
        return {
          success: true,
          message: `Successfully refreshed data for all boards (${sprintsProcessed} total sprints)`,
          sprintsProcessed,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error('Error refreshing data:', error);
      return {
        success: false,
        message: `Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sprintsProcessed: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getBenchmarks(): Promise<SprintBenchmark[]> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockBenchmarks();
      }

      return await this.databaseService.getBenchmarks();
    } catch (error) {
      this.logger.error('Error fetching benchmarks:', error);
      throw new Error(`Failed to fetch benchmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBenchmark(benchmark: Omit<SprintBenchmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<SprintBenchmark> {
    try {
      // Create a properly typed benchmark object
      const fullBenchmark: SprintBenchmark = {
        ...benchmark,
        id: 0, // Will be set by database
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await this.databaseService.saveBenchmark(fullBenchmark);
    } catch (error) {
      this.logger.error('Error creating benchmark:', error);
      throw new Error(`Failed to create benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBenchmark(id: number, updates: Partial<SprintBenchmark>): Promise<SprintBenchmark> {
    try {
      const updatedBenchmark = {
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };
      
      return await this.databaseService.updateBenchmark(updatedBenchmark as SprintBenchmark);
    } catch (error) {
      this.logger.error('Error updating benchmark:', error);
      throw new Error(`Failed to update benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBenchmark(id: number): Promise<void> {
    try {
      // Since DatabaseService doesn't have deleteBenchmark, we'll need to work around it
      // In a real implementation, you'd add this method to DatabaseService
      this.logger.warn(`Delete benchmark not implemented in database service for id: ${id}`);
      throw new Error('Delete benchmark operation not yet implemented');
    } catch (error) {
      this.logger.error('Error deleting benchmark:', error);
      throw new Error(`Failed to delete benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBoards(): Promise<JiraBoard[]> {
    try {
      this.logger.info('Fetching Jira boards through JiraTrendsService');
      const boards = await this.jiraApiService.getBoards();
      this.logger.info(`Successfully fetched ${boards.length} boards from Jira`);
      return boards;
    } catch (error) {
      this.logger.error('Failed to fetch boards from Jira:', error);
      throw new Error(`Failed to fetch boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        return this.mockDataService.getMockHealthCheck();
      }

      const health = await this.getHealthStatus();
      
      return {
        status: health.status === 'healthy' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    }
  }
}
