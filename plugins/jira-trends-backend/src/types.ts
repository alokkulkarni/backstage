/**
 * Types for Jira Sprint Insights & Trends Plugin
 */

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location?: {
    projectId: number;
    projectKey: string;
    projectName: string;
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  boardId: number;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: {
      name: string;
      iconUrl: string;
    };
    status: {
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    storyPoints?: number;
    created: string;
    updated: string;
    resolutiondate?: string;
    // Allow for custom fields (like story point fields)
    [key: string]: any;
  };
}

export interface SprintMetrics {
  id: number;
  sprintId: number;
  sprintName: string;
  boardId: number;
  boardName?: string;
  velocity: number;
  churnRate: number;
  completionRatio: number;
  avgCycleTime: number;
  teamStability: number;
  defectRate: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
  sprintCompleteDate?: string;
  workTypeBreakdown: {
    story: number;
    bug: number;
    task: number;
    epic: number;
    [key: string]: number;
  };
  teamComposition: {
    totalMembers: number;
    newMembers: number;
    experiencedMembers: number;
    seniorDevs: number;
    juniorDevs: number;
    qaEngineers: number;
    designers: number;
    productOwners: number;
  };
  issueMetrics: {
    totalIssues: number;
    completedIssues: number;
    addedAfterStart: number;
    removedAfterStart: number;
    spilloverFromPrevious: number;
  };
  lastUpdated: string;
  createdAt: string;
}

export interface SprintBenchmark {
  id: number;
  name: string;
  description: string;
  metricName: string;
  metricType: 'velocity' | 'churn_rate' | 'completion_ratio' | 'cycle_time' | 'team_stability' | 'defect_rate';
  target: number;
  warning: number;
  targetValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ComplianceStatus = 'PASS' | 'WARN' | 'FAIL';

export interface ComplianceResult {
  metric: string;
  status: ComplianceStatus;
  value: number;
  actualValue: number;
  targetValue: number;
  warningThreshold: number;
  deviation: number;
  message: string;
  benchmark: SprintBenchmark;
}

export interface SprintComplianceReport {
  id?: number;
  sprintId: number;
  sprintName?: string;
  boardId: number;
  boardName?: string;
  evaluationDate: string;
  overallStatus: ComplianceStatus;
  overallScore?: number;
  metrics: Record<string, ComplianceResult>;
  recommendations: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  jiraConnection: 'ok' | 'error';
  database: 'ok' | 'error';
  message?: string;
  timestamp: string;
}

export interface TrendData {
  date: string;
  sprintId?: number;
  sprintName: string;
  boardId?: number;
  velocity: number;
  churnRate: number;
  completionRatio: number;
  bugCount: number;
  teamSize: number;
  teamChangePercentage: number;
  // Enhanced metrics for better trend analysis
  burndownEfficiency?: number;
  scopeChange?: number;
  cycleTime?: number;
  leadTime?: number;
  qualityScore?: number;
  teamSatisfaction?: number;
  deliveryPredictability?: number;
}

// Database entities
export interface SprintMetricsEntity {
  id?: number;
  sprint_id: number;
  sprint_name: string;
  board_id: number;
  velocity: number;
  churn_rate: number;
  committed_vs_completed: number;
  bug_count: number;
  story_point_trend: number;
  work_type_breakdown: string; // JSON string
  team_size: number;
  team_members: string; // JSON string
  team_change: number;
  start_date?: string;
  end_date?: string;
  complete_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SprintBenchmarkEntity {
  metric: string;
  pass_threshold: number;
  warn_threshold?: number;
  fail_threshold?: number;
  comparison_operator: string;
  unit: string;
  description: string;
}

// API Response types
export interface GetSprintMetricsResponse {
  metrics: SprintMetrics[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GetComplianceReportResponse {
  report: SprintComplianceReport;
}

export interface RefreshDataResponse {
  success: boolean;
  message: string;
  sprintsProcessed: number;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}
