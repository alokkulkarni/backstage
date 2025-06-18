import React, { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Card,
  CardHeader,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Collapse,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Cancel as AbortedIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as TrendingFlatIcon
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { jenkinsApiRef, JenkinsJob, JenkinsBuild, JenkinsBuildStage, SonarQubeResult } from '../../api';

interface JenkinsJobsCardProps {
  title?: string;
  showRefreshButton?: boolean;
  maxItems?: number;
}

interface ProjectGroup {
  projectName: string;
  jobs: JenkinsJob[];
  builds: JenkinsBuild[];
}

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  listItem: {
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expandedItem: {
    backgroundColor: theme.palette.action.selected,
  },
  buildHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  buildDetails: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1),
    margin: theme.spacing(1, 0),
  },
  stageContainer: {
    margin: theme.spacing(1, 0),
  },
  stage: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
  stageSuccess: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  stageFailure: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  stageWarning: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  stageDefault: {
    backgroundColor: theme.palette.grey[200],
  },
  qualityGate: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    margin: theme.spacing(1, 0),
  },
  qualityGateOk: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  qualityGateError: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  qualityGateWarn: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  metricsGrid: {
    marginTop: theme.spacing(1),
  },
  metricCard: {
    padding: theme.spacing(1),
    textAlign: 'center',
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  trendIcon: {
    marginLeft: theme.spacing(0.5),
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  jobName: {
    fontWeight: 500,
  },
  buildNumber: {
    color: theme.palette.text.secondary,
    fontSize: '0.8rem',
  },
  timeAgo: {
    color: theme.palette.text.secondary,
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tabPanel: {
    padding: theme.spacing(1, 0),
  },
}));

const TabPanel: React.FC<{ children: React.ReactNode; value: number; index: number }> = ({
  children,
  value,
  index,
}) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const getBuildStatusIcon = (result: string | null, building: boolean) => {
  if (building) return <CircularProgress size={16} />;
  
  switch (result) {
    case 'SUCCESS':
      return <SuccessIcon style={{ color: '#4caf50', fontSize: 16 }} />;
    case 'FAILURE':
      return <ErrorIcon style={{ color: '#f44336', fontSize: 16 }} />;
    case 'UNSTABLE':
      return <WarningIcon style={{ color: '#ff9800', fontSize: 16 }} />;
    case 'ABORTED':
      return <AbortedIcon style={{ color: '#757575', fontSize: 16 }} />;
    default:
      return <BuildIcon style={{ color: '#2196f3', fontSize: 16 }} />;
  }
};

const getResultColor = (result: string | null, building: boolean) => {
  if (building) return 'primary';
  
  switch (result) {
    case 'SUCCESS':
      return 'default';
    case 'FAILURE':
      return 'secondary';
    case 'UNSTABLE':
      return 'default';
    case 'ABORTED':
      return 'default';
    default:
      return 'primary';
  }
};

const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
};

const getTrendIcon = (currentDuration: number, previousDuration?: number) => {
  if (!previousDuration) return null;
  
  const diff = currentDuration - previousDuration;
  const threshold = previousDuration * 0.1; // 10% threshold
  
  if (diff > threshold) {
    return <TrendingUpIcon className="trendIcon" style={{ color: '#f44336', fontSize: 16 }} />;
  } else if (diff < -threshold) {
    return <TrendingDownIcon className="trendIcon" style={{ color: '#4caf50', fontSize: 16 }} />;
  }
  return <TrendingFlatIcon className="trendIcon" style={{ color: '#757575', fontSize: 16 }} />;
};

const BuildStagesView: React.FC<{ stages: JenkinsBuildStage[] }> = ({ stages }) => {
  const classes = useStyles();
  
  return (
    <Box className={classes.stageContainer}>
      <Typography variant="h6" gutterBottom>
        <TimelineIcon style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Build Stages
      </Typography>
      {stages.map((stage) => (
        <Box
          key={stage.id}
          className={`${classes.stage} ${
            stage.status === 'SUCCESS' ? classes.stageSuccess :
            stage.status === 'FAILURE' ? classes.stageFailure :
            stage.status === 'UNSTABLE' ? classes.stageWarning :
            classes.stageDefault
          }`}
        >
          <Typography variant="body2" style={{ fontWeight: 500 }}>
            {stage.name}
          </Typography>
          <Typography variant="caption">
            {formatDuration(stage.durationMillis)}
          </Typography>
          <Chip size="small" label={stage.status} />
        </Box>
      ))}
    </Box>
  );
};

const SonarQubeView: React.FC<{ qualityGate: SonarQubeResult }> = ({ qualityGate }) => {
  const classes = useStyles();
  
  return (
    <Box className={classes.qualityGate + ' ' + (
      qualityGate.status === 'OK' ? classes.qualityGateOk :
      qualityGate.status === 'ERROR' ? classes.qualityGateError :
      classes.qualityGateWarn
    )}>
      <CodeIcon />
      <Typography variant="h6">
        SonarQube Quality Gate: {qualityGate.status}
      </Typography>
      {qualityGate.conditions && qualityGate.conditions.length > 0 && (
        <Box style={{ marginLeft: 16 }}>
          {qualityGate.conditions.map((condition: any, index: number) => (
            <Typography key={index} variant="caption" display="block">
              {condition.metricKey}: {condition.actualValue} ({condition.status})
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

const FailureDetailsView: React.FC<{ 
  failureDetails: any; 
  jenkinsApi?: any; 
  jobName?: string; 
  buildNumber?: number; 
}> = ({ failureDetails, jenkinsApi, jobName, buildNumber }) => {
  const classes = useStyles();
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<any>(null);
  const [loadingConsole, setLoadingConsole] = useState(false);
  const [consoleError, setConsoleError] = useState<string | null>(null);

  const loadConsoleOutput = async () => {
    if (!jenkinsApi || !jobName || !buildNumber) {
      setConsoleError('Unable to load console output: missing job information');
      return;
    }

    setLoadingConsole(true);
    setConsoleError(null);
    
    try {
      const decodedJobName = decodeURIComponent(jobName);
      const output = await jenkinsApi.getConsoleOutput(decodedJobName, buildNumber);
      setConsoleOutput(output);
      setConsoleExpanded(true);
    } catch (error) {
      console.error('Failed to load console output:', error);
      setConsoleError(`Failed to load console output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingConsole(false);
    }
  };

  return (
    <Box className={classes.metricsGrid}>
      <Typography variant="h6" gutterBottom style={{ color: '#f44336' }}>
        <ErrorIcon style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Build Failure Analysis
      </Typography>
      
      {/* Failed Stages - User-friendly display */}
      {failureDetails?.failedStages && failureDetails.failedStages.length > 0 ? (
        <Box style={{ marginBottom: 16 }}>
          <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 600, color: '#d32f2f' }}>
            Failed Stages ({failureDetails.failedStages.length})
          </Typography>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {failureDetails.failedStages.map((stage: any, index: number) => (
              <Box key={index} style={{ 
                padding: 12, 
                backgroundColor: '#ffebee', 
                borderRadius: 8, 
                border: '1px solid #ffcdd2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Typography variant="subtitle2" style={{ fontWeight: 600, color: '#c62828' }}>
                    📋 {stage.stageName}
                  </Typography>
                  {stage.logUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => window.open(stage.logUrl, '_blank')}
                      startIcon={<LaunchIcon />}
                      style={{ minWidth: 'auto', padding: '4px 8px' }}
                    >
                      View Log
                    </Button>
                  )}
                </Box>
                <Typography variant="body2" color="error" style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '13px',
                  backgroundColor: '#fff',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ffcdd2'
                }}>
                  {stage.errorMessage || 'Stage failed without specific error message'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : failureDetails?.consoleFailures && failureDetails.consoleFailures.length > 0 ? (
        <Box style={{ marginBottom: 16 }}>
          <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 600, color: '#d32f2f' }}>
            Console Analysis - Build Failures ({failureDetails.consoleFailures.length})
          </Typography>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {failureDetails.consoleFailures.map((failure: any, index: number) => (
              <Box key={index} style={{ 
                padding: 12, 
                backgroundColor: '#ffebee', 
                borderRadius: 8, 
                border: '1px solid #ffcdd2',
                marginBottom: 8
              }}>
                <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 4, color: '#d32f2f' }}>
                  {failure.errorType}
                </Typography>
                <Typography variant="body2" style={{ 
                  padding: 8, 
                  backgroundColor: '#fff', 
                  borderRadius: 4,
                  border: '1px solid #ffcdd2',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  {failure.errorMessage}
                </Typography>
                {(failure.location || failure.timestamp) && (
                  <Box style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                    {failure.location && (
                      <Typography variant="caption" color="textSecondary">
                        📍 {failure.location}
                      </Typography>
                    )}
                    {failure.timestamp && (
                      <Typography variant="caption" color="textSecondary">
                        🕒 {failure.timestamp}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="textSecondary" style={{ fontStyle: 'italic', marginTop: 8 }}>
            💡 These errors were extracted from the build console output to help identify the root cause
          </Typography>
        </Box>
      ) : (
        <Box style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
            ℹ️ No detailed failure information available - build may have failed during initialization or checkout
          </Typography>
        </Box>
      )}

      {/* Test Results Summary */}
      {failureDetails?.testResults && failureDetails.testResults.failCount > 0 && (
        <Box style={{ marginBottom: 16 }}>
          <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 600, color: '#d32f2f' }}>
            Test Failures ({failureDetails.testResults.failCount} of {failureDetails.testResults.totalCount})
          </Typography>
          <Box style={{ 
            padding: 12, 
            backgroundColor: '#fff3e0', 
            borderRadius: 8, 
            border: '1px solid #ffcc02',
            marginBottom: 8
          }}>
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              🧪 <strong>{failureDetails.testResults.failCount} tests failed</strong> out of {failureDetails.testResults.totalCount} total tests
            </Typography>
            {failureDetails.testResults.testReportUrl && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.open(failureDetails.testResults.testReportUrl, '_blank')}
                startIcon={<LaunchIcon />}
                style={{ marginTop: 4 }}
              >
                View Full Test Report
              </Button>
            )}
          </Box>
        </Box>
      )}
      
      {/* Console Output Section */}
      <Box style={{ marginBottom: 16 }}>
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 600, color: '#d32f2f' }}>
          Console Output
        </Typography>
        
        {!consoleOutput && !loadingConsole && !consoleError && (
          <Box style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 8,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
              💻 Console output can help identify the root cause of the failure
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={loadConsoleOutput}
              startIcon={<ExpandMoreIcon />}
              disabled={!jenkinsApi || !jobName || !buildNumber}
            >
              Load Console Output
            </Button>
            {(!jenkinsApi || !jobName || !buildNumber) && (
              <Typography variant="caption" display="block" style={{ marginTop: 4, color: '#999' }}>
                Console output unavailable - missing job information
              </Typography>
            )}
          </Box>
        )}

        {loadingConsole && (
          <Box style={{ 
            padding: 16, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CircularProgress size={20} style={{ marginRight: 8 }} />
            <Typography variant="body2">Loading console output...</Typography>
          </Box>
        )}

        {consoleError && (
          <Box style={{ 
            padding: 12, 
            backgroundColor: '#ffebee', 
            borderRadius: 8,
            border: '1px solid #ffcdd2'
          }}>
            <Typography variant="body2" color="error">
              ⚠️ {consoleError}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={loadConsoleOutput}
              style={{ marginTop: 8 }}
            >
              Retry
            </Button>
          </Box>
        )}

        {consoleOutput && (
          <Box>
            <Box style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 8,
              padding: '8px 12px',
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
              borderRadius: '8px 8px 0 0'
            }}>
              <Typography variant="body2" style={{ fontWeight: 500 }}>
                💻 Console Output ({consoleOutput.size} bytes)
              </Typography>
              <Button
                size="small"
                onClick={() => setConsoleExpanded(!consoleExpanded)}
                startIcon={consoleExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                style={{ color: '#ffffff', minWidth: 'auto' }}
              >
                {consoleExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </Box>
            
            <Collapse in={consoleExpanded}>
              <Box style={{
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                padding: 16,
                borderRadius: '0 0 8px 8px',
                maxHeight: 400,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid #333'
              }}>
                {consoleOutput.text || 'No console output available'}
                {consoleOutput.hasMore && (
                  <Typography variant="caption" display="block" style={{ 
                    marginTop: 8, 
                    padding: 8, 
                    backgroundColor: '#333', 
                    borderRadius: 4,
                    color: '#ffeb3b'
                  }}>
                    ℹ️ Output truncated - more data available in full Jenkins log
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* Artifacts Section */}
      {failureDetails?.artifacts && failureDetails.artifacts.length > 0 && (
        <Box style={{ marginBottom: 16 }}>
          <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 600, color: '#1976d2' }}>
            Build Artifacts ({failureDetails.artifacts.length})
          </Typography>
          <Box style={{ 
            padding: 12, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 8,
            border: '1px solid #90caf9'
          }}>
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              📎 Files generated during this build:
            </Typography>
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {failureDetails.artifacts.map((artifact: any, index: number) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    // Open artifact URL in a popup window for authentication
                    const popup = window.open(artifact.url, 'jenkins-artifact', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    if (!popup) {
                      // Fallback if popup blocked
                      window.open(artifact.url, '_blank');
                    }
                  }}
                  startIcon={<LaunchIcon />}
                  style={{ textTransform: 'none' }}
                >
                  {artifact.fileName}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const EnhancedTestResultsView: React.FC<{ testResult: any; jenkinsApi: any }> = ({ testResult, jenkinsApi: _jenkinsApi }) => {
  const classes = useStyles();
  const [failedTestsExpanded, setFailedTestsExpanded] = useState(false);
  
  const handleViewTestReport = () => {
    if (testResult.testReportUrl) {
      // Use direct Jenkins URL in popup window for authentication (same as artifacts)
      const popup = window.open(testResult.testReportUrl, 'jenkins-test-report', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (!popup) {
        // Fallback if popup blocked
        window.open(testResult.testReportUrl, '_blank');
      }
    }
  };
  
  return (
    <Box className={classes.metricsGrid}>
      <Typography variant="h6" gutterBottom>
        <AssessmentIcon style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Test Results
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box className={classes.metricCard}>
            <Typography variant="h6" style={{ color: '#4caf50' }}>
              {testResult.passCount}
            </Typography>
            <Typography variant="caption">Passed</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box className={classes.metricCard}>
            <Typography variant="h6" style={{ color: '#f44336' }}>
              {testResult.failCount}
            </Typography>
            <Typography variant="caption">Failed</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box className={classes.metricCard}>
            <Typography variant="h6" style={{ color: '#ff9800' }}>
              {testResult.skipCount}
            </Typography>
            <Typography variant="caption">Skipped</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box className={classes.metricCard}>
            <Typography variant="h6">
              {testResult.totalCount}
            </Typography>
            <Typography variant="caption">Total</Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Failed Tests Details */}
      {testResult.failedTests && testResult.failedTests.length > 0 && (
        <Box style={{ marginTop: 16 }}>
          <Button
            onClick={() => setFailedTestsExpanded(!failedTestsExpanded)}
            style={{ marginBottom: 8 }}
            startIcon={failedTestsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            color="secondary"
          >
            Failed Tests ({testResult.failedTests.length})
          </Button>
          <Collapse in={failedTestsExpanded}>
            {testResult.failedTests.map((test: any, index: number) => (
              <Box key={index} style={{
                padding: 12,
                backgroundColor: '#ffebee',
                borderRadius: 4,
                marginBottom: 8,
                border: '1px solid #ffcdd2'
              }}>
                <Typography variant="subtitle2" style={{ fontWeight: 500 }}>
                  {test.className}.{test.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Duration: {test.duration}s
                  {test.age && ` • Failed since build #${test.failedSince} (${test.age} builds ago)`}
                </Typography>
                {test.errorDetails && (
                  <Box style={{ marginTop: 8 }}>
                    <Typography variant="caption" style={{ fontWeight: 500 }}>Error:</Typography>
                    <Typography variant="body2" style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      padding: 8,
                      borderRadius: 4,
                      marginTop: 4,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {test.errorDetails}
                    </Typography>
                  </Box>
                )}
                {test.testResultUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(test.testResultUrl, '_blank')}
                    style={{ marginTop: 8 }}
                  >
                    View Test Details
                  </Button>
                )}
              </Box>
            ))}
          </Collapse>
        </Box>
      )}
      
      {testResult.testReportUrl && (
        <Box style={{ marginTop: 16 }}>
          <Button
            variant="outlined"
            onClick={handleViewTestReport}
            startIcon={<LaunchIcon />}
          >
            View Full Test Report
          </Button>
        </Box>
      )}
    </Box>
  );
};

const BuildDetailsView: React.FC<{ 
  build: JenkinsBuild; 
  onRunJob: (jobUrl: string) => void;
  onViewInJenkins: (buildUrl: string) => void;
  onLoadEnhancedData?: (build: JenkinsBuild) => void;
  isLoadingEnhancedData?: boolean;
  jenkinsApi: any;
}> = ({ build, onRunJob, onViewInJenkins, onLoadEnhancedData, isLoadingEnhancedData, jenkinsApi }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const loadedRef = React.useRef(new Set<string>());
  
  const commitCount = build.changeSet?.items?.length || 0;
  const jobUrl = build.url.substring(0, build.url.lastIndexOf('/'));
  const buildKey = `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`;

  // Load enhanced data when build is expanded, but only for failed builds
  const handleExpandToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    // Load enhanced data when expanding for the first time for builds that might have test results
    if (newExpanded && onLoadEnhancedData && !loadedRef.current.has(buildKey) && 
        (build.result === 'FAILURE' || build.result === 'UNSTABLE' || build.result === 'SUCCESS')) {
      loadedRef.current.add(buildKey);
      onLoadEnhancedData(build);
    }
  };
  
  return (
    <ListItem className={`${classes.listItem} ${expanded ? classes.expandedItem : ''}`}>
      <ListItemIcon>
        {getBuildStatusIcon(build.result, build.building)}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box className={classes.buildHeader}>
            <Typography variant="body2" className={classes.jobName}>
              {build.fullDisplayName?.split(' #')[0] || 'Unknown Job'}
            </Typography>
            <Typography variant="caption" className={classes.buildNumber}>
              #{build.number}
            </Typography>
            <Chip
              size="small"
              label={build.building ? 'Running' : (build.result || 'Unknown')}
              color={getResultColor(build.result, build.building)}
              variant="outlined"
            />
            {getTrendIcon(build.duration, build.previousBuild?.duration)}
          </Box>
        }
        secondary={
          <Box>
            <Box display="flex" alignItems="center" style={{ marginTop: 4 }}>
              <ScheduleIcon style={{ fontSize: 14 }} />
              <Typography variant="caption">
                Duration: {formatDuration(build.duration)}
              </Typography>
              <Typography variant="caption" className={classes.timeAgo}>
                • {formatTimeAgo(build.timestamp)}
              </Typography>
              {commitCount > 0 && (
                <Typography variant="caption">
                  • {commitCount} commit{commitCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
            
            <Collapse in={expanded}>
              <Box className={classes.buildDetails}>
                {isLoadingEnhancedData && (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" style={{ marginLeft: 8 }}>
                      Loading detailed information...
                    </Typography>
                  </Box>
                )}
                
                {build.stages && build.stages.length > 0 && (
                  <BuildStagesView stages={build.stages} />
                )}
                
                {/* Show failure details for failed/unstable builds */}
                {build.failureDetails && (build.result === 'FAILURE' || build.result === 'UNSTABLE') && (
                  <FailureDetailsView 
                    failureDetails={build.failureDetails} 
                    jenkinsApi={jenkinsApi}
                    jobName={build.fullDisplayName?.split(' #')[0]}
                    buildNumber={build.number}
                  />
                )}
                
                {/* Show attachments if available */}
                {/* Artifacts are already displayed in the failure details section above */}
                
                {build.testResults && (
                  <EnhancedTestResultsView testResult={build.testResults} jenkinsApi={jenkinsApi} />
                )}
                
                {build.sonarQube && (
                  <SonarQubeView qualityGate={build.sonarQube} />
                )}
                
                {build.changeSet && build.changeSet.items && build.changeSet.items.length > 0 && (
                  <Box className={classes.metricsGrid}>
                    <Typography variant="h6" gutterBottom>
                      Recent Changes
                    </Typography>
                    {build.changeSet.items.slice(0, 3).map((change, index) => (
                      <Box key={index} style={{ marginBottom: 8 }}>
                        <Typography variant="body2" style={{ fontWeight: 500 }}>
                          {change.author?.fullName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {change.msg}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Box className={classes.actionButtons}>
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    variant="outlined"
                    color="primary"
                    onClick={() => onRunJob(jobUrl)}
                  >
                    Run Job
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LaunchIcon />}
                    variant="outlined"
                    onClick={() => onViewInJenkins(build.url)}
                  >
                    View in Jenkins
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          size="small"
          onClick={handleExpandToggle}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// Export FailureDetailsView for testing
export { FailureDetailsView };

export const JenkinsJobsCard: React.FC<JenkinsJobsCardProps> = ({
  title = 'Jenkins Insights',
  showRefreshButton = true,
  maxItems = 20
}) => {
  const classes = useStyles();
  const jenkinsApi = useApi(jenkinsApiRef);
  const identityApi = useApi(identityApiRef);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [runJobDialog, setRunJobDialog] = useState<{ open: boolean; jobUrl: string }>({ open: false, jobUrl: '' });
  const [enhancedBuildData, setEnhancedBuildData] = useState<Map<string, JenkinsBuild>>(new Map());
  const [loadingEnhancedData, setLoadingEnhancedData] = useState<Set<string>>(new Set());
  const loadingPromises = React.useRef<Map<string, Promise<void>>>(new Map());

  // Function to batch load lightweight data for builds with test results
  const loadCriticalBuildsData = React.useCallback(async (builds: JenkinsBuild[]) => {
    // Find builds that might have test results (all completed builds)
    const criticalBuilds = builds.filter(build => 
      build.result === 'FAILURE' || build.result === 'UNSTABLE' || build.result === 'SUCCESS'
    ).slice(0, 5); // Limit to 5 most recent builds

    if (criticalBuilds.length === 0) return;

    // Set loading state for critical builds
    const criticalBuildKeys = criticalBuilds.map(build => 
      `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`
    );
    
    setLoadingEnhancedData(prev => {
      const newSet = new Set(prev);
      criticalBuildKeys.forEach(key => newSet.add(key));
      return newSet;
    });

    // Load only failure-specific data for critical builds in parallel
    const loadPromises = criticalBuilds.map(async build => {
      const buildKey = `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`;
      
      try {
        // Extract job name from build URL or display name
        const jobNameFromUrl = build.url.match(/\/job\/([^\/]+)\//)?.[1];
        const jobNameFromDisplay = build.fullDisplayName?.split(' #')[0];
        const jobName = jobNameFromUrl || jobNameFromDisplay;

        if (!jobName) {
          console.warn('Unable to determine job name for build:', build);
          return null;
        }

        const decodedJobName = decodeURIComponent(jobName);
        
        // Use lightweight failure summary instead of full build details
        const failureSummary = await jenkinsApi.getFailureSummary(decodedJobName, build.number);
        
        // Create enhanced build with only failure-related data
        const enhancedBuild: JenkinsBuild = {
          ...build,
          failureDetails: {
            failedStages: failureSummary.failedStages,
            artifacts: failureSummary.artifacts,
            consoleFailures: failureSummary.consoleFailures
          },
          testResults: failureSummary.testResults ? {
            totalCount: failureSummary.testResults.totalCount,
            failCount: failureSummary.testResults.failCount,
            skipCount: 0,
            passCount: failureSummary.testResults.totalCount - failureSummary.testResults.failCount,
            suites: [],
            failedTests: failureSummary.testResults.failedTests.map(test => ({
              name: test.name,
              className: test.className,
              status: 'FAILED' as const,
              duration: 0,
              errorDetails: test.errorDetails,
              testResultUrl: test.testResultUrl
            })),
            testReportUrl: failureSummary.testResults.testReportUrl
          } : undefined
        };
        
        return { buildKey, enhancedBuild };
      } catch (error) {
        console.error(`Failed to load failure data for build ${buildKey}:`, error);
        return null;
      }
    });

    try {
      const results = await Promise.allSettled(loadPromises);
      
      // Update enhanced data with successful results
      setEnhancedBuildData(prevData => {
        const newMap = new Map(prevData);
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            newMap.set(result.value.buildKey, result.value.enhancedBuild);
          }
        });
        return newMap;
      });
    } finally {
      // Remove from loading state
      setLoadingEnhancedData(prev => {
        const newSet = new Set(prev);
        criticalBuildKeys.forEach(key => newSet.delete(key));
        return newSet;
      });
    }
  }, [jenkinsApi]);

  // Function to load lightweight failure data on demand for individual builds
  const loadEnhancedBuildData = React.useCallback(async (build: JenkinsBuild) => {
    const buildKey = `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`;
    
    // Check if already loaded or loading
    if (enhancedBuildData.has(buildKey) || loadingPromises.current.has(buildKey)) {
      return;
    }
    
    // Load enhanced data for builds that might have test results
    if (build.result !== 'FAILURE' && build.result !== 'UNSTABLE' && build.result !== 'SUCCESS') {
      return;
    }
    
    // Extract job name from build URL or display name
    const jobNameFromUrl = build.url.match(/\/job\/([^\/]+)\//)?.[1];
    const jobNameFromDisplay = build.fullDisplayName?.split(' #')[0];
    const jobName = jobNameFromUrl || jobNameFromDisplay;

    if (!jobName) {
      console.warn('Unable to determine job name for build:', build);
      return;
    }

    // Create and store the loading promise
    const loadingPromise = (async () => {
      try {
        setLoadingEnhancedData(prev => new Set(prev).add(buildKey));

        const decodedJobName = decodeURIComponent(jobName);
        
        // Use lightweight failure summary instead of full build details
        const failureSummary = await jenkinsApi.getFailureSummary(decodedJobName, build.number);
        
        // Create enhanced build with only failure-related data
        const enhancedBuild: JenkinsBuild = {
          ...build,
          failureDetails: {
            failedStages: failureSummary.failedStages,
            artifacts: failureSummary.artifacts,
            consoleFailures: failureSummary.consoleFailures
          },
          testResults: failureSummary.testResults ? {
            totalCount: failureSummary.testResults.totalCount,
            failCount: failureSummary.testResults.failCount,
            skipCount: 0,
            passCount: failureSummary.testResults.totalCount - failureSummary.testResults.failCount,
            suites: [],
            failedTests: failureSummary.testResults.failedTests.map(test => ({
              name: test.name,
              className: test.className,
              status: 'FAILED' as const,
              duration: 0,
              errorDetails: test.errorDetails,
              testResultUrl: test.testResultUrl
            })),
            testReportUrl: failureSummary.testResults.testReportUrl
          } : undefined
        };
        
        setEnhancedBuildData(prevData => new Map(prevData).set(buildKey, enhancedBuild));
        
      } catch (error) {
        console.error(`Failed to load failure data for build ${buildKey}:`, error);
      } finally {
        setLoadingEnhancedData(prevLoading => {
          const newSet = new Set(prevLoading);
          newSet.delete(buildKey);
          return newSet;
        });
        loadingPromises.current.delete(buildKey);
      }
    })();

    loadingPromises.current.set(buildKey, loadingPromise);
    return loadingPromise;
  }, [jenkinsApi, enhancedBuildData]);

  // Function to get build with enhanced data if available
  const getBuildWithEnhancedData = useCallback((build: JenkinsBuild): JenkinsBuild => {
    const buildKey = `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`;
    const enhancedData = enhancedBuildData.get(buildKey);
    
    if (enhancedData) {
      // Merge enhanced data with basic build info
      return {
        ...build,
        stages: enhancedData.stages,
        testResults: enhancedData.testResults,
        sonarQube: enhancedData.sonarQube,
        failureDetails: enhancedData.failureDetails,
      };
    }
    
    return build;
  }, [enhancedBuildData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Clear enhanced data on refresh to ensure fresh data
    setEnhancedBuildData(new Map());
    setLoadingEnhancedData(new Set());
    loadingPromises.current.clear();

    try {
      // Get the current user's email from Backstage identity
      const profile = await identityApi.getProfileInfo();
      if (!profile.email) {
        throw new Error('No email found in user profile');
      }

      setUserEmail(profile.email);

      // Try to find the Jenkins user by email
      const jenkinsUser = await jenkinsApi.findUserByEmail(profile.email);
      let userId = profile.email;

      if (jenkinsUser) {
        userId = jenkinsUser.id;
      } else {
        // Try using just the username part of the email
        userId = profile.email.split('@')[0];
      }

      // Get jobs triggered by this user
      const userJobsResponse = await jenkinsApi.getJobsTriggeredByUser(userId);
      
      // Group builds by project name
      const projectMap = new Map<string, { jobs: JenkinsJob[]; builds: JenkinsBuild[] }>();
      
      userJobsResponse.builds.forEach(build => {
        const projectName = build.fullDisplayName?.split(' #')[0] || 'Unknown Project';
        
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, { jobs: [], builds: [] });
        }
        
        const project = projectMap.get(projectName)!;
        project.builds.push(build);
        
        // Add corresponding job if not already present
        const correspondingJob = userJobsResponse.jobs.find(job => 
          build.url.includes(`/job/${encodeURIComponent(job.name)}/`)
        );
        
        if (correspondingJob && !project.jobs.find(j => j.name === correspondingJob.name)) {
          project.jobs.push(correspondingJob);
        }
      });
      
      // Convert to array and sort builds by timestamp
      const groups: ProjectGroup[] = Array.from(projectMap.entries()).map(([projectName, data]) => ({
        projectName,
        jobs: data.jobs,
        builds: data.builds.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems)
      }));
      
      // Sort groups by most recent build
      groups.sort((a, b) => {
        const aLatest = Math.max(...a.builds.map(build => build.timestamp));
        const bLatest = Math.max(...b.builds.map(build => build.timestamp));
        return bLatest - aLatest;
      });

      setProjectGroups(groups);

      // Load enhanced data for critical builds (failed/unstable) immediately
      const allBuilds = groups.flatMap(group => group.builds);
      if (allBuilds.length > 0) {
        // Don't await this - let it load in background
        loadCriticalBuildsData(allBuilds).catch(error => {
          console.warn('Failed to load critical builds data:', error);
        });
      }

    } catch (err) {
      console.error('Failed to fetch Jenkins data:', err);
      let errorMessage = 'Failed to fetch Jenkins data';
      
      if (err instanceof Error) {
        if (err.message.includes('<!DOCTYPE')) {
          errorMessage = 'Jenkins server is not accessible or returning HTML instead of JSON. Please check if Jenkins is running and the proxy configuration is correct.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to Jenkins server. Please verify that Jenkins is running on the configured endpoint.';
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = 'Authentication failed. Please check Jenkins credentials in the configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [identityApi, jenkinsApi, maxItems, loadCriticalBuildsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    // Clear enhanced data before refreshing
    setEnhancedBuildData(new Map());
    setLoadingEnhancedData(new Set());
    loadingPromises.current.clear();
    fetchData();
  };

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRunJob = (jobUrl: string) => {
    setRunJobDialog({ open: true, jobUrl });
  };

  const handleCloseRunJobDialog = () => {
    setRunJobDialog({ open: false, jobUrl: '' });
  };

  const handleConfirmRunJob = async () => {
    // Here you would implement the actual job triggering
    // For now, we'll just open the Jenkins job page
    window.open(runJobDialog.jobUrl, '_blank');
    handleCloseRunJobDialog();
  };

  const handleViewInJenkins = (buildUrl: string) => {
    window.open(buildUrl, '_blank');
  };

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title={title} />
        <CardContent className={classes.content}>
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={classes.card}>
        <CardHeader 
          title={title}
          action={
            showRefreshButton && (
              <IconButton onClick={handleRefresh} size="small" title="Refresh">
                <RefreshIcon />
              </IconButton>
            )
          }
        />
        <CardContent className={classes.content}>
          <Alert severity="error">
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              <strong>Jenkins Connection Error:</strong>
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              {error}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Troubleshooting: Ensure Jenkins is running on localhost:8082 and the proxy configuration in app-config.yaml is correct.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardHeader 
        title={title}
        subheader={userEmail ? `Showing builds for ${userEmail}` : undefined}
        action={
          showRefreshButton && (
            <IconButton onClick={handleRefresh} size="small" title="Refresh">
              <RefreshIcon />
            </IconButton>
          )
        }
      />
      <CardContent className={classes.content}>
        {projectGroups.length === 0 ? (
          <div className={classes.emptyState}>
            <BuildIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
            <Typography variant="body1">
              No recent builds found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You haven't triggered any Jenkins jobs recently.
            </Typography>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              className={classes.tabs}
            >
              {projectGroups.map((group) => (
                <Tab
                  key={group.projectName}
                  label={
                    <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                      <Typography variant="body2">{group.projectName}</Typography>
                      <Chip size="small" label={group.builds.length} />
                    </Box>
                  }
                />
              ))}
            </Tabs>
            
            {projectGroups.map((group, groupIndex) => (
              <TabPanel key={group.projectName} value={activeTab} index={groupIndex}>
                <Box className={classes.tabPanel}>
                  <List dense>
                    {group.builds.map((build, buildIndex) => {
                      const buildKey = `${build.fullDisplayName?.split(' #')[0] || 'unknown'}-${build.number}`;
                      const isLoading = loadingEnhancedData.has(buildKey);
                      
                      return (
                        <BuildDetailsView
                          key={`${build.url}-${buildIndex}`}
                          build={getBuildWithEnhancedData(build)}
                          onRunJob={handleRunJob}
                          onViewInJenkins={handleViewInJenkins}
                          onLoadEnhancedData={loadEnhancedBuildData}
                          isLoadingEnhancedData={isLoading}
                          jenkinsApi={jenkinsApi}
                        />
                      );
                    })}
                  </List>
                </Box>
              </TabPanel>
            ))}
          </>
        )}
      </CardContent>
      
      <Dialog open={runJobDialog.open} onClose={handleCloseRunJobDialog}>
        <DialogTitle>Run Jenkins Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to trigger a new build for this job?
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
            This will start a new build with the latest configuration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRunJobDialog}>Cancel</Button>
          <Button onClick={handleConfirmRunJob} color="primary" variant="contained">
            Run Job
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
