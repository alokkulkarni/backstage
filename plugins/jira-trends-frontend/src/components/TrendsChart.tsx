import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Paper,
} from '@material-ui/core';
import { HelpTooltip, METRIC_HELP_CONTENT } from './HelpTooltip';
import { makeStyles } from '@material-ui/core/styles';
import { 
  FullscreenExit, 
  Fullscreen, 
  TrendingUp, 
  TrendingDown, 
  ShowChart,
  BarChart as BarChartIcon,
} from '@material-ui/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { SprintMetrics, SprintBenchmark } from '../types/index';

const useStyles = makeStyles((theme) => ({
  card: {
    height: '100%',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  chartContainer: {
    height: 400,
    width: '100%',
    minHeight: 300,
  },
  expandedChart: {
    height: 600,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  summaryCard: {
    padding: theme.spacing(2),
    textAlign: 'center',
    background: theme.palette.background.default,
    marginBottom: theme.spacing(2),
  },
  trendValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
  positiveValue: {
    color: theme.palette.success.main,
  },
  negativeValue: {
    color: theme.palette.error.main,
  },
  neutralValue: {
    color: theme.palette.text.secondary,
  },
  metricSelector: {
    minWidth: 200,
  },
  chartTypeToggle: {
    height: 40,
    display: 'flex',
    gap: theme.spacing(1),
  },
  toggleButton: {
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.paper,
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  activeToggle: {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

interface TrendsChartProps {
  metrics: SprintMetrics[];
  benchmarks?: SprintBenchmark[];
  loading?: boolean;
}

type ChartType = 'velocity' | 'churnRate' | 'completionRatio' | 'cycleTime' | 'teamStability' | 'defectRate';
type ChartView = 'line' | 'bar' | 'area' | 'combined';

export const TrendsChart: React.FC<TrendsChartProps> = ({
  metrics,
  benchmarks = [],
  loading = false,
}) => {
  const classes = useStyles();
  const [selectedMetric, setSelectedMetric] = useState<ChartType>('velocity');
  const [chartView, setChartView] = useState<ChartView>('line');
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Trends Chart" />
        <CardContent>
          <Typography>Loading chart data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Trends Chart" />
        <CardContent>
          <Typography>No metrics data available for chart visualization</Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            Use the refresh button to fetch real data from Jira
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Create a function to get benchmark target values
  const getBenchmarkTarget = (metricName: string): number => {
    // Try multiple possible metric names to handle variations
    const possibleNames = [
      metricName,
      metricName.toLowerCase(),
      metricName.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
    ];
    
    let benchmark = null;
    for (const name of possibleNames) {
      benchmark = benchmarks.find(b => 
        b.metricName === name && b.isActive
      );
      if (benchmark) break;
    }
    
    const target = benchmark?.target ?? benchmark?.targetValue ?? 0;
    // console.log(`TrendsChart - getBenchmarkTarget(${metricName}):`, { 
    //   searchedNames: possibleNames, 
    //   foundBenchmark: benchmark, 
    //   target,
    //   availableBenchmarks: benchmarks.map(b => ({ name: b.metricName, target: b.target }))
    // });
    return target;
  };

  // console.log('TrendsChart - Received benchmarks:', benchmarks);

  // Prepare enhanced chart data with more context
  const chartData = metrics
    .sort((a, b) => new Date(a.sprintStartDate || '').getTime() - new Date(b.sprintStartDate || '').getTime())
    .map((metric, index) => ({
      sprint: metric.sprintName,
      sprintNumber: index + 1,
      velocity: metric.velocity,
      velocityTarget: getBenchmarkTarget('velocity') || 40, // Use benchmark or fallback
      churnRate: metric.churnRate * 100,
      churnRateTarget: getBenchmarkTarget('churnRate') || 15,
      completionRatio: metric.completionRatio * 100,
      completionRatioTarget: getBenchmarkTarget('completionRatio') || 85,
      cycleTime: metric.avgCycleTime,
      cycleTimeTarget: getBenchmarkTarget('avgCycleTime') || getBenchmarkTarget('cycleTime') || 5,
      teamStability: metric.teamStability * 100,
      teamStabilityTarget: getBenchmarkTarget('teamStability') || 80,
      defectRate: metric.defectRate * 100, // Use defectRate directly since it's already available
      defectRateTarget: getBenchmarkTarget('defectRate') || 5,
      date: new Date(metric.sprintStartDate || '').toLocaleDateString(),
      teamSize: metric.teamComposition?.totalMembers || 0, // Add safe access with fallback
      storyPoints: metric.velocity,
    }));

  // console.log('TrendsChart - Generated chartData with targets:', 
  //   chartData.map(d => ({
  //     sprint: d.sprint,
  //     velocityTarget: d.velocityTarget,
  //     churnRateTarget: d.churnRateTarget,
  //     completionRatioTarget: d.completionRatioTarget,
  //     cycleTimeTarget: d.cycleTimeTarget,
  //     teamStabilityTarget: d.teamStabilityTarget,
  //     defectRateTarget: d.defectRateTarget
  //   }))
  // );

  const metricConfig = {
    velocity: {
      label: 'Velocity (Story Points)',
      color: '#8884d8',
      targetColor: '#82ca9d',
      unit: ' SP',
      targetField: 'velocityTarget' as keyof typeof chartData[0],
      isHigherBetter: true,
    },
    churnRate: {
      label: 'Churn Rate (%)',
      color: '#ff7c7c',
      targetColor: '#ffb3b3',
      unit: '%',
      targetField: 'churnRateTarget' as keyof typeof chartData[0],
      isHigherBetter: false,
    },
    completionRatio: {
      label: 'Completion Ratio (%)',
      color: '#82ca9d',
      targetColor: '#a4de6c',
      unit: '%',
      targetField: 'completionRatioTarget' as keyof typeof chartData[0],
      isHigherBetter: true,
    },
    cycleTime: {
      label: 'Average Cycle Time (Days)',
      color: '#ffc658',
      targetColor: '#ffd700',
      unit: 'd',
      targetField: 'cycleTimeTarget' as keyof typeof chartData[0],
      isHigherBetter: false,
    },
    teamStability: {
      label: 'Team Stability (%)',
      color: '#8dd1e1',
      targetColor: '#b8e6f0',
      unit: '%',
      targetField: 'teamStabilityTarget' as keyof typeof chartData[0],
      isHigherBetter: true,
    },
    defectRate: {
      label: 'Defect Rate (%)',
      color: '#d084d0',
      targetColor: '#e6b3e6',
      unit: '%',
      targetField: 'defectRateTarget' as keyof typeof chartData[0],
      isHigherBetter: false,
    },
  };

  const currentConfig = metricConfig[selectedMetric];

  // Calculate trend and statistics
  const values = chartData.map(d => d[selectedMetric]);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  const firstValue = values[0] || 0;
  const lastValue = values[values.length - 1] || 0;
  const trend = lastValue - firstValue;
  const trendPercentage = firstValue !== 0 ? ((trend / firstValue) * 100) : 0;

  const getTrendIcon = () => {
    if (Math.abs(trendPercentage) < 5) return null;
    
    const isPositiveTrend = currentConfig.isHigherBetter ? trend > 0 : trend < 0;
    return isPositiveTrend ? <TrendingUp /> : <TrendingDown />;
  };

  const getTrendClass = () => {
    if (Math.abs(trendPercentage) < 5) return classes.neutralValue;
    
    const isPositiveTrend = currentConfig.isHigherBetter ? trend > 0 : trend < 0;
    return isPositiveTrend ? classes.positiveValue : classes.negativeValue;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: 16,
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="body2" style={{ fontWeight: 'bold' }}>
            {label} ({data.date})
          </Typography>
          <Typography variant="body2" style={{ color: currentConfig.color, fontWeight: 'bold' }}>
            {currentConfig.label}: {payload[0].value.toFixed(1)}{currentConfig.unit}
          </Typography>
          {payload.find((p: any) => p.dataKey === currentConfig.targetField) && (
            <Typography variant="body2" style={{ color: currentConfig.targetColor }}>
              Target: {data[currentConfig.targetField]}{currentConfig.unit}
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary">
            Team Size: {data.teamSize} members
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const targetValue = chartData[0]?.[currentConfig.targetField];

    switch (chartView) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={selectedMetric}
              fill={currentConfig.color}
              name={currentConfig.label}
            />
            {targetValue && (
              <ReferenceLine 
                y={targetValue} 
                stroke={currentConfig.targetColor} 
                strokeDasharray="5 5"
                label={`Target: ${targetValue}${currentConfig.unit}`}
              />
            )}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={currentConfig.color}
              fill={currentConfig.color}
              fillOpacity={0.3}
              name={currentConfig.label}
            />
            {targetValue && (
              <ReferenceLine 
                y={targetValue} 
                stroke={currentConfig.targetColor} 
                strokeDasharray="5 5"
                label={`Target: ${targetValue}${currentConfig.unit}`}
              />
            )}
          </AreaChart>
        );

      case 'combined':
        return (
          <ComposedChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={selectedMetric}
              fill={currentConfig.color}
              fillOpacity={0.6}
              name={currentConfig.label}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={currentConfig.color}
              strokeWidth={3}
              dot={{ fill: currentConfig.color, r: 4 }}
              name="Trend"
            />
            {targetValue && (
              <ReferenceLine 
                y={targetValue} 
                stroke={currentConfig.targetColor} 
                strokeDasharray="5 5"
                label={`Target: ${targetValue}${currentConfig.unit}`}
              />
            )}
          </ComposedChart>
        );

      default: // line chart
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={currentConfig.color}
              strokeWidth={2}
              dot={{ fill: currentConfig.color, r: 4 }}
              name={currentConfig.label}
            />
            {targetValue && (
              <ReferenceLine 
                y={targetValue} 
                stroke={currentConfig.targetColor} 
                strokeDasharray="5 5"
                label={`Target: ${targetValue}${currentConfig.unit}`}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <Card className={classes.card}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            Sprint Trends Analysis
            <HelpTooltip {...METRIC_HELP_CONTENT.sprintTrends} />
          </Box>
        }
        subheader={`${currentConfig.label} across ${chartData.length} sprints`}
        action={
          <Box className={classes.headerActions}>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {/* Summary Statistics */}
        <Grid container spacing={2} style={{ marginBottom: 16 }}>
          <Grid item xs={12} md={4}>
            <Paper className={classes.summaryCard}>
              <Typography variant="body2" color="textSecondary">Current Value</Typography>
              <Typography className={`${classes.trendValue} ${getTrendClass()}`}>
                {lastValue.toFixed(1)}{currentConfig.unit}
                {getTrendIcon()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.summaryCard}>
              <Typography variant="body2" color="textSecondary">Average</Typography>
              <Typography className={classes.trendValue}>
                {avgValue.toFixed(1)}{currentConfig.unit}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.summaryCard}>
              <Typography variant="body2" color="textSecondary">Trend</Typography>
              <Typography className={`${classes.trendValue} ${getTrendClass()}`}>
                {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Chart Controls */}
        <Box className={classes.controls}>
          <FormControl variant="outlined" size="small" className={classes.metricSelector}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ChartType)}
              label="Metric"
            >
              <MenuItem value="velocity">Velocity</MenuItem>
              <MenuItem value="churnRate">Churn Rate</MenuItem>
              <MenuItem value="completionRatio">Completion Ratio</MenuItem>
              <MenuItem value="cycleTime">Cycle Time</MenuItem>
              <MenuItem value="teamStability">Team Stability</MenuItem>
              <MenuItem value="defectRate">Defect Rate</MenuItem>
            </Select>
          </FormControl>

          <Box className={classes.chartTypeToggle}>
            {[
              { value: 'line', icon: <ShowChart fontSize="small" /> },
              { value: 'bar', icon: <BarChartIcon fontSize="small" /> },
              { value: 'area', label: 'Area' },
              { value: 'combined', label: 'Combined' },
            ].map(({ value, icon, label }) => (
              <Box
                key={value}
                className={`${classes.toggleButton} ${chartView === value ? classes.activeToggle : ''}`}
                onClick={() => setChartView(value as ChartView)}
              >
                {icon || label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Chart */}
        <Box 
          className={`${classes.chartContainer} ${isExpanded ? classes.expandedChart : ''}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
