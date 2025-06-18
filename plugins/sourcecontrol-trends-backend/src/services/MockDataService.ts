import { LoggerService } from '@backstage/backend-plugin-api';
import { 
  SourceControlRepository,
  SourceControlPullRequest,
  SourceControlVulnerability,
  SourceControlBenchmark,
  SourceControlMetrics,
  SourceControlComplianceReport,
  RepositoryMetricsRequest,
  ComplianceReportRequest,
  BenchmarkUpdateRequest
} from '../types';

export class MockDataService {
  private logger: LoggerService;
  private useMockData: boolean = true; // Always true for mock service

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  /**
   * Check if mock data is being used
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Get mock organizations - alias for getMockUserOrganizations
   */
  getMockOrganizations(): Promise<string[]> {
    return this.getMockUserOrganizations();
  }

  /**
   * Get mock repository trends for a specific repository
   */
  getMockRepositoryTrends(owner: string, repo: string): any {
    this.logger.info(`Returning mock repository trends for ${owner}/${repo}`);
    
    return {
      repository: `${owner}/${repo}`,
      timeRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        days: 30
      },
      trends: [
        {
          date: '2024-12-01',
          avgTimeToMerge: 28.5,
          vulnerabilityCount: 5,
          openPRCount: 8,
          stalePRCount: 2
        },
        {
          date: '2024-12-05',
          avgTimeToMerge: 42.0,
          vulnerabilityCount: 4,
          openPRCount: 6,
          stalePRCount: 1
        },
        {
          date: '2024-12-10',
          avgTimeToMerge: 35.5,
          vulnerabilityCount: 3,
          openPRCount: 5,
          stalePRCount: 0
        }
      ],
      summary: {
        timeToMergeChange: -15.5,
        vulnerabilityChange: -2,
        prActivityChange: 3
      }
    };
  }

  // Mock Repositories
  async getMockRepositories(request: RepositoryMetricsRequest): Promise<SourceControlRepository[]> {
    this.logger.info('Returning mock repository data');
    
    const mockRepos: SourceControlRepository[] = [
      {
        id: 'repo-1',
        name: 'frontend-app',
        fullName: 'alokkulkarni/frontend-app',
        owner: 'alokkulkarni',
        url: 'https://github.com/alokkulkarni/frontend-app',
        description: 'Main frontend application for the platform',
        language: 'TypeScript',
        defaultBranch: 'main',
        isPrivate: false,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-12-10'),
        lastPushedAt: new Date('2024-12-10'),
        starsCount: 45,
        forksCount: 12,
        watchersCount: 45,
        openIssuesCount: 8,
        hasIssues: true,
        hasProjects: true,
        hasWiki: true,
        archived: false,
        disabled: false,
        visibility: 'public',
        lastScanAt: new Date('2024-12-09'),
      },
      {
        id: 'repo-2',
        name: 'backend-api',
        fullName: 'alokkulkarni/backend-api',
        owner: 'alokkulkarni',
        url: 'https://github.com/alokkulkarni/backend-api',
        description: 'Backend API service',
        language: 'Python',
        defaultBranch: 'main',
        isPrivate: true,
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2024-12-09'),
        lastPushedAt: new Date('2024-12-09'),
        starsCount: 23,
        forksCount: 5,
        watchersCount: 23,
        openIssuesCount: 3,
        hasIssues: true,
        hasProjects: false,
        hasWiki: false,
        archived: false,
        disabled: false,
        visibility: 'private',
        lastScanAt: new Date('2024-12-08'),
      },
      {
        id: 'repo-3',
        name: 'infrastructure-templates',
        fullName: 'alokkulkarni/infrastructure-templates',
        owner: 'alokkulkarni',
        url: 'https://github.com/alokkulkarni/infrastructure-templates',
        description: 'Terraform templates for infrastructure',
        language: 'HCL',
        defaultBranch: 'main',
        isPrivate: false,
        createdAt: new Date('2023-03-10'),
        updatedAt: new Date('2024-12-05'),
        lastPushedAt: new Date('2024-12-05'),
        starsCount: 67,
        forksCount: 20,
        watchersCount: 67,
        openIssuesCount: 12,
        hasIssues: true,
        hasProjects: true,
        hasWiki: true,
        archived: false,
        disabled: false,
        visibility: 'public',
        lastScanAt: new Date('2024-12-07'),
      },
      {
        id: 'repo-4',
        name: 'legacy-system',
        fullName: 'alokkulkarni/legacy-system',
        owner: 'alokkulkarni',
        url: 'https://github.com/alokkulkarni/legacy-system',
        description: 'Legacy system - deprecated',
        language: 'Java',
        defaultBranch: 'master',
        isPrivate: true,
        createdAt: new Date('2022-05-15'),
        updatedAt: new Date('2024-01-15'),
        lastPushedAt: new Date('2024-01-15'),
        starsCount: 8,
        forksCount: 2,
        watchersCount: 8,
        openIssuesCount: 25,
        hasIssues: true,
        hasProjects: false,
        hasWiki: false,
        archived: true,
        disabled: false,
        visibility: 'private',
        lastScanAt: new Date('2024-01-15'),
      },
    ];

    // Apply filters
    let filteredRepos = mockRepos;

    if (request.ownerFilter) {
      filteredRepos = filteredRepos.filter(repo => repo.owner === request.ownerFilter);
    }

    if (!request.includeArchived) {
      filteredRepos = filteredRepos.filter(repo => !repo.archived);
    }

    return filteredRepos;
  }

  /**
   * Get mock repositories for a specific organization
   */
  async getMockOrganizationRepositories(organization: string, includeArchived: boolean = false): Promise<SourceControlRepository[]> {
    const request: RepositoryMetricsRequest = {
      ownerFilter: organization,
      includeArchived
    };
    return await this.getMockRepositories(request);
  }

  async getMockRepository(repositoryId: string): Promise<SourceControlRepository | null> {
    const repositories = await this.getMockRepositories({});
    return repositories.find(repo => repo.id === repositoryId) || null;
  }

  // Mock Metrics
  async getMockMetrics(request: RepositoryMetricsRequest): Promise<SourceControlMetrics[]> {
    this.logger.info('Returning mock metrics data');
    
    const mockMetrics: SourceControlMetrics[] = [
      {
        id: 'metrics-1',
        repositoryId: 'repo-1',
        metricDate: new Date('2024-12-10'),
        avgTimeToMergePRHours: 18.5,
        reviewCoveragePercent: 85.0,
        stalePRCount: 2,
        totalOpenPRCount: 8,
        stalePRRatio: 0.25,
        avgPRSizeLines: 150,
        openVulnerabilityCount: 1,
        highSeverityVulnerabilityCount: 0,
        mediumSeverityVulnerabilityCount: 1,
        lowSeverityVulnerabilityCount: 0,
        daysSinceLastSecurityScan: 1,
        branchProtectionEnabled: true,
        directCommitsToDefaultCount: 0,
        dependencyDriftCount: 3,
        outdatedDependencyCount: 5,
        activeContributorCount: 6,
        avgCommitsPerWeek: 12.5,
        codeOwnerFileExists: true,
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-10'),
      },
      {
        id: 'metrics-2',
        repositoryId: 'repo-2',
        metricDate: new Date('2024-12-09'),
        avgTimeToMergePRHours: 32.0,
        reviewCoveragePercent: 92.0,
        stalePRCount: 0,
        totalOpenPRCount: 3,
        stalePRRatio: 0.0,
        avgPRSizeLines: 89,
        openVulnerabilityCount: 0,
        highSeverityVulnerabilityCount: 0,
        mediumSeverityVulnerabilityCount: 0,
        lowSeverityVulnerabilityCount: 0,
        daysSinceLastSecurityScan: 2,
        branchProtectionEnabled: true,
        directCommitsToDefaultCount: 1,
        dependencyDriftCount: 1,
        outdatedDependencyCount: 2,
        activeContributorCount: 4,
        avgCommitsPerWeek: 8.2,
        codeOwnerFileExists: true,
        createdAt: new Date('2024-12-09'),
        updatedAt: new Date('2024-12-09'),
      },
      {
        id: 'metrics-3',
        repositoryId: 'repo-3',
        metricDate: new Date('2024-12-05'),
        avgTimeToMergePRHours: 76.5,
        reviewCoveragePercent: 65.0,
        stalePRCount: 5,
        totalOpenPRCount: 12,
        stalePRRatio: 0.42,
        avgPRSizeLines: 250,
        openVulnerabilityCount: 3,
        highSeverityVulnerabilityCount: 1,
        mediumSeverityVulnerabilityCount: 2,
        lowSeverityVulnerabilityCount: 0,
        daysSinceLastSecurityScan: 5,
        branchProtectionEnabled: false,
        directCommitsToDefaultCount: 8,
        dependencyDriftCount: 12,
        outdatedDependencyCount: 18,
        activeContributorCount: 3,
        avgCommitsPerWeek: 5.8,
        codeOwnerFileExists: false,
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-05'),
      },
    ];

    // Apply filters
    let filteredMetrics = mockMetrics;

    if (request.repositoryIds && request.repositoryIds.length > 0) {
      filteredMetrics = filteredMetrics.filter(metric => 
        request.repositoryIds!.includes(metric.repositoryId)
      );
    }

    if (request.startDate) {
      const startDate = new Date(request.startDate);
      filteredMetrics = filteredMetrics.filter(metric => metric.metricDate >= startDate);
    }

    if (request.endDate) {
      const endDate = new Date(request.endDate);
      filteredMetrics = filteredMetrics.filter(metric => metric.metricDate <= endDate);
    }

    return filteredMetrics;
  }

  async getMockRepositoryMetrics(repositoryId: string, options: { startDate?: string; endDate?: string }): Promise<SourceControlMetrics[]> {
    const allMetrics = await this.getMockMetrics({ repositoryIds: [repositoryId], ...options });
    return allMetrics.filter(metric => metric.repositoryId === repositoryId);
  }

  // Mock Compliance Reports
  async getMockComplianceReports(request: ComplianceReportRequest): Promise<SourceControlComplianceReport[]> {
    this.logger.info('Returning mock compliance report data');
    
    const mockReports: SourceControlComplianceReport[] = [
      {
        id: 'compliance-1',
        repositoryId: 'repo-1',
        reportDate: new Date('2024-12-10'),
        overallScore: 85,
        overallStatus: 'PASS',
        timeToMergePRStatus: 'PASS',
        timeToMergePRValue: 18.5,
        reviewCoverageStatus: 'PASS',
        reviewCoverageValue: 85.0,
        stalePRStatus: 'WARN',
        stalePRValue: 0.25,
        branchProtectionStatus: 'PASS',
        branchProtectionValue: true,
        vulnerabilityStatus: 'WARN',
        vulnerabilityValue: 1,
        securityScanStatus: 'PASS',
        securityScanValue: 1,
        dependencyDriftStatus: 'WARN',
        dependencyDriftValue: 3,
        createdAt: new Date('2024-12-10'),
      },
      {
        id: 'compliance-2',
        repositoryId: 'repo-2',
        reportDate: new Date('2024-12-09'),
        overallScore: 95,
        overallStatus: 'PASS',
        timeToMergePRStatus: 'WARN',
        timeToMergePRValue: 32.0,
        reviewCoverageStatus: 'PASS',
        reviewCoverageValue: 92.0,
        stalePRStatus: 'PASS',
        stalePRValue: 0.0,
        branchProtectionStatus: 'PASS',
        branchProtectionValue: true,
        vulnerabilityStatus: 'PASS',
        vulnerabilityValue: 0,
        securityScanStatus: 'PASS',
        securityScanValue: 2,
        dependencyDriftStatus: 'PASS',
        dependencyDriftValue: 1,
        createdAt: new Date('2024-12-09'),
      },
      {
        id: 'compliance-3',
        repositoryId: 'repo-3',
        reportDate: new Date('2024-12-05'),
        overallScore: 45,
        overallStatus: 'FAIL',
        timeToMergePRStatus: 'FAIL',
        timeToMergePRValue: 76.5,
        reviewCoverageStatus: 'FAIL',
        reviewCoverageValue: 65.0,
        stalePRStatus: 'FAIL',
        stalePRValue: 0.42,
        branchProtectionStatus: 'FAIL',
        branchProtectionValue: false,
        vulnerabilityStatus: 'FAIL',
        vulnerabilityValue: 3,
        securityScanStatus: 'WARN',
        securityScanValue: 5,
        dependencyDriftStatus: 'FAIL',
        dependencyDriftValue: 12,
        createdAt: new Date('2024-12-05'),
      },
    ];

    // Apply filters
    let filteredReports = mockReports;

    if (request.repositoryIds && request.repositoryIds.length > 0) {
      filteredReports = filteredReports.filter(report => 
        request.repositoryIds!.includes(report.repositoryId)
      );
    }

    if (request.reportDate) {
      const reportDate = new Date(request.reportDate);
      filteredReports = filteredReports.filter(report => 
        report.reportDate.toDateString() === reportDate.toDateString()
      );
    }

    return filteredReports;
  }

  async getMockRepositoryComplianceReport(repositoryId: string): Promise<SourceControlComplianceReport | null> {
    const reports = await this.getMockComplianceReports({ repositoryIds: [repositoryId] });
    return reports.length > 0 ? reports[0] : null;
  }

  // Mock Benchmarks
  async getMockBenchmarks(): Promise<SourceControlBenchmark[]> {
    this.logger.info('Returning mock benchmark data');
    
    return [
      {
        id: 'benchmark-1',
        metric: 'timeToMergePR',
        passThreshold: 24,
        warnThreshold: 72,
        failThreshold: 168,
        comparisonOperator: 'lte',
        unit: 'hours',
        description: 'Average time to merge pull requests',
        category: 'process',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'system',
      },
      {
        id: 'benchmark-2',
        metric: 'reviewCoverage',
        passThreshold: 80,
        warnThreshold: 60,
        failThreshold: 40,
        comparisonOperator: 'gte',
        unit: 'percentage',
        description: 'Code review coverage percentage',
        category: 'quality',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'system',
      },
      {
        id: 'benchmark-3',
        metric: 'vulnerabilityCount',
        passThreshold: 0,
        warnThreshold: 5,
        failThreshold: 10,
        comparisonOperator: 'lte',
        unit: 'count',
        description: 'Number of open security vulnerabilities',
        category: 'security',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'system',
      },
      {
        id: 'benchmark-4',
        metric: 'stalePRRatio',
        passThreshold: 0.10,
        warnThreshold: 0.25,
        failThreshold: 0.50,
        comparisonOperator: 'lte',
        unit: 'ratio',
        description: 'Ratio of stale pull requests',
        category: 'process',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'system',
      },
    ];
  }

  async getMockBenchmark(metric: string): Promise<SourceControlBenchmark | null> {
    const benchmarks = await this.getMockBenchmarks();
    return benchmarks.find(benchmark => benchmark.metric === metric) || null;
  }

  // Mock Vulnerabilities
  async getMockRepositoryVulnerabilities(repositoryId: string, options: { severity?: string; state?: string }): Promise<SourceControlVulnerability[]> {
    this.logger.info(`Returning mock vulnerability data for repository ${repositoryId}`);
    
    const mockVulnerabilities: SourceControlVulnerability[] = [
      {
        id: 'vuln-1',
        repositoryId: 'repo-1',
        alertId: 'alert-001',
        severity: 'medium',
        state: 'open',
        packageName: 'lodash',
        vulnerableVersionRange: '<4.17.21',
        firstPatchedVersion: '4.17.21',
        createdAt: new Date('2024-12-08'),
        updatedAt: new Date('2024-12-08'),
        dismissedAt: null,
        fixedAt: null,
        dismissReason: null,
        cwe: 'CWE-400',
        ghsaId: 'GHSA-35jh-r3h4-6jhm',
        description: 'Lodash vulnerable to ReDoS attack',
      },
      {
        id: 'vuln-2',
        repositoryId: 'repo-3',
        alertId: 'alert-002',
        severity: 'high',
        state: 'open',
        packageName: 'axios',
        vulnerableVersionRange: '<0.21.2',
        firstPatchedVersion: '0.21.2',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        dismissedAt: null,
        fixedAt: null,
        dismissReason: null,
        cwe: 'CWE-22',
        ghsaId: 'GHSA-8hc4-vh64-cxmj',
        description: 'Axios vulnerable to SSRF',
      },
      {
        id: 'vuln-3',
        repositoryId: 'repo-3',
        alertId: 'alert-003',
        severity: 'medium',
        state: 'open',
        packageName: 'express',
        vulnerableVersionRange: '<4.18.2',
        firstPatchedVersion: '4.18.2',
        createdAt: new Date('2024-11-25'),
        updatedAt: new Date('2024-11-25'),
        dismissedAt: null,
        fixedAt: null,
        dismissReason: null,
        cwe: 'CWE-79',
        ghsaId: 'GHSA-qwcr-r2fm-qrc7',
        description: 'Express vulnerable to XSS',
      },
    ];

    let filteredVulns = mockVulnerabilities.filter(vuln => vuln.repositoryId === repositoryId);

    if (options.severity) {
      filteredVulns = filteredVulns.filter(vuln => vuln.severity === options.severity);
    }

    if (options.state) {
      filteredVulns = filteredVulns.filter(vuln => vuln.state === options.state);
    }

    return filteredVulns;
  }

  // Mock Pull Requests
  async getMockRepositoryPullRequests(repositoryId: string, options: { state?: string; limit?: number }): Promise<SourceControlPullRequest[]> {
    this.logger.info(`Returning mock pull request data for repository ${repositoryId}`);
    
    const mockPRs: SourceControlPullRequest[] = [
      {
        id: 'pr-1',
        number: 42,
        repositoryId: 'repo-1',
        title: 'Add user authentication feature',
        state: 'open',
        authorLogin: 'alokkulkarni',
        authorId: 'user-1',
        createdAt: new Date('2024-12-08'),
        updatedAt: new Date('2024-12-10'),
        closedAt: null,
        mergedAt: null,
        reviewersCount: 2,
        approvalsCount: 1,
        requestedChangesCount: 0,
        commentsCount: 5,
        additions: 250,
        deletions: 30,
        changedFiles: 8,
        timeToMergeHours: null,
        timeToFirstReviewHours: 4.5,
        baseBranch: 'main',
        headBranch: 'feature/user-auth',
        draft: false,
        mergeable: true,
      },
      {
        id: 'pr-2',
        number: 41,
        repositoryId: 'repo-1',
        title: 'Fix memory leak in data processing',
        state: 'merged',
        authorLogin: 'developer2',
        authorId: 'user-2',
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-07'),
        closedAt: new Date('2024-12-07'),
        mergedAt: new Date('2024-12-07'),
        reviewersCount: 3,
        approvalsCount: 3,
        requestedChangesCount: 1,
        commentsCount: 12,
        additions: 45,
        deletions: 67,
        changedFiles: 3,
        timeToMergeHours: 36.5,
        timeToFirstReviewHours: 2.0,
        baseBranch: 'main',
        headBranch: 'bugfix/memory-leak',
        draft: false,
        mergeable: null,
      },
    ];

    let filteredPRs = mockPRs.filter(pr => pr.repositoryId === repositoryId);

    if (options.state) {
      filteredPRs = filteredPRs.filter(pr => pr.state === options.state);
    }

    if (options.limit) {
      filteredPRs = filteredPRs.slice(0, options.limit);
    }

    return filteredPRs;
  }

  // Mock Dashboard Data
  async getMockDashboardOverview(): Promise<any> {
    this.logger.info('Returning mock dashboard overview data');
    
    return {
      totalRepositories: 4,
      activeRepositories: 3,
      vulnerabilityStats: {
        total: 3,
        critical: 0,
        high: 1,
        medium: 2,
        low: 0,
        open: 3,
      },
      complianceStats: {
        total: 3,
        pass: 2,
        warn: 0,
        fail: 1,
        avgScore: 75,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getMockDashboardTrends(days: number = 30): Promise<any> {
    this.logger.info('Returning mock dashboard trends data');
    
    return {
      timeRange: { 
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000), 
        endDate: new Date(), 
        days 
      },
      metrics: [
        { date: '2024-12-01', avgTimeToMerge: 28.5, vulnerabilityCount: 5 },
        { date: '2024-12-05', avgTimeToMerge: 42.0, vulnerabilityCount: 4 },
        { date: '2024-12-10', avgTimeToMerge: 35.5, vulnerabilityCount: 3 },
      ],
      trends: [
        { metric: 'timeToMerge', trend: 'improving', change: -15.5 },
        { metric: 'vulnerabilities', trend: 'improving', change: -2 },
        { metric: 'compliance', trend: 'stable', change: 0 },
      ],
    };
  }

  // Mock operations that return success
  async mockRefreshData(repositoryId?: string): Promise<void> {
    this.logger.info(`Mock data refresh initiated${repositoryId ? ` for repository ${repositoryId}` : ''}`);
  }

  async getMockRefreshStatus(): Promise<{ status: string; lastRefresh?: Date; nextRefresh?: Date }> {
    return {
      status: 'mock_mode',
      lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      nextRefresh: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
    };
  }

  async mockCreateBenchmark(data: BenchmarkUpdateRequest): Promise<SourceControlBenchmark> {
    this.logger.info(`Mock benchmark creation for metric: ${data.metric}`);
    
    return {
      id: `mock-${Date.now()}`,
      metric: data.metric,
      passThreshold: data.passThreshold || null,
      warnThreshold: data.warnThreshold || null,
      failThreshold: data.failThreshold || null,
      comparisonOperator: data.comparisonOperator || 'lte',
      unit: data.unit || '',
      description: data.description || '',
      category: data.category || 'quality',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock-user',
    };
  }

  async mockUpdateBenchmark(metric: string, data: BenchmarkUpdateRequest): Promise<SourceControlBenchmark | null> {
    this.logger.info(`Mock benchmark update for metric: ${metric}`);
    
    const existing = await this.getMockBenchmark(metric);
    if (!existing) return null;

    return {
      ...existing,
      passThreshold: data.passThreshold ?? existing.passThreshold,
      warnThreshold: data.warnThreshold ?? existing.warnThreshold,
      failThreshold: data.failThreshold ?? existing.failThreshold,
      comparisonOperator: data.comparisonOperator || existing.comparisonOperator,
      unit: data.unit ?? existing.unit,
      description: data.description ?? existing.description,
      category: data.category || existing.category,
      updatedAt: new Date(),
    };
  }

  async mockDeleteBenchmark(metric: string): Promise<boolean> {
    this.logger.info(`Mock benchmark deletion for metric: ${metric}`);
    return true;
  }

  // User-specific mock data methods

  /**
   * Get mock accessible repository IDs for a user
   */
  getMockUserAccessibleRepositoryIds(): string[] {
    return ['repo-1', 'repo-2', 'repo-3', 'repo-4'];
  }

  /**
   * Check if user has access to a specific repository
   */
  hasUserAccessToRepository(repositoryId: string, _userOrganizations: string[]): boolean {
    const accessibleIds = this.getMockUserAccessibleRepositoryIds();
    
    // Check if repository ID is in user's accessible repositories
    if (accessibleIds.includes(repositoryId)) {
      return true;
    }
    
    // For additional security, could also check if repository belongs to user's organizations
    // This would require looking up the repository and checking its owner
    return false;
  }

  /**
   * Get mock user organizations
   */
  async getMockUserOrganizations(_userRequest?: any): Promise<string[]> {
    this.logger.info('Returning mock user organizations');
    return ['alokkulkarni', 'virginmoney', 'platformteam'];
  }

  /**
   * Get mock repositories for a specific organization
   */
  async getMockRepositoriesForOrganization(organization: string, filters?: { includeArchived?: boolean }): Promise<SourceControlRepository[]> {
    this.logger.info(`Returning mock repositories for organization: ${organization}`);
    
    const allRepos = await this.getMockRepositories({});
    
    // Filter repositories by organization (owner)
    let filteredRepos = allRepos.filter(repo => repo.owner === organization);
    
    // Apply archive filter if specified
    if (!filters?.includeArchived) {
      filteredRepos = filteredRepos.filter(repo => !repo.archived);
    }
    
    return filteredRepos;
  }

  /**
   * Get mock user-accessible repositories
   */
  async getMockUserRepositories(_userRequest?: any, filters?: { includeArchived?: boolean; ownerFilter?: string }): Promise<SourceControlRepository[]> {
    this.logger.info('Returning mock user-accessible repositories');
    
    const allRepos = await this.getMockRepositories({});
    let filteredRepos = allRepos;
    
    // Apply owner filter if specified
    if (filters?.ownerFilter) {
      filteredRepos = filteredRepos.filter(repo => repo.owner === filters.ownerFilter);
    }
    
    // Apply archive filter if specified
    if (!filters?.includeArchived) {
      filteredRepos = filteredRepos.filter(repo => !repo.archived);
    }
    
    // For mock data, return all repositories (in real implementation, filter by user access)
    return filteredRepos;
  }
}
