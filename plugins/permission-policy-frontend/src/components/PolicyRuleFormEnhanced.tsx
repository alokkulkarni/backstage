/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Paper,
  Tooltip,
  Card,
  CardContent,
  Collapse,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import { Autocomplete, Alert } from '@material-ui/lab';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { 
  PolicyRule, 
  PolicySubject, 
  PolicyCondition, 
  User, 
  Group,
  RESOURCE_TYPES,
  COMMON_ACTIONS,
  POLICY_CATEGORIES,
  CONDITION_OPERATORS,
} from '../types';

const useStyles = makeStyles((theme) => ({
  formContainer: {
    padding: theme.spacing(2),
    maxHeight: '70vh',
    overflow: 'auto',
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  helpCard: {
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
  },
  conditionPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  addButton: {
    marginTop: theme.spacing(1),
  },
  fullWidth: {
    width: '100%',
  },
  debugInfo: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.info.light,
    borderRadius: theme.shape.borderRadius,
  },
  helpText: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  exampleText: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5),
    borderRadius: 4,
    marginTop: theme.spacing(0.5),
  },
  errorText: {
    color: theme.palette.error.main,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.5),
  },
}));

interface PolicyRuleFormProps {
  open: boolean;
  rule?: PolicyRule | null;
  users: User[];
  groups: Group[];
  onClose: (saved?: boolean) => void;
  onSave: (rule: Partial<PolicyRule>) => Promise<boolean>;
}

export const PolicyRuleFormEnhanced: React.FC<PolicyRuleFormProps> = ({
  open,
  rule,
  users,
  groups,
  onClose,
  onSave,
}) => {
  const classes = useStyles();
  
  const [formData, setFormData] = useState<Partial<PolicyRule>>({
    name: '',
    description: '',
    resource: '',
    actions: [],
    effect: 'allow',
    subjects: [],
    conditions: [],
    metadata: {
      priority: 1,
      tags: [],
      category: 'access-control',
    },
  });

  const [newAction, setNewAction] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [applyToAllUsers, setApplyToAllUsers] = useState(false);
  const [applyToAllGroups, setApplyToAllGroups] = useState(false);

  // Debug information for troubleshooting
  const debugInfo = {
    usersCount: users?.length || 0,
    groupsCount: groups?.length || 0,
    usersData: users?.slice(0, 3), // Show first 3 users for debugging
    groupsData: groups?.slice(0, 3), // Show first 3 groups for debugging
  };

  // Initialize form data when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        ...rule,
        metadata: {
          priority: 1,
          tags: [],
          category: 'access-control',
          ...rule.metadata,
        },
      });
      // Check if rule applies to all users or all groups
      const hasAllUsers = rule.subjects?.some(s => s.type === 'user' && s.identifier === '*');
      const hasAllGroups = rule.subjects?.some(s => s.type === 'group' && s.identifier === '*');
      setApplyToAllUsers(hasAllUsers || false);
      setApplyToAllGroups(hasAllGroups || false);
    } else {
      setFormData({
        name: '',
        description: '',
        resource: '',
        actions: [],
        effect: 'allow',
        subjects: [],
        conditions: [],
        metadata: {
          priority: 1,
          tags: [],
          category: 'access-control',
        },
      });
      setApplyToAllUsers(false);
      setApplyToAllGroups(false);
    }
  }, [rule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose(true);
      }
    } catch (error) {
      console.error('Failed to save policy rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const addAction = () => {
    if (newAction && !formData.actions?.includes(newAction)) {
      setFormData({
        ...formData,
        actions: [...(formData.actions || []), newAction],
      });
      setNewAction('');
    }
  };

  const removeAction = (actionToRemove: string) => {
    setFormData({
      ...formData,
      actions: formData.actions?.filter(action => action !== actionToRemove) || [],
    });
  };

  const addSubject = (type: 'user' | 'group', identifier: string) => {
    const newSubject: PolicySubject = { type, identifier };
    if (!formData.subjects?.some(s => s.type === type && s.identifier === identifier)) {
      setFormData({
        ...formData,
        subjects: [...(formData.subjects || []), newSubject],
      });
    }
  };

  const removeSubject = (subjectToRemove: PolicySubject) => {
    // Check if we're removing "all users" or "all groups" special subjects
    if (subjectToRemove.identifier === '*') {
      if (subjectToRemove.type === 'user') {
        setApplyToAllUsers(false);
      } else if (subjectToRemove.type === 'group') {
        setApplyToAllGroups(false);
      }
    }
    
    setFormData({
      ...formData,
      subjects: formData.subjects?.filter(
        s => !(s.type === subjectToRemove.type && s.identifier === subjectToRemove.identifier)
      ) || [],
    });
  };

  const handleAllUsersChange = (checked: boolean) => {
    setApplyToAllUsers(checked);
    if (checked) {
      // Add "all users" subject and remove individual user subjects
      const newSubjects = formData.subjects?.filter(s => s.type !== 'user') || [];
      newSubjects.push({ type: 'user', identifier: '*' });
      setFormData({
        ...formData,
        subjects: newSubjects,
      });
    } else {
      // Remove "all users" subject
      setFormData({
        ...formData,
        subjects: formData.subjects?.filter(s => !(s.type === 'user' && s.identifier === '*')) || [],
      });
    }
  };

  const handleAllGroupsChange = (checked: boolean) => {
    setApplyToAllGroups(checked);
    if (checked) {
      // Add "all groups" subject and remove individual group subjects
      const newSubjects = formData.subjects?.filter(s => s.type !== 'group') || [];
      newSubjects.push({ type: 'group', identifier: '*' });
      setFormData({
        ...formData,
        subjects: newSubjects,
      });
    } else {
      // Remove "all groups" subject
      setFormData({
        ...formData,
        subjects: formData.subjects?.filter(s => !(s.type === 'group' && s.identifier === '*')) || [],
      });
    }
  };

  const addCondition = () => {
    const newCondition: PolicyCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    setFormData({
      ...formData,
      conditions: [...(formData.conditions || []), newCondition],
    });
  };

  const updateCondition = (index: number, field: keyof PolicyCondition, value: any) => {
    const updatedConditions = [...(formData.conditions || [])];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      conditions: updatedConditions,
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions?.filter((_, i) => i !== index) || [],
    });
  };

  const addTag = () => {
    if (newTag && !formData.metadata?.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          tags: [...(formData.metadata?.tags || []), newTag],
        },
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        tags: formData.metadata?.tags?.filter(tag => tag !== tagToRemove) || [],
      },
    });
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {rule ? 'Edit Policy Rule' : 'Create Policy Rule'}
          <Box>
            <Tooltip title="Toggle Help">
              <IconButton onClick={() => setShowHelp(!showHelp)} size="small">
                <HelpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Debug Info">
              <IconButton onClick={() => setDebugMode(!debugMode)} size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent className={classes.formContainer}>
        {/* Help Card */}
        <Collapse in={showHelp}>
          <Card className={classes.helpCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Policy Rule Creation Guide
              </Typography>
              <Typography variant="body2" paragraph>
                Create fine-grained access control rules for your Backstage resources. Each rule defines who can perform what actions on specific resources.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Concepts:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>Subjects</strong>: Users or groups who the rule applies to (optional - if empty, applies to all)<br/>
                    • <strong>Resources</strong>: Backstage entities (catalog, scaffolder, etc.)<br/>
                    • <strong>Actions</strong>: Operations like read, write, create, delete<br/>
                    • <strong>Effect</strong>: Allow or deny access<br/>
                    • <strong>Conditions</strong>: Additional filters for fine-grained control
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Example Use Cases:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Allow all users to read catalog entities<br/>
                    • Restrict template execution to platform team<br/>
                    • Give admin users full access to all resources<br/>
                    • Allow all groups to manage their own components<br/>
                    • Use "Apply to All" checkboxes for system-wide policies
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {/* Debug Information */}
        <Collapse in={debugMode}>
          <Alert severity="info" className={classes.debugInfo}>
            <Typography variant="subtitle2">Debug Information:</Typography>
            <Typography variant="body2">
              Users available: {debugInfo.usersCount} | Groups available: {debugInfo.groupsCount}
            </Typography>
            {debugInfo.usersCount === 0 && (
              <Typography variant="body2" style={{ color: '#1976d2' }}>
                ℹ️ No users found. Policies without subjects will apply to all users.
              </Typography>
            )}
            {debugInfo.groupsCount === 0 && (
              <Typography variant="body2" style={{ color: '#1976d2' }}>
                ℹ️ No groups found. Policies without subjects will apply to all users.
              </Typography>
            )}
            {debugInfo.usersData && debugInfo.usersData.length > 0 && (
              <Typography variant="body2">
                Sample users: {debugInfo.usersData.map(u => u.name).join(', ')}
              </Typography>
            )}
            {debugInfo.groupsData && debugInfo.groupsData.length > 0 && (
              <Typography variant="body2">
                Sample groups: {debugInfo.groupsData.map(g => g.name).join(', ')}
              </Typography>
            )}
          </Alert>
        </Collapse>

        {/* Basic Information */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <span>Basic Information</span>
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Policy Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                helperText="A unique, descriptive name for this policy rule"
              />
              <Typography className={classes.exampleText}>
                Examples: "Allow Developer Catalog Read", "Platform Team Admin Access", "Scaffolder Template Execute"
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Effect</InputLabel>
                <Select
                  value={formData.effect || 'allow'}
                  onChange={(e) => setFormData({ ...formData, effect: e.target.value as 'allow' | 'deny' })}
                >
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="deny">Deny</MenuItem>
                </Select>
                <FormHelperText>Whether to allow or deny access</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                helperText="Explain the purpose and scope of this policy rule"
              />
              <Typography className={classes.exampleText}>
                Example: "Grants developers read access to all catalog entities to browse and discover services and components"
              </Typography>
            </Grid>
          </Grid>
        </div>

        {/* Resource and Actions */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <span>Resource and Actions</span>
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={[...RESOURCE_TYPES]}
                value={formData.resource || ''}
                onChange={(_, value) => setFormData({ ...formData, resource: value || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Resource Type"
                    required
                    helperText="The Backstage resource this rule applies to"
                  />
                )}
              />
              <Typography className={classes.exampleText}>
                Common resources: catalog-entity, scaffolder-template, permission-policy, kubernetes-cluster
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Actions
              </Typography>
              <Typography className={classes.helpText}>
                Specific operations that can be performed on the resource
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <Autocomplete
                  freeSolo
                  options={[...COMMON_ACTIONS]}
                  value={newAction}
                  onChange={(_, value) => setNewAction(value || '')}
                  style={{ minWidth: 200, marginRight: 8 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add Action"
                      size="small"
                      helperText="e.g., read, write, create, delete, execute"
                    />
                  )}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addAction}
                  disabled={!newAction}
                >
                  Add
                </Button>
              </Box>
              <Typography className={classes.exampleText}>
                Examples: read (view), write (edit), create (add new), delete (remove), execute (run templates)
              </Typography>
              
              <Box>
                {formData.actions?.map((action, index) => (
                  <Chip
                    key={index}
                    label={action}
                    onDelete={() => removeAction(action)}
                    className={classes.chip}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </div>

        {/* Subjects */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <span>Subjects (Who this applies to)</span>
          </Typography>
          
          <Typography className={classes.helpText} gutterBottom>
            Select users and groups that this policy rule should apply to. If no subjects are specified, the rule will apply to all users.
          </Typography>
          
          {/* Quick Selection Checkboxes */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Selection:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyToAllUsers}
                      onChange={(e) => handleAllUsersChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Apply to All Users"
                />
                <Typography variant="body2" className={classes.helpText}>
                  Check this to apply the policy to all users in the system
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyToAllGroups}
                      onChange={(e) => handleAllGroupsChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Apply to All Groups"
                />
                <Typography variant="body2" className={classes.helpText}>
                  Check this to apply the policy to all groups in the system
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={users || []}
                getOptionLabel={(option) => option.name || option.entityRef || 'Unknown User'}
                disabled={applyToAllUsers}
                onChange={(_, user) => {
                  if (user && !applyToAllUsers) {
                    addSubject('user', user.entityRef || user.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add User"
                    size="small"
                    disabled={applyToAllUsers}
                    helperText={applyToAllUsers ? 'Disabled - Apply to All Users is checked' : `${users?.length || 0} users available`}
                  />
                )}
                noOptionsText={users?.length === 0 ? "No users found - check catalog connection" : "No matching users"}
              />
              <Typography className={classes.exampleText}>
                Examples: user:default/john.doe, user:default/jane.smith
              </Typography>
              {users?.length === 0 && (
                <Typography className={classes.helpText}>
                  ℹ️ No users available. Policies without subjects will apply to all users.
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={groups || []}
                getOptionLabel={(option) => option.name || option.entityRef || 'Unknown Group'}
                disabled={applyToAllGroups}
                onChange={(_, group) => {
                  if (group && !applyToAllGroups) {
                    addSubject('group', group.entityRef || group.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Group"
                    size="small"
                    disabled={applyToAllGroups}
                    helperText={applyToAllGroups ? 'Disabled - Apply to All Groups is checked' : `${groups?.length || 0} groups available`}
                  />
                )}
                noOptionsText={groups?.length === 0 ? "No groups found - check catalog connection" : "No matching groups"}
              />
              <Typography className={classes.exampleText}>
                Examples: group:default/developers, group:default/platform-team, group:default/admins
              </Typography>
              {groups?.length === 0 && (
                <Typography className={classes.helpText}>
                  ℹ️ No groups available. Policies without subjects will apply to all users.
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Subjects:
              </Typography>
              <Box>
                {formData.subjects?.map((subject, index) => {
                  let displayLabel = `${subject.type}: ${subject.identifier}`;
                  let chipColor: "primary" | "secondary" = "secondary";
                  
                  if (subject.identifier === '*') {
                    displayLabel = subject.type === 'user' ? 'All Users' : 'All Groups';
                    chipColor = "primary";
                  }
                  
                  return (
                    <Chip
                      key={index}
                      label={displayLabel}
                      onDelete={() => removeSubject(subject)}
                      className={classes.chip}
                      color={chipColor}
                      variant={subject.identifier === '*' ? "default" : "outlined"}
                    />
                  );
                })}
                {(!formData.subjects || formData.subjects.length === 0) && (
                  <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                    No subjects selected. This policy will apply to all users.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </div>

        {/* Conditions - Optional */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Conditions (Optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className={classes.fullWidth}>
              <Typography className={classes.helpText} gutterBottom>
                Add conditions to create more specific rules based on entity properties, ownership, or other attributes.
              </Typography>
              <Typography className={classes.exampleText} gutterBottom>
                Examples: "entity.metadata.namespace == 'production'", "entity.spec.owner == 'team-a'", "request.user.isAdmin == true"
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addCondition}
                className={classes.addButton}
              >
                Add Condition
              </Button>
              
              {formData.conditions?.map((condition, index) => (
                <Paper key={index} className={classes.conditionPaper}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        helperText="Entity property path"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        helperText="Expected value(s)"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        size="small"
                        onClick={() => removeCondition(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </div>
          </AccordionDetails>
        </Accordion>

        {/* Metadata - Optional */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Metadata (Optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className={classes.fullWidth}>
              <Typography className={classes.helpText} gutterBottom>
                Add metadata to organize and categorize your policy rules. Higher priority rules are evaluated first.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="number"
                    label="Priority"
                    value={formData.metadata?.priority || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        priority: parseInt(e.target.value, 10),
                      },
                    })}
                    inputProps={{ min: 1, max: 100 }}
                    helperText="1-100 (higher = more important)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.metadata?.category || 'access-control'}
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          category: e.target.value as string,
                        },
                      })}
                    >
                      {POLICY_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Policy category for organization</FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Typography className={classes.helpText}>
                    Add tags to help organize and search for policies
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TextField
                      size="small"
                      label="Add Tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      style={{ minWidth: 200, marginRight: 8 }}
                      helperText="e.g., production, development, security"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addTag}
                      disabled={!newTag}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box>
                    {formData.metadata?.tags?.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        className={classes.chip}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </div>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={!formData.name || !formData.resource || !formData.actions?.length || saving}
        >
          {saving ? 'Saving...' : (rule ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
