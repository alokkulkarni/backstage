// Jenkins API types
export interface JenkinsUser {
  id: string;
  fullName: string;
  description?: string;
  property?: Array<{
    _class: string;
    address?: string;
  }>;
}

export interface JenkinsJob {
  _class: string;
  name: string;
  url: string;
  color: string;
  fullDisplayName?: string;
  description?: string;
  buildable: boolean;
  lastBuild?: JenkinsBuild;
  lastCompletedBuild?: JenkinsBuild;
  lastFailedBuild?: JenkinsBuild;
  lastStableBuild?: JenkinsBuild;
  lastSuccessfulBuild?: JenkinsBuild;
  lastUnstableBuild?: JenkinsBuild;
  lastUnsuccessfulBuild?: JenkinsBuild;
}

export interface JenkinsBuildStage {
  _class: string;
  id: string;
  name: string;
  status: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'IN_PROGRESS' | 'NOT_EXECUTED';
  startTimeMillis: number;
  durationMillis: number;
  pauseDurationMillis?: number;
  stageFlowNodes?: Array<{
    id: string;
    name: string;
    status: string;
    startTimeMillis: number;
    durationMillis: number;
  }>;
}

export interface JenkinsTestResult {
  _class: string;
  duration: number;
  empty: boolean;
  failCount: number;
  passCount: number;
  skipCount: number;
  suites: Array<{
    name: string;
    duration: number;
    cases: Array<{
      name: string;
      className: string;
      status: 'PASSED' | 'FAILED' | 'SKIPPED';
      duration: number;
      errorDetails?: string;
      errorStackTrace?: string;
    }>;
  }>;
}

export interface SonarQubeQualityGate {
  status: 'OK' | 'WARN' | 'ERROR';
  conditions: Array<{
    status: 'OK' | 'WARN' | 'ERROR';
    metricKey: string;
    comparator: string;
    periodIndex?: number;
    errorThreshold?: string;
    actualValue?: string;
  }>;
  projectStatus?: {
    status: string;
    conditions: Array<{
      status: string;
      metricKey: string;
      actualValue: string;
    }>;
  };
}

export interface JenkinsBuild {
  _class: string;
  number: number;
  url: string;
  displayName: string;
  description?: string;
  duration: number;
  estimatedDuration: number;
  executor?: any;
  fullDisplayName: string;
  id: string;
  keepLog: boolean;
  queueId: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'NOT_BUILT' | null;
  timestamp: number;
  building: boolean;
  builtOn?: string;
  // Enhanced build details
  stages?: JenkinsBuildStage[];
  testResults?: JenkinsTestResults;
  sonarQube?: SonarQubeResult;
  failureDetails?: JenkinsFailureDetails;
  previousBuild?: {
    number: number;
    duration: number;
    result: string;
  };
  changeSet?: {
    _class: string;
    items: Array<{
      _class: string;
      author: {
        absoluteUrl: string;
        fullName: string;
      };
      commitId: string;
      timestamp: number;
      date: string;
      msg: string;
    }>;
    kind: string;
  };
  culprits?: Array<{
    absoluteUrl: string;
    fullName: string;
  }>;
  actions?: Array<{
    _class: string;
    causes?: Array<{
      _class: string;
      shortDescription: string;
      userId?: string;
      userName?: string;
    }>;
  }>;
}

export interface JenkinsJobWithBuilds extends JenkinsJob {
  builds: JenkinsBuild[];
}

export interface JenkinsUserJobsResponse {
  jobs: JenkinsJob[];
  builds: JenkinsBuild[];
}

// Enhanced types for the new API methods
export interface JenkinsBuildTrend {
  buildNumber: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'NOT_BUILT' | null;
  duration: number;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  durationChange: number;
}

export interface JenkinsProjectSummary {
  name: string;
  jobs: JenkinsJob[];
  lastBuild?: JenkinsBuild;
  successRate: number;
  totalBuilds: number;
  recentBuilds: JenkinsBuild[];
}

// Updated interfaces to match the API implementations
export interface JenkinsTestResults {
  totalCount: number;
  failCount: number;
  skipCount: number;
  passCount: number;
  suites: Array<{
    name: string;
    duration: number;
    cases: JenkinsTestCase[];
  }>;
  failedTests?: JenkinsTestCase[];
  testReportUrl?: string;
}

export interface SonarQubeResult {
  status: 'OK' | 'WARN' | 'ERROR' | 'UNKNOWN';
  url?: string;
  conditions: Array<{
    status: 'OK' | 'WARN' | 'ERROR';
    metricKey: string;
    comparator: string;
    periodIndex?: number;
    errorThreshold?: string;
    actualValue?: string;
  }>;
}

// New interfaces for enhanced failure information
export interface JenkinsConsoleOutput {
  text: string;
  hasMore: boolean;
  size: number;
}

export interface JenkinsBuildArtifact {
  displayPath: string;
  fileName: string;
  relativePath: string;
  size?: number;
  url: string;
  originalUrl?: string; // Original Jenkins URL for direct access
}

export interface JenkinsFailureDetails {
  consoleOutput?: JenkinsConsoleOutput;
  failedStages: Array<{
    stageName: string;
    errorMessage: string;
    stackTrace?: string;
    logUrl: string;
  }>;
  artifacts: JenkinsBuildArtifact[];
  consoleFailures?: Array<{
    errorType: string;
    errorMessage: string;
    location?: string;
    timestamp?: string;
  }>;
}

// Enhanced test case interface with more detailed failure information
export interface JenkinsTestCase {
  name: string;
  className: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  errorDetails?: string;
  errorStackTrace?: string;
  failedSince?: number;
  age?: number;
  testResultUrl?: string;
}
