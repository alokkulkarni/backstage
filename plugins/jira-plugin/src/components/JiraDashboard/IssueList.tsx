import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  Paper,
  IconButton,
} from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { DateTime } from 'luxon';
import { JiraIssue } from '../../api/local-types';
import { IssueDetailsDialog } from './IssueDetailsDialog.tsx';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  chip: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  todoChip: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  },
  inProgressChip: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  doneChip: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  blockedChip: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  priority: {
    display: 'flex',
    alignItems: 'center',
  },
  priorityIcon: {
    marginRight: theme.spacing(0.5),
    width: 16,
    height: 16,
  },
  issueKey: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  truncate: {
    maxWidth: 300,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  issuetype: {
    display: 'flex',
    alignItems: 'center',
  },
  issuetypeIcon: {
    marginRight: theme.spacing(0.5),
    width: 16,
    height: 16,
  },
  emptyState: {
    padding: theme.spacing(2),
    textAlign: 'center',
  },
}));

interface IssueListProps {
  issues: JiraIssue[];
  onIssueUpdated: () => void;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onIssueUpdated }) => {
  const classes = useStyles();
  const [selectedIssue, setSelectedIssue] = React.useState<JiraIssue | null>(null);

  const getStatusChipClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('todo') || statusLower.includes('backlog') || statusLower.includes('open')) {
      return classes.todoChip;
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return classes.inProgressChip;
    }
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('complete')) {
      return classes.doneChip;
    }
    if (statusLower.includes('block') || statusLower.includes('impediment')) {
      return classes.blockedChip;
    }
    return '';
  };

  const formatDate = (dateString: string): string => {
    return DateTime.fromISO(dateString).toFormat('dd MMM yyyy');
  };

  const handleOpenDetails = (issue: JiraIssue) => {
    setSelectedIssue(issue);
  };

  const handleCloseDetails = () => {
    setSelectedIssue(null);
  };

  const handleIssueUpdated = () => {
    setSelectedIssue(null);
    onIssueUpdated();
  };

  if (issues.length === 0) {
    return (
      <Paper className={classes.emptyState}>
        <Typography>No issues found.</Typography>
      </Paper>
    );
  }

  return (
    <Box className={classes.root}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map(issue => (
              <TableRow key={issue.id} className={classes.tableRow} onClick={() => handleOpenDetails(issue)}>
                <TableCell className={classes.issueKey}>
                  {issue.key}
                </TableCell>
                <TableCell>
                  <div className={classes.issuetype}>
                    <img 
                      src={issue.fields.issuetype.iconUrl} 
                      alt={issue.fields.issuetype.name}
                      className={classes.issuetypeIcon}
                    />
                    {issue.fields.issuetype.name}
                  </div>
                </TableCell>
                <TableCell className={classes.truncate}>{issue.fields.summary}</TableCell>
                <TableCell>
                  <Chip
                    label={issue.fields.status.name}
                    size="small"
                    className={`${classes.chip} ${getStatusChipClass(issue.fields.status.name)}`}
                  />
                </TableCell>
                <TableCell>
                  {issue.fields.priority && (
                    <div className={classes.priority}>
                      <img
                        src={issue.fields.priority.iconUrl}
                        alt={issue.fields.priority.name}
                        className={classes.priorityIcon}
                      />
                      {issue.fields.priority.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatDate(issue.fields.updated)}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(issue);
                  }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedIssue && (
        <IssueDetailsDialog
          issueKey={selectedIssue.key}
          open={Boolean(selectedIssue)}
          onClose={handleCloseDetails}
          onIssueUpdated={handleIssueUpdated}
        />
      )}
    </Box>
  );
};
