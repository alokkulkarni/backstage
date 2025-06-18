// Database schemas for Source Control Trends
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
  createdAt: Date;
  updatedAt: Date;
  lastPushedAt: Date;
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
  lastScanAt?: Date;
}

export interface SourceControlBranchProtection {
  id: string;
  repositoryId: string;
  branchName: string;
  protectionEnabled: boolean;
  requirePullRequest: boolean;
  requiredReviewers: number;
  dismissStaleReviews: boolean;
  requireCodeOwnerReviews: boolean;
  requireStatusChecks: boolean;
  requireUpToDate: boolean;
  enforceAdmins: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceControlPullRequest {
  id: string;
  number: number;
  repositoryId: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
  authorLogin: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  mergedAt: Date | null;
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

export interface SourceControlCommit {
  id: string;
  sha: string;
  repositoryId: string;
  authorLogin: string;
  authorId: string;
  message: string;
  timestamp: Date;
  directToDefault: boolean;
  branchName: string;
  additions: number;
  deletions: number;
  changedFiles: number;
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
  createdAt: Date;
  updatedAt: Date;
  dismissedAt: Date | null;
  fixedAt: Date | null;
  dismissReason: string | null;
  cwe: string | null;
  ghsaId: string;
  description: string;
}

export interface SourceControlSecurityScan {
  id: string;
  repositoryId: string;
  scanType: 'dependabot' | 'code_scanning' | 'secret_scanning';
  status: 'completed' | 'failed' | 'in_progress';
  completedAt: Date | null;
  alertsCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  createdAt: Date;
}

export interface SourceControlDependency {
  id: string;
  repositoryId: string;
  packageName: string;
  packageVersion: string;
  packageManager: string;
  manifestPath: string;
  dependencyType: 'direct' | 'indirect';
  scope: 'runtime' | 'development';
  isOutdated: boolean;
  latestVersion: string | null;
  majorVersionsBehind: number;
  minorVersionsBehind: number;
  patchVersionsBehind: number;
  createdAt: Date;
  updatedAt: Date;
}

// Compliance and benchmark schemas
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
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SourceControlMetrics {
  id: string;
  repositoryId: string;
  metricDate: Date;
  
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
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceControlComplianceReport {
  id: string;
  repositoryId: string;
  reportDate: Date;
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
  
  createdAt: Date;
}

// API Request/Response types
export interface RepositoryMetricsRequest {
  repositoryIds?: string[];
  ownerFilter?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
  userRequest?: any; // HTTP request object for user context
}

export interface ComplianceReportRequest {
  repositoryIds?: string[];
  ownerFilter?: string;
  reportDate?: string;
  userRequest?: any; // HTTP request object for user context
}

export interface BenchmarkUpdateRequest {
  metric: string;
  passThreshold?: number;
  warnThreshold?: number;
  failThreshold?: number;
  comparisonOperator?: 'gte' | 'lte' | 'range' | 'eq';
  unit?: string;
  description?: string;
  category?: 'security' | 'quality' | 'process' | 'performance';
}

// Data ingestion types
export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  html_url: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  private: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
}

export interface GitHubPullRequestResponse {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    id: number;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
  draft: boolean;
  mergeable: boolean | null;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  requested_reviewers: any[];
}

export interface GitHubVulnerabilityResponse {
  number: number;
  state: 'open' | 'fixed' | 'dismissed';
  security_advisory: {
    ghsa_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    description: string;
    cwe: {
      cwe_id: string;
    } | null;
  };
  security_vulnerability: {
    package: {
      name: string;
    };
    vulnerable_version_range: string;
    first_patched_version: {
      identifier: string;
    } | null;
  };
  created_at: string;
  updated_at: string;
  dismissed_at: string | null;
  fixed_at: string | null;
  dismiss_reason: string | null;
}

// Service interfaces
export interface GitHubApiService {
  getRepositories(org?: string): Promise<GitHubRepositoryResponse[]>;
  getPullRequests(owner: string, repo: string, state?: 'open' | 'closed' | 'all'): Promise<GitHubPullRequestResponse[]>;
  getBranchProtection(owner: string, repo: string, branch: string): Promise<any>;
  getVulnerabilityAlerts(owner: string, repo: string): Promise<GitHubVulnerabilityResponse[]>;
  getCommits(owner: string, repo: string, since?: Date, until?: Date): Promise<any[]>;
  getDependencies(owner: string, repo: string): Promise<any[]>;
  getSecurityScans(owner: string, repo: string): Promise<any[]>;
}

export interface MetricsCalculationService {
  calculateRepositoryMetrics(repositoryId: string, dateRange: { start: Date; end: Date }): Promise<SourceControlMetrics>;
  calculateComplianceReport(repositoryId: string, benchmarks: SourceControlBenchmark[]): Promise<SourceControlComplianceReport>;
}

export interface DataIngestionService {
  ingestRepositoryData(repositories: GitHubRepositoryResponse[]): Promise<void>;
  ingestPullRequestData(repositoryId: string, pullRequests: GitHubPullRequestResponse[]): Promise<void>;
  ingestVulnerabilityData(repositoryId: string, vulnerabilities: GitHubVulnerabilityResponse[]): Promise<void>;
  refreshRepositoryData(repositoryId?: string): Promise<void>;
}
