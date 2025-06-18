import { Logger } from 'winston';
import { DatabaseService } from './DatabaseService';
import { SprintMetrics, SprintBenchmark, SprintComplianceReport, ComplianceResult, ComplianceStatus } from '../types';

/**
 * Service for evaluating sprint compliance against benchmarks
 */
export class ComplianceService {
  constructor(
    private readonly logger: Logger,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Evaluate sprint metrics against benchmarks
   */
  async evaluateCompliance(metrics: SprintMetrics): Promise<SprintComplianceReport> {
    this.logger.info(`Evaluating compliance for sprint ${metrics.sprintId}`);

    const benchmarks = await this.databaseService.getBenchmarks();
    const benchmarkMap = new Map(benchmarks.map(b => [b.metricName, b]));

    this.logger.info(`Found ${benchmarks.length} benchmarks: ${benchmarks.map(b => b.metricName).join(', ')}`);
    
    // Check for missing benchmarks
    const requiredMetrics = ['velocity', 'churnRate', 'completionRatio', 'bugCount', 'teamSize', 'teamStability', 'avgCycleTime', 'defectRate'];
    const missingBenchmarks = requiredMetrics.filter(metric => !benchmarkMap.has(metric));
    if (missingBenchmarks.length > 0) {
      this.logger.warn(`Missing benchmarks for metrics: ${missingBenchmarks.join(', ')}`);
    }

    const results: Record<string, ComplianceResult> = {};

    // Evaluate each metric with null checks
    const velocityBenchmark = benchmarkMap.get('velocity');
    if (velocityBenchmark) {
      results.velocity = this.evaluateMetric(
        'velocity',
        metrics.velocity,
        velocityBenchmark,
      );
    } else {
      this.logger.warn(`Skipping velocity evaluation - benchmark not found`);
    }

    const churnRateBenchmark = benchmarkMap.get('churnRate');
    if (churnRateBenchmark) {
      results.churnRate = this.evaluateMetric(
        'churnRate',
        metrics.churnRate * 100, // Convert to percentage for comparison
        churnRateBenchmark,
        true, // Lower is better
      );
    } else {
      this.logger.warn(`Skipping churnRate evaluation - benchmark not found`);
    }

    const completionRatioBenchmark = benchmarkMap.get('completionRatio');
    if (completionRatioBenchmark) {
      results.completionRatio = this.evaluateMetric(
        'completionRatio',
        metrics.completionRatio * 100, // Convert to percentage for comparison
        completionRatioBenchmark,
      );
    } else {
      this.logger.warn(`Skipping completionRatio evaluation - benchmark not found`);
    }

    // Bug count evaluation - use actual bug count, not defect rate
    const bugCount = metrics.workTypeBreakdown.bug || 0;
    const bugCountBenchmark = benchmarkMap.get('bugCount');
    if (bugCountBenchmark) {
      results.bugCount = this.evaluateMetric(
        'bugCount',
        bugCount,
        bugCountBenchmark,
        true, // Lower is better
      );
    } else {
      this.logger.warn(`Skipping bugCount evaluation - benchmark not found`);
    }

    // Team size evaluation - check if within optimal range (4-9 members)
    const teamSize = metrics.teamComposition.totalMembers;
    const teamSizeBenchmark = benchmarkMap.get('teamSize');
    if (teamSizeBenchmark) {
      results.teamSize = this.evaluateTeamSize(
        teamSize,
        teamSizeBenchmark,
      );
    } else {
      this.logger.warn(`Skipping teamSize evaluation - benchmark not found`);
    }

    const teamStabilityBenchmark = benchmarkMap.get('teamStability');
    if (teamStabilityBenchmark) {
      results.teamStability = this.evaluateMetric(
        'teamStability',
        metrics.teamStability,
        teamStabilityBenchmark,
      );
    } else {
      this.logger.warn(`Skipping teamStability evaluation - benchmark not found`);
    }

    const avgCycleTimeBenchmark = benchmarkMap.get('avgCycleTime');
    if (avgCycleTimeBenchmark) {
      results.avgCycleTime = this.evaluateMetric(
        'avgCycleTime',
        metrics.avgCycleTime,
        avgCycleTimeBenchmark,
        true, // Lower is better
      );
    } else {
      this.logger.warn(`Skipping avgCycleTime evaluation - benchmark not found`);
    }

    const defectRateBenchmark = benchmarkMap.get('defectRate');
    if (defectRateBenchmark) {
      results.defectRate = this.evaluateMetric(
        'defectRate',
        metrics.defectRate,
        defectRateBenchmark,
        true, // Lower is better
      );
    } else {
      this.logger.warn(`Skipping defectRate evaluation - benchmark not found`);
    }

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(results);

    const complianceReport: SprintComplianceReport = {
      id: 0, // Will be set by database
      sprintId: metrics.sprintId,
      boardId: metrics.boardId,
      evaluationDate: new Date().toISOString(),
      overallStatus,
      metrics: results,
      recommendations: this.generateRecommendations(results, metrics),
      createdAt: new Date().toISOString(),
    };

    this.logger.info(`Compliance evaluation completed for sprint ${metrics.sprintId}: ${overallStatus}`);
    return complianceReport;
  }

  /**
   * Evaluate a single metric against its benchmark
   */
  private evaluateMetric(
    metricName: string,
    actualValue: number,
    benchmark: SprintBenchmark,
    lowerIsBetter: boolean = false,
  ): ComplianceResult {
    const { target, warning } = benchmark;
    
    let status: ComplianceStatus;
    let deviation: number;

    if (lowerIsBetter) {
      deviation = ((actualValue - target) / target) * 100;
      if (actualValue <= target) {
        status = 'PASS';
      } else if (actualValue <= warning) {
        status = 'WARN';
      } else {
        status = 'FAIL';
      }
    } else {
      deviation = ((target - actualValue) / target) * 100;
      if (actualValue >= target) {
        status = 'PASS';
      } else if (actualValue >= warning) {
        status = 'WARN';
      } else {
        status = 'FAIL';
      }
    }

    return {
      metric: metricName,
      status,
      value: actualValue,
      actualValue,
      targetValue: target,
      warningThreshold: warning,
      deviation: Math.round(deviation * 100) / 100,
      message: this.generateMetricMessage(metricName, status, actualValue, target, deviation),
      benchmark,
    };
  }

  /**
   * Special evaluation for team size with range-based logic
   */
  private evaluateTeamSize(
    teamSize: number,
    benchmark: SprintBenchmark,
  ): ComplianceResult {
    let status: ComplianceStatus;
    let deviation: number;
    let message: string;

    // Team size logic: WARN if < 4 or > 9, PASS if 4-9
    if (teamSize >= 4 && teamSize <= 9) {
      status = 'PASS';
      deviation = 0;
      message = `✅ Team size (${teamSize}) is within optimal range (4-9 members)`;
    } else {
      status = 'WARN';
      if (teamSize < 4) {
        deviation = ((4 - teamSize) / 4) * 100;
        message = `⚠️ Team size (${teamSize}) is below optimal minimum of 4 members`;
      } else {
        deviation = ((teamSize - 9) / 9) * 100;
        message = `⚠️ Team size (${teamSize}) exceeds optimal maximum of 9 members`;
      }
    }

    return {
      metric: 'teamSize',
      status,
      value: teamSize,
      actualValue: teamSize,
      targetValue: benchmark.target,
      warningThreshold: benchmark.warning,
      deviation: Math.round(deviation * 100) / 100,
      message,
      benchmark,
    };
  }

  /**
   * Calculate overall compliance status based on individual metrics
   */
  private calculateOverallStatus(results: Record<string, ComplianceResult>): ComplianceStatus {
    const statuses = Object.values(results).map(r => r.status);
    
    if (statuses.includes('FAIL')) {
      return 'FAIL';
    }
    if (statuses.includes('WARN')) {
      return 'WARN';
    }
    return 'PASS';
  }

  /**
   * Generate actionable recommendations based on compliance results
   */
  private generateRecommendations(results: Record<string, ComplianceResult>, metrics: SprintMetrics): string[] {
    const recommendations: string[] = [];

    // Velocity recommendations
    if (results.velocity && results.velocity.status !== 'PASS') {
      if (results.velocity.actualValue < results.velocity.targetValue) {
        recommendations.push(
          `Velocity is ${Math.abs(results.velocity.deviation)}% below target. Consider: 1) Breaking down large stories, 2) Addressing impediments, 3) Team capacity planning.`
        );
      }
    }

    // Churn rate recommendations
    if (results.churnRate && results.churnRate.status !== 'PASS') {
      recommendations.push(
        `High churn rate (${results.churnRate.actualValue}%) indicates scope instability. Consider: 1) Better sprint planning, 2) Clearer acceptance criteria, 3) Stakeholder alignment.`
      );
    }

    // Completion ratio recommendations
    if (results.completionRatio && results.completionRatio.status !== 'PASS') {
      recommendations.push(
        `Low completion ratio (${Math.round(results.completionRatio.actualValue * 100)}%) suggests capacity issues. Consider: 1) More realistic sprint planning, 2) Addressing blockers faster, 3) Team skill development.`
      );
    }

    // Team stability recommendations
    if (results.teamStability && results.teamStability.status !== 'PASS') {
      recommendations.push(
        `Team stability concerns detected. Consider: 1) Knowledge sharing sessions, 2) Pair programming, 3) Documentation improvements.`
      );
    }

    // Cycle time recommendations
    if (results.avgCycleTime && results.avgCycleTime.status !== 'PASS') {
      recommendations.push(
        `High average cycle time (${results.avgCycleTime.actualValue} days) indicates process inefficiencies. Consider: 1) Reducing WIP limits, 2) Improving code review process, 3) Automating testing.`
      );
    }

    // Defect rate recommendations
    if (results.defectRate && results.defectRate.status !== 'PASS') {
      recommendations.push(
        `High defect rate (${Math.round(results.defectRate.actualValue * 100)}%) indicates quality issues. Consider: 1) Test-driven development, 2) Code review improvements, 3) Definition of Done refinement.`
      );
    }

    // Team composition recommendations
    if (metrics.teamComposition.juniorDevs > metrics.teamComposition.seniorDevs) {
      recommendations.push(
        `Team has more junior developers. Consider: 1) Mentoring programs, 2) Pair programming with seniors, 3) Code review focus.`
      );
    }

    return recommendations;
  }

  /**
   * Generate a human-readable message for a metric result
   */
  private generateMetricMessage(
    metricName: string,
    status: ComplianceStatus,
    actualValue: number,
    targetValue: number,
    deviation: number,
  ): string {
    const metricDisplayNames: Record<string, string> = {
      velocity: 'Sprint Velocity',
      churnRate: 'Churn Rate',
      completionRatio: 'Completion Ratio',
      teamStability: 'Team Stability',
      avgCycleTime: 'Average Cycle Time',
      defectRate: 'Defect Rate',
    };

    const displayName = metricDisplayNames[metricName] || metricName;
    const statusEmoji = { PASS: '✅', WARN: '⚠️', FAIL: '❌' }[status];
    
    switch (status) {
      case 'PASS':
        return `${statusEmoji} ${displayName} meets target (${actualValue} vs ${targetValue})`;
      case 'WARN':
        return `${statusEmoji} ${displayName} below target by ${Math.abs(deviation)}% (${actualValue} vs ${targetValue})`;
      case 'FAIL':
        return `${statusEmoji} ${displayName} significantly below target by ${Math.abs(deviation)}% (${actualValue} vs ${targetValue})`;
      default:
        return `${displayName}: ${actualValue}`;
    }
  }

  /**
   * Get compliance trend data
   */
  async getComplianceTrends(boardId?: number, days: number = 90): Promise<Array<{
    date: string;
    passCount: number;
    warnCount: number;
    failCount: number;
    totalSprints: number;
  }>> {
    const reports = await this.databaseService.getComplianceReports(boardId, undefined, days);
    
    // Group by date and calculate trends
    const trendMap = new Map<string, { pass: number; warn: number; fail: number; total: number }>();
    
    reports.forEach(report => {
      const date = report.evaluationDate.split('T')[0]; // Get date part only
      
      if (!trendMap.has(date)) {
        trendMap.set(date, { pass: 0, warn: 0, fail: 0, total: 0 });
      }
      
      const trend = trendMap.get(date)!;
      trend.total++;
      
      switch (report.overallStatus) {
        case 'PASS':
          trend.pass++;
          break;
        case 'WARN':
          trend.warn++;
          break;
        case 'FAIL':
          trend.fail++;
          break;
      }
    });
    
    return Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      passCount: counts.pass,
      warnCount: counts.warn,
      failCount: counts.fail,
      totalSprints: counts.total,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}
