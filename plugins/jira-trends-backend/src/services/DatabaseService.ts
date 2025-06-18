import { LoggerService } from '@backstage/backend-plugin-api';
import {
  SprintMetrics,
  SprintBenchmark,
  SprintComplianceReport,
} from '../types';

/**
 * Database service for managing sprint metrics and benchmarks
 * Uses in-memory storage for simplicity
 */
export class DatabaseService {
  private sprintMetrics: Map<string, SprintMetrics> = new Map();
  private sprintBenchmarks: Map<string, SprintBenchmark> = new Map();
  private complianceReports: Map<string, SprintComplianceReport> = new Map();
  private initialized = false;

  constructor(
    private readonly logger: LoggerService,
  ) {}

  /**
   * Initialize database with default benchmarks
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing database service');

    // Create default benchmarks with enhanced descriptions
    await this.createDefaultBenchmarks();

    this.initialized = true;
    this.logger.info('Database service initialized successfully - ready for real Jira data');
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<'ok' | 'error'> {
    try {
      // Simple test - check if we can access our data structures
      const benchmarkCount = this.sprintBenchmarks.size;
      this.logger.debug(`Database connection test passed - ${benchmarkCount} benchmarks available`);
      return 'ok';
    } catch (error) {
      this.logger.error('Database connection test failed:', error instanceof Error ? error : new Error(String(error)));
      return 'error';
    }
  }

  /**
   * Save sprint metrics
   */
  async saveSprintMetrics(metrics: SprintMetrics): Promise<SprintMetrics> {
    const key = `${metrics.boardId}-${metrics.sprintId}`;
    const metricsWithId = {
      ...metrics,
      id: metrics.id || this.generateId(),
      lastUpdated: new Date().toISOString(),
      createdAt: metrics.createdAt || new Date().toISOString(),
    };
    
    this.sprintMetrics.set(key, metricsWithId);
    this.logger.debug(`Saved metrics for sprint ${metrics.sprintId}`, { boardId: metrics.boardId });
    
    return metricsWithId;
  }

  /**
   * Get sprint metrics
   */
  async getSprintMetrics(boardId?: number, sprintId?: number): Promise<SprintMetrics | undefined> {
    if (boardId && sprintId) {
      const key = `${boardId}-${sprintId}`;
      return this.sprintMetrics.get(key);
    }

    // Return the first match if only one parameter is provided
    for (const [, metrics] of this.sprintMetrics.entries()) {
      if (boardId && metrics.boardId === boardId) return metrics;
      if (sprintId && metrics.sprintId === sprintId) return metrics;
    }

    return undefined;
  }

  /**
   * Get list of sprint metrics with pagination and filtering
   */
  async getSprintMetricsList(
    boardId?: number, 
    limit?: number, 
    daysSince?: number
  ): Promise<SprintMetrics[]> {
    let metrics = Array.from(this.sprintMetrics.values());

    // Filter by board if specified
    if (boardId) {
      metrics = metrics.filter(m => m.boardId === boardId);
    }

    // Filter by date if specified
    if (daysSince) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);
      metrics = metrics.filter(m => {
        const metricDate = new Date(m.sprintEndDate || m.lastUpdated);
        return metricDate >= cutoffDate;
      });
    }

    // Sort by most recent first
    metrics.sort((a, b) => {
      const aDate = new Date(a.sprintEndDate || a.lastUpdated);
      const bDate = new Date(b.sprintEndDate || b.lastUpdated);
      return bDate.getTime() - aDate.getTime();
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      metrics = metrics.slice(0, limit);
    }

    return metrics;
  }

  /**
   * Save compliance report
   */
  async saveComplianceReport(report: SprintComplianceReport): Promise<SprintComplianceReport> {
    const key = `${report.boardId}-${report.sprintId}`;
    const reportWithId = {
      ...report,
      id: report.id || this.generateId(),
      createdAt: report.createdAt || new Date().toISOString(),
    };
    
    this.complianceReports.set(key, reportWithId);
    this.logger.debug(`Saved compliance report for sprint ${report.sprintId}`, { boardId: report.boardId });
    
    return reportWithId;
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(
    boardId?: number,
    limit?: number,
    daysSince?: number,
    sprintId?: number
  ): Promise<SprintComplianceReport[]> {
    let reports = Array.from(this.complianceReports.values());

    // Filter by sprint if specified
    if (sprintId) {
      reports = reports.filter(r => r.sprintId === sprintId);
    }

    // Filter by board if specified
    if (boardId) {
      reports = reports.filter(r => r.boardId === boardId);
    }

    // Filter by date if specified
    if (daysSince) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);
      reports = reports.filter(r => {
        const reportDate = new Date(r.evaluationDate);
        return reportDate >= cutoffDate;
      });
    }

    // Sort by most recent first
    reports.sort((a, b) => {
      const aDate = new Date(a.evaluationDate);
      const bDate = new Date(b.evaluationDate);
      return bDate.getTime() - aDate.getTime();
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      reports = reports.slice(0, limit);
    }

    return reports;
  }

  /**
   * Get benchmarks
   */
  async getBenchmarks(): Promise<SprintBenchmark[]> {
    return Array.from(this.sprintBenchmarks.values());
  }

  /**
   * Save benchmark
   */
  async saveBenchmark(benchmark: SprintBenchmark): Promise<SprintBenchmark> {
    const benchmarkWithId = {
      ...benchmark,
      id: benchmark.id || this.generateId(),
      createdAt: benchmark.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.sprintBenchmarks.set(benchmark.metricName, benchmarkWithId);
    this.logger.debug(`Saved benchmark for ${benchmark.metricName}`);
    
    return benchmarkWithId;
  }

  /**
   * Update a benchmark
   */
  async updateBenchmark(benchmark: SprintBenchmark): Promise<SprintBenchmark> {
    if (!this.sprintBenchmarks.has(benchmark.metricName)) {
      throw new Error(`Benchmark for metric ${benchmark.metricName} not found`);
    }

    const existing = this.sprintBenchmarks.get(benchmark.metricName)!;
    const updated = {
      ...existing,
      ...benchmark,
      updatedAt: new Date().toISOString(),
    };

    this.sprintBenchmarks.set(benchmark.metricName, updated);
    this.logger.debug(`Updated benchmark for ${benchmark.metricName}`);
    
    return updated;
  }

  /**
   * Get recent metrics for dashboard
   */
  async getRecentMetrics(limit = 10): Promise<SprintMetrics[]> {
    const metrics = Array.from(this.sprintMetrics.values());
    
    // Sort by completion date, then by creation date
    metrics.sort((a, b) => {
      const aDate = new Date(a.sprintEndDate || a.createdAt);
      const bDate = new Date(b.sprintEndDate || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });

    return metrics.slice(0, limit);
  }

  /**
   * Get sprint metrics by ID
   */
  async getSprintMetricsById(sprintId: number): Promise<SprintMetrics | null> {
    for (const metrics of this.sprintMetrics.values()) {
      if (metrics.sprintId === sprintId) {
        return metrics;
      }
    }
    return null;
  }

  /**
   * Get sprint metrics with pagination
   */
  async getSprintMetricsPaginated(
    boardId?: number,
    page = 1,
    pageSize = 20,
  ): Promise<{ metrics: SprintMetrics[]; totalCount: number }> {
    let metrics = Array.from(this.sprintMetrics.values());

    // Filter by board if specified
    if (boardId) {
      metrics = metrics.filter(m => m.boardId === boardId);
    }

    const totalCount = metrics.length;

    // Sort by creation date, most recent first
    metrics.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedMetrics = metrics.slice(startIndex, startIndex + pageSize);

    return { metrics: paginatedMetrics, totalCount };
  }  /**
   * Create default benchmarks based on industry standards and best practices
   * Each benchmark includes detailed descriptions explaining calculation methods and business rationale
   */
  private async createDefaultBenchmarks(): Promise<void> {
    const defaultBenchmarks: Omit<SprintBenchmark, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Velocity Benchmark',
        metricName: 'velocity',
        metricType: 'velocity',
        description: `TARGET VELOCITY: ≥ 40 Story Points per Sprint

CALCULATION METHOD:
- Sum of story points for all issues completed during the sprint
- Only includes issues marked as "Done" or equivalent final status
- Story points are assigned during sprint planning based on effort estimation

BUSINESS RATIONALE:
This benchmark ensures teams maintain consistent delivery capacity. Higher velocity indicates:
• Improved team efficiency and collaboration
• Better sprint planning and estimation accuracy
• Consistent value delivery to stakeholders
• Predictable release planning capabilities

IMPROVEMENT STRATEGIES:
- Refine story point estimation through planning poker
- Remove impediments and blockers proactively
- Optimize team collaboration and knowledge sharing
- Invest in automation and technical improvements`,
        target: 40, // ≥ 40 SP
        targetValue: 40,
        warning: 30, // Warning threshold
        warningThreshold: 30,
        criticalThreshold: 20,
        unit: 'story points',
        category: 'productivity',
        isActive: true,
      },
      {
        name: 'Churn Rate Benchmark',
        metricName: 'churnRate',
        metricType: 'churn_rate',
        description: `TARGET CHURN RATE: ≤ 10%

CALCULATION METHOD:
- Churn Rate = (Stories Added + Stories Removed) / Total Committed Stories × 100
- Measures scope changes after sprint commitment
- Tracks both additions and removals from sprint backlog

BUSINESS RATIONALE:
Low churn rate indicates stable sprint planning and commitment reliability:
• Demonstrates effective sprint planning and stakeholder alignment
• Reduces team disruption and context switching
• Enables predictable delivery timelines
• Builds trust with stakeholders through consistent commitments

IMPROVEMENT STRATEGIES:
- Strengthen definition of ready for user stories
- Improve stakeholder communication during planning
- Better estimation and capacity planning
- Establish change control processes for in-flight sprints`,
        target: 10, // ≤ 10%
        targetValue: 10,
        warning: 20, // WARN ≤ 20%
        warningThreshold: 20,
        criticalThreshold: 30, // FAIL > 30%
        unit: 'percentage',
        category: 'stability',
        isActive: true,
      },
      {
        name: 'Completion Ratio Benchmark',
        metricName: 'completionRatio',
        metricType: 'completion_ratio',
        description: `TARGET COMPLETION RATIO: ≥ 90%

CALCULATION METHOD:
- Completion Ratio = Completed Story Points / Committed Story Points × 100
- Measures how much of the sprint commitment was delivered
- Based on story points moved to "Done" status during sprint

BUSINESS RATIONALE:
High completion ratio demonstrates sprint execution excellence:
• Shows reliable delivery against commitments
• Indicates accurate estimation and planning
• Enables predictable value delivery to customers
• Builds stakeholder confidence in team capabilities

IMPROVEMENT STRATEGIES:
- Improve story estimation accuracy
- Better identify and address dependencies
- Enhance sprint planning with historical data
- Focus on completing stories before starting new ones`,
        target: 90, // ≥ 90%
        targetValue: 90,
        warning: 80, // Warning threshold
        warningThreshold: 80,
        criticalThreshold: 70,
        unit: 'percentage',
        category: 'delivery',
        isActive: true,
      },
      {
        name: 'Bug Count Benchmark',
        metricName: 'bugCount',
        metricType: 'defect_rate',
        description: `TARGET BUG COUNT: ≤ 5 bugs per Sprint

CALCULATION METHOD:
- Count of issues with issue type "Bug" completed during sprint
- Includes both newly found bugs and bugs carried over from previous sprints
- Measures overall quality of deliverables

BUSINESS RATIONALE:
Low bug count indicates high-quality development practices:
• Demonstrates effective testing and quality assurance
• Reduces technical debt accumulation
• Improves customer satisfaction and user experience
• Reduces maintenance overhead and support costs

IMPROVEMENT STRATEGIES:
- Implement comprehensive automated testing
- Adopt test-driven development (TDD) practices
- Conduct regular code reviews and pair programming
- Invest in quality gates and continuous integration`,
        target: 5, // ≤ 5 bugs
        targetValue: 5,
        warning: 8, // Warning threshold
        warningThreshold: 8,
        criticalThreshold: 12,
        unit: 'count',
        category: 'quality',
        isActive: true,
      },
      {
        name: 'Team Size Benchmark',
        metricName: 'teamSize',
        metricType: 'team_stability',
        description: `OPTIMAL TEAM SIZE: ~7 members (Range: 5-9)

CALCULATION METHOD:
- Count of unique team members assigned to issues in the sprint
- Includes all roles: developers, testers, designers, product owners
- Measured by unique assignees across all sprint issues

BUSINESS RATIONALE:
Optimal team size balances collaboration efficiency with communication overhead:
• Small enough for effective communication (≤9 members)
• Large enough for diverse skills and knowledge sharing (≥5 members)
• Follows "Two Pizza Rule" for maximum team effectiveness
• Enables proper skill distribution and backup coverage

IMPROVEMENT STRATEGIES:
- Right-size teams based on scope and complexity
- Cross-train team members for better coverage
- Balance senior and junior developers for mentoring
- Consider team composition for optimal skill mix`,
        target: 7, // Optimal size
        targetValue: 7,
        warning: 4, // Minimum acceptable
        warningThreshold: 4,
        criticalThreshold: 9, // Maximum acceptable
        unit: 'members',
        category: 'team',
        isActive: true,
      },
      {
        name: 'Team Stability Benchmark',
        metricName: 'teamStability',
        metricType: 'team_stability',
        description: `TARGET TEAM STABILITY: ≥ 75% (≤ 25% team change)

CALCULATION METHOD:
- Team Stability = (Unchanged Members / Total Members) × 100
- Compares current sprint team with previous sprint team
- Measures consistency in team composition over time

BUSINESS RATIONALE:
High team stability promotes velocity and quality:
• Maintains team dynamics and established collaboration patterns
• Preserves domain knowledge and context
• Reduces onboarding overhead and knowledge transfer time
• Enables continuous improvement in team processes

IMPROVEMENT STRATEGIES:
- Minimize mid-sprint team changes unless critical
- Plan team transitions during sprint boundaries
- Ensure proper knowledge transfer for team changes
- Document team knowledge and processes effectively`,
        target: 75, // 75% stability = 25% change
        targetValue: 75,
        warning: 60, // 40% change
        warningThreshold: 60,
        criticalThreshold: 50, // 50% change
        unit: 'percentage',
        category: 'team',
        isActive: true,
      },
      {
        name: 'Cycle Time Benchmark',
        metricName: 'avgCycleTime',
        metricType: 'cycle_time',
        description: `TARGET CYCLE TIME: ≤ 5 days average

CALCULATION METHOD:
- Cycle Time = Time from "In Progress" to "Done" for each issue
- Averaged across all completed issues in the sprint
- Measured in calendar days (includes weekends)

BUSINESS RATIONALE:
Short cycle time indicates efficient development flow:
• Faster feedback loops and reduced work-in-progress
• Quicker value delivery to end users
• Reduced risk of integration conflicts and rework
• Better responsiveness to changing requirements

IMPROVEMENT STRATEGIES:
- Break down large stories into smaller, manageable tasks
- Identify and eliminate process bottlenecks
- Implement continuous integration and deployment
- Reduce work-in-progress limits to improve flow`,
        target: 5,
        targetValue: 5,
        warning: 10,
        warningThreshold: 10,
        criticalThreshold: 15,
        unit: 'days',
        category: 'efficiency',
        isActive: true,
      },
      {
        name: 'Defect Rate Benchmark',
        metricName: 'defectRate',
        metricType: 'defect_rate',
        description: `TARGET DEFECT RATE: ≤ 5%

CALCULATION METHOD:
- Defect Rate = (Number of Bugs / Total Issues Completed) × 100
- Only includes bugs discovered after story completion
- Measured against issues completed in the current sprint

BUSINESS RATIONALE:
Low defect rate indicates high development quality:
• Reduced post-delivery maintenance and support costs
• Higher customer satisfaction and product reliability
• Improved team confidence and reduced technical debt
• Better predictability in delivery timelines

IMPROVEMENT STRATEGIES:
- Implement test-driven development practices
- Strengthen code review processes and standards
- Improve definition of done with quality gates
- Increase automated testing coverage`,
        target: 5,
        targetValue: 5,
        warning: 10,
        warningThreshold: 10,
        criticalThreshold: 15,
        unit: 'percentage',
        category: 'quality',
        isActive: true,
      },
    ];

    for (const benchmark of defaultBenchmarks) {
      await this.saveBenchmark(benchmark as SprintBenchmark);
    }
    
    this.logger.info(`Created ${defaultBenchmarks.length} enhanced benchmarks with detailed descriptions`);
  }



  /**
   * Generate a simple numeric ID
   */
  private generateId(): number {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    this.sprintMetrics.clear();
    this.complianceReports.clear();
    // Don't clear benchmarks as they are needed
    this.logger.info('Cleared all data except benchmarks');
  }
}
