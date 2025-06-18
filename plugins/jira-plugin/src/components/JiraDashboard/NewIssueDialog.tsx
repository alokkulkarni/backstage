import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  IconButton,
  Grid,
  Checkbox,
  FormControlLabel,
  Chip,
  Paper,
  Divider,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import CloseIcon from '@material-ui/icons/Close';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import { useApi } from '@backstage/core-plugin-api';
import { jiraApiRef, IssueCreateOptions } from '../../api';
import { JiraProject, JiraUser } from '../../api/local-types';

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  issueTypeIcon: {
    width: 24,
    height: 24,
    marginRight: theme.spacing(1),
  },
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  colorOption: {
    display: 'inline-block',
    width: 24,
    height: 24,
    margin: theme.spacing(0.5),
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid transparent',
    '&.selected': {
      border: `2px solid ${theme.palette.primary.main}`,
    },
  },
  colorContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  attachButton: {
    marginLeft: theme.spacing(1),
  },
  fileInput: {
    display: 'none',
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  sectionDivider: {
    margin: theme.spacing(3, 0),
  },
  linkedItemsPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  fullWidth: {
    width: '100%',
  },
}));

interface NewIssueDialogProps {
  open: boolean;
  onClose: () => void;
  onIssueCreated: () => void;
}

export const NewIssueDialog: React.FC<NewIssueDialogProps> = ({
  open,
  onClose,
  onIssueCreated,
}) => {
  const classes = useStyles();
  const jiraApi = useApi(jiraApiRef);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  // Removed issueTypes state as we're using hardcoded work type values
  const [statuses, setStatuses] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [fixVersions, setFixVersions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<JiraUser | null>(null);

  // Form state
  const [projectKey, setProjectKey] = useState('');
  const [issueType, setIssueType] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [team, setTeam] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedFixVersions, setSelectedFixVersions] = useState<string[]>([]);
  const [issueColor, setIssueColor] = useState('purple');
  const [reporter, setReporter] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [linkedItems, setLinkedItems] = useState<string[]>([]);
  const [restrictToRoles, setRestrictToRoles] = useState<string[]>([]);
  const [createAnother, setCreateAnother] = useState(false);
  const [newLinkedItem, setNewLinkedItem] = useState('');

  // Color options
  const colorOptions = ['purple', 'blue', 'green', 'yellow', 'orange', 'red'];

  // Work type values are now hardcoded in the select component
  
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      setLoading(true);
      setError(null);
      try {
        // Fetch all the initial data in parallel
        const [
          projectsData, 
          // We don't need issueTypesData anymore as we're using hardcoded work types
          statusesData,
          teamsData,
          rolesData,
          userProfile
        ] = await Promise.all([
          jiraApi.getProjects(),
          // Removed jiraApi.getIssueTypes() call
          jiraApi.getStatuses(),
          jiraApi.getTeams(),
          jiraApi.getAvailableRoles(),
          jiraApi.getUserProfile(),
        ]);

        setProjects(projectsData);
        // No longer need to set issue types as we're using hardcoded work types
        setStatuses(Array.isArray(statusesData) ? statusesData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setCurrentUser(userProfile);
        
        // Set the current user as the reporter by default
        if (userProfile && userProfile.accountId) {
          setReporter(userProfile.accountId);
        }
      } catch (err) {
        console.error('Error fetching Jira data:', err);
        setError('Failed to load data from Jira. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);
  
  // Fetch fix versions when project changes
  useEffect(() => {
    const fetchFixVersions = async () => {
      if (!projectKey) {
        setFixVersions([]);
        return;
      }
      
      try {
        const versionsData = await jiraApi.getFixVersions(projectKey);
        setFixVersions(Array.isArray(versionsData) ? versionsData : []);
      } catch (err) {
        console.error('Error fetching fix versions:', err);
        // Don't set an error, as this is a secondary data fetch
        setFixVersions([]);
      }
    };
    
    fetchFixVersions();
  }, [projectKey]);

  const resetForm = () => {
    setProjectKey('');
    setIssueType('');
    setSummary('');
    setDescription('');
    setStatus('To Do');
    setTeam('');
    setStartDate(null);
    setDueDate(null);
    setSelectedFixVersions([]);
    setIssueColor('purple');
    // Keep the reporter as the current user
    setAttachment(null);
    setLinkedItems([]);
    setRestrictToRoles([]);
    setNewLinkedItem('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validate form
    if (!projectKey || !issueType || !summary) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Format dates for the API
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : undefined;
      const formattedDueDate = dueDate ? dueDate.toISOString().split('T')[0] : undefined;
      
      const options: IssueCreateOptions = {
        projectKey,
        issueType,
        summary,
        description,
        status,
        team,
        startDate: formattedStartDate,
        dueDate: formattedDueDate,
        fixVersions: selectedFixVersions,
        issueColor,
        reporter,
        linkedItems,
        restrictToRoles,
      };
      
      // Use the enhanced API method with all options
      await jiraApi.createIssueWithOptions(options);
      onIssueCreated();
      
      // Reset form if not creating another, otherwise just reset some fields
      if (createAnother) {
        // Reset only key fields but keep project, type, etc.
        setSummary('');
        setDescription('');
        setStartDate(null);
        setDueDate(null);
        setSelectedFixVersions([]);
        setAttachment(null);
        setLinkedItems([]);
        setError(null);
      } else {
        resetForm();
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      setError('Failed to create issue. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <Typography variant="h6">Create New Issue</Typography>
        <IconButton edge="end" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        ) : (
          <>
            {error && (
              <Alert severity="error" className={classes.formField}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="project-select-label">Project *</InputLabel>
                  <Select
                    labelId="project-select-label"
                    id="project-select"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value as string)}
                    label="Project *"
                    disabled={submitting}
                  >
                    <MenuItem value="">
                      <em>Select a project</em>
                    </MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.key}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="work-type-select-label">Work Type *</InputLabel>
                  <Select
                    labelId="work-type-select-label"
                    id="work-type-select"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as string)}
                    label="Work Type *"
                    disabled={!projectKey || submitting}
                  >
                    <MenuItem value="">
                      <em>Select work type</em>
                    </MenuItem>
                    <MenuItem value="Epic">EPIC</MenuItem>
                    <MenuItem value="Story">STORY</MenuItem>
                    <MenuItem value="Task">TASK</MenuItem>
                    <MenuItem value="Sub-task">Sub Task</MenuItem>
                    <MenuItem value="Bug">BUG</MenuItem>
                    <MenuItem value="Defect">Defect</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    id="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as string)}
                    label="Status"
                    disabled={submitting}
                  >
                    {statuses.map((statusItem) => (
                      <MenuItem key={statusItem.id} value={statusItem.name}>
                        {statusItem.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="team-select-label">Team</InputLabel>
                  <Select
                    labelId="team-select-label"
                    id="team-select"
                    value={team}
                    onChange={(e) => setTeam(e.target.value as string)}
                    label="Team"
                    disabled={submitting}
                  >
                    <MenuItem value="">
                      <em>Select team</em>
                    </MenuItem>
                    {teams.map((teamItem) => (
                      <MenuItem key={teamItem.id} value={teamItem.id}>
                        {teamItem.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Summary *"
                  variant="outlined"
                  fullWidth
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={classes.formField}
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <KeyboardDatePicker
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    margin="normal"
                    id="start-date"
                    label="Start Date"
                    value={startDate}
                    onChange={date => setStartDate(date)}
                    KeyboardButtonProps={{
                      'aria-label': 'change start date',
                    }}
                    className={classes.formField}
                    fullWidth
                    inputVariant="outlined"
                    disabled={submitting}
                  />
                </MuiPickersUtilsProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <KeyboardDatePicker
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    margin="normal"
                    id="due-date"
                    label="Due Date"
                    value={dueDate}
                    onChange={date => setDueDate(date)}
                    KeyboardButtonProps={{
                      'aria-label': 'change due date',
                    }}
                    className={classes.formField}
                    fullWidth
                    inputVariant="outlined"
                    disabled={submitting}
                  />
                </MuiPickersUtilsProvider>
              </Grid>

              <Grid item xs={12}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="fix-versions-label">Fix Version/s</InputLabel>
                  <Select
                    labelId="fix-versions-label"
                    id="fix-versions-select"
                    multiple
                    value={selectedFixVersions}
                    onChange={(e) => setSelectedFixVersions(e.target.value as string[])}
                    label="Fix Version/s"
                    disabled={submitting || !projectKey}
                    renderValue={(selected) => (
                      <div className={classes.chipContainer}>
                        {(selected as string[]).map((value) => (
                          <Chip 
                            key={value} 
                            label={fixVersions.find(v => v.id === value)?.name || value} 
                          />
                        ))}
                      </div>
                    )}
                  >
                    {fixVersions.map((version) => (
                      <MenuItem key={version.id} value={version.id}>
                        {version.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2">Issue Color</Typography>
                <div className={classes.colorContainer}>
                  {colorOptions.map(color => (
                    <Button 
                      key={color}
                      variant={issueColor === color ? "contained" : "outlined"}
                      style={{ 
                        backgroundColor: issueColor === color ? color : undefined,
                        color: issueColor === color && (color === 'purple' || color === 'blue' || color === 'red') ? 'white' : undefined,
                        minWidth: 40,
                        marginRight: 8 
                      }}
                      onClick={() => setIssueColor(color)}
                      aria-label={`Select ${color} color`}
                      title={`${color} color`}
                    >
                      {color.charAt(0).toUpperCase()}
                    </Button>
                  ))}
                </div>
              </Grid>

              <Grid item xs={12}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="reporter-label">Reporter</InputLabel>
                  <Select
                    labelId="reporter-label"
                    id="reporter-select"
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value as string)}
                    label="Reporter"
                    disabled={submitting}
                  >
                    {currentUser && (
                      <MenuItem value={currentUser.accountId}>
                        {currentUser.displayName}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2">Attachments</Typography>
                <div className={classes.formField}>
                  <input
                    accept="*/*"
                    className={classes.fileInput}
                    id="file-upload"
                    type="file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAttachment(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFileIcon />}
                      disabled={submitting}
                    >
                      {attachment ? attachment.name : 'Attach file'}
                    </Button>
                  </label>
                  {attachment && (
                    <Button 
                      size="small" 
                      onClick={() => setAttachment(null)}
                      className={classes.attachButton}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </Grid>

              <Grid item xs={12}>
                <Divider className={classes.sectionDivider} />
                <Typography variant="subtitle1" className={classes.sectionTitle}>
                  Linked Work Items
                </Typography>
                <Paper variant="outlined" className={classes.linkedItemsPaper}>
                  <Grid container spacing={2}>
                    <Grid item xs={10}>
                      <TextField
                        label="Link to issue"
                        variant="outlined"
                        fullWidth
                        value={newLinkedItem}
                        onChange={(e) => setNewLinkedItem(e.target.value)}
                        placeholder="Enter issue key (e.g. PROJECT-123)"
                        disabled={submitting}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                          if (newLinkedItem && !linkedItems.includes(newLinkedItem)) {
                            setLinkedItems([...linkedItems, newLinkedItem]);
                            setNewLinkedItem('');
                          }
                        }}
                        disabled={!newLinkedItem || submitting}
                        className={classes.fullWidth}
                      >
                        Add
                      </Button>
                    </Grid>
                    
                    {linkedItems.length > 0 && (
                      <Grid item xs={12}>
                        <div className={classes.chipContainer}>
                          {linkedItems.map((item) => (
                            <Chip
                              key={item}
                              label={item}
                              onDelete={() => setLinkedItems(linkedItems.filter(i => i !== item))}
                              disabled={submitting}
                            />
                          ))}
                        </div>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <FormControl variant="outlined" fullWidth className={classes.formField}>
                  <InputLabel id="restrict-roles-label">Restrict to</InputLabel>
                  <Select
                    labelId="restrict-roles-label"
                    id="restrict-roles-select"
                    multiple
                    value={restrictToRoles}
                    onChange={(e) => setRestrictToRoles(e.target.value as string[])}
                    label="Restrict to"
                    disabled={submitting}
                    renderValue={(selected) => (
                      <div className={classes.chipContainer}>
                        {(selected as string[]).map((value) => (
                          <Chip 
                            key={value} 
                            label={roles.find(r => r.id === value)?.name || value} 
                          />
                        ))}
                      </div>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={classes.formField}
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createAnother}
                      onChange={(e) => setCreateAnother(e.target.checked)}
                      name="createAnother"
                      color="primary"
                      disabled={submitting}
                    />
                  }
                  label="Create another"
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || submitting || !projectKey || !issueType || !summary}
        >
          {submitting ? <CircularProgress size={24} /> : 'Create Issue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
