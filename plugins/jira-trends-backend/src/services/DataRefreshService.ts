import cron from 'node-cron';
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import { JiraApiService } from './JiraApiService';
import { DatabaseService } from './DatabaseService';
import { MetricsCalculatorService } from './MetricsCalculatorService';
import { ComplianceService } from './ComplianceService';
import { JiraSprint } from '../types';

/**
 * Service for refreshing Jira sprint data on a schedule
 */
export class DataRefreshService {
  private cronJob?: cron.ScheduledTask;
  private isRefreshing = false;

  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
    private readonly jiraApiService: JiraApiService,
    private readonly databaseService: DatabaseService,
    private readonly metricsCalculator: MetricsCalculatorService,
    private readonly complianceService: ComplianceService,
  ) {}

  /**
   * Start the scheduled data refresh
   */
  start(): void {
    const schedule = this.config.getOptionalString('jiraTrends.refreshInterval') || '0 */6 * * *'; // Every 6 hours
    
    this.logger.info(`Starting data refresh service with schedule: ${schedule}`);
    
    this.cronJob = cron.schedule(schedule, async () => {
      await this.performFullRefresh();
    }, {
      scheduled: false,
    });

    this.cronJob.start();
    this.logger.info('Data refresh service started successfully');
  }

  /**
   * Stop the scheduled data refresh
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      this.logger.info('Data refresh service stopped');
    }
  }

  /**
   * Perform a full data refresh for all boards
   */
  async performFullRefresh(userEmail?: string): Promise<void> {
    if (this.isRefreshing) {
      this.logger.warn('Data refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting full data refresh', { userEmail });
      
      // Get all available boards with error handling for missing credentials
      let boards;
      try {
        boards = await this.jiraApiService.getBoards();
        this.logger.info(`Found ${boards.length} boards to refresh`);
      } catch (error) {
        // Handle authentication/credential errors gracefully
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized') || 
          error.message.includes('Missing credentials') ||
          error.message.includes('ECONNREFUSED')
        )) {
          this.logger.warn('Jira API connection failed - likely missing or invalid credentials. Skipping data refresh.', {
            error: error.message,
            suggestion: 'Please check JIRA_USERNAME and JIRA_API_TOKEN environment variables'
          });
          return;
        }
        // Re-throw other types of errors
        throw error;
      }

      let refreshedBoards = 0;
      let totalSprints = 0;

      for (const board of boards) {
        try {
          const sprintCount = await this.refreshBoardData(board.id, userEmail);
          totalSprints += sprintCount;
          refreshedBoards++;
          
          this.logger.debug(`Refreshed board ${board.name} (${board.id}) - ${sprintCount} sprints`);
        } catch (error) {
          this.logger.error(`Failed to refresh board ${board.name} (${board.id})`, error);
          // Continue with other boards
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Full data refresh completed in ${duration}ms: ${refreshedBoards}/${boards.length} boards, ${totalSprints} sprints processed`,
        { 
          duration,
          refreshedBoards,
          totalBoards: boards.length,
          totalSprints,
          userEmail,
        }
      );
    } catch (error) {
      // Log error but don't throw to prevent startup failures
      this.logger.error('Full data refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userEmail
      });
      
      // Only throw if it's not a credential/connection issue
      if (error instanceof Error && !(
        error.message.includes('401') || 
        error.message.includes('Unauthorized') || 
        error.message.includes('Missing credentials') ||
        error.message.includes('ECONNREFUSED')
      )) {
        throw error;
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh data for a specific board
   */
  async refreshBoardData(boardId: number, userEmail?: string): Promise<number> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Refreshing data for board ${boardId}`, { boardId, userEmail });

      // Get all sprints (both active and closed) to find the most recent 6 sprints
      const allSprints = await this.jiraApiService.getSprints(boardId);
      
      // Sort sprints by end date or creation date, most recent first
      const sortedSprints = allSprints.sort((a: any, b: any) => {
        const dateA = new Date(a.endDate || a.startDate || 0);
        const dateB = new Date(b.endDate || b.startDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Take the last 6 sprints (including active ones)
      const recentSprints = sortedSprints.slice(0, 6);

      this.logger.debug(`Found ${recentSprints.length} recent sprints for board ${boardId}`);

      let processedSprints = 0;

      for (const sprint of recentSprints) {
        try {
          await this.refreshSprintData(sprint, userEmail);
          processedSprints++;
        } catch (error) {
          this.logger.error(`Failed to refresh sprint ${sprint.name} (${sprint.id})`, error);
          // Continue with other sprints
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Board ${boardId} refresh completed in ${duration}ms: ${processedSprints}/${recentSprints.length} sprints processed`
      );

      return processedSprints;
    } catch (error) {
      this.logger.error(`Failed to refresh board ${boardId}`, error);
      throw error;
    }
  }

  /**
   * Refresh data for a specific sprint
   */
  async refreshSprintData(sprint: JiraSprint, _userEmail?: string): Promise<void> {
    try {
      this.logger.debug(`Refreshing sprint ${sprint.name} (${sprint.id})`);

      // Check if we already have recent data for this sprint
      const existingMetrics = await this.databaseService.getSprintMetrics(sprint.boardId, sprint.id);
      if (existingMetrics && this.isDataRecent(existingMetrics.lastUpdated)) {
        this.logger.debug(`Sprint ${sprint.id} data is recent, skipping refresh`);
        return;
      }

      // Get sprint issues
      const issues = await this.jiraApiService.getSprintIssues(sprint.id);
      
      if (issues.length === 0) {
        this.logger.debug(`No issues found for sprint ${sprint.id}, skipping`);
        return;
      }

      // Calculate metrics
      const metrics = await this.metricsCalculator.calculateSprintMetrics(sprint, issues);
      
      // Store metrics
      await this.databaseService.saveSprintMetrics(metrics);

      // Evaluate compliance
      const complianceReport = await this.complianceService.evaluateCompliance(metrics);
      await this.databaseService.saveComplianceReport(complianceReport);

      this.logger.debug(`Successfully refreshed sprint ${sprint.id} with ${issues.length} issues`);
      
    } catch (error) {
      this.logger.error(`Failed to refresh sprint ${sprint.name} (${sprint.id})`, error);
      throw error;
    }
  }



  /**
   * Check if data is recent enough to skip refresh
   */
  private isDataRecent(lastUpdated: string, maxAgeHours: number = 6): boolean {
    const lastUpdateTime = new Date(lastUpdated);
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    return lastUpdateTime >= cutoffTime;
  }

  /**
   * Get refresh status
   */
  getStatus(): {
    isRefreshing: boolean;
    lastRefresh?: string;
    schedule?: string;
    isScheduled: boolean;
  } {
    return {
      isRefreshing: this.isRefreshing,
      schedule: this.config.getOptionalString('jiraTrends.refreshInterval'),
      isScheduled: !!this.cronJob,
    };
  }

  /**
   * Force immediate refresh for a specific board
   */
  async forceRefreshBoard(boardId: number, userEmail?: string): Promise<void> {
    this.logger.info(`Force refreshing board ${boardId}`, { boardId, userEmail });
    await this.refreshBoardData(boardId, userEmail);
  }

  /**
   * Force immediate full refresh
   */
  async forceFullRefresh(userEmail?: string): Promise<void> {
    this.logger.info('Force refreshing all data', { userEmail });
    await this.performFullRefresh(userEmail);
  }
}
