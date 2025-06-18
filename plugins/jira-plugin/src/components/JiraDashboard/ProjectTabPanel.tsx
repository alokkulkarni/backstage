import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { 
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
} from '@material-ui/core';
import { JiraIssue } from '../../api/local-types';
import { IssueList } from './IssueList';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={1}>{children}</Box>}
    </div>
  );
};

type IssuesByType = {
  [type: string]: JiraIssue[];
};

interface ProjectTabPanelProps {
  project: string;
  issues: JiraIssue[];
  onIssueUpdated: () => void;
}

export const ProjectTabPanel: React.FC<ProjectTabPanelProps> = ({ project, issues, onIssueUpdated }) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);

  // Group issues by type
  const issuesByType: IssuesByType = issues.reduce((acc, issue) => {
    const type = issue.fields.issuetype.name;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(issue);
    return acc;
  }, {} as IssuesByType);

  // Create array of types for tabs
  const types = Object.keys(issuesByType);

  const handleTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Box className={classes.header}>
        <Typography variant="h6">{project}</Typography>
        <Typography variant="body2">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </Typography>
      </Box>
      
      <Divider />

      {types.length > 1 ? (
        <>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            className={classes.tabs}
          >
            <Tab label="All Types" />
            {types.map(type => (
              <Tab 
                key={type} 
                label={`${type} (${issuesByType[type].length})`}
              />
            ))}
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <IssueList issues={issues} onIssueUpdated={onIssueUpdated} />
          </TabPanel>

          {types.map((type, index) => (
            <TabPanel key={type} value={tabValue} index={index + 1}>
              <IssueList issues={issuesByType[type]} onIssueUpdated={onIssueUpdated} />
            </TabPanel>
          ))}
        </>
      ) : (
        <Box mt={2}>
          <IssueList issues={issues} onIssueUpdated={onIssueUpdated} />
        </Box>
      )}
    </div>
  );
};
