// Types for frontend components
export interface SourceControlRepository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  lastPushedAt: string;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
  lastScanAt?: string;
}

export interface SourceControlBenchmark {
  id: string;
  metric: string;
  passThreshold: number | null;
  warnThreshold: number | null;
  failThreshold: number | null;
  comparisonOperator: 'gte' | 'lte' | 'range' | 'eq';
  unit: string;
  description: string;
  category: 'security' | 'quality' | 'process' | 'performance';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SourceControlMetrics {
  id: string;
  repositoryId: string;
  metricDate: string;
  
  // PR Metrics
  avgTimeToMergePRHours: number | null;
  reviewCoveragePercent: number | null;
  stalePRCount: number;
  totalOpenPRCount: number;
  stalePRRatio: number | null;
  avgPRSizeLines: number | null;
  
  // Security Metrics
  openVulnerabilityCount: number;
  highSeverityVulnerabilityCount: number;
  mediumSeverityVulnerabilityCount: number;
  lowSeverityVulnerabilityCount: number;
  daysSinceLastSecurityScan: number | null;
  
  // Repository Health
  branchProtectionEnabled: boolean;
  directCommitsToDefaultCount: number;
  dependencyDriftCount: number;
  outdatedDependencyCount: number;
  
  // Collaboration Metrics
  activeContributorCount: number;
  avgCommitsPerWeek: number | null;
  codeOwnerFileExists: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface SourceControlComplianceReport {
  id: string;
  repositoryId: string;
  reportDate: string;
  overallScore: number;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  
  // Individual metric results
  timeToMergePRStatus: 'PASS' | 'WARN' | 'FAIL';
  timeToMergePRValue: number | null;
  
  reviewCoverageStatus: 'PASS' | 'WARN' | 'FAIL';
  reviewCoverageValue: number | null;
  
  stalePRStatus: 'PASS' | 'WARN' | 'FAIL';
  stalePRValue: number | null;
  
  branchProtectionStatus: 'PASS' | 'WARN' | 'FAIL';
  branchProtectionValue: boolean;
  
  vulnerabilityStatus: 'PASS' | 'WARN' | 'FAIL';
  vulnerabilityValue: number;
  
  securityScanStatus: 'PASS' | 'WARN' | 'FAIL';
  securityScanValue: number | null;
  
  dependencyDriftStatus: 'PASS' | 'WARN' | 'FAIL';
  dependencyDriftValue: number;
  
  createdAt: string;
}

export interface SourceControlPullRequest {
  id: string;
  number: number;
  repositoryId: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
  authorLogin: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  reviewersCount: number;
  approvalsCount: number;
  requestedChangesCount: number;
  commentsCount: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  timeToMergeHours: number | null;
  timeToFirstReviewHours: number | null;
  baseBranch: string;
  headBranch: string;
  draft: boolean;
  mergeable: boolean | null;
}

export interface SourceControlVulnerability {
  id: string;
  repositoryId: string;
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  state: 'open' | 'fixed' | 'dismissed';
  packageName: string;
  vulnerableVersionRange: string;
  firstPatchedVersion: string | null;
  createdAt: string;
  updatedAt: string;
  dismissedAt: string | null;
  fixedAt: string | null;
  dismissReason: string | null;
  cwe: string | null;
  ghsaId: string;
  description: string;
}

// Dashboard types
export interface DashboardOverview {
  totalRepositories: number;
  activeRepositories: number;
  vulnerabilityStats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
  };
  complianceStats: {
    total: number;
    pass: number;
    warn: number;
    fail: number;
    avgScore: number;
  };
  lastUpdated: string;
}

export interface DashboardTrends {
  timeRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  metrics: any[];
  trends: any[];
}

// API Response types
export interface ApiListResponse<T> {
  items: T[];
  total: number;
}

// Filter and request types
export interface RepositoryFilter {
  owner?: string;
  includeArchived?: boolean;
  search?: string;
  language?: string;
}

export interface MetricsFilter {
  repositoryIds?: string[];
  owner?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
}

export interface ComplianceFilter {
  repositoryIds?: string[];
  owner?: string;
  reportDate?: string;
  status?: 'PASS' | 'WARN' | 'FAIL';
}

export interface VulnerabilityFilter {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  state?: 'open' | 'fixed' | 'dismissed';
}

export interface PullRequestFilter {
  state?: 'open' | 'closed' | 'merged';
  limit?: number;
}

// API interface
export interface SourceControlTrendsApi {
  // Repositories
  getRepositories(filter?: RepositoryFilter): Promise<ApiListResponse<SourceControlRepository>>;
  getRepository(id: string): Promise<SourceControlRepository>;
  
  // Metrics
  getMetrics(filter?: MetricsFilter): Promise<ApiListResponse<SourceControlMetrics>>;
  getRepositoryMetrics(id: string, filter?: { startDate?: string; endDate?: string }): Promise<SourceControlMetrics[]>;
  
  // Compliance
  getComplianceReports(filter?: ComplianceFilter): Promise<ApiListResponse<SourceControlComplianceReport>>;
  getRepositoryComplianceReport(id: string): Promise<SourceControlComplianceReport>;
  
  // Benchmarks
  getBenchmarks(): Promise<ApiListResponse<SourceControlBenchmark>>;
  getBenchmark(metric: string): Promise<SourceControlBenchmark>;
  createBenchmark(data: Partial<SourceControlBenchmark>): Promise<SourceControlBenchmark>;
  updateBenchmark(metric: string, data: Partial<SourceControlBenchmark>): Promise<SourceControlBenchmark>;
  deleteBenchmark(metric: string): Promise<boolean>;
  
  // Vulnerabilities and PRs
  getRepositoryVulnerabilities(id: string, filter?: VulnerabilityFilter): Promise<ApiListResponse<SourceControlVulnerability>>;
  getRepositoryPullRequests(id: string, filter?: PullRequestFilter): Promise<ApiListResponse<SourceControlPullRequest>>;
  
  // Dashboard
  getDashboardOverview(owner?: string): Promise<DashboardOverview>;
  getDashboardTrends(owner?: string, days?: number): Promise<DashboardTrends>;
  
  // Data refresh
  refreshData(repositoryId?: string, force?: boolean): Promise<{ success: boolean; message: string }>;
  getRefreshStatus(): Promise<{ status: string; lastRefresh?: string; nextRefresh?: string }>;
  
  // Data source
  getDataSourceInfo(): Promise<{ useMockData: boolean; dataSource: string }>;
  
  // User-specific methods
  getUserOrganizations(): Promise<ApiListResponse<string>>;
  getUserRepositories(filter?: RepositoryFilter): Promise<ApiListResponse<SourceControlRepository>>;
  getRepositoriesForOrganization(organization: string, filter?: RepositoryFilter): Promise<ApiListResponse<SourceControlRepository>>;
  getUserRepositoryMetrics(id: string, filter?: { startDate?: string; endDate?: string }): Promise<SourceControlMetrics[]>;
  getUserComplianceReports(filter?: ComplianceFilter): Promise<ApiListResponse<SourceControlComplianceReport>>;
}
