import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  makeStyles,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Security,
  Code,
  Timeline,
} from '@material-ui/icons';
import { Alert, AlertTitle } from '@material-ui/lab';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSourceControlTrendsApi } from '../../hooks';
import { DashboardOverview } from '../../types';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  card: {
    height: '100%',
  },
  metricCard: {
    height: 140,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  passValue: {
    color: theme.palette.success.main,
  },
  warnValue: {
    color: theme.palette.warning.main,
  },
  failValue: {
    color: theme.palette.error.main,
  },
  chartContainer: {
    height: 300,
  },
  refreshButton: {
    marginLeft: theme.spacing(1),
  },
  lastUpdated: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));

const VULNERABILITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
};

export const DashboardOverviewCard: React.FC<{ owner?: string }> = ({ owner }) => {
  const classes = useStyles();
  const api = useSourceControlTrendsApi();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      setError(null);
      const data = await api.getDashboardOverview(owner);
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.refreshData(undefined, true);
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [owner]);

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <LinearProgress />
          <Typography variant="h6" style={{ marginTop: 16 }}>
            Loading dashboard overview...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error || !overview) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error || 'No data available'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const vulnerabilityData = [
    { name: 'Critical', value: overview.vulnerabilityStats.critical, fill: VULNERABILITY_COLORS.critical },
    { name: 'High', value: overview.vulnerabilityStats.high, fill: VULNERABILITY_COLORS.high },
    { name: 'Medium', value: overview.vulnerabilityStats.medium, fill: VULNERABILITY_COLORS.medium },
    { name: 'Low', value: overview.vulnerabilityStats.low, fill: VULNERABILITY_COLORS.low },
  ].filter(item => item.value > 0);

  const complianceData = [
    { name: 'Pass', value: overview.complianceStats.pass, fill: '#4caf50' },
    { name: 'Warn', value: overview.complianceStats.warn, fill: '#ff9800' },
    { name: 'Fail', value: overview.complianceStats.fail, fill: '#f44336' },
  ].filter(item => item.value > 0);

  return (
    <div className={classes.root}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Source Control Trends Dashboard
          {owner && (
            <Chip
              label={`Organization: ${owner}`}
              color="primary"
              style={{ marginLeft: 16 }}
            />
          )}
        </Typography>
        <Box>
          <Typography className={classes.lastUpdated}>
            Last updated: {new Date(overview.lastUpdated).toLocaleString()}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton
              className={classes.refreshButton}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Repository Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.metricCard}>
            <CardContent>
              <Code color="primary" fontSize="large" />
              <Typography className={classes.metricValue}>
                {overview.totalRepositories}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Repositories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.metricCard}>
            <CardContent>
              <Timeline color="primary" fontSize="large" />
              <Typography className={classes.metricValue}>
                {overview.activeRepositories}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Repositories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.metricCard}>
            <CardContent>
              <Security color="secondary" fontSize="large" />
              <Typography className={`${classes.metricValue} ${overview.vulnerabilityStats.open > 0 ? classes.failValue : classes.passValue}`}>
                {overview.vulnerabilityStats.open}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Open Vulnerabilities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Score */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.metricCard}>
            <CardContent>
              {overview.complianceStats.avgScore >= 80 ? (
                <CheckCircle className={classes.passValue} fontSize="large" />
              ) : overview.complianceStats.avgScore >= 60 ? (
                <Warning className={classes.warnValue} fontSize="large" />
              ) : (
                <ErrorIcon className={classes.failValue} fontSize="large" />
              )}
              <Typography className={`${classes.metricValue} ${
                overview.complianceStats.avgScore >= 80 ? classes.passValue :
                overview.complianceStats.avgScore >= 60 ? classes.warnValue :
                classes.failValue
              }`}>
                {Math.round(overview.complianceStats.avgScore)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Compliance Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Vulnerability Distribution */}
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardHeader title="Vulnerability Distribution" />
            <CardContent>
              {vulnerabilityData.length > 0 ? (
                <div className={classes.chartContainer}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={vulnerabilityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {vulnerabilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography variant="body1" color="textSecondary">
                    No vulnerabilities found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Status */}
        <Grid item xs={12} md={6}>
          <Card className={classes.card}>
            <CardHeader title="Compliance Status" />
            <CardContent>
              {complianceData.length > 0 ? (
                <div className={classes.chartContainer}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography variant="body1" color="textSecondary">
                    No compliance data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};
