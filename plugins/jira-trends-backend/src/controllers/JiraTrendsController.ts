import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { JiraTrendsService } from '../services/JiraTrendsService';
import { DataRefreshService } from '../services/DataRefreshService';
import { UserBoardMappingService } from '../services/UserBoardMappingService';
import { MockDataService } from '../services/MockDataService';

/**
 * Controller for handling Jira Trends API requests
 */
export class JiraTrendsController {
  constructor(
    private readonly logger: Logger,
    private readonly jiraTrendsService: JiraTrendsService,
    private readonly dataRefreshService: DataRefreshService,
    private readonly userBoardMappingService: UserBoardMappingService,
    private readonly mockDataService: MockDataService,
  ) {}

  /**
   * Health check endpoint
   */
  async getHealth(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        const health = this.mockDataService.getMockHealthCheck();
        res.json(health);
        return;
      }

      const health = await this.jiraTrendsService.getHealthCheck();
      res.json(health);
    } catch (error) {
      this.handleError(error as Error, _req, res, _next);
    }
  }

  /**
   * Get available boards - uses dynamic user-based filtering
   */
  async getBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = this.extractUserEmail(req);
      this.logger.debug('Getting boards for user', { userEmail });
      
      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        const boards = this.mockDataService.getMockBoardsForUser(userEmail);
        this.logger.debug('Returning mock boards data for user', { userEmail, boardCount: boards.length });
        res.json(boards);
        return;
      }
      
      // Get user's accessible boards dynamically
      const boards = await this.userBoardMappingService.getAllUserBoards(userEmail);
      this.logger.debug('Returning user accessible boards', { userEmail, boardCount: boards.length });
      res.json(boards);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sprint metrics
   */
  async getSprintMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = this.extractUserEmail(req);
      let boardId = req.query.boardId ? Number(req.query.boardId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      if (boardId && isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid boardId parameter' });
        return;
      }

      if (isNaN(limit) || limit <= 0) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      // If no boardId specified, use user's mapped board
      if (!boardId) {
        boardId = await this.userBoardMappingService.getBoardIdForUser(userEmail);
        this.logger.debug('Using mapped board for user', { userEmail, mappedBoardId: boardId });
      }

      this.logger.debug('Getting sprint metrics for user', { userEmail, boardId, limit, offset });

      // Use mock data if enabled
      if (this.mockDataService.isUsingMockData()) {
        const response = this.mockDataService.getMockSprintMetrics(boardId, limit, offset);
        res.json(response);
        return;
      }

      const response = await this.jiraTrendsService.getSprintMetrics(boardId, limit, offset);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific sprint metrics by ID
   */
  async getSprintMetricsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sprintId = Number(req.params.sprintId);
      
      if (isNaN(sprintId)) {
        res.status(400).json({ error: 'Invalid sprintId parameter' });
        return;
      }

      // Use getSprintMetrics with specific parameters since getSprintMetricsById doesn't exist
      const response = await this.jiraTrendsService.getSprintMetrics(undefined, 1, 0);
      const metrics = response.metrics.find(m => m.sprintId === sprintId);
      
      if (!metrics) {
        res.status(404).json({ error: 'Sprint metrics not found' });
        return;
      }

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = this.extractUserEmail(req);
      const boardId = req.query.boardId ? Number(req.query.boardId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      if (boardId && isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid boardId parameter' });
        return;
      }

      if (isNaN(limit) || limit <= 0) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      this.logger.debug('Getting compliance reports for user', { userEmail, boardId, limit });
      const reports = await this.jiraTrendsService.getComplianceReports(boardId, limit);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get compliance report by sprint ID
   */
  async getComplianceReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sprintId = Number(req.params.sprintId);
      
      if (isNaN(sprintId)) {
        res.status(400).json({ error: 'Invalid sprintId parameter' });
        return;
      }

      // Get all reports and filter by sprintId
      const reports = await this.jiraTrendsService.getComplianceReports();
      const report = reports.find(r => r.sprintId === sprintId);
      
      if (!report) {
        res.status(404).json({ error: 'Compliance report not found' });
        return;
      }

      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get benchmarks
   */
  async getBenchmarks(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const benchmarks = await this.jiraTrendsService.getBenchmarks();
      res.json(benchmarks);
    } catch (error) {
      this.handleError(error as Error, _req, res, _next);
    }
  }

  /**
   * Get trends data
   */
  async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = this.extractUserEmail(req);
      const boardId = req.query.boardId ? Number(req.query.boardId) : undefined;
      const days = req.query.days ? Number(req.query.days) : 90;

      if (boardId && isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid boardId parameter' });
        return;
      }

      if (isNaN(days) || days <= 0 || days > 365) {
        res.status(400).json({ error: 'Invalid days parameter (must be 1-365)' });
        return;
      }

      this.logger.debug('Getting trends for user', { userEmail, boardId, days });
      // Calculate limit from days (approximate)
      const limit = Math.max(10, Math.floor(days / 14)); // Assuming sprints are ~2 weeks
      const trends = await this.jiraTrendsService.getTrendData(boardId, limit);
      res.json(trends);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get compliance trends
   */
  async getComplianceTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const boardId = req.query.boardId ? Number(req.query.boardId) : undefined;
      const days = req.query.days ? Number(req.query.days) : 90;

      if (boardId && isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid boardId parameter' });
        return;
      }

      if (isNaN(days) || days <= 0 || days > 365) {
        res.status(400).json({ error: 'Invalid days parameter (must be 1-365)' });
        return;
      }

      // Calculate limit from days and get reports
      const limit = Math.max(10, Math.floor(days / 14));
      const reports = await this.jiraTrendsService.getComplianceReports(boardId, limit);
      
      // Transform reports into trends format
      const trends = reports.map(report => ({
        date: report.evaluationDate,
        sprintId: report.sprintId,
        boardId: report.boardId,
        overallStatus: report.overallStatus,
        metrics: report.metrics,
      }));
      
      res.json(trends);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh data for a specific board
   */
  async refreshBoardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const boardId = req.body.boardId ? Number(req.body.boardId) : undefined;
      const userEmail = req.headers['x-user-email'] as string;
      
      this.logger.info(`Manual board refresh triggered for board ${boardId}`, { userEmail, boardId });
      
      const result = await this.jiraTrendsService.refreshData(boardId);
      
      res.json({
        success: result.success,
        message: result.message,
        sprintsProcessed: result.sprintsProcessed,
        timestamp: result.timestamp,
      });
    } catch (error) {
      this.logger.error('Error in refreshBoardData:', error);
      next(error);
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = req.headers['x-user-email'] as string;
      
      this.logger.info('Manual data refresh triggered', { userEmail });
      
      const result = await this.jiraTrendsService.refreshData();
      
      res.json({
        success: result.success,
        message: result.message,
        sprintsProcessed: result.sprintsProcessed,
        timestamp: result.timestamp,
      });
    } catch (error) {
      this.logger.error('Error in refreshAllData:', error);
      next(error);
    }
  }

  /**
   * Get refresh status
   */
  async getRefreshStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get status from the data refresh service
      const status = this.dataRefreshService.getStatus();
      
      res.json({
        isRefreshing: status.isRefreshing,
        lastRefresh: status.lastRefresh,
        schedule: status.schedule,
        isScheduled: status.isScheduled,
      });
    } catch (error) {
      this.logger.error('Error getting refresh status:', error);
      next(error);
    }
  }

  /**
   * Extract user email from request (Backstage auth)
   */
  private extractUserEmail(req: Request): string | undefined {
    // Backstage provides user info in the request
    const userInfo = (req as any).user;
    
    // Try different ways to extract email from user info
    let email = userInfo?.entity?.spec?.profile?.email || 
                userInfo?.email || 
                userInfo?.profile?.email ||
                userInfo?.userEntityRef;
    
    // For testing purposes, if no email found, use a default test email
    if (!email) {
      this.logger.debug('No user email found in request, using test email for development');
      email = 'test-user@example.com'; // Default test email
    }
    
    // If userEntityRef format (user:default/username), extract just the username part
    if (typeof email === 'string' && email.startsWith('user:')) {
      const parts = email.split('/');
      if (parts.length > 1) {
        email = `${parts[1]}@example.com`; // Convert to email format
      }
    }
    
    this.logger.debug('Extracted user email', { email, userInfo: JSON.stringify(userInfo, null, 2) });
    return email;
  }

  /**
   * Error handling middleware
   */
  handleError(error: Error, req: Request, res: Response, _next: NextFunction): void {
    this.logger.error('API request failed', {
      method: req.method,
      path: req.path,
      query: req.query,
      error: error.message,
      stack: error.stack,
    });

    // Determine appropriate status code
    let statusCode = 500;
    let message = 'Internal server error';

    if (error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      statusCode = 401;
      message = 'Authentication required';
    } else if (error.message.includes('forbidden') || error.message.includes('permission')) {
      statusCode = 403;
      message = 'Access denied';
    }

    res.status(statusCode).json({
      error: message,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
}
