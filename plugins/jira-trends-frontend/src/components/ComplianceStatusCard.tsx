import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@material-ui/core';
import { HelpTooltip, METRIC_HELP_CONTENT } from './HelpTooltip';
import { makeStyles } from '@material-ui/core/styles';
import {
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
} from '@material-ui/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { SprintComplianceReport } from '../types/index';

const useStyles = makeStyles((theme) => ({
  card: {
    height: '100%',
  },
  compliantItem: {
    color: theme.palette.success.main,
  },
  warningItem: {
    color: theme.palette.warning.main,
  },
  nonCompliantItem: {
    color: theme.palette.error.main,
  },
  statusCard: {
    padding: theme.spacing(2),
    textAlign: 'center',
    background: theme.palette.background.default,
    marginBottom: theme.spacing(1),
  },
  chartContainer: {
    height: 250,
    width: '100%',
  },
  smallChartContainer: {
    height: 150,
    width: '100%',
  },
  recommendationChip: {
    margin: theme.spacing(0.25),
  },
  accordionSummary: {
    backgroundColor: theme.palette.background.default,
  },
  complianceScore: {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  passScore: {
    color: theme.palette.success.main,
  },
  warnScore: {
    color: theme.palette.warning.main,
  },
  failScore: {
    color: theme.palette.error.main,
  },
  viewToggle: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  recommendationsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

interface ComplianceStatusCardProps {
  compliance: SprintComplianceReport[];
  loading?: boolean;
}

export const ComplianceStatusCard: React.FC<ComplianceStatusCardProps> = ({
  compliance,
  loading = false,
}) => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'details'>('overview');

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Compliance Status" />
        <CardContent>
          <Typography>Loading compliance data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!compliance || compliance.length === 0) {
    return (
      <Card className={classes.card}>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center">
              Compliance Status
              <HelpTooltip {...METRIC_HELP_CONTENT.compliance} />
            </Box>
          } 
        />
        <CardContent>
          <Typography>No compliance reports available</Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            Use the refresh button to generate compliance reports from real Jira data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const latestCompliance = compliance[0];
  const complianceScore = latestCompliance.overallScore;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className={classes.compliantItem} />;
      case 'WARN':
        return <Warning className={classes.warningItem} />;
      case 'FAIL':
        return <Error className={classes.nonCompliantItem} />;
      default:
        return <Error className={classes.nonCompliantItem} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PASS':
        return classes.compliantItem;
      case 'WARN':
        return classes.warningItem;
      case 'FAIL':
        return classes.nonCompliantItem;
      default:
        return classes.nonCompliantItem;
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return classes.passScore;
    if (score >= 60) return classes.warnScore;
    return classes.failScore;
  };

  // Prepare data for charts
  const statusDistribution = Object.entries(latestCompliance.metrics).reduce((acc, [_, result]) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    color: status === 'PASS' ? '#4caf50' : status === 'WARN' ? '#ff9800' : '#f44336',
  }));

  const trendsData = compliance.slice(0, 10).reverse().map((report) => ({
    sprint: report.sprintName,
    score: report.overallScore,
    passCount: Object.values(report.metrics).filter(m => m.status === 'PASS').length,
    warnCount: Object.values(report.metrics).filter(m => m.status === 'WARN').length,
    failCount: Object.values(report.metrics).filter(m => m.status === 'FAIL').length,
  }));

  const metricsData = Object.entries(latestCompliance.metrics).map(([metricName, result]) => {
    // Use consistent naming and ensure values are appropriate for chart display
    let actualValue = result.value ?? result.actualValue ?? 0;
    let targetValue = result.benchmark?.targetValue ?? result.targetValue ?? 0;
    let warningValue = result.benchmark?.warningThreshold ?? result.warningThreshold ?? 0;
    
    // Convert percentage values to be more visible (0-100 range)
    if (metricName.includes('Rate') || metricName.includes('Ratio') || metricName.includes('Completion')) {
      actualValue = actualValue * 100;
      targetValue = targetValue * 100;
      warningValue = warningValue * 100;
    }
    
    // Ensure minimum visibility for very small values
    const minVisibleValue = 1;
    const displayActual = Math.max(actualValue, actualValue > 0 ? minVisibleValue : 0);
    const displayTarget = Math.max(targetValue, targetValue > 0 ? minVisibleValue : 0);
    const displayWarning = Math.max(warningValue, warningValue > 0 ? minVisibleValue : 0);
    
    return {
      metric: metricName.charAt(0).toUpperCase() + metricName.slice(1).replace(/([A-Z])/g, ' $1'), // Better formatting
      value: displayActual,
      target: displayTarget,
      warning: displayWarning,
      originalValue: actualValue,
      originalTarget: targetValue,
      originalWarning: warningValue,
      status: result.status,
      unit: metricName.includes('Rate') || metricName.includes('Ratio') || metricName.includes('Completion') ? '%' : 
           metricName.includes('Time') ? 'days' : 
           metricName.includes('velocity') ? 'points' : '',
    };
  });

  // console.log('ComplianceStatusCard - metricsData:', metricsData); // Debug log

  // Generate demo data if we don't have enough real metrics for testing
  const demoMetricsData = metricsData.length < 3 ? [
    {
      metric: 'Velocity',
      value: 35,
      target: 40,
      warning: 30,
      status: 'WARN',
      unit: 'points'
    },
    {
      metric: 'Completion Rate',
      value: 92,
      target: 85,
      warning: 70,
      status: 'PASS',
      unit: '%'
    },
    {
      metric: 'Churn Rate',
      value: 18,
      target: 10,
      warning: 20,
      status: 'WARN',
      unit: '%'
    },
    {
      metric: 'Cycle Time',
      value: 3.2,
      target: 5,
      warning: 8,
      status: 'PASS',
      unit: 'days'
    },
    {
      metric: 'Team Stability',
      value: 85,
      target: 80,
      warning: 60,
      status: 'PASS',
      unit: '%'
    }
  ] : metricsData;

  const finalMetricsData = metricsData.length > 0 ? metricsData : demoMetricsData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <Box
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: 200,
          }}
        >
          <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: 8, color: '#1976d2' }}>
            {label}
          </Typography>
          
          {/* Status Badge */}
          <Box style={{ marginBottom: 8 }}>
            <Chip
              size="small"
              label={data?.status || 'N/A'}
              color={data?.status === 'PASS' ? 'primary' : data?.status === 'WARN' ? 'default' : 'secondary'}
              style={{ fontSize: '0.7rem' }}
            />
          </Box>
          
          {/* Values */}
          {payload.map((entry: any, index: number) => (
            <Box key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Typography variant="body2" style={{ color: entry.color, fontWeight: 500 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" style={{ fontWeight: 'bold', marginLeft: 8 }}>
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {data?.unit && ` ${data.unit}`}
              </Typography>
            </Box>
          ))}
          
          {/* Performance Indicator */}
          {data?.status && data.value != null && data.target != null && (
            <Box style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
              <Typography variant="caption" color="textSecondary">
                Performance: {data.target > 0 ? ((data.value / data.target) * 100).toFixed(0) : '0'}% of target
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Overall Score */}
      <Grid item xs={12} md={6}>
        <Paper className={classes.statusCard}>
          <Typography variant="h6" gutterBottom>Overall Compliance Score</Typography>
          <Typography className={`${classes.complianceScore} ${getScoreClass(complianceScore)}`}>
            {complianceScore}%
          </Typography>
          <Chip
            label={latestCompliance.overallStatus}
            color={latestCompliance.overallStatus === 'PASS' ? 'primary' : 'secondary'}
            size="small"
          />
        </Paper>
      </Grid>

      {/* Status Distribution Pie Chart */}
      <Grid item xs={12} md={6}>
        <Paper className={classes.statusCard}>
          <Typography variant="h6" gutterBottom>Status Distribution</Typography>
          <Box className={classes.smallChartContainer}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Metrics Performance */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Metrics Performance</Typography>
        {finalMetricsData.length === 0 ? (
          <Box className={classes.statusCard}>
            <Typography color="textSecondary">No metrics data available</Typography>
          </Box>
        ) : (
          /* Summary Statistics Cards Only */
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box className={classes.statusCard} style={{ padding: 16, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Metrics Meeting Target</Typography>
                <Typography variant="h4" className={classes.passScore}>
                  {finalMetricsData.filter(m => m.status === 'PASS').length} / {finalMetricsData.length}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className={classes.statusCard} style={{ padding: 16, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Needs Attention</Typography>
                <Typography variant="h4" className={classes.warnScore}>
                  {finalMetricsData.filter(m => m.status === 'WARN').length} warnings
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className={classes.statusCard} style={{ padding: 16, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Critical Issues</Typography>
                <Typography variant="h4" className={classes.failScore}>
                  {finalMetricsData.filter(m => m.status === 'FAIL').length} failures
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );

  const renderTrends = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Compliance Trends</Typography>
      <Box className={classes.chartContainer}>
        <ResponsiveContainer>
          <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Overall Score (%)"
            />
            <Line 
              type="monotone" 
              dataKey="passCount" 
              stroke="#4caf50" 
              strokeWidth={2}
              name="Pass Count"
            />
            <Line 
              type="monotone" 
              dataKey="failCount" 
              stroke="#f44336" 
              strokeWidth={2}
              name="Fail Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );

  const renderDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Detailed Metrics</Typography>
      {Object.entries(latestCompliance.metrics).map(([metricName, result], index) => (
        <Accordion key={index}>
          <AccordionSummary 
            expandIcon={<ExpandMore />}
            className={classes.accordionSummary}
          >
            <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {getStatusIcon(result.status)}
              <Typography style={{ marginLeft: 8, fontWeight: 'bold' }}>
                {metricName}
              </Typography>
              <Box style={{ flexGrow: 1 }} />
              <Chip
                size="small"
                label={`${result.value?.toFixed(1) ?? 'N/A'} / ${result.benchmark?.targetValue?.toFixed(1) ?? 'N/A'}`}
                className={getStatusClass(result.status)}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box style={{ width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Current Value: <strong>{result.value?.toFixed(2) ?? 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Target: <strong>{result.benchmark?.targetValue?.toFixed(2) ?? 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Warning Threshold: <strong>{result.benchmark?.warningThreshold?.toFixed(2) ?? 'N/A'}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>Progress to Target</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      result.benchmark?.targetValue && result.value != null
                        ? Math.min((result.value / result.benchmark.targetValue) * 100, 100)
                        : 0
                    }
                    color={result.status === 'PASS' ? 'primary' : 'secondary'}
                  />
                </Grid>
              </Grid>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Card className={classes.card}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center">
            Compliance Dashboard
            <HelpTooltip {...METRIC_HELP_CONTENT.compliance} />
          </Box>
        }
        subheader={`Sprint: ${latestCompliance.sprintName}`}
        action={
          <Box className={classes.viewToggle}>
            <Button
              size="small"
              variant={viewMode === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('overview')}
            >
              Overview
            </Button>
            <Button
              size="small"
              variant={viewMode === 'trends' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('trends')}
            >
              Trends
            </Button>
            <Button
              size="small"
              variant={viewMode === 'details' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('details')}
            >
              Details
            </Button>
          </Box>
        }
      />
      <CardContent>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'trends' && renderTrends()}
        {viewMode === 'details' && renderDetails()}

        {/* Recommendations Section */}
        {latestCompliance.recommendations.length > 0 && (
          <Box style={{ marginTop: 16 }}>
            <Typography variant="h6" gutterBottom>Recommendations</Typography>
            <Box className={classes.recommendationsContainer}>
              {latestCompliance.recommendations.slice(0, 5).map((recommendation, index) => (
                <Chip
                  key={index}
                  label={recommendation}
                  size="small"
                  variant="outlined"
                  className={classes.recommendationChip}
                />
              ))}
              {latestCompliance.recommendations.length > 5 && (
                <Chip
                  label={`+${latestCompliance.recommendations.length - 5} more`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
