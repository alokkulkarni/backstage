import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tab,
  Tabs,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import CloseIcon from '@material-ui/icons/Close';
import SendIcon from '@material-ui/icons/Send';
import { DateTime } from 'luxon';
import { useApi } from '@backstage/core-plugin-api';
import { jiraApiRef } from '../../api';
import { JiraIssue, JiraComment } from '../../api/local-types';

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueKey: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  chip: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
    margin: theme.spacing(0, 0.5),
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
  field: {
    margin: theme.spacing(1, 0),
  },
  section: {
    margin: theme.spacing(2, 0),
  },
  comments: {
    maxHeight: 300,
    overflowY: 'auto',
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  comment: {
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.default,
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
  },
  commentForm: {
    display: 'flex',
    marginTop: theme.spacing(2),
    alignItems: 'flex-start',
  },
  commentTextField: {
    flexGrow: 1,
    marginRight: theme.spacing(1),
  },
  transitionSelect: {
    minWidth: 200,
    marginRight: theme.spacing(1),
  },
  avatar: {
    width: 24,
    height: 24,
    marginRight: theme.spacing(1),
    borderRadius: '50%',
  },
  avatarLarge: {
    width: 32,
    height: 32,
    marginRight: theme.spacing(1),
    borderRadius: '50%',
  },
  tabContent: {
    padding: theme.spacing(2, 0),
  },
  descriptionText: {
    whiteSpace: 'pre-wrap',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  infoLabel: {
    fontWeight: 'bold',
    minWidth: 120,
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
      id={`issue-tabpanel-${index}`}
      aria-labelledby={`issue-tab-${index}`}
      {...other}
    >
      {value === index && <Box className="tabpanel-content">{children}</Box>}
    </div>
  );
};

interface IssueDetailsDialogProps {
  issueKey: string;
  open: boolean;
  onClose: () => void;
  onIssueUpdated: () => void;
}

export const IssueDetailsDialog: React.FC<IssueDetailsDialogProps> = ({
  issueKey,
  open,
  onClose,
  onIssueUpdated,
}) => {
  const classes = useStyles();
  const jiraApi = useApi(jiraApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [comments, setComments] = useState<JiraComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [transitions, setTransitions] = useState<{ id: string; name: string }[]>([]);
  const [selectedTransition, setSelectedTransition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      if (!open) return;

      setLoading(true);
      setError(null);
      try {
        const [issueDetails, issueComments, availableTransitions] = await Promise.all([
          jiraApi.getIssueDetails(issueKey),
          jiraApi.getIssueComments(issueKey),
          jiraApi.getAvailableTransitions(issueKey),
        ]);

        setIssue(issueDetails);
        setComments(issueComments);
        setTransitions(availableTransitions.transitions || []);
      } catch (err) {
        console.error('Error fetching issue details:', err);
        setError('Failed to load issue details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [issueKey, open]);

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
    return DateTime.fromISO(dateString).toLocaleString(DateTime.DATETIME_MED);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await jiraApi.addComment(issueKey, newComment);
      const updatedComments = await jiraApi.getIssueComments(issueKey);
      setComments(updatedComments);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransitionChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTransition(e.target.value as string);
  };

  const handleTransitionSubmit = async () => {
    if (!selectedTransition) return;

    setSubmitting(true);
    try {
      await jiraApi.transitionIssue(issueKey, selectedTransition);
      const updatedIssue = await jiraApi.getIssueDetails(issueKey);
      setIssue(updatedIssue);
      setSelectedTransition('');
      onIssueUpdated();
    } catch (err) {
      console.error('Error updating issue status:', err);
      setError('Failed to update issue status. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Loading Issue Details</DialogTitle>
        <DialogContent>
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !issue) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error || 'Issue not found'}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <Box display="flex" alignItems="center">
          <span className={classes.issueKey}>{issue.key}</span>
          <Typography variant="h6">{issue.fields.summary}</Typography>
        </Box>
        <IconButton edge="end" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <img
              src={issue.fields.issuetype.iconUrl}
              alt={issue.fields.issuetype.name}
              className={classes.avatar}
            />
            <Typography variant="body1" style={{ marginRight: 8 }}>
              {issue.fields.issuetype.name}
            </Typography>
            <Chip
              label={issue.fields.status.name}
              size="small"
              className={`${classes.chip} ${getStatusChipClass(issue.fields.status.name)}`}
            />
          </Box>
          <Typography variant="body2">
            Updated: {formatDate(issue.fields.updated)}
          </Typography>
        </Box>

        <Divider />

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Details" />
          <Tab label="Comments" />
          <Tab label="Actions" />
        </Tabs>

        <div className={classes.tabContent}>
          <TabPanel value={tabValue} index={0}>
            <div className={classes.section}>
              <div className={classes.infoRow}>
                <Typography className={classes.infoLabel}>Project:</Typography>
                <Typography>{issue.fields.project.name} ({issue.fields.project.key})</Typography>
              </div>

              {issue.fields.priority && (
                <div className={classes.infoRow}>
                  <Typography className={classes.infoLabel}>Priority:</Typography>
                  <div className={classes.priority}>
                    <img
                      src={issue.fields.priority.iconUrl}
                      alt={issue.fields.priority.name}
                      className={classes.priorityIcon}
                    />
                    {issue.fields.priority.name}
                  </div>
                </div>
              )}

              <div className={classes.infoRow}>
                <Typography className={classes.infoLabel}>Reporter:</Typography>
                <Box display="flex" alignItems="center">
                  <img
                    src={issue.fields.reporter.avatarUrls['24x24']}
                    alt={issue.fields.reporter.displayName}
                    className={classes.avatar}
                  />
                  <Typography>{issue.fields.reporter.displayName}</Typography>
                </Box>
              </div>

              {issue.fields.assignee && (
                <div className={classes.infoRow}>
                  <Typography className={classes.infoLabel}>Assignee:</Typography>
                  <Box display="flex" alignItems="center">
                    <img
                      src={issue.fields.assignee.avatarUrls['24x24']}
                      alt={issue.fields.assignee.displayName}
                      className={classes.avatar}
                    />
                    <Typography>{issue.fields.assignee.displayName}</Typography>
                  </Box>
                </div>
              )}

              <div className={classes.infoRow}>
                <Typography className={classes.infoLabel}>Created:</Typography>
                <Typography>{formatDate(issue.fields.created)}</Typography>
              </div>

              {issue.fields.duedate && (
                <div className={classes.infoRow}>
                  <Typography className={classes.infoLabel}>Due Date:</Typography>
                  <Typography>
                    {formatDate(issue.fields.duedate)}
                  </Typography>
                </div>
              )}
            </div>

            <div className={classes.section}>
              <Typography variant="subtitle1" gutterBottom>Description</Typography>
              <Typography 
                className={classes.descriptionText}
                dangerouslySetInnerHTML={{ 
                  __html: issue.renderedFields?.description || issue.fields.description || 'No description provided.' 
                }}
              />
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle1" gutterBottom>
              Comments ({comments.length})
            </Typography>

            <div className={classes.comments}>
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className={classes.comment}>
                    <div className={classes.commentHeader}>
                      <Box display="flex" alignItems="center">
                        <img
                          src={comment.author.avatarUrls['24x24']}
                          alt={comment.author.displayName}
                          className={classes.avatar}
                        />
                        <Typography variant="subtitle2">
                          {comment.author.displayName}
                        </Typography>
                      </Box>
                      <Typography variant="caption">{formatDate(comment.created)}</Typography>
                    </div>
                    <Typography 
                      variant="body2"
                      dangerouslySetInnerHTML={{ __html: comment.body }}
                    />
                  </div>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No comments yet
                </Typography>
              )}
            </div>

            <div className={classes.commentForm}>
              <TextField
                className={classes.commentTextField}
                label="Add a comment"
                multiline
                rows={3}
                variant="outlined"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={submitting}
              />
              <Button
                color="primary"
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
              >
                Add
              </Button>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="subtitle1" gutterBottom>
              Change Status
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <TextField
                select
                label="Transition to"
                value={selectedTransition}
                onChange={handleTransitionChange}
                variant="outlined"
                className={classes.transitionSelect}
                disabled={transitions.length === 0 || submitting}
              >
                {transitions.map(transition => (
                  <MenuItem key={transition.id} value={transition.id}>
                    {transition.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="primary"
                onClick={handleTransitionSubmit}
                disabled={!selectedTransition || submitting}
              >
                Update Status
              </Button>
            </Box>

            {transitions.length === 0 && (
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                No available transitions for this issue
              </Typography>
            )}

            <Box mt={2}>
              <Button
                color="primary"
                variant="outlined"
                href={`${issue.self.split('/rest/')[0]}/browse/${issue.key}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Jira
              </Button>
            </Box>
          </TabPanel>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
