import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { SprintMetrics } from '../types/index';
import { HelpTooltip, METRIC_HELP_CONTENT } from './HelpTooltip';

const useStyles = makeStyles((theme) => ({
  card: {
    height: '100%',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  metricContainer: {
    textAlign: 'center',
    padding: theme.spacing(1),
  },
  trendIndicator: {
    marginLeft: theme.spacing(1),
  },
}));

interface MetricsOverviewCardProps {
  metrics: SprintMetrics[];
  loading?: boolean;
}

export const MetricsOverviewCard: React.FC<MetricsOverviewCardProps> = ({
  metrics,
  loading = false,
}) => {
  const classes = useStyles();

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Metrics Overview" />
        <CardContent>
          <Typography>Loading metrics...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Metrics Overview" />
        <CardContent>
          <Typography>No metrics available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages from recent metrics
  const recentMetrics = metrics.slice(-5); // Last 5 sprints
  const avgVelocity = recentMetrics.reduce((sum, m) => sum + m.velocity, 0) / recentMetrics.length;
  const avgChurnRate = recentMetrics.reduce((sum, m) => sum + m.churnRate, 0) / recentMetrics.length;
  const avgCompletionRatio = recentMetrics.reduce((sum, m) => sum + m.completionRatio, 0) / recentMetrics.length;
  const avgCycleTime = recentMetrics.reduce((sum, m) => sum + m.avgCycleTime, 0) / recentMetrics.length;

  const formatNumber = (value: number, decimals: number = 1): string => {
    return value.toFixed(decimals);
  };

  const getCompletionColor = (ratio: number): 'primary' | 'secondary' | 'default' => {
    if (ratio >= 0.9) return 'primary';
    if (ratio >= 0.7) return 'secondary';
    return 'default';
  };

  return (
    <Card className={classes.card}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center">
            Metrics Overview
            <HelpTooltip
              title="Metrics Overview"
              description="Key performance indicators averaged from your last 5 sprints. These metrics help track team productivity, quality, and predictability over time."
              calculation="Averages calculated from the 5 most recent completed sprints"
            />
          </Box>
        } 
        subheader="Average from last 5 sprints" 
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box className={classes.metricContainer}>
              <Typography className={classes.metricValue}>
                {formatNumber(avgVelocity, 0)}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography className={classes.metricLabel}>
                  Velocity
                </Typography>
                <HelpTooltip {...METRIC_HELP_CONTENT.velocity} />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box className={classes.metricContainer}>
              <Typography className={classes.metricValue}>
                {formatNumber(avgChurnRate * 100, 1)}%
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography className={classes.metricLabel}>
                  Churn Rate
                </Typography>
                <HelpTooltip {...METRIC_HELP_CONTENT.churnRate} />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box className={classes.metricContainer}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography className={classes.metricValue}>
                  {formatNumber(avgCompletionRatio * 100, 1)}%
                </Typography>
                <Chip
                  size="small"
                  label={avgCompletionRatio >= 0.9 ? 'Good' : avgCompletionRatio >= 0.7 ? 'Fair' : 'Poor'}
                  color={getCompletionColor(avgCompletionRatio)}
                  className={classes.trendIndicator}
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography className={classes.metricLabel}>
                  Completion Rate
                </Typography>
                <HelpTooltip {...METRIC_HELP_CONTENT.completionRatio} />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box className={classes.metricContainer}>
              <Typography className={classes.metricValue}>
                {formatNumber(avgCycleTime, 1)}d
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography className={classes.metricLabel}>
                  Avg Cycle Time
                </Typography>
                <HelpTooltip {...METRIC_HELP_CONTENT.cycleTime} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
