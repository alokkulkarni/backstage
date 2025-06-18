import { Logger } from 'winston';
import { DatabaseService } from './DatabaseService';

/**
 * Service for calculating metrics from stored Jira data
 */
export class MetricsCalculationService {
  constructor(
    private readonly logger: Logger,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Calculate velocity trend for a board
   */
  async calculateVelocityTrend(boardId: number, limit = 10): Promise<{ date: string; velocity: number }[]> {
    try {
      const metrics = await this.databaseService.getSprintMetricsList(boardId, limit);
      
      return metrics
        .filter(m => m.sprintEndDate) // Only include completed sprints
        .sort((a, b) => new Date(a.sprintEndDate!).getTime() - new Date(b.sprintEndDate!).getTime())
        .map(metric => ({
          date: metric.sprintEndDate || metric.lastUpdated,
          velocity: metric.velocity,
        }));
    } catch (error) {
      this.logger.error('Error calculating velocity trend:', error);
      throw new Error(`Failed to calculate velocity trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate burndown chart data for a sprint
   */
  async calculateBurndownData(sprintId: number): Promise<{ date: string; remaining: number; ideal: number }[]> {
    try {
      // Mock implementation since we don't have detailed daily tracking
      const metrics = await this.databaseService.getSprintMetricsById(sprintId);
      
      if (!metrics) {
        throw new Error(`Sprint metrics not found for sprint ${sprintId}`);
      }

      // Generate mock burndown data based on completion ratio
      const totalStoryPoints = metrics.velocity / metrics.completionRatio;
      const sprintDays = 10; // Assume 2-week sprint with 10 working days
      
      const burndownData = [];
      const dailyIdealBurn = totalStoryPoints / sprintDays;
      
      for (let day = 0; day <= sprintDays; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (sprintDays - day));
        
        // Mock actual burndown with some realistic variation
        const idealRemaining = Math.max(0, totalStoryPoints - (day * dailyIdealBurn));
        const actualRemaining = day === sprintDays 
          ? totalStoryPoints * (1 - metrics.completionRatio)
          : idealRemaining + (Math.random() - 0.5) * 10; // Add some variation
        
        burndownData.push({
          date: date.toISOString().split('T')[0],
          remaining: Math.max(0, actualRemaining),
          ideal: idealRemaining,
        });
      }
      
      return burndownData;
    } catch (error) {
      this.logger.error('Error calculating burndown data:', error);
      throw new Error(`Failed to calculate burndown data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cycle time trends
   */
  async calculateCycleTimeTrends(boardId: number, limit = 10): Promise<{ date: string; avgCycleTime: number }[]> {
    try {
      const metrics = await this.databaseService.getSprintMetricsList(boardId, limit);
      
      return metrics
        .filter(m => m.sprintEndDate)
        .sort((a, b) => new Date(a.sprintEndDate!).getTime() - new Date(b.sprintEndDate!).getTime())
        .map(metric => ({
          date: metric.sprintEndDate || metric.lastUpdated,
          avgCycleTime: metric.avgCycleTime,
        }));
    } catch (error) {
      this.logger.error('Error calculating cycle time trends:', error);
      throw new Error(`Failed to calculate cycle time trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate team performance metrics
   */
  async calculateTeamPerformance(sprintId: number): Promise<{
    teamEfficiency: number;
    velocityPerMember: number;
    qualityScore: number;
    stabilityScore: number;
  }> {
    try {
      const metrics = await this.databaseService.getSprintMetricsById(sprintId);
      
      if (!metrics) {
        throw new Error(`Sprint metrics not found for sprint ${sprintId}`);
      }

      const teamEfficiency = metrics.completionRatio * 100;
      const velocityPerMember = metrics.teamComposition.totalMembers > 0 
        ? metrics.velocity / metrics.teamComposition.totalMembers 
        : 0;
      const qualityScore = Math.max(0, 100 - (metrics.defectRate * 100));
      const stabilityScore = metrics.teamStability;

      return {
        teamEfficiency,
        velocityPerMember,
        qualityScore,
        stabilityScore,
      };
    } catch (error) {
      this.logger.error('Error calculating team performance:', error);
      throw new Error(`Failed to calculate team performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate predictability metrics
   */
  async calculatePredictability(boardId: number, limit = 5): Promise<{
    averageCompletionRatio: number;
    consistencyScore: number;
    trendDirection: 'improving' | 'stable' | 'declining';
  }> {
    try {
      const metrics = await this.databaseService.getSprintMetricsList(boardId, limit);
      
      if (metrics.length === 0) {
        return {
          averageCompletionRatio: 0,
          consistencyScore: 0,
          trendDirection: 'stable',
        };
      }

      const completionRatios = metrics.map(m => m.completionRatio);
      const averageCompletionRatio = completionRatios.reduce((sum, ratio) => sum + ratio, 0) / completionRatios.length;
      
      // Calculate consistency (lower standard deviation = higher consistency)
      const variance = completionRatios.reduce((sum, ratio) => sum + Math.pow(ratio - averageCompletionRatio, 2), 0) / completionRatios.length;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, 100 - (stdDev * 100));

      // Determine trend direction
      let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
      if (metrics.length >= 3) {
        const recent = metrics.slice(0, Math.floor(metrics.length / 2));
        const older = metrics.slice(Math.floor(metrics.length / 2));
        
        const recentAvg = recent.reduce((sum, m) => sum + m.completionRatio, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.completionRatio, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.05) {
          trendDirection = 'improving';
        } else if (recentAvg < olderAvg - 0.05) {
          trendDirection = 'declining';
        }
      }

      return {
        averageCompletionRatio,
        consistencyScore,
        trendDirection,
      };
    } catch (error) {
      this.logger.error('Error calculating predictability:', error);
      throw new Error(`Failed to calculate predictability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}