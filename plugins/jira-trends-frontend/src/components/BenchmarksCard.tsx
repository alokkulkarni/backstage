import React, { useState } from 'react';
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
  Paper,
  Tooltip,
  Collapse,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { 
  Edit, 
  Add, 
  Info, 
  TrendingUp, 
  Assessment, 
  Speed, 
  Group,
  BugReport,
  CheckCircle,
  Warning,
  ExpandMore,
  ExpandLess,
  Build,
  Schedule,
  Category,
  Description,
} from '@material-ui/icons';
import { SprintBenchmark } from '../types/index';

// Define styles as a JS object to avoid TypeScript issues
const styles = {
  benchmarksContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  benchmarksHeader: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    padding: 24,
    textAlign: 'center' as const,
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  headerSubtitle: {
    margin: '8px 0 0 0',
    opacity: 0.9,
    fontSize: '0.95rem',
  },
  benchmarksGrid: {
    padding: 24,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  benchmarkCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e3f2fd',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  benchmarkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  benchmarkName: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  benchmarkIcon: {
    fontSize: '1.2rem',
  },
  benchmarkStatus: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statusActive: {
    background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
    color: '#2d5a3d',
  },
  statusInactive: {
    background: 'linear-gradient(135deg, #ffd3d3 0%, #ffb3b3 100%)',
    color: '#8b2635',
  },
  benchmarkMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  benchmarkMetric: {
    textAlign: 'center' as const,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e9ecef',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#6c757d',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#495057',
  },
  benchmarkDescription: {
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    marginBottom: 16,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
    borderLeft: '3px solid #4facfe',
  },
  benchmarkActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: '0.8rem',
    textTransform: 'none' as const,
    fontWeight: 500,
  },
  noBenchmarks: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#666',
  },
  noBenchmarksIcon: {
    fontSize: '3rem',
    color: '#ccc',
    marginBottom: 16,
  },
  addBenchmarkButton: {
    background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
    borderRadius: 25,
    padding: '12px 32px',
    boxShadow: '0 3px 15px rgba(79, 172, 254, 0.3)',
    transition: 'all 0.3s ease',
    textTransform: 'none' as const,
    fontWeight: 600,
    color: 'white',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    minWidth: 400,
  },
  metricDescription: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
};

interface BenchmarksCardProps {
  benchmarks: SprintBenchmark[];
  loading?: boolean;
  onUpdateBenchmark?: (benchmark: SprintBenchmark) => void;
  onCreateBenchmark?: (benchmark: Omit<SprintBenchmark, 'id'>) => void;
}

export const BenchmarksCard: React.FC<BenchmarksCardProps> = ({
  benchmarks,
  loading = false,
  onUpdateBenchmark,
  onCreateBenchmark,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<SprintBenchmark | null>(null);
  const [expandedBenchmarks, setExpandedBenchmarks] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    metricName: '',
    description: '',
    target: 0,
    warning: 0,
    unit: '',
    category: 'performance',
  });

  const metricDescriptions = {
    velocity: 'Story points completed per sprint',
    churnRate: 'Percentage of scope changes during sprint',
    completionRatio: 'Percentage of committed work completed',
    teamStability: 'Percentage of team members remaining stable',
    avgCycleTime: 'Average time from start to completion',
    defectRate: 'Percentage of work items with defects',
    bugCount: 'Number of bug/defect issues per sprint',
    teamSize: 'Number of team members working on sprint',
  };

  const getMetricIcon = (metricName: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      velocity: <TrendingUp style={styles.benchmarkIcon} />,
      churnRate: <Assessment style={styles.benchmarkIcon} />,
      completionRatio: <CheckCircle style={styles.benchmarkIcon} />,
      teamStability: <Group style={styles.benchmarkIcon} />,
      avgCycleTime: <Speed style={styles.benchmarkIcon} />,
      defectRate: <Warning style={styles.benchmarkIcon} />,
      bugCount: <BugReport style={styles.benchmarkIcon} />,
      teamSize: <Group style={styles.benchmarkIcon} />,
    };
    return iconMap[metricName] || <Assessment style={styles.benchmarkIcon} />;
  };

  const toggleExpanded = (benchmarkId: number) => {
    const newExpanded = new Set(expandedBenchmarks);
    if (newExpanded.has(benchmarkId)) {
      newExpanded.delete(benchmarkId);
    } else {
      newExpanded.add(benchmarkId);
    }
    setExpandedBenchmarks(newExpanded);
  };

  const handleEdit = (benchmark: SprintBenchmark) => {
    setEditingBenchmark(benchmark);
    setFormData({
      metricName: benchmark.metricName,
      description: benchmark.description,
      target: benchmark.target,
      warning: benchmark.warning,
      unit: benchmark.unit,
      category: benchmark.category,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBenchmark(null);
    setFormData({
      metricName: '',
      description: '',
      target: 0,
      warning: 0,
      unit: '',
      category: 'performance',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const benchmarkData = {
      name: formData.metricName || 'Custom Benchmark',
      metricName: formData.metricName,
      metricType: 'velocity' as const, // Default type, should be set based on metricName
      description: formData.description,
      target: formData.target,
      targetValue: formData.target,
      warning: formData.warning,
      warningThreshold: formData.warning,
      criticalThreshold: formData.warning * 1.5, // Derive critical from warning
      unit: formData.unit,
      category: formData.category,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingBenchmark) {
      onUpdateBenchmark?.({ ...benchmarkData, id: editingBenchmark.id });
    } else {
      onCreateBenchmark?.(benchmarkData);
    }
    
    setDialogOpen(false);
    setEditingBenchmark(null);
  };

  const formatThreshold = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value}%`;
    }
    return `${value} ${unit}`.trim();
  };

  if (loading) {
    return (
      <div style={styles.benchmarksContainer}>
        <div style={styles.benchmarksHeader}>
          <Typography style={styles.headerTitle}>
            📊 Performance Benchmarks
          </Typography>
          <Typography style={styles.headerSubtitle}>
            Loading benchmarks...
          </Typography>
        </div>
        <div style={styles.noBenchmarks}>
          <div style={styles.noBenchmarksIcon}>⏳</div>
          <Typography>Loading performance benchmarks...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.benchmarksContainer}>
      <div style={styles.benchmarksHeader}>
        <Typography style={styles.headerTitle}>
          📊 Performance Benchmarks
        </Typography>
        <Typography style={styles.headerSubtitle}>
          Track and monitor sprint performance against defined targets
        </Typography>
        {onCreateBenchmark && (
          <Button
            startIcon={<Add />}
            onClick={handleAdd}
            style={styles.addBenchmarkButton}
          >
            Add Benchmark
          </Button>
        )}
      </div>

      {benchmarks.length === 0 ? (
        <div style={styles.noBenchmarks}>
          <Assessment style={styles.noBenchmarksIcon} />
          <Typography variant="h6" gutterBottom>
            No Benchmarks Configured
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add performance benchmarks to track sprint metrics against your targets.
          </Typography>
        </div>
      ) : (
        <div style={styles.benchmarksGrid}>
          {benchmarks.map((benchmark) => (
            <Paper key={benchmark.id} style={styles.benchmarkCard}>
              <div style={styles.benchmarkHeader}>
                <Typography style={styles.benchmarkName}>
                  {getMetricIcon(benchmark.metricName)}
                  {benchmark.metricName}
                </Typography>
                <div
                  style={{
                    ...styles.benchmarkStatus,
                    ...(benchmark.isActive ? styles.statusActive : styles.statusInactive),
                  }}
                >
                  {benchmark.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div style={styles.benchmarkMetrics}>
                <div style={styles.benchmarkMetric}>
                  <div style={styles.metricLabel}>Target</div>
                  <div style={styles.metricValue}>
                    {formatThreshold(benchmark.target, benchmark.unit)}
                  </div>
                </div>
                <div style={styles.benchmarkMetric}>
                  <div style={styles.metricLabel}>Warning</div>
                  <div style={styles.metricValue}>
                    {formatThreshold(benchmark.warning, benchmark.unit)}
                  </div>
                </div>
                <div style={styles.benchmarkMetric}>
                  <div style={styles.metricLabel}>Category</div>
                  <div style={styles.metricValue}>
                    {benchmark.category}
                  </div>
                </div>
              </div>

              <div style={styles.benchmarkDescription}>
                {benchmark.description}
              </div>

              {/* Expandable detailed content */}
              <div style={styles.benchmarkActions}>
                <Button
                  size="small"
                  startIcon={expandedBenchmarks.has(benchmark.id || 0) ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => toggleExpanded(benchmark.id || 0)}
                  style={styles.actionButton}
                >
                  {expandedBenchmarks.has(benchmark.id || 0) ? 'Less Details' : 'More Details'}
                </Button>
                {onUpdateBenchmark && (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(benchmark)}
                    style={styles.actionButton}
                  >
                    Edit
                  </Button>
                )}
                <Tooltip title="Benchmark information">
                  <Button
                    size="small"
                    startIcon={<Info />}
                    style={styles.actionButton}
                  >
                    Details
                  </Button>
                </Tooltip>
              </div>

              {/* Expanded details section */}
              <Collapse in={expandedBenchmarks.has(benchmark.id || 0)}>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
                  {/* Detailed Description */}
                  {(benchmark as any).detailedDescription && (
                    <div style={{ marginBottom: 16 }}>
                      <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Description style={{ fontSize: '1rem' }} />
                        Detailed Analysis
                      </Typography>
                      <Typography variant="body2" style={{ lineHeight: 1.6, color: '#555' }}>
                        {(benchmark as any).detailedDescription}
                      </Typography>
                    </div>
                  )}

                  {/* Rationale */}
                  {(benchmark as any).rationale && (
                    <div style={{ marginBottom: 16 }}>
                      <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Assessment style={{ fontSize: '1rem' }} />
                        Rationale
                      </Typography>
                      <Typography variant="body2" style={{ lineHeight: 1.6, color: '#555' }}>
                        {(benchmark as any).rationale}
                      </Typography>
                    </div>
                  )}

                  {/* Improvement Tips */}
                  {(benchmark as any).improvementTips && Array.isArray((benchmark as any).improvementTips) && (
                    <div style={{ marginBottom: 16 }}>
                      <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Build style={{ fontSize: '1rem' }} />
                        Improvement Tips
                      </Typography>
                      <List dense style={{ padding: 0 }}>
                        {(benchmark as any).improvementTips.map((tip: string, index: number) => (
                          <ListItem key={index} style={{ paddingLeft: 0, paddingTop: 2, paddingBottom: 2 }}>
                            <ListItemIcon style={{ minWidth: 24 }}>
                              <span style={{ color: '#4facfe', fontSize: '0.8rem' }}>•</span>
                            </ListItemIcon>
                            <ListItemText
                              primary={tip}
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                style: { fontSize: '0.875rem', lineHeight: 1.4 } 
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </div>
                  )}

                  {/* Category and Review Info */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Chip 
                      icon={<Category style={{ fontSize: '0.9rem' }} />}
                      label={benchmark.category}
                      size="small"
                      style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                    />
                    {(benchmark as any).lastReviewed && (
                      <Chip 
                        icon={<Schedule style={{ fontSize: '0.9rem' }} />}
                        label={`Last reviewed: ${new Date((benchmark as any).lastReviewed).toLocaleDateString()}`}
                        size="small"
                        style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
                      />
                    )}
                    {(benchmark as any).nextReview && (
                      <Chip 
                        icon={<Schedule style={{ fontSize: '0.9rem' }} />}
                        label={`Next review: ${new Date((benchmark as any).nextReview).toLocaleDateString()}`}
                        size="small"
                        style={{ backgroundColor: '#e8f5e8', color: '#388e3c' }}
                      />
                    )}
                  </div>
                </div>
              </Collapse>
            </Paper>
          ))}
        </div>
      )}

      {/* Dialog for adding/editing benchmarks */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBenchmark ? 'Edit Benchmark' : 'Add New Benchmark'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} style={styles.dialogContent}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Metric Name</InputLabel>
                <Select
                  value={formData.metricName}
                  onChange={(e) => setFormData({ ...formData, metricName: e.target.value as string })}
                >
                  <MenuItem value="velocity">Velocity</MenuItem>
                  <MenuItem value="churnRate">Churn Rate</MenuItem>
                  <MenuItem value="completionRatio">Completion Ratio</MenuItem>
                  <MenuItem value="teamStability">Team Stability</MenuItem>
                  <MenuItem value="avgCycleTime">Average Cycle Time</MenuItem>
                  <MenuItem value="defectRate">Defect Rate</MenuItem>
                  <MenuItem value="bugCount">Bug Count</MenuItem>
                  <MenuItem value="teamSize">Team Size</MenuItem>
                </Select>
              </FormControl>
              {formData.metricName && (
                <Paper style={styles.metricDescription}>
                  <Typography variant="body2" color="textSecondary">
                    {metricDescriptions[formData.metricName as keyof typeof metricDescriptions]}
                  </Typography>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as string })}
                >
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="quality">Quality</MenuItem>
                  <MenuItem value="process">Process</MenuItem>
                  <MenuItem value="team">Team</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Target Value"
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Warning Threshold"
                type="number"
                value={formData.warning}
                onChange={(e) => setFormData({ ...formData, warning: Number(e.target.value) })}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., %, points, days"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!formData.metricName || !formData.description || !formData.unit}
          >
            {editingBenchmark ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
