import React from 'react';
import { 
  Tooltip, 
  IconButton, 
  Typography, 
  Box 
} from '@material-ui/core';
import { Help as HelpIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  helpButton: {
    padding: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
  },
  tooltipContent: {
    maxWidth: 350,
    padding: theme.spacing(1),
  },
  tooltipTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
  },
  tooltipDescription: {
    marginBottom: theme.spacing(1),
  },
  tooltipCalculation: {
    fontSize: '0.875rem',
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
}));

interface HelpTooltipProps {
  title: string;
  description: string;
  calculation?: string;
  size?: 'small' | 'medium';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  description,
  calculation,
  size = 'small',
}) => {
  const classes = useStyles();

  const tooltipContent = (
    <Box className={classes.tooltipContent}>
      <Typography className={classes.tooltipTitle} variant="subtitle2">
        {title}
      </Typography>
      <Typography className={classes.tooltipDescription} variant="body2">
        {description}
      </Typography>
      {calculation && (
        <Typography className={classes.tooltipCalculation} variant="caption">
          <strong>How it's calculated:</strong> {calculation}
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <IconButton 
        className={classes.helpButton} 
        size={size}
        aria-label={`Help for ${title}`}
      >
        <HelpIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  );
};

// Predefined help content for common metrics
export const METRIC_HELP_CONTENT = {
  velocity: {
    title: 'Sprint Velocity',
    description: 'The amount of work completed during a sprint, measured in story points. Higher velocity indicates the team is completing more work.',
    calculation: 'Sum of story points for all completed issues in the sprint',
  },
  completionRatio: {
    title: 'Completion Ratio',
    description: 'The percentage of planned work that was actually completed during the sprint. A good completion ratio indicates reliable sprint planning.',
    calculation: 'Completed issues ÷ Total planned issues × 100%',
  },
  churnRate: {
    title: 'Churn Rate',
    description: 'The percentage of work that was added or removed after the sprint started. Low churn indicates stable sprint planning.',
    calculation: '(Issues added + Issues removed after sprint start) ÷ Total issues × 100%',
  },
  cycleTime: {
    title: 'Average Cycle Time',
    description: 'The average time it takes for work items to go from "In Progress" to "Done". Lower cycle time indicates faster delivery.',
    calculation: 'Average time from when an issue enters "In Progress" until it\'s marked "Done"',
  },
  defectRate: {
    title: 'Defect Rate',
    description: 'The percentage of work that consists of bugs or defects. Lower defect rate indicates higher quality output.',
    calculation: 'Bug issues ÷ Total completed issues × 100%',
  },
  teamStability: {
    title: 'Team Stability',
    description: 'The percentage of team members who have been with the team for multiple sprints. Higher stability often leads to better performance.',
    calculation: 'Experienced team members ÷ Total team members × 100%',
  },
  workTypeBreakdown: {
    title: 'Work Type Breakdown',
    description: 'Distribution of different types of work (stories, bugs, tasks, epics) completed in the sprint. Helps understand team focus areas.',
    calculation: 'Count of each issue type completed during the sprint',
  },
  teamComposition: {
    title: 'Team Composition',
    description: 'The makeup of the team by role and experience level. Balanced teams with diverse skills typically perform better.',
    calculation: 'Count of team members by role (Senior Devs, Junior Devs, QA, etc.)',
  },
  sprintTrends: {
    title: 'Sprint Trends',
    description: 'Visual representation of how key metrics change over time across multiple sprints. Helps identify patterns and areas for improvement.',
    calculation: 'Historical data plotted over time showing metric evolution',
  },
  compliance: {
    title: 'Compliance Status',
    description: 'Indicates whether sprint metrics meet established benchmarks. Green means targets are met, yellow indicates warnings, red means action needed.',
    calculation: 'Actual metric values compared against defined benchmark thresholds',
  },
};
