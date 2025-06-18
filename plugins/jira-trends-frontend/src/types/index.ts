// Backend types copied for frontend usage
export interface JiraBoard {
  id: number;
  name: string;
  type: 'scrum' | 'kanban';
  projectKey: string;
  projectName: string;
  isActive: boolean;
  sprintCount: number;
  lastActivity: string;
  self?: string;
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

export interface SprintMetrics {
  id: number;
  sprintId: number;
  sprintName: string;
  boardId: number;
  boardName?: string;
  sprintStartDate?: string;
  sprintEndDate?: string;
  sprintCompleteDate?: string;
  
  // Core metrics
  velocity: number;
  churnRate: number;
  completionRatio: number;
  avgCycleTime: number;
  defectRate: number;
  teamStability: number;
  
  // Work breakdown
  workTypeBreakdown: {
    story: number;
    bug: number;
    task: number;
    epic: number;
    [key: string]: number;
  };
  
  // Team metrics
  teamComposition: {
    totalMembers: number;
    seniorDevs: number;
    juniorDevs: number;
    qaEngineers: number;
    designers: number;
    productOwners: number;
    newMembers: number;
    experiencedMembers: number;
  };
  
  // Additional metrics
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
  metricName: string;
  metricType: 'velocity' | 'churn_rate' | 'completion_ratio' | 'cycle_time' | 'team_stability' | 'defect_rate';
  target: number;
  targetValue: number;
  warning: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  description: string;
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
  id: number;
  sprintId: number;
  sprintName: string;
  boardId: number;
  boardName: string;
  evaluationDate: string;
  overallStatus: ComplianceStatus;
  overallScore: number;
  metrics: Record<string, ComplianceResult>;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
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
  sprintId: number;
  sprintName: string;
  boardId: number;
  velocity: number;
  burndownEfficiency: number;
  scopeChange: number;
  cycleTime: number;
  leadTime: number;
  qualityScore: number;
  teamSatisfaction?: number;
  deliveryPredictability: number;
  churnRate: number;
  completionRatio: number;
  bugCount: number;
  teamSize: number;
  teamChangePercentage: number;
}

// Frontend-specific types
export interface DashboardData {
  recentMetrics: SprintMetrics[];
  complianceReports: SprintComplianceReport[];
  healthStatus: HealthStatus;
  boards: JiraBoard[];
  benchmarks: SprintBenchmark[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface ComplianceChartData {
  date: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  totalSprints: number;
}

export interface MetricsTrendData {
  velocity: ChartDataPoint[];
  churnRate: ChartDataPoint[];
  completionRatio: ChartDataPoint[];
  defectRate: ChartDataPoint[];
  teamSize: ChartDataPoint[];
}

export interface FilterOptions {
  boardId?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  limit?: number;
}

export interface TableColumn {
  field: string;
  headerName: string;
  width?: number;
  renderCell?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

export interface AlertConfig {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface RefreshStatus {
  isRefreshing: boolean;
  lastRefresh?: string;
  schedule?: string;
  isScheduled: boolean;
}
