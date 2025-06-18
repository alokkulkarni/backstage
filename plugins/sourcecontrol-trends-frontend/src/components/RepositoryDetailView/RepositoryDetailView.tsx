import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { 
  TrendingUp, 
  Security, 
  Assessment, 
  Code, 
  BugReport, 
  Timeline,
  CheckCircle,
  Error,
  Warning
} from '@material-ui/icons';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api/SourceControlTrendsApiRef';
import { SourceControlRepository } from '../../types';
import { MetricsHelp } from '../MetricsHelp';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  tabContent: {
    paddingTop: theme.spacing(2),
  },
  metricCard: {
    padding: theme.spacing(2),
    textAlign: 'center',
    height: '100%',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  metricLabel: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  healthyMetric: {
    color: theme.palette.success.main,
  },
  warningMetric: {
    color: theme.palette.warning.main,
  },
  criticalMetric: {
    color: theme.palette.error.main,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  complianceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  repositoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  repositoryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`repository-tabpanel-${index}`}
      aria-labelledby={`repository-tab-${index}`}
      {...other}
    >
      {value === index && <Box className="tabContent">{children}</Box>}
    </div>
  );
}

export interface RepositoryDetailViewProps {
  repository: SourceControlRepository;
  onClose?: () => void;
}

export const RepositoryDetailView: React.FC<RepositoryDetailViewProps> = ({
  repository,
}) => {
  const classes = useStyles();
  const api = useApi(sourceControlTrendsApiRef);
  
  const [tabValue, setTabValue] = useState(0);
  const [_repositoryMetrics, setRepositoryMetrics] = useState<any>(null);
  const [_repositoryCompliance, setRepositoryCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch repository metrics and compliance data
        const [metricsResult, complianceResult] = await Promise.all([
          api.getUserRepositoryMetrics(repository.id, {}),
          api.getUserComplianceReports({ repositoryIds: [repository.id] })
        ]);
        
        setRepositoryMetrics(metricsResult);
        setRepositoryCompliance(complianceResult);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to fetch repository data');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositoryData();
  }, [api, repository.id]);

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return classes.healthyMetric;
    if (value >= thresholds.warning) return classes.warningMetric;
    return classes.criticalMetric;
  };

  const getComplianceIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
      case 'compliant':
        return <CheckCircle style={{ color: '#4caf50' }} />;
      case 'fail':
      case 'non-compliant':
        return <Error style={{ color: '#f44336' }} />;
      case 'warning':
        return <Warning style={{ color: '#ff9800' }} />;
      default:
        return <Warning style={{ color: '#9e9e9e' }} />;
    }
  };

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loading Repository Details...
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Repository Details
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration
  const mockMetrics = {
    codeQuality: 85,
    testCoverage: 72,
    securityScore: 78,
    maintainability: 90,
    pullRequestMetrics: {
      averageReviewTime: 2.5,
      mergeRate: 94,
      totalPRs: 156
    },
    codeMetrics: {
      linesOfCode: 15420,
      complexity: 3.2,
      duplicateCode: 2.1
    }
  };

  const mockCompliance = [
    { rule: 'Branch Protection', status: 'pass', description: 'Main branch is protected' },
    { rule: 'Required Reviews', status: 'pass', description: 'At least 2 reviewers required' },
    { rule: 'Security Scanning', status: 'warning', description: 'Some vulnerabilities found' },
    { rule: 'License Compliance', status: 'pass', description: 'Approved license detected' },
    { rule: 'Documentation', status: 'fail', description: 'README needs improvement' },
  ];

  return (
    <Card className={classes.card}>
      <CardContent>
        <div className={classes.repositoryHeader}>
          <div className={classes.repositoryTitle}>
            <Code />
            <Typography variant="h5">
              {repository.name}
            </Typography>
            <Chip 
              label={repository.isPrivate ? 'Private' : 'Public'} 
              size="small" 
              variant="outlined" 
            />
            {repository.archived && (
              <Chip label="Archived" size="small" color="secondary" />
            )}
          </div>
        </div>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {repository.description || 'No description available'}
        </Typography>

        <Divider style={{ margin: '16px 0' }} />

        <Tabs value={tabValue} onChange={handleTabChange} aria-label="repository details tabs">
          <Tab icon={<TrendingUp />} label="Metrics" />
          <Tab icon={<Assessment />} label="Compliance" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Timeline />} label="Trends" />
        </Tabs>

        <div className={classes.tabContent}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MetricsHelp 
                  compactView={true} 
                  selectedMetrics={['codeQuality', 'testCoverage', 'securityScore', 'maintainability']}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.metricCard}>
                  <Typography 
                    className={`${classes.metricValue} ${getMetricColor(mockMetrics.codeQuality, { good: 80, warning: 60 })}`}
                  >
                    {mockMetrics.codeQuality}%
                  </Typography>
                  <Typography className={classes.metricLabel}>
                    Code Quality
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.metricCard}>
                  <Typography 
                    className={`${classes.metricValue} ${getMetricColor(mockMetrics.testCoverage, { good: 80, warning: 60 })}`}
                  >
                    {mockMetrics.testCoverage}%
                  </Typography>
                  <Typography className={classes.metricLabel}>
                    Test Coverage
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.metricCard}>
                  <Typography 
                    className={`${classes.metricValue} ${getMetricColor(mockMetrics.securityScore, { good: 80, warning: 60 })}`}
                  >
                    {mockMetrics.securityScore}%
                  </Typography>
                  <Typography className={classes.metricLabel}>
                    Security Score
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.metricCard}>
                  <Typography 
                    className={`${classes.metricValue} ${getMetricColor(mockMetrics.maintainability, { good: 80, warning: 60 })}`}
                  >
                    {mockMetrics.maintainability}%
                  </Typography>
                  <Typography className={classes.metricLabel}>
                    Maintainability
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3} style={{ marginTop: 16 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pull Request Metrics
                    </Typography>
                    <Box className={classes.progressContainer}>
                      <Typography>Average Review Time:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.pullRequestMetrics.averageReviewTime} days
                      </Typography>
                    </Box>
                    <Box className={classes.progressContainer}>
                      <Typography>Merge Rate:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.pullRequestMetrics.mergeRate}%
                      </Typography>
                    </Box>
                    <Box className={classes.progressContainer}>
                      <Typography>Total PRs:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.pullRequestMetrics.totalPRs}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Code Metrics
                    </Typography>
                    <Box className={classes.progressContainer}>
                      <Typography>Lines of Code:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.codeMetrics.linesOfCode.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box className={classes.progressContainer}>
                      <Typography>Complexity:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.codeMetrics.complexity}
                      </Typography>
                    </Box>
                    <Box className={classes.progressContainer}>
                      <Typography>Duplicate Code:</Typography>
                      <Typography variant="body2" color="primary">
                        {mockMetrics.codeMetrics.duplicateCode}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Compliance Rule</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockCompliance.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.rule}</TableCell>
                      <TableCell>
                        <div className={classes.complianceItem}>
                          {getComplianceIcon(item.status)}
                          <Typography variant="body2" style={{ textTransform: 'capitalize' }}>
                            {item.status}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Security analysis for repository: {repository.name}
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <BugReport style={{ marginRight: 8 }} />
                      Vulnerabilities
                    </Typography>
                    <Typography variant="body2">
                      3 High, 7 Medium, 12 Low severity issues found
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Security style={{ marginRight: 8 }} />
                      Security Score
                    </Typography>
                    <Typography variant="body2">
                      Overall security rating: B+ (78/100)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Historical trends and analytics for repository: {repository.name}
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Timeline style={{ marginRight: 8 }} />
                      Repository Trends
                    </Typography>
                    <Typography variant="body2">
                      Trend analysis charts and historical data would be displayed here.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </div>
      </CardContent>
    </Card>
  );
};
