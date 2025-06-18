import { Logger } from 'winston';
import { Config } from '@backstage/config';
import {
  JiraBoard,
  SprintMetrics,
  GetSprintMetricsResponse,
  HealthStatus,
  HealthCheckResponse,
} from '../types';

/**
 * Service for providing mock data when useMockData flag is enabled
 */
export class MockDataService {
  private readonly logger: Logger;
  private readonly isEnabled: boolean;

  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    
    const jiraTrendsConfig = config.getOptionalConfig('jiraTrends');
    this.isEnabled = jiraTrendsConfig?.getOptionalBoolean('useMockData') || false;
    
    this.logger.info('MockDataService initialized', { enabled: this.isEnabled });
  }

  /**
   * Check if mock data is enabled
   */
  isUsingMockData(): boolean {
    return this.isEnabled;
  }

  /**
   * Get mock boards data
   */
  getMockBoards(): JiraBoard[] {
    return [
      {
        id: 1,
        name: 'Development Team Board',
        type: 'scrum',
        location: {
          projectId: 10001,
          projectKey: 'DEV',
          projectName: 'Development Project'
        }
      }
    ];
  }

  /**
   * Get mock boards data based on user email
   */
  getMockBoardsForUser(_userEmail?: string): JiraBoard[] {
    return this.getMockBoards();
  }

  /**
   * Get mock sprint metrics with multiple logical sprints
   */
  getMockSprintMetrics(boardId?: number, limit: number = 10, offset: number = 0): GetSprintMetricsResponse {
    const sprintNames = [
      'Q1 2025 Planning Sprint',
      'New Year Feature Kickoff',
      'User Authentication Hardening',
      'Dashboard Redesign Phase 1',
      'API Performance Optimization',
      'Mobile App Integration Sprint',
      'Security Audit & Fixes',
      'Spring Release Preparation',
      'Feature Flag Implementation',
      'Database Migration Sprint',
      'UI Component Library Update',
      'Customer Feedback Integration',
      'Performance Monitoring Setup',
      'Q2 2025 Feature Sprint', // Active sprint
    ];

    const metrics: SprintMetrics[] = [];
    const now = new Date();
    const targetBoardId = boardId || 1;
    
    // Generate sprints covering last 3 months plus current active sprint
    for (let i = 0; i < sprintNames.length; i++) {
      const sprintStartDate = new Date(now);
      sprintStartDate.setDate(now.getDate() - ((sprintNames.length - 1 - i) * 14)); // 2-week sprints
      
      const sprintEndDate = new Date(sprintStartDate);
      sprintEndDate.setDate(sprintStartDate.getDate() + 13);

      const isActiveSprint = i === sprintNames.length - 1; // Last sprint is active
      const isRecentSprint = i >= sprintNames.length - 3; // Last 3 sprints are recent

      // Vary metrics based on sprint type and progression
      const baseVelocity = 30 + (i * 2); // Gradually improving velocity
      const baseCompletion = isActiveSprint ? 0.60 : (0.70 + (i * 0.02)); // Active sprint lower completion
      const teamGrowth = Math.min(8 + Math.floor(i / 3), 12); // Team grows over time

      metrics.push({
        id: (targetBoardId * 1000) + i + 1,
        sprintId: i + 1,
        sprintName: sprintNames[i],
        boardId: targetBoardId,
        boardName: this.getBoardNameById(targetBoardId),
        velocity: Math.round(baseVelocity + (Math.random() * 10 - 5)), // ±5 variance
        churnRate: isActiveSprint ? 0.25 : (0.05 + (Math.random() * 0.15)), // Higher churn in active sprint
        completionRatio: Math.max(0.45, Math.min(1.0, baseCompletion + (Math.random() * 0.2 - 0.1))),
        avgCycleTime: Math.round(3 + (Math.random() * 6)), // 3-9 days
        teamStability: isRecentSprint ? (0.85 + (Math.random() * 0.1)) : (0.75 + (Math.random() * 0.2)),
        defectRate: Math.max(0.01, 0.02 + (Math.random() * 0.08)), // 1-10%
        sprintStartDate: sprintStartDate.toISOString(),
        sprintEndDate: sprintEndDate.toISOString(),
        sprintCompleteDate: isActiveSprint ? undefined : sprintEndDate.toISOString(),
        workTypeBreakdown: {
          story: Math.round(10 + (Math.random() * 15)),
          bug: Math.round(1 + (Math.random() * 4)),
          task: Math.round(5 + (Math.random() * 8)),
          epic: Math.round(Math.random() * 3),
        },
        teamComposition: {
          totalMembers: teamGrowth,
          newMembers: isRecentSprint ? Math.round(Math.random() * 2) : 0,
          experiencedMembers: Math.round(teamGrowth * 0.7),
          seniorDevs: Math.round(teamGrowth * 0.3),
          juniorDevs: Math.round(teamGrowth * 0.25),
          qaEngineers: Math.round(teamGrowth * 0.2),
          designers: Math.round(teamGrowth * 0.15),
          productOwners: 1,
        },
        issueMetrics: {
          totalIssues: Math.round(20 + (Math.random() * 25)),
          completedIssues: Math.round(15 + (Math.random() * 20)),
          addedAfterStart: Math.round(Math.random() * 5),
          removedAfterStart: Math.round(Math.random() * 3),
          spilloverFromPrevious: i === 0 ? 0 : Math.round(Math.random() * 4),
        },
        lastUpdated: new Date().toISOString(),
        createdAt: sprintStartDate.toISOString()
      });
    }

    // Apply pagination
    const paginatedMetrics = metrics.slice(offset, offset + limit);
    
    return {
      metrics: paginatedMetrics,
      totalCount: metrics.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  }

  /**
   * Get board name by ID
   */
  private getBoardNameById(boardId: number): string {
    const boards = this.getMockBoards();
    const board = boards.find(b => b.id === boardId);
    return board?.name || `Board ${boardId}`;
  }

  /**
   * Get mock trend data
   */
  /**
   * Get mock trend data across multiple sprints
   */
  getMockTrendData(boardId?: number, limit?: number): any[] {
    const sprintNames = [
      'Q1 2025 Planning Sprint',
      'New Year Feature Kickoff',
      'User Authentication Hardening',
      'Dashboard Redesign Phase 1',
      'API Performance Optimization',
      'Mobile App Integration Sprint',
      'Security Audit & Fixes',
      'Spring Release Preparation',
      'Feature Flag Implementation',
      'Database Migration Sprint',
      'UI Component Library Update',
      'Customer Feedback Integration',
      'Performance Monitoring Setup',
      'Q2 2025 Feature Sprint',
    ];

    const trends = [];
    const now = new Date();
    const targetBoardId = boardId || 1;
    const dataPoints = Math.min(limit || 12, sprintNames.length);

    for (let i = 0; i < dataPoints; i++) {
      const sprintStartDate = new Date(now);
      sprintStartDate.setDate(now.getDate() - ((dataPoints - 1 - i) * 14));

      // Simulate improving trends over time
      const progressFactor = i / (dataPoints - 1);
      const baseVelocity = 25 + (progressFactor * 20); // 25-45 range
      const baseCompletion = 0.70 + (progressFactor * 0.20); // 70-90% range
      const baseChurn = 0.25 - (progressFactor * 0.15); // 25% down to 10%

      trends.push({
        date: sprintStartDate.toISOString(),
        sprintId: i + 1,
        sprintName: sprintNames[i],
        boardId: targetBoardId,
        velocity: Math.round(baseVelocity + (Math.random() * 6 - 3)), // ±3 variance
        churnRate: Math.max(0.05, baseChurn + (Math.random() * 0.1 - 0.05)),
        completionRatio: Math.min(1.0, baseCompletion + (Math.random() * 0.15 - 0.075)),
        bugCount: Math.round(1 + (Math.random() * 4)),
        teamSize: Math.min(12, 6 + Math.floor(i / 2)), // Gradual team growth
        teamChangePercentage: i === 0 ? 0 : Math.random() * 0.15 // 0-15% change
      });
    }

    return trends;
  }

  /**
   * Get mock compliance reports
   */
  /**
   * Get mock compliance reports for recent sprints
   */
  getMockComplianceReports(boardId?: number, limit?: number): any[] {
    const sprintNames = [
      'Performance Monitoring Setup',
      'Customer Feedback Integration',
      'UI Component Library Update',
      'Database Migration Sprint',
      'Q2 2025 Feature Sprint', // Current active sprint
    ];

    const reports = [];
    const targetBoardId = boardId || 1;
    const reportCount = Math.min(limit || 5, sprintNames.length);

    for (let i = 0; i < reportCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - ((reportCount - 1 - i) * 14)); // Every 2 weeks

      const isRecentSprint = i >= reportCount - 2;
      const baseScore = isRecentSprint ? 75 + (Math.random() * 20) : 80 + (Math.random() * 15);

      reports.push({
        id: (targetBoardId * 1000) + i + 1,
        sprintId: i + 1,
        sprintName: sprintNames[i] || `Sprint ${i + 1}`,
        boardId: targetBoardId,
        boardName: this.getBoardNameById(targetBoardId),
        evaluationDate: date.toISOString(),
        overallStatus: baseScore > 85 ? 'PASS' : baseScore > 70 ? 'WARN' : 'FAIL',
        overallScore: Math.round(baseScore),
        metrics: {
          velocityCompliance: {
            score: Math.round(80 + (Math.random() * 20)),
            status: 'PASS',
            details: 'Team velocity within expected range for sprint capacity'
          },
          completionCompliance: {
            score: Math.round(75 + (Math.random() * 20)),
            status: isRecentSprint ? 'WARN' : 'PASS',
            details: isRecentSprint ? 'Some scope creep detected mid-sprint' : 'Sprint goals achieved successfully'
          },
          qualityCompliance: {
            score: Math.round(85 + (Math.random() * 15)),
            status: 'PASS',
            details: 'Low defect rate, good testing practices maintained'
          }
        },
        recommendations: [
          isRecentSprint ? 'Focus on sprint planning accuracy' : 'Maintain current delivery pace',
          'Continue emphasis on code quality and testing',
          'Monitor team capacity for sustainable delivery',
          'Review and refine story estimation practices'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }

    return reports;
  }

  /**
   * Get comprehensive mock benchmarks with detailed descriptions
   */
  getMockBenchmarks(): any[] {
    return [
      {
        id: 1,
        name: 'Velocity Target',
        description: 'Story points completed per sprint - measures team throughput and delivery capacity',
        detailedDescription: 'Velocity represents the amount of work a team can complete during a single sprint, measured in story points. This metric helps predict future delivery capacity and identifies trends in team productivity. A consistent velocity indicates predictable delivery, while increasing velocity may indicate team maturation or process improvements.',
        metricName: 'velocity',
        metricType: 'velocity',
        target: 45,
        warning: 30,
        targetValue: 45,
        warningThreshold: 30,
        criticalThreshold: 20,
        unit: 'story points',
        category: 'Delivery Performance',
        rationale: 'Based on team capacity and historical performance data. Target represents sustainable pace for consistent delivery.',
        improvementTips: [
          'Break down large stories into smaller, more manageable pieces',
          'Improve estimation accuracy through regular retrospectives',
          'Remove impediments and blockers quickly',
          'Ensure proper sprint planning and story refinement'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Sprint Completion Ratio',
        description: 'Percentage of committed work completed within sprint timeframe',
        detailedDescription: 'Sprint completion ratio measures the team\'s ability to deliver on their sprint commitments. It reflects planning accuracy, estimation quality, and the team\'s ability to manage scope. High completion ratios indicate reliable delivery and good sprint planning practices.',
        metricName: 'completionRatio',
        metricType: 'completion_ratio',
        target: 0.85,
        warning: 0.70,
        targetValue: 0.85,
        warningThreshold: 0.70,
        criticalThreshold: 0.60,
        unit: 'percentage',
        category: 'Sprint Planning',
        rationale: '85% completion allows for some scope flexibility while maintaining commitment reliability. Accounts for unexpected blockers and scope changes.',
        improvementTips: [
          'Improve story estimation techniques',
          'Better sprint planning with realistic capacity assessment',
          'Minimize mid-sprint scope changes',
          'Address team impediments proactively',
          'Ensure stories are properly refined before sprint planning'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextReview: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Sprint Churn Rate',
        description: 'Percentage of scope changes during sprint execution',
        detailedDescription: 'Churn rate measures the stability of sprint scope after sprint planning. It includes stories added, removed, or significantly changed during the sprint. Low churn indicates good planning and requirement stability, while high churn may suggest poor planning, changing priorities, or external dependencies.',
        metricName: 'churnRate',
        metricType: 'churn_rate',
        target: 0.15,
        warning: 0.25,
        targetValue: 0.15,
        warningThreshold: 0.25,
        criticalThreshold: 0.35,
        unit: 'percentage',
        category: 'Sprint Stability',
        rationale: 'Up to 15% churn is acceptable for adapting to new information. Higher churn disrupts sprint goals and team focus.',
        improvementTips: [
          'Invest more time in sprint planning and story refinement',
          'Better stakeholder alignment before sprint commitment',
          'Improve requirement gathering and analysis',
          'Protect the team from mid-sprint disruptions',
          'Establish clear Definition of Ready for stories'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        nextReview: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Average Cycle Time',
        description: 'Average time from story start to completion',
        detailedDescription: 'Cycle time measures how long it takes for work items to flow through the development process, from "In Progress" to "Done". Shorter cycle times indicate efficient workflows and faster feedback loops. This metric helps identify bottlenecks in the development process.',
        metricName: 'avgCycleTime',
        metricType: 'cycle_time',
        target: 5,
        warning: 8,
        targetValue: 5,
        warningThreshold: 8,
        criticalThreshold: 12,
        unit: 'days',
        category: 'Flow Efficiency',
        rationale: '5-day average allows for proper development, testing, and review while maintaining good flow. Longer cycles may indicate process bottlenecks.',
        improvementTips: [
          'Break down large stories into smaller tasks',
          'Reduce work-in-progress limits',
          'Streamline code review and testing processes',
          'Identify and remove process bottlenecks',
          'Improve collaboration between team members'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        nextReview: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Team Stability',
        description: 'Consistency of team composition across sprints',
        detailedDescription: 'Team stability measures how consistent the team composition remains over time. Stable teams develop better working relationships, shared understanding, and improved estimation accuracy. High stability leads to better velocity predictability and team performance.',
        metricName: 'teamStability',
        metricType: 'team_stability',
        target: 0.90,
        warning: 0.75,
        targetValue: 0.90,
        warningThreshold: 0.75,
        criticalThreshold: 0.60,
        unit: 'percentage',
        category: 'Team Dynamics',
        rationale: '90% stability allows for gradual team growth while maintaining team cohesion and knowledge retention.',
        improvementTips: [
          'Minimize team member reassignments during active development',
          'Plan team changes during natural transition points',
          'Implement effective knowledge sharing practices',
          'Provide clear career development paths',
          'Foster strong team culture and collaboration'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        nextReview: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 6,
        name: 'Defect Rate',
        description: 'Percentage of delivered stories containing defects',
        detailedDescription: 'Defect rate measures the quality of delivered work by tracking the percentage of stories that contain defects or require rework after being marked as complete. Lower defect rates indicate better development practices, thorough testing, and quality-focused culture.',
        metricName: 'defectRate',
        metricType: 'defect_rate',
        target: 0.05,
        warning: 0.10,
        targetValue: 0.05,
        warningThreshold: 0.10,
        criticalThreshold: 0.15,
        unit: 'percentage',
        category: 'Quality Assurance',
        rationale: 'Target of 5% allows for minor issues while maintaining high quality standards. Higher rates indicate quality process improvements needed.',
        improvementTips: [
          'Implement comprehensive automated testing',
          'Strengthen Definition of Done criteria',
          'Improve peer code review processes',
          'Enhance testing practices and coverage',
          'Invest in team training on quality practices'
        ],
        isActive: true,
        lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Get mock health status
   */
  getMockHealthStatus(): HealthStatus {
    return {
      status: 'healthy',
      jiraConnection: 'ok',
      database: 'ok',
      message: 'All services operational (using mock data)',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get mock health check response
   */
  getMockHealthCheck(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}
