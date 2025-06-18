import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { 
  ExpandMore, 
  TrendingUp, 
  Security, 
  Assessment, 
  Code, 
  Timeline,
  Speed,
  Group,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  benchmarkChip: {
    margin: theme.spacing(0.5),
  },
  targetChip: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  warningChip: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  criticalChip: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  accordionSummary: {
    backgroundColor: theme.palette.grey[50],
  },
  benchmarkTable: {
    marginTop: theme.spacing(2),
  },
  compactMetric: {
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5),
  },
  expandedDetails: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
  },
  iconText: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  flexGapSmall: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      marginRight: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
    },
  },
  flexGapMedium: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
  },
  listStyle: {
    margin: theme.spacing(1, 0),
    paddingLeft: theme.spacing(2.5),
  },
  clickableText: {
    cursor: 'pointer',
  },
  sectionSpacing: {
    marginTop: theme.spacing(2),
  },
  itemSpacing: {
    marginBottom: theme.spacing(0.5),
  },
  dividerSpacing: {
    margin: theme.spacing(3, 0),
  },
}));

interface MetricDefinition {
  id: string;
  name: string;
  icon: React.ReactElement;
  description: string;
  purpose: string;
  calculation: string;
  benchmarks: {
    target: { value: string | number; description: string };
    warning: { value: string | number; description: string };
    critical?: { value: string | number; description: string };
  };
  interpretation: {
    good: string;
    warning: string;
    critical: string;
  };
  actionableInsights: string[];
  relatedMetrics?: string[];
}

const METRICS_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'timeToMergePR',
    name: 'Time to Merge PR',
    icon: <Timeline />,
    description: 'Average time from pull request creation to merge completion',
    purpose: 'Measures development velocity and review efficiency',
    calculation: 'Average of (PR merge time - PR creation time) for all merged PRs in the period',
    benchmarks: {
      target: { value: '< 24 hours', description: 'Optimal development velocity' },
      warning: { value: '24-72 hours', description: 'Acceptable but could be improved' },
      critical: { value: '> 72 hours', description: 'Significant bottleneck in development process' }
    },
    interpretation: {
      good: 'Fast review cycles indicate efficient team collaboration and clear code standards',
      warning: 'Moderate delays may indicate review bottlenecks or complex changes',
      critical: 'Long merge times suggest process inefficiencies or resource constraints'
    },
    actionableInsights: [
      'Implement automated testing to catch issues early',
      'Set up review assignment automation',
      'Break down large PRs into smaller, reviewable chunks',
      'Establish clear review guidelines and SLAs',
      'Use draft PRs for work-in-progress code'
    ],
    relatedMetrics: ['reviewCoverage', 'stalePRRatio']
  },
  {
    id: 'reviewCoverage',
    name: 'Review Coverage',
    icon: <Group />,
    description: 'Percentage of pull requests that receive adequate peer review',
    purpose: 'Ensures code quality and knowledge sharing across the team',
    calculation: '(Number of PRs with >= 2 reviews / Total number of PRs) × 100',
    benchmarks: {
      target: { value: '≥ 80%', description: 'Excellent peer review culture' },
      warning: { value: '60-79%', description: 'Adequate but needs improvement' },
      critical: { value: '< 60%', description: 'Insufficient code review practices' }
    },
    interpretation: {
      good: 'Strong review culture promotes code quality and team knowledge sharing',
      warning: 'Some PRs may be missing adequate review, potential quality risks',
      critical: 'Poor review coverage indicates high risk of bugs and technical debt'
    },
    actionableInsights: [
      'Require minimum number of reviewers for PR approval',
      'Implement code owner assignments for critical paths',
      'Train team members on effective code review practices',
      'Use review checklists to ensure consistency',
      'Recognize and reward thorough code reviews'
    ],
    relatedMetrics: ['timeToMergePR', 'vulnerabilityCount']
  },
  {
    id: 'vulnerabilityCount',
    name: 'Security Vulnerabilities',
    icon: <Security />,
    description: 'Number of open security vulnerabilities in the codebase',
    purpose: 'Tracks security posture and risk exposure',
    calculation: 'Count of open vulnerabilities categorized by severity (Critical, High, Medium, Low)',
    benchmarks: {
      target: { value: '0 Critical/High', description: 'Secure codebase with minimal risk' },
      warning: { value: '1-5 Medium/Low', description: 'Manageable security debt' },
      critical: { value: '> 5 or any Critical', description: 'Significant security risk requiring immediate attention' }
    },
    interpretation: {
      good: 'Low vulnerability count indicates strong security practices',
      warning: 'Moderate vulnerabilities require monitoring and planned remediation',
      critical: 'High vulnerability count poses significant security risks'
    },
    actionableInsights: [
      'Implement automated security scanning in CI/CD pipeline',
      'Establish vulnerability remediation SLAs by severity',
      'Regular dependency updates and security patches',
      'Security training for development team',
      'Integrate security testing in development workflow'
    ],
    relatedMetrics: ['branchProtection', 'reviewCoverage']
  },
  {
    id: 'stalePRRatio',
    name: 'Stale PR Ratio',
    icon: <Speed />,
    description: 'Percentage of pull requests that remain open for extended periods',
    purpose: 'Identifies bottlenecks in development workflow and technical debt',
    calculation: '(Number of PRs open > 30 days / Total open PRs) × 100',
    benchmarks: {
      target: { value: '< 10%', description: 'Healthy development flow' },
      warning: { value: '10-25%', description: 'Some workflow inefficiencies' },
      critical: { value: '> 25%', description: 'Significant development bottlenecks' }
    },
    interpretation: {
      good: 'Low stale PR ratio indicates efficient development workflow',
      warning: 'Some PRs may be blocked or require attention',
      critical: 'High ratio suggests systematic issues in development process'
    },
    actionableInsights: [
      'Regular PR triage and cleanup sessions',
      'Identify and resolve blocking dependencies',
      'Improve communication channels for stuck PRs',
      'Consider breaking down complex PRs',
      'Implement PR aging alerts and notifications'
    ],
    relatedMetrics: ['timeToMergePR', 'reviewCoverage']
  },
  {
    id: 'branchProtection',
    name: 'Branch Protection',
    icon: <Security />,
    description: 'Status of branch protection rules on main/master branches',
    purpose: 'Ensures code quality gates and prevents direct pushes to protected branches',
    calculation: 'Binary check: enabled/disabled for required status checks, review requirements, and admin enforcement',
    benchmarks: {
      target: { value: 'Fully Enabled', description: 'Comprehensive protection with all rules active' },
      warning: { value: 'Partially Enabled', description: 'Some protection rules missing' },
      critical: { value: 'Disabled', description: 'No branch protection, high risk of quality issues' }
    },
    interpretation: {
      good: 'Full branch protection ensures code quality and review requirements',
      warning: 'Partial protection may leave some quality gaps',
      critical: 'No protection allows potentially problematic code to reach production'
    },
    actionableInsights: [
      'Enable required status checks before merging',
      'Require pull request reviews before merging',
      'Enforce branch protection rules for administrators',
      'Require up-to-date branches before merging',
      'Set up automated quality gates (tests, linting, security scans)'
    ],
    relatedMetrics: ['reviewCoverage', 'vulnerabilityCount']
  },
  {
    id: 'codeQuality',
    name: 'Code Quality Score',
    icon: <Code />,
    description: 'Composite score based on code complexity, test coverage, and technical debt',
    purpose: 'Provides overall assessment of codebase maintainability and quality',
    calculation: 'Weighted average of: Test Coverage (40%), Code Complexity (30%), Documentation (20%), Linting Compliance (10%)',
    benchmarks: {
      target: { value: '≥ 80%', description: 'High-quality, maintainable codebase' },
      warning: { value: '60-79%', description: 'Acceptable quality with improvement opportunities' },
      critical: { value: '< 60%', description: 'Quality issues requiring immediate attention' }
    },
    interpretation: {
      good: 'High code quality score indicates maintainable, robust codebase',
      warning: 'Moderate quality may lead to increased maintenance burden',
      critical: 'Low quality score suggests high technical debt and maintenance risks'
    },
    actionableInsights: [
      'Increase unit and integration test coverage',
      'Refactor complex functions and classes',
      'Improve code documentation and comments',
      'Enforce coding standards with automated linting',
      'Regular technical debt assessment and cleanup'
    ],
    relatedMetrics: ['testCoverage', 'maintainability']
  },
  {
    id: 'testCoverage',
    name: 'Test Coverage',
    icon: <Assessment />,
    description: 'Percentage of code covered by automated tests',
    purpose: 'Measures the extent of automated testing and quality assurance',
    calculation: '(Lines of code covered by tests / Total lines of code) × 100',
    benchmarks: {
      target: { value: '≥ 80%', description: 'Comprehensive test coverage' },
      warning: { value: '60-79%', description: 'Adequate coverage with gaps' },
      critical: { value: '< 60%', description: 'Insufficient test coverage' }
    },
    interpretation: {
      good: 'High test coverage provides confidence in code changes and refactoring',
      warning: 'Moderate coverage may miss some edge cases or critical paths',
      critical: 'Low coverage indicates high risk of undetected bugs and regressions'
    },
    actionableInsights: [
      'Write unit tests for new features and bug fixes',
      'Add integration tests for critical user workflows',
      'Implement test-driven development practices',
      'Use code coverage tools to identify untested areas',
      'Require minimum coverage thresholds for new code'
    ],
    relatedMetrics: ['codeQuality', 'maintainability']
  },
  {
    id: 'maintainability',
    name: 'Maintainability Index',
    icon: <TrendingUp />,
    description: 'Composite metric measuring how easy the code is to maintain and modify',
    purpose: 'Predicts long-term development velocity and technical debt accumulation',
    calculation: 'Based on cyclomatic complexity, lines of code, and Halstead metrics',
    benchmarks: {
      target: { value: '≥ 85', description: 'Highly maintainable code' },
      warning: { value: '65-84', description: 'Moderately maintainable' },
      critical: { value: '< 65', description: 'Difficult to maintain, high technical debt' }
    },
    interpretation: {
      good: 'High maintainability enables rapid feature development and easy debugging',
      warning: 'Moderate maintainability may slow down future development',
      critical: 'Low maintainability leads to increased development costs and bugs'
    },
    actionableInsights: [
      'Refactor complex functions into smaller, focused units',
      'Reduce code duplication through proper abstraction',
      'Improve naming conventions for better readability',
      'Add comprehensive documentation for complex logic',
      'Regular code reviews focusing on maintainability'
    ],
    relatedMetrics: ['codeQuality', 'testCoverage']
  }
];

export interface MetricsHelpProps {
  compactView?: boolean;
  selectedMetrics?: string[];
}

export const MetricsHelp: React.FC<MetricsHelpProps> = ({ 
  compactView = false, 
  selectedMetrics 
}) => {
  const classes = useStyles();
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const metricsToShow = selectedMetrics 
    ? METRICS_DEFINITIONS.filter(metric => selectedMetrics.includes(metric.id))
    : METRICS_DEFINITIONS;

  const handleMetricToggle = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  const getBenchmarkChipClass = (type: 'target' | 'warning' | 'critical') => {
    switch (type) {
      case 'target': return classes.targetChip;
      case 'warning': return classes.warningChip;
      case 'critical': return classes.criticalChip;
    }
  };

  if (compactView) {
    return (
      <Grid container spacing={2}>
        {metricsToShow.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.id}>
            <div className={classes.compactMetric}>
              <div className={classes.iconText}>
                {metric.icon}
                <Typography variant="subtitle2">{metric.name}</Typography>
              </div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {metric.description}
              </Typography>
              <div className={classes.flexGapSmall}>
                <Chip 
                  label={`Target: ${metric.benchmarks.target.value}`}
                  size="small"
                  className={`${classes.benchmarkChip} ${classes.targetChip}`}
                />
                <Chip 
                  label={`Warning: ${metric.benchmarks.warning.value}`}
                  size="small"
                  className={`${classes.benchmarkChip} ${classes.warningChip}`}
                />
              </div>
              {expandedMetric === metric.id && (
                <div className={classes.expandedDetails}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Purpose:</strong> {metric.purpose}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Calculation:</strong> {metric.calculation}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Action Items:</strong>
                  </Typography>
                  <ul className={classes.listStyle}>
                    {metric.actionableInsights.slice(0, 3).map((insight, index) => (
                      <li key={index}>
                        <Typography variant="body2">{insight}</Typography>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Box display="flex" justifyContent="center" marginTop={1}>
                <Typography 
                  variant="caption" 
                  color="primary" 
                  className={classes.clickableText}
                  onClick={() => handleMetricToggle(metric.id)}
                >
                  {expandedMetric === metric.id ? 'Show Less' : 'Learn More'}
                </Typography>
              </Box>
            </div>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Source Control Metrics Guide
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Understanding key metrics for repository health, development velocity, and code quality.
        </Typography>

        {metricsToShow.map((metric) => (
          <Accordion key={metric.id}>
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              className={classes.accordionSummary}
            >
              <div className={classes.metricHeader}>
                {metric.icon}
                <Typography variant="h6">{metric.name}</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Box width="100%">
                <Typography variant="body1" paragraph>
                  {metric.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Purpose & Business Value
                </Typography>
                <Typography variant="body2" paragraph>
                  {metric.purpose}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  How It's Calculated
                </Typography>
                <Typography variant="body2" paragraph>
                  {metric.calculation}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Benchmark Thresholds
                </Typography>
                <TableContainer component={Paper} className={classes.benchmarkTable}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Threshold</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Interpretation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Chip 
                            label="Target" 
                            size="small" 
                            className={getBenchmarkChipClass('target')}
                          />
                        </TableCell>
                        <TableCell>{metric.benchmarks.target.value}</TableCell>
                        <TableCell>{metric.benchmarks.target.description}</TableCell>
                        <TableCell>{metric.interpretation.good}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Chip 
                            label="Warning" 
                            size="small" 
                            className={getBenchmarkChipClass('warning')}
                          />
                        </TableCell>
                        <TableCell>{metric.benchmarks.warning.value}</TableCell>
                        <TableCell>{metric.benchmarks.warning.description}</TableCell>
                        <TableCell>{metric.interpretation.warning}</TableCell>
                      </TableRow>
                      {metric.benchmarks.critical && (
                        <TableRow>
                          <TableCell>
                            <Chip 
                              label="Critical" 
                              size="small" 
                              className={getBenchmarkChipClass('critical')}
                            />
                          </TableCell>
                          <TableCell>{metric.benchmarks.critical.value}</TableCell>
                          <TableCell>{metric.benchmarks.critical.description}</TableCell>
                          <TableCell>{metric.interpretation.critical}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2" gutterBottom className={classes.sectionSpacing}>
                  Actionable Insights & Improvement Strategies
                </Typography>
                <ul className={classes.listStyle}>
                  {metric.actionableInsights.map((insight, index) => (
                    <li key={index}>
                      <Typography variant="body2" className={classes.itemSpacing}>
                        {insight}
                      </Typography>
                    </li>
                  ))}
                </ul>

                {metric.relatedMetrics && (
                  <>
                    <Typography variant="subtitle2" gutterBottom className={classes.sectionSpacing}>
                      Related Metrics
                    </Typography>
                    <div className={classes.flexGapMedium}>
                      {metric.relatedMetrics.map((relatedId) => {
                        const relatedMetric = METRICS_DEFINITIONS.find(m => m.id === relatedId);
                        return relatedMetric ? (
                          <Chip 
                            key={relatedId}
                            label={relatedMetric.name}
                            size="small"
                            variant="outlined"
                          />
                        ) : null;
                      })}
                    </div>
                  </>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        <Divider className={classes.dividerSpacing} />
        
        <Typography variant="h6" gutterBottom>
          How to Use These Metrics Effectively
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Regular Monitoring:</strong> Review these metrics weekly or bi-weekly as part of team retrospectives
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Trend Analysis:</strong> Focus on trends over time rather than absolute values
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Contextual Understanding:</strong> Consider team size, project complexity, and business priorities
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Actionable Goals:</strong> Set specific, measurable improvement targets based on current baseline
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Balanced Approach:</strong> Avoid optimizing for single metrics; consider the overall health picture
        </Typography>
      </CardContent>
    </Card>
  );
};
