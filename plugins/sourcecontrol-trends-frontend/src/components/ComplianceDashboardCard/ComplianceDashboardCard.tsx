import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  LinearProgress 
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api';
import { SourceControlRepository, SourceControlComplianceReport } from '../../types';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  metricCard: {
    textAlign: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  metricLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  chartContainer: {
    height: 300,
    marginTop: theme.spacing(2),
  },
  compliantMetric: {
    color: theme.palette.success.main,
  },
  nonCompliantMetric: {
    color: theme.palette.error.main,
  },
}));

export const ComplianceDashboardCard: React.FC = () => {
  const classes = useStyles();
  const api = useApi(sourceControlTrendsApiRef);
  const [repositories, setRepositories] = useState<SourceControlRepository[]>([]);
  const [complianceReports, setComplianceReports] = useState<SourceControlComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reposResult, complianceResult] = await Promise.all([
          api.getRepositories(),
          api.getComplianceReports()
        ]);
        setRepositories(reposResult.items || []);
        setComplianceReports(complianceResult.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load compliance data');
        console.error('Error fetching compliance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compliance Dashboard
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
            Compliance Dashboard
          </Typography>
          <Alert severity="error">
            Failed to load compliance data: {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate compliance summary
  const totalRepos = repositories.length;
  const compliantReports = complianceReports.filter((report: SourceControlComplianceReport) => report.overallStatus === 'PASS').length;
  const nonCompliantReports = complianceReports.filter((report: SourceControlComplianceReport) => report.overallStatus === 'FAIL').length;
  const complianceRate = totalRepos > 0 ? Math.round((compliantReports / totalRepos) * 100) : 0;

  // Prepare chart data for compliance trends
  const trendData = complianceReports?.slice(-30).map((report: SourceControlComplianceReport, index: number) => ({
    day: `Day ${index + 1}`,
    compliance_rate: report.overallScore || 0,
    security_score: report.vulnerabilityStatus === 'PASS' ? 100 : report.vulnerabilityStatus === 'WARN' ? 50 : 0,
    quality_score: report.reviewCoverageStatus === 'PASS' ? 100 : report.reviewCoverageStatus === 'WARN' ? 50 : 0,
  })) || [];

  // Prepare compliance by category data
  const categoryData = [
    { name: 'Branch Protection', compliance: 85 },
    { name: 'Security Scanning', compliance: 72 },
    { name: 'Code Review', compliance: 90 },
    { name: 'Documentation', compliance: 65 },
    { name: 'License', compliance: 78 },
  ];

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Compliance Dashboard
        </Typography>
        
        {/* Summary Metrics */}
        <Grid container spacing={3} style={{ marginBottom: 24 }}>
          <Grid item xs={12} sm={3}>
            <Box className={classes.metricCard}>
              <Typography className={`${classes.metricValue} ${classes.compliantMetric}`}>
                {complianceRate}%
              </Typography>
              <Typography className={classes.metricLabel}>
                Overall Compliance
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box className={classes.metricCard}>
              <Typography className={`${classes.metricValue} ${classes.compliantMetric}`}>
                {compliantReports}
              </Typography>
              <Typography className={classes.metricLabel}>
                Compliant Repositories
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box className={classes.metricCard}>
              <Typography className={`${classes.metricValue} ${classes.nonCompliantMetric}`}>
                {nonCompliantReports}
              </Typography>
              <Typography className={classes.metricLabel}>
                Non-Compliant Repositories
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box className={classes.metricCard}>
              <Typography className={classes.metricValue}>
                {totalRepos}
              </Typography>
              <Typography className={classes.metricLabel}>
                Total Repositories
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Compliance Trends Chart */}
        <Typography variant="subtitle1" gutterBottom>
          Compliance Trends (Last 30 Days)
        </Typography>
        <Box className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="compliance_rate" 
                stroke="#4caf50" 
                strokeWidth={2}
                name="Compliance Rate %"
              />
              <Line 
                type="monotone" 
                dataKey="security_score" 
                stroke="#ff9800" 
                strokeWidth={2}
                name="Security Score %"
              />
              <Line 
                type="monotone" 
                dataKey="quality_score" 
                stroke="#2196f3" 
                strokeWidth={2}
                name="Quality Score %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Compliance by Category */}
        <Typography variant="subtitle1" gutterBottom style={{ marginTop: 32 }}>
          Compliance by Category
        </Typography>
        <Box className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="compliance" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
