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
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
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
}));

interface PolicyRuleFormProps {
  open: boolean;
  rule?: PolicyRule | null;
  users: User[];
  groups: Group[];
  onClose: (saved?: boolean) => void;
  onSave: (rule: Partial<PolicyRule>) => Promise<boolean>;
}

export const PolicyRuleForm: React.FC<PolicyRuleFormProps> = ({
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
    setFormData({
      ...formData,
      subjects: formData.subjects?.filter(
        s => !(s.type === subjectToRemove.type && s.identifier === subjectToRemove.identifier)
      ) || [],
    });
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
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {rule ? 'Edit Policy Rule' : 'Create Policy Rule'}
      </DialogTitle>
      
      <DialogContent className={classes.formContainer}>
        {/* Basic Information */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Basic Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Policy Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
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
              />
            </Grid>
          </Grid>
        </div>

        {/* Resource and Actions */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Resource and Actions
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
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
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
            Subjects
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.name}
                onChange={(_, user) => {
                  if (user) {
                    addSubject('user', user.entityRef || user.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add User"
                    size="small"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={groups}
                getOptionLabel={(option) => option.name}
                onChange={(_, group) => {
                  if (group) {
                    addSubject('group', group.entityRef || group.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Group"
                    size="small"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box>
                {formData.subjects?.map((subject, index) => (
                  <Chip
                    key={index}
                    label={`${subject.type}: ${subject.identifier}`}
                    onDelete={() => removeSubject(subject)}
                    className={classes.chip}
                    color="secondary"
                  />
                ))}
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
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TextField
                      size="small"
                      label="Add Tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      style={{ minWidth: 200, marginRight: 8 }}
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
          disabled={!formData.name || !formData.resource || !formData.actions?.length || !formData.subjects?.length || saving}
        >
          {saving ? 'Saving...' : (rule ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
