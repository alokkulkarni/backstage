import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import { 
  MetricsCalculationService as IMetricsCalculationService,
  SourceControlMetrics,
  SourceControlComplianceReport,
  SourceControlBenchmark
} from '../types';
import { subDays } from 'date-fns';

export class MetricsCalculationService implements IMetricsCalculationService {
  private db: DatabaseService;
  private logger: LoggerService;

  constructor(db: DatabaseService, logger: LoggerService) {
    this.db = db;
    this.logger = logger;
  }

  async calculateRepositoryMetrics(
    repositoryId: string, 
    dateRange: { start: Date; end: Date }
  ): Promise<SourceControlMetrics> {
    try {
      this.logger.debug(`Calculating metrics for repository ${repositoryId}`);

      const [
        prMetrics,
        securityMetrics,
        repositoryHealth,
        collaborationMetrics
      ] = await Promise.all([
        this.calculatePRMetrics(repositoryId, dateRange),
        this.calculateSecurityMetrics(repositoryId),
        this.calculateRepositoryHealth(repositoryId),
        this.calculateCollaborationMetrics(repositoryId, dateRange)
      ]);

      const metrics: SourceControlMetrics = {
        id: this.generateId(),
        repositoryId,
        metricDate: new Date(),
        
        // PR Metrics
        avgTimeToMergePRHours: prMetrics.avgTimeToMerge,
        reviewCoveragePercent: prMetrics.reviewCoverage,
        stalePRCount: prMetrics.stalePRCount,
        totalOpenPRCount: prMetrics.totalOpenPRCount,
        stalePRRatio: prMetrics.stalePRRatio,
        avgPRSizeLines: prMetrics.avgPRSize,
        
        // Security Metrics
        openVulnerabilityCount: securityMetrics.openVulnerabilityCount,
        highSeverityVulnerabilityCount: securityMetrics.highSeverityCount,
        mediumSeverityVulnerabilityCount: securityMetrics.mediumSeverityCount,
        lowSeverityVulnerabilityCount: securityMetrics.lowSeverityCount,
        daysSinceLastSecurityScan: securityMetrics.daysSinceLastScan,
        
        // Repository Health
        branchProtectionEnabled: repositoryHealth.branchProtectionEnabled,
        directCommitsToDefaultCount: repositoryHealth.directCommitsCount,
        dependencyDriftCount: repositoryHealth.dependencyDriftCount,
        outdatedDependencyCount: repositoryHealth.outdatedDependencyCount,
        
        // Collaboration Metrics
        activeContributorCount: collaborationMetrics.activeContributorCount,
        avgCommitsPerWeek: collaborationMetrics.avgCommitsPerWeek,
        codeOwnerFileExists: collaborationMetrics.codeOwnerFileExists,
        
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store the calculated metrics
      await this.storeMetrics(metrics);

      this.logger.debug(`Successfully calculated metrics for repository ${repositoryId}`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to calculate metrics for repository ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  async calculateComplianceReport(
    repositoryId: string, 
    benchmarks: SourceControlBenchmark[]
  ): Promise<SourceControlComplianceReport> {
    try {
      this.logger.debug(`Calculating compliance report for repository ${repositoryId}`);

      // Get the latest metrics for the repository
      const latestMetrics = await this.getLatestMetrics(repositoryId);
      if (!latestMetrics) {
        throw new Error(`No metrics found for repository ${repositoryId}`);
      }

      // Create benchmark lookup
      const benchmarkMap = new Map<string, SourceControlBenchmark>();
      benchmarks.forEach(benchmark => {
        benchmarkMap.set(benchmark.metric, benchmark);
      });

      // Calculate compliance for each metric
      const timeToMergePR = this.evaluateMetric(
        latestMetrics.avgTimeToMergePRHours,
        benchmarkMap.get('timeToMergePR')
      );

      const reviewCoverage = this.evaluateMetric(
        latestMetrics.reviewCoveragePercent,
        benchmarkMap.get('reviewCoverage')
      );

      const stalePR = this.evaluateMetric(
        latestMetrics.stalePRRatio,
        benchmarkMap.get('stalePRRatio')
      );

      const branchProtection = this.evaluateMetric(
        latestMetrics.branchProtectionEnabled ? 100 : 0,
        benchmarkMap.get('branchProtection')
      );

      const vulnerability = this.evaluateMetric(
        latestMetrics.highSeverityVulnerabilityCount,
        benchmarkMap.get('vulnerabilityCount')
      );

      const securityScan = this.evaluateMetric(
        latestMetrics.daysSinceLastSecurityScan,
        benchmarkMap.get('securityScanFreshness')
      );

      const dependencyDrift = this.evaluateMetric(
        latestMetrics.dependencyDriftCount,
        benchmarkMap.get('dependencyDrift')
      );

      // Calculate overall score and status
      const metricStatuses = [
        timeToMergePR.status,
        reviewCoverage.status,
        stalePR.status,
        branchProtection.status,
        vulnerability.status,
        securityScan.status,
        dependencyDrift.status
      ];

      const overallScore = this.calculateOverallScore(metricStatuses);
      const overallStatus = this.determineOverallStatus(metricStatuses);

      const complianceReport: SourceControlComplianceReport = {
        id: this.generateId(),
        repositoryId,
        reportDate: new Date(),
        overallScore,
        overallStatus,
        
        timeToMergePRStatus: timeToMergePR.status,
        timeToMergePRValue: latestMetrics.avgTimeToMergePRHours,
        
        reviewCoverageStatus: reviewCoverage.status,
        reviewCoverageValue: latestMetrics.reviewCoveragePercent,
        
        stalePRStatus: stalePR.status,
        stalePRValue: latestMetrics.stalePRRatio,
        
        branchProtectionStatus: branchProtection.status,
        branchProtectionValue: latestMetrics.branchProtectionEnabled,
        
        vulnerabilityStatus: vulnerability.status,
        vulnerabilityValue: latestMetrics.highSeverityVulnerabilityCount,
        
        securityScanStatus: securityScan.status,
        securityScanValue: latestMetrics.daysSinceLastSecurityScan,
        
        dependencyDriftStatus: dependencyDrift.status,
        dependencyDriftValue: latestMetrics.dependencyDriftCount,
        
        createdAt: new Date(),
      };

      // Store the compliance report
      await this.storeComplianceReport(complianceReport);

      this.logger.debug(`Successfully calculated compliance report for repository ${repositoryId}`);
      return complianceReport;
    } catch (error) {
      this.logger.error(`Failed to calculate compliance report for repository ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  // Private calculation methods
  private async calculatePRMetrics(repositoryId: string, dateRange: { start: Date; end: Date }) {
    try {
      const client = await this.db.getClient();
      const prs = await client('sourcecontrol_pull_requests')
        .where('repository_id', repositoryId)
        .where('created_at', '>=', dateRange.start)
        .where('created_at', '<=', dateRange.end)
        .select('*');

      const openPRs = prs.filter((pr: any) => pr.state === 'open');
      const mergedPRs = prs.filter((pr: any) => pr.state === 'merged');
      const stalePRs = openPRs.filter((pr: any) => {
        const daysSinceUpdate = (Date.now() - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 7;
      });

      const avgTimeToMerge = mergedPRs.length > 0
        ? mergedPRs.reduce((sum: any, pr: any) => sum + (pr.time_to_merge_hours || 0), 0) / mergedPRs.length
        : null;

      const reviewedPRs = prs.filter((pr: any) => pr.reviewers_count > 0);
      const reviewCoverage = prs.length > 0 ? (reviewedPRs.length / prs.length) * 100 : null;

      const avgPRSize = prs.length > 0
        ? prs.reduce((sum: any, pr: any) => sum + (pr.additions + pr.deletions), 0) / prs.length
        : null;

      const stalePRRatio = openPRs.length > 0 ? (stalePRs.length / openPRs.length) * 100 : null;

      return {
        avgTimeToMerge,
        reviewCoverage,
        stalePRCount: stalePRs.length,
        totalOpenPRCount: openPRs.length,
        stalePRRatio,
        avgPRSize,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate PR metrics for repository ${repositoryId}:`, error as Error);
      return {
        avgTimeToMerge: null,
        reviewCoverage: null,
        stalePRCount: 0,
        totalOpenPRCount: 0,
        stalePRRatio: null,
        avgPRSize: null,
      };
    }
  }

  private async calculateSecurityMetrics(repositoryId: string) {
    try {
      const client = await this.db.getClient();
      const vulnerabilities = await client('sourcecontrol_vulnerabilities')
        .where('repository_id', repositoryId)
        .where('state', 'open')
        .select('*');

      const openVulnerabilityCount = vulnerabilities.length;
      const highSeverityCount = vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical').length;
      const mediumSeverityCount = vulnerabilities.filter(v => v.severity === 'medium').length;
      const lowSeverityCount = vulnerabilities.filter(v => v.severity === 'low').length;

      // Get last security scan
      const lastScan = await client('sourcecontrol_security_scans')
        .where('repository_id', repositoryId)
        .orderBy('completed_at', 'desc')
        .first();

      const daysSinceLastScan = lastScan?.completed_at
        ? Math.floor((Date.now() - new Date(lastScan.completed_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        openVulnerabilityCount,
        highSeverityCount,
        mediumSeverityCount,
        lowSeverityCount,
        daysSinceLastScan,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate security metrics for repository ${repositoryId}:`, error as Error);
      return {
        openVulnerabilityCount: 0,
        highSeverityCount: 0,
        mediumSeverityCount: 0,
        lowSeverityCount: 0,
        daysSinceLastScan: null,
      };
    }
  }

  private async calculateRepositoryHealth(repositoryId: string) {
    try {
      const client = await this.db.getClient();
      
      // Check branch protection
      const branchProtection = await client('sourcecontrol_branch_protection')
        .where('repository_id', repositoryId)
        .where('protection_enabled', true)
        .first();

      // Count direct commits to default branch (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const directCommits = await client('sourcecontrol_commits')
        .where('repository_id', repositoryId)
        .where('direct_to_default', true)
        .where('timestamp', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();

      // Count outdated dependencies
      const outdatedDependencies = await client('sourcecontrol_dependencies')
        .where('repository_id', repositoryId)
        .where('is_outdated', true)
        .count('* as count')
        .first();

      // Count major version drift (dependencies > 1 major version behind)
      const driftDependencies = await client('sourcecontrol_dependencies')
        .where('repository_id', repositoryId)
        .where('major_versions_behind', '>', 1)
        .count('* as count')
        .first();

      return {
        branchProtectionEnabled: !!branchProtection,
        directCommitsCount: Number(directCommits?.count) || 0,
        outdatedDependencyCount: Number(outdatedDependencies?.count) || 0,
        dependencyDriftCount: Number(driftDependencies?.count) || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate repository health for repository ${repositoryId}:`, error as Error);
      return {
        branchProtectionEnabled: false,
        directCommitsCount: 0,
        outdatedDependencyCount: 0,
        dependencyDriftCount: 0,
      };
    }
  }

  private async calculateCollaborationMetrics(repositoryId: string, dateRange: { start: Date; end: Date }) {
    try {
      const client = await this.db.getClient();
      
      // Count active contributors (committed in date range)
      const activeContributors = await client('sourcecontrol_commits')
        .where('repository_id', repositoryId)
        .where('timestamp', '>=', dateRange.start)
        .where('timestamp', '<=', dateRange.end)
        .countDistinct('author_login as count')
        .first();

      // Calculate average commits per week
      const totalCommits = await client('sourcecontrol_commits')
        .where('repository_id', repositoryId)
        .where('timestamp', '>=', dateRange.start)
        .where('timestamp', '<=', dateRange.end)
        .count('* as count')
        .first();

      const weeks = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const avgCommitsPerWeek = weeks > 0 ? Number(totalCommits?.count || 0) / weeks : null;

      // Check for CODEOWNERS file (mock implementation)
      const codeOwnerFileExists = Math.random() > 0.5; // TODO: Implement actual check

      return {
        activeContributorCount: Number(activeContributors?.count) || 0,
        avgCommitsPerWeek,
        codeOwnerFileExists,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate collaboration metrics for repository ${repositoryId}:`, error as Error);
      return {
        activeContributorCount: 0,
        avgCommitsPerWeek: null,
        codeOwnerFileExists: false,
      };
    }
  }

  // Compliance evaluation methods
  private evaluateMetric(
    value: number | boolean | null,
    benchmark: SourceControlBenchmark | undefined
  ): { status: 'PASS' | 'WARN' | 'FAIL'; score: number } {
    if (!benchmark || value === null || value === undefined) {
      return { status: 'FAIL', score: 0 };
    }

    const numericValue = typeof value === 'boolean' ? (value ? 100 : 0) : value;

    switch (benchmark.comparisonOperator) {
      case 'gte':
        if (benchmark.passThreshold !== null && numericValue >= benchmark.passThreshold) {
          return { status: 'PASS', score: 100 };
        }
        if (benchmark.warnThreshold !== null && numericValue >= benchmark.warnThreshold) {
          return { status: 'WARN', score: 50 };
        }
        return { status: 'FAIL', score: 0 };

      case 'lte':
        if (benchmark.passThreshold !== null && numericValue <= benchmark.passThreshold) {
          return { status: 'PASS', score: 100 };
        }
        if (benchmark.warnThreshold !== null && numericValue <= benchmark.warnThreshold) {
          return { status: 'WARN', score: 50 };
        }
        return { status: 'FAIL', score: 0 };

      case 'eq':
        if (benchmark.passThreshold !== null && numericValue === benchmark.passThreshold) {
          return { status: 'PASS', score: 100 };
        }
        return { status: 'FAIL', score: 0 };

      case 'range':
        if (
          benchmark.passThreshold !== null &&
          benchmark.failThreshold !== null &&
          numericValue >= benchmark.passThreshold &&
          numericValue <= benchmark.failThreshold
        ) {
          return { status: 'PASS', score: 100 };
        }
        if (
          benchmark.warnThreshold !== null &&
          benchmark.failThreshold !== null &&
          numericValue >= benchmark.warnThreshold &&
          numericValue <= benchmark.failThreshold
        ) {
          return { status: 'WARN', score: 50 };
        }
        return { status: 'FAIL', score: 0 };

      default:
        return { status: 'FAIL', score: 0 };
    }
  }

  private calculateOverallScore(statuses: ('PASS' | 'WARN' | 'FAIL')[]): number {
    const scores = statuses.map(status => {
      switch (status) {
        case 'PASS': return 100;
        case 'WARN': return 50;
        case 'FAIL': return 0;
        default: return 0;
      }
    });

    return scores.length > 0 ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : 0;
  }

  private determineOverallStatus(statuses: ('PASS' | 'WARN' | 'FAIL')[]): 'PASS' | 'WARN' | 'FAIL' {
    if (statuses.includes('FAIL')) return 'FAIL';
    if (statuses.includes('WARN')) return 'WARN';
    return 'PASS';
  }

  // Database storage methods
  private async storeMetrics(metrics: SourceControlMetrics): Promise<void> {
    const client = await this.db.getClient();
    await client('sourcecontrol_metrics')
      .insert(metrics)
      .onConflict(['repository_id', 'metric_date'])
      .merge();
  }

  private async storeComplianceReport(report: SourceControlComplianceReport): Promise<void> {
    const client = await this.db.getClient();
    await client('sourcecontrol_compliance_reports')
      .insert(report)
      .onConflict(['repository_id', 'report_date'])
      .merge();
  }

  private async getLatestMetrics(repositoryId: string): Promise<SourceControlMetrics | null> {
    const client = await this.db.getClient();
    const metrics = await client('sourcecontrol_metrics')
      .where('repository_id', repositoryId)
      .orderBy('metric_date', 'desc')
      .first();

    return metrics || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
