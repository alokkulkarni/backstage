import { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Progress,
  StatusOK,
  StatusAborted,
  StatusPending,
  EmptyState,

} from '@backstage/core-components';
import { useApi, githubAuthApiRef, errorApiRef, configApiRef } from '@backstage/core-plugin-api';
import { Octokit } from '@octokit/rest';
// import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Button,
  IconButton, 
  Typography, 
  Grid, 
  Chip, 
  Tooltip,
  CircularProgress,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  Snackbar,
} from '@material-ui/core';
import moment from 'moment';
import CloudIcon from '@material-ui/icons/Cloud';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import InfoIcon from '@material-ui/icons/Info';
import DnsIcon from '@material-ui/icons/Dns';
import StorageIcon from '@material-ui/icons/Storage';
import ComputerIcon from '@material-ui/icons/Computer';
import CodeIcon from '@material-ui/icons/Code';

const useStyles = makeStyles({
  container: {
    width: '100%',
  },
  statusChip: {
    marginRight: '8px',
  },
  createButton: {
    marginTop: '16px',
  },
  metadataContainer: {
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metadataChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  destroyButton: {
    backgroundColor: '#d32f2f',
    color: 'white',
    '&:hover': {
      backgroundColor: '#b71c1c',
    },
  },
  actionsContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  infoButton: {
    color: '#1976d2',
  },
  dialogContent: {
    minWidth: '500px',
    maxWidth: '800px',
    padding: '16px',
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflowX: 'auto',
    marginBottom: '16px',
    border: '1px solid #ddd',
  },
  outputSection: {
    marginBottom: '16px',
  },
  outputTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  commandSection: {
    marginTop: '16px',
  },
  commandTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  sectionDivider: {
    margin: '16px 0',
  },
  tabPanel: {
    padding: '16px 0',
  },
  infoIcon: {
    marginRight: '8px',
  },
  gridItem: {
    marginBottom: '8px',
  },
  serviceItem: {
    paddingLeft: '12px',
  },
  paperPadding: {
    padding: '16px',
  },
  buttonAbsolute: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  alertMargin: {
    marginBottom: '16px',
  }
});

type Environment = {
  id: number;
  title: string;
  number: number;
  state: string;
  creator: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string }>;
  body: string;
};

// New interface for environment outputs
interface EnvironmentOutput {
  kubeconfig?: string;
  clusterName?: string;
  databaseEndpoint?: string;
  databaseName?: string;
  databasePassword?: string;
  serviceEndpoints?: Record<string, string>;
  instructions?: string;
  status?: string; // Added environment status field
  // Add raw terraform outputs for better metadata display
  rawTerraformOutputs?: Record<string, string>; // Raw key-value pairs from terraform outputs
  applyLog?: string; // The actual terraform apply log
}

// Interface for generated commands
interface EnvironmentCommands {
  kubernetes: string[];
  database: string[];
  general: string[];
}

const getStatusComponent = (state: string) => {
  switch (state.toLowerCase()) {
    case 'open':
      return <StatusOK>Active</StatusOK>;
    case 'closed':
      return <StatusAborted>Destroyed</StatusAborted>;
    default:
      return <StatusPending>{state}</StatusPending>;
  }
};

const getMetadataFromBody = (body: string) => {
  try {
    // Simple parsing to extract metadata from issue body
    const metadataRegex = /\`\`\`json\s*({[\s\S]*?})\s*\`\`\`/;
    const match = body.match(metadataRegex);
    
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing environment metadata:', error);
    return null;
  }
};

// New function to extract environment outputs from GitHub issue body
const getEnvironmentOutputs = (body: string): EnvironmentOutput => {
  const outputs: EnvironmentOutput = {};
  
  try {
    // First try to extract workflow-style status with steps
    const workflowStatusRegex = /Status\s*\n\s*\n([\s\S]*?)(?:\n\s*\n|\n###|$)/i;
    const workflowMatch = body.match(workflowStatusRegex);
    
    if (workflowMatch && workflowMatch[1]) {
      // Get all steps and find the last completed one
      const steps = workflowMatch[1].trim().split('\n').filter(line => line.trim());
      
      if (steps.length > 0) {
        // Get the last step as the current status
        const lastStep = steps[steps.length - 1].trim();
        outputs.status = lastStep;
      }
    } else {
      // Fallback to the old status extraction format
      const envStatusRegex = /Environment Status[:\s]+([\w\s-]+)/i;
      const envStatusMatch = body.match(envStatusRegex);
      if (envStatusMatch && envStatusMatch[1]) {
        outputs.status = envStatusMatch[1].trim();
      }
    }
    
    // Extract Terraform output section which contains important environment details
    const tfOutputRegex = /```(?:terraform|hcl|)\s*([\s\S]*?)```/gi;
    let tfMatch;
    while ((tfMatch = tfOutputRegex.exec(body)) !== null) {
      const outputText = tfMatch[1].trim();
      
      // Parse for common terraform output patterns
      // Look for database credentials
      const dbPasswordMatch = outputText.match(/(?:db_password|database_password|password)["\s=:]+["']?([^"'\s,}]+)/i);
      if (dbPasswordMatch && dbPasswordMatch[1]) {
        outputs.databasePassword = dbPasswordMatch[1].trim();
      }
      
      // Look for database endpoints
      const dbEndpointMatch = outputText.match(/(?:db_endpoint|database_endpoint|endpoint)["\s=:]+["']?([^"'\s,}]+\.[^"'\s,}]+)/i);
      if (dbEndpointMatch && dbEndpointMatch[1]) {
        outputs.databaseEndpoint = dbEndpointMatch[1].trim();
      }
      
      // Look for database names
      const dbNameMatch = outputText.match(/(?:db_name|database_name)["\s=:]+["']?([^"'\s,}]+)/i);
      if (dbNameMatch && dbNameMatch[1]) {
        outputs.databaseName = dbNameMatch[1].trim();
      }
      
      // Look for cluster names
      const clusterNameMatch = outputText.match(/(?:cluster_name|eks_cluster)["\s=:]+["']?([^"'\s,}]+)/i);
      if (clusterNameMatch && clusterNameMatch[1]) {
        outputs.clusterName = clusterNameMatch[1].trim();
      }
      
      // Look for URLs and endpoints
      const urlMatches = outputText.match(/(https?:\/\/[^"'\s,}]+)/g);
      if (urlMatches) {
        if (!outputs.serviceEndpoints) {
          outputs.serviceEndpoints = {};
        }
        urlMatches.forEach((url, index) => {
          // Try to find a name for this URL in the surrounding text
          const urlLineMatch = outputText.match(new RegExp(`([\\w_-]+)[^\\n]*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
          const urlName = urlLineMatch ? urlLineMatch[1].trim() : `service_${index + 1}`;
          
          outputs.serviceEndpoints![urlName] = url;
        });
      }
    }
    
    // Extract Kubernetes config information
    const kubeConfigRegex = /### Kubernetes Config\s*```yaml\s*([\s\S]*?)```/i;
    const kubeMatch = body.match(kubeConfigRegex);
    if (kubeMatch && kubeMatch[1]) {
      outputs.kubeconfig = kubeMatch[1].trim();
    }
    
    // Extract cluster name
    const clusterNameRegex = /Cluster Name[:\s]+([\w-]+)/i;
    const clusterMatch = body.match(clusterNameRegex);
    if (clusterMatch && clusterMatch[1]) {
      outputs.clusterName = clusterMatch[1].trim();
    }
    
    // Extract database information
    const dbEndpointRegex = /Database Endpoint[:\s]+([^\n]+)/i;
    const dbMatch = body.match(dbEndpointRegex);
    if (dbMatch && dbMatch[1]) {
      outputs.databaseEndpoint = dbMatch[1].trim();
    }
    
    const dbNameRegex = /Database Name[:\s]+([^\n]+)/i;
    const dbNameMatch = body.match(dbNameRegex);
    if (dbNameMatch && dbNameMatch[1]) {
      outputs.databaseName = dbNameMatch[1].trim();
    }
    
    // Look for Terraform outputs in plain text format
    const tfOutputPattern = /(?:Outputs:|Apply complete![\s\S]*?Outputs:)\s*([\s\S]*?)(?:$|<details>)/i;
    const tfOutputMatch = body.match(tfOutputPattern);
    if (tfOutputMatch && tfOutputMatch[1]) {
      const outputText = tfOutputMatch[1].trim();
      outputs.rawTerraformOutputs = {};
      outputs.applyLog = outputText;
      
      // Parse output lines for key-value pairs
      const outputLines = outputText.split('\n').map(line => line.trim()).filter(line => line);
      
      outputLines.forEach(line => {
        // Match patterns like "key = value" or "key: value" or "key: "value""
        const lineMatch = line.match(/([^=:]+)[=:]\s*(?:"([^"]*)"|(.*?)(?:$|\s+\()|(.*))/);
        
        if (lineMatch) {
          const key = lineMatch[1].trim();
          // Use the quoted value if available, otherwise use the unquoted value
          const value = (lineMatch[2] || lineMatch[3] || lineMatch[4] || '').trim();
          
          // Store raw output
          if (value) {
            // Ensure rawTerraformOutputs is initialized before assigning to it
            outputs.rawTerraformOutputs = outputs.rawTerraformOutputs || {};
            outputs.rawTerraformOutputs[key] = value;
          }
          
          // Process for known output types
          const keyLower = key.toLowerCase();
          if (keyLower.includes('password') || keyLower.includes('secret')) {
            outputs.databasePassword = value;
          } else if (keyLower.includes('endpoint') || keyLower.includes('host')) {
            outputs.databaseEndpoint = value;
          } else if (keyLower.includes('database') || keyLower.includes('db_name')) {
            outputs.databaseName = value;
          } else if (keyLower.includes('cluster') || keyLower.includes('kubernetes')) {
            outputs.clusterName = value;
          } else if (value.match(/^https?:\/\//)) {
            // If the value is a URL, add it to service endpoints
            if (!outputs.serviceEndpoints) {
              outputs.serviceEndpoints = {};
            }
            outputs.serviceEndpoints[key] = value;
          }
        }
      });
    }
    
    // Extract service endpoints section
    const serviceEndpointsRegex = /### Service Endpoints\s*([\s\S]*?)(?:###|$)/i;
    const serviceMatch = body.match(serviceEndpointsRegex);
    if (serviceMatch && serviceMatch[1]) {
      const endpoints: Record<string, string> = {};
      
      const endpointLines = serviceMatch[1].trim().split('\n');
      endpointLines.forEach(line => {
        // Match both formats: "name: url" or "name - url"
        const endpointMatch = line.match(/([^:]+)[:\s-]+\s*(.+)/);
        if (endpointMatch) {
          const [, name, url] = endpointMatch;
          endpoints[name.trim()] = url.trim();
        }
      });
      
      if (Object.keys(endpoints).length > 0) {
        outputs.serviceEndpoints = endpoints;
      }
    }
    
    // Extract deployment/usage instructions
    const instructionsRegex = /### (Deployment|Usage) Instructions\s*([\s\S]*?)(?:###|$)/i;
    const instructionsMatch = body.match(instructionsRegex);
    if (instructionsMatch && instructionsMatch[2]) {
      outputs.instructions = instructionsMatch[2].trim();
    }
    
    return outputs;
  } catch (error) {
    console.error('Error parsing environment outputs:', error);
    return {};
  }
};

// Generate useful commands based on environment data
const generateEnvironmentCommands = (env: Environment, outputs: EnvironmentOutput): EnvironmentCommands => {
  const commands: EnvironmentCommands = {
    kubernetes: [],
    database: [],
    general: [],
  };
  
  // Generate Kubernetes commands if applicable
  if (outputs.clusterName) {
    commands.kubernetes.push(`# Configure kubectl with the environment's credentials`);
    commands.kubernetes.push(`aws eks update-kubeconfig --name ${outputs.clusterName} --region us-east-1`);
    commands.kubernetes.push(`# Check all pods in the cluster`);
    commands.kubernetes.push(`kubectl get pods --all-namespaces`);
    commands.kubernetes.push(`# View all services`);
    commands.kubernetes.push(`kubectl get svc --all-namespaces`);
  }
  
  // Generate database commands if applicable
  if (outputs.databaseEndpoint && outputs.databaseName) {
    commands.database.push(`# Connect to the database`);
    
    const password = outputs.databasePassword ? outputs.databasePassword : 'password'; 
    
    if (outputs.databaseEndpoint.includes('mysql') || outputs.databaseName.includes('mysql')) {
      commands.database.push(`mysql -h ${outputs.databaseEndpoint} -u admin -p ${outputs.databaseName}`);
      commands.database.push(`# MySQL connection string`);
      commands.database.push(`mysql://admin:${password}@${outputs.databaseEndpoint}/${outputs.databaseName}`);
    } else if (outputs.databaseEndpoint.includes('postgres') || outputs.databaseName.includes('postgres')) {
      commands.database.push(`psql -h ${outputs.databaseEndpoint} -U postgres -d ${outputs.databaseName}`);
      commands.database.push(`# PostgreSQL connection string`);
      commands.database.push(`postgresql://postgres:${password}@${outputs.databaseEndpoint}:5432/${outputs.databaseName}`);
    } else {
      commands.database.push(`# Generic database connection - check documentation for specific details`);
      commands.database.push(`# Connection endpoint: ${outputs.databaseEndpoint}`);
      commands.database.push(`# Database name: ${outputs.databaseName}`);
      if (outputs.databasePassword) {
        commands.database.push(`# Database password: ${outputs.databasePassword}`);
      }
    }
  }
  
  // Generate general environment commands
  const metadata = getMetadataFromBody(env.body);
  commands.general.push(`# Environment information`);
  commands.general.push(`export ENVIRONMENT_NAME="${env.title}"`);
  
  if (metadata) {
    if (metadata.version) {
      commands.general.push(`export VERSION="${metadata.version}"`);
    }
    if (metadata.region) {
      commands.general.push(`export REGION="${metadata.region}"`);
    }
  }
  
  // Add raw Terraform outputs if available
  if (outputs.rawTerraformOutputs && Object.keys(outputs.rawTerraformOutputs).length > 0) {
    commands.general.push(`\n# Terraform Outputs`);
    Object.entries(outputs.rawTerraformOutputs).forEach(([key, value]) => {
      // Skip sensitive values that are already included elsewhere
      if (!key.toLowerCase().includes('password') && !key.toLowerCase().includes('secret')) {
        commands.general.push(`export TF_VAR_${key.toLowerCase()}="${value}"`);
      }
    });
  }
  
  // Add service endpoint commands
  if (outputs.serviceEndpoints) {
    commands.general.push(`\n# Access environment services`);
    Object.entries(outputs.serviceEndpoints).forEach(([name, url]) => {
      commands.general.push(`# ${name}: ${url}`);
      if (url.startsWith('http')) {
        commands.general.push(`curl ${url}`);
      }
    });
  }
  
  return commands;
};

export const EnvironmentsComponent = () => {
  const classes = useStyles();
  const githubAuthApi = useApi(githubAuthApiRef);
  const errorApi = useApi(errorApiRef);
  const configApi = useApi(configApiRef);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [refreshingEnv, setRefreshingEnv] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state variables for environment details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  // State variables for environment data
  const [environments, setEnvironments] = useState<Environment[]>([]);
  
  // Get owner and repo from config or use defaults
  const owner = configApi.getOptionalString('app.terraformEnvironments.defaultOwner') || 'alokkulkarni';
  const repo = configApi.getOptionalString('app.terraformEnvironments.defaultRepo') || 'ephemeralenvironments';
  const labelFilter = 'environment';

  // Function to fetch environments from GitHub
  const fetchEnvironments = async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      const token = await githubAuthApi.getAccessToken(['repo']);
      
      const octokit = new Octokit({
        auth: token,
      });

      const response = await octokit.issues.listForRepo({
        owner,
        repo,
        labels: labelFilter,
        state: 'all',
        per_page: 100,
      });

      const fetchedEnvironments = response.data.map(issue => ({
        id: issue.id,
        title: issue.title,
        number: issue.number,
        state: issue.state,
        creator: issue.user?.login || 'Unknown',
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        labels: issue.labels as Array<{ name: string }>,
        body: issue.body || '',
      }));
      
      setEnvironments(fetchedEnvironments);
    } catch (e) {
      errorApi.post(e as Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to refresh all environments
  const refreshAllEnvironments = async () => {
    setIsRefreshing(true);
    await fetchEnvironments();
    setIsRefreshing(false);
  };

  // Function to fetch a single environment
  const fetchSingleEnvironment = async (issueNumber: number): Promise<void> => {
    try {
      setRefreshingEnv(issueNumber);
      const token = await githubAuthApi.getAccessToken(['repo']);
      
      const octokit = new Octokit({
        auth: token,
      });

      try {
        // Try to get the environment details first
        const response = await octokit.issues.get({
          owner,
          repo,
          issue_number: issueNumber,
        });
        
        // Update just this environment in the local state
        setEnvironments(prev => {
          const updatedEnvironments = [...prev];
          const index = updatedEnvironments.findIndex(env => env.number === issueNumber);
          
          if (index !== -1) {
            updatedEnvironments[index] = {
              id: response.data.id,
              title: response.data.title,
              number: response.data.number,
              state: response.data.state,
              creator: response.data.user?.login || 'Unknown',
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              labels: response.data.labels as Array<{ name: string }>,
              body: response.data.body || '',
            };
          } else {
            // If we couldn't find the environment in our current list, add it
            updatedEnvironments.push({
              id: response.data.id,
              title: response.data.title,
              number: response.data.number,
              state: response.data.state,
              creator: response.data.user?.login || 'Unknown',
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              labels: response.data.labels as Array<{ name: string }>,
              body: response.data.body || '',
            });
          }
          
          return updatedEnvironments;
        });
        
        // Indicate success with a snackbar message
        setSnackbarMessage(`Environment #${issueNumber} refreshed successfully`);
        setSnackbarOpen(true);
        
      } catch (error) {
        // Issue might have been deleted
        console.log(`Issue #${issueNumber} might have been deleted:`, error);
        
        // Remove this environment from the local state
        setEnvironments(prev => prev.filter(env => env.number !== issueNumber));
        
        // Indicate with a message that the environment was removed
        setSnackbarMessage(`Environment #${issueNumber} was removed (it might have been deleted)`);
        setSnackbarOpen(true);
      }
    } catch (e) {
      errorApi.post(e as Error);
      
      // Show error message to user
      setSnackbarMessage(`Error refreshing environment #${issueNumber}: ${(e as Error).message}`);
      setSnackbarOpen(true);
    } finally {
      setRefreshingEnv(null);
    }
  };

  const triggerDestroyWorkflow = async (issueNumber: number) => {
    try {
      const token = await githubAuthApi.getAccessToken(['repo']);
      
      const octokit = new Octokit({
        auth: token,
      });
      
      // Check if the workflow file exists first
      try {
        // This call will verify the workflow exists before trying to dispatch it
        await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}', {
          owner,
          repo,
          workflow_id: '.github/workflows/destroy-environment.yaml', // Updated to include the full path
        });
      } catch (workflowErr) {
        // If the workflow doesn't exist, throw a more specific error
        throw new Error(`Workflow '.github/workflows/destroy-environment.yaml' not found in ${owner}/${repo} repository. Please ensure the workflow file exists.`);
      }
      
      // Updated to use the correct path and parameters according to the latest GitHub API
      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner,
        repo,
        workflow_id: '.github/workflows/destroy-environment.yaml', // Updated to include the full path
        ref: 'main', // Assuming the workflow is on the main branch
        inputs: {
          issue_number: issueNumber.toString(),
        },
      });

      return true;
    } catch (e) {
      console.error('Error triggering workflow:', e);
      errorApi.post(e as Error);
      throw e;
    }
  };

  const handleDestroyClick = (environment: Environment) => {
    setSelectedEnvironment(environment);
    setConfirmOpen(true);
  };

  const handleConfirmDestroy = async () => {
    if (!selectedEnvironment) return;
    
    try {
      await triggerDestroyWorkflow(selectedEnvironment.number);
      setConfirmOpen(false);
      
      // Display success message
      setSnackbarMessage(`Environment destruction workflow triggered for ${selectedEnvironment.title}`);
      setSnackbarOpen(true);
      
      // Refresh the environment immediately to show status change
      fetchSingleEnvironment(selectedEnvironment.number);
      
      // Clear the selected environment
      setSelectedEnvironment(null);
    } catch (e) {
      // Error is already handled by triggerDestroyWorkflow
      setConfirmOpen(false);
      
      // Additional error notification with more details
      const errorMessage = (e as Error).message;
      const betterMessage = errorMessage.includes('Not Found')
        ? 'Workflow file not found. Please ensure "destroy-environment.yaml" exists in the repository.'
        : errorMessage;
      
      setSnackbarMessage(`Failed to trigger destroy workflow: ${betterMessage}`);
      setSnackbarOpen(true);
    }
  };

  const handleCancelDestroy = () => {
    setConfirmOpen(false);
    setSelectedEnvironment(null);
  };

  const handleCreateEnvironment = () => {
    window.open(`https://github.com/${owner}/${repo}/issues/new?labels=${labelFilter}`, '_blank');
  };

  // We'll use inline handlers instead of this function
  
  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command).then(() => {
      setSnackbarMessage('Command copied to clipboard');
      setSnackbarOpen(true);
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const handleOpenDetails = (environment: Environment) => {
    setSelectedEnvironment(environment);
    setDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const columns: TableColumn<Environment>[] = [
    {
      title: 'Name',
      field: 'title',
      highlight: true,
    },
    {
      title: 'Status',
      render: (row: Environment) => {
        const outputs = getEnvironmentOutputs(row.body);
        // If we have a custom status from the issue body, use that
        if (outputs.status) {
          // Determine the status color based on the environment status
          const normalizedStatus = outputs.status.toLowerCase();
          let statusChip;
          
          // For workflow step based status
          if (
            normalizedStatus.includes('validate') || 
            normalizedStatus.includes('create') || 
            normalizedStatus.includes('initialize') || 
            normalizedStatus.includes('plan')
          ) {
            statusChip = <StatusPending>{outputs.status}</StatusPending>;
          } else if (
            normalizedStatus.includes('apply') || 
            normalizedStatus.includes('upload')
          ) {
            statusChip = <StatusOK>{outputs.status}</StatusOK>;
          } else if (normalizedStatus.includes('error') || normalizedStatus.includes('failed')) {
            statusChip = <StatusAborted>{outputs.status}</StatusAborted>;
          } 
          // For general status keywords
          else if (normalizedStatus.includes('creating') || normalizedStatus.includes('pending') || normalizedStatus.includes('initializing')) {
            statusChip = <StatusPending>{outputs.status}</StatusPending>;
          } else if (normalizedStatus.includes('ready') || normalizedStatus.includes('created') || normalizedStatus.includes('running')) {
            statusChip = <StatusOK>{outputs.status}</StatusOK>;
          } else if (normalizedStatus.includes('destroying') || normalizedStatus.includes('terminating')) {
            statusChip = <StatusPending>{outputs.status}</StatusPending>;
          } else if (normalizedStatus.includes('destroyed') || normalizedStatus.includes('terminated')) {
            statusChip = <StatusAborted>{outputs.status}</StatusAborted>;
          } else {
            statusChip = <StatusPending>{outputs.status}</StatusPending>;
          }
          
          return statusChip;
        }
        
        // Fallback to the issue state if no custom status is found
        return getStatusComponent(row.state);
      },
    },
    {
      title: 'Creator',
      field: 'creator',
    },
    {
      title: 'Created',
      render: (row: Environment) => moment(row.created_at).fromNow(),
    },
    {
      title: 'Updated',
      render: (row: Environment) => moment(row.updated_at).fromNow(),
    },
    {
      title: 'Labels',
      render: (row: Environment) => (
        <div>
          {row.labels.map(label => (
            <Chip 
              key={label.name} 
              label={label.name} 
              size="small" 
              className={classes.statusChip} 
            />
          ))}
        </div>
      ),
    },
    {
      title: 'Metadata',
      render: (row: Environment) => {
        const metadata = getMetadataFromBody(row.body);
        const outputs = getEnvironmentOutputs(row.body);
        
        // No metadata or outputs found
        if (!metadata && Object.keys(outputs).length === 0) {
          return <Typography variant="body2">No metadata</Typography>;
        }
        
        // Determine what to display
        let displayEntries: Array<[string, string | number | boolean]> = [];
        
        // Add metadata entries first
        if (metadata) {
          displayEntries = Object.entries(metadata)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, value as string | number | boolean]);
        }
        
        // Add important outputs
        if (outputs.clusterName) {
          displayEntries.push(['cluster', outputs.clusterName]);
        }
        if (outputs.databaseEndpoint) {
          displayEntries.push(['db', 'available']);
        }
        if (outputs.serviceEndpoints && Object.keys(outputs.serviceEndpoints).length > 0) {
          displayEntries.push(['services', Object.keys(outputs.serviceEndpoints).length]);
        }
        
        const displayCount = 3; // Show only first 3 entries
        
        return (
          <Box className={classes.metadataContainer}>
            <Tooltip 
              title={
                <div>
                  {displayEntries.map(([key, value]) => (
                    <div key={key}><strong>{key}:</strong> {String(value)}</div>
                  ))}
                  {outputs.serviceEndpoints && (
                    <>
                      <div><strong>Available Services:</strong></div>
                      {Object.entries(outputs.serviceEndpoints).map(([service, url]) => (
                        <div key={service} className={classes.serviceItem}>• {service}: {url}</div>
                      ))}
                    </>
                  )}
                </div>
              }
            >
              <div className={classes.metadataChips}>
                {displayEntries.slice(0, displayCount).map(([key, value]) => (
                  <Chip
                    key={key}
                    size="small"
                    label={`${key}: ${typeof value === 'string' && value.length > 10 
                      ? `${value.substring(0, 10)}...` 
                      : String(value).substring(0, 20)}`}
                  />
                ))}
                {displayEntries.length > displayCount && (
                  <Chip
                    size="small"
                    label={`+${displayEntries.length - displayCount} more`}
                    variant="outlined"
                  />
                )}
                <IconButton 
                  className={classes.infoButton} 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(row);
                  }}
                  title="Show environment details"
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </div>
            </Tooltip>
          </Box>
        );
      }
    },
    {
      title: 'Link',
      render: (row: Environment) => {
        const url = `https://github.com/${owner}/${repo}/issues/${row.number}`;
        return (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            href={url}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            View Issue
          </Button>
        );
      }
    },
    {
      title: 'Actions',
      render: (row: Environment) => (
        <div className={classes.actionsContainer}>
          <IconButton 
            aria-label="refresh" 
            onClick={() => fetchSingleEnvironment(row.number)}
            disabled={refreshingEnv === row.number}
            size="small"
            title="Refresh this environment"
          >
            {refreshingEnv === row.number ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
          {row.state.toLowerCase() === 'open' && (
            <Button
              size="small"
              variant="contained"
              className={classes.destroyButton}
              onClick={() => handleDestroyClick(row)}
              startIcon={<DeleteIcon fontSize="small" />}
            >
              Destroy
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Initial data loading
  useEffect(() => {
    fetchEnvironments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo, labelFilter]); // Re-fetch if these dependencies change

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't refresh if a refresh is already in progress
      if (!isRefreshing && refreshingEnv === null) {
        console.log('Auto-refreshing environments');
        fetchEnvironments();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isRefreshing, refreshingEnv]); // Only re-create the interval if these states change

  if (isRefreshing && environments.length === 0) {
    return <Progress />;
  }

  if (environments.length === 0) {
    return (
      <EmptyState
        missing="data"
        title="No environments found"
        description={`There are no issues tagged with "${labelFilter}" in the ${owner}/${repo} repository.`}
        action={
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateEnvironment}
            className={classes.createButton}
          >
            Create Environment
          </Button>
        }
      />
    );
  }

  return (
    <div className={classes.container}>
      <Alert severity="info" className={classes.alertMargin}>
        Environments are managed as GitHub issues tagged with "{labelFilter}" in the {owner}/{repo} repository.
      </Alert>
      <Table
        options={{
          search: true,
          paging: true,
          pageSize: 10,
          padding: 'dense',
        }}
        data={environments}
        columns={columns}
        title={
          <Grid container alignItems="center" spacing={1}>
            <Grid item>
              <CloudIcon />
            </Grid>
            <Grid item>
              <Typography variant="h6">Ephemeral Environments</Typography>
            </Grid>
            <Grid item>
              <IconButton 
                color="primary" 
                onClick={refreshAllEnvironments}
                disabled={isRefreshing}
                size="small"
                title="Refresh all environments"
              >
                {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Grid>
          </Grid>
        }
      />
      
      <Dialog
        open={confirmOpen}
        onClose={handleCancelDestroy}
      >
        <DialogTitle>Confirm Environment Destruction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to destroy the environment "{selectedEnvironment?.title}"? 
            This will trigger the destroy-environment workflow for issue #{selectedEnvironment?.number}.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDestroy} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDestroy} color="secondary" variant="contained">
            Destroy
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedEnvironment && (
          <>
            <DialogTitle>
              Environment Details - {selectedEnvironment.title}
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    <InfoIcon className={classes.infoIcon} fontSize="small" /> Environment Information
                  </Typography>
                  <Paper variant="outlined" className={classes.paperPadding}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} className={classes.gridItem}>
                        <Typography variant="body2"><strong>Name:</strong> {selectedEnvironment.title}</Typography>
                      </Grid>
                      <Grid item xs={6} className={classes.gridItem}>
                        <Typography variant="body2"><strong>Status:</strong> {
                          getEnvironmentOutputs(selectedEnvironment.body).status || 
                          (selectedEnvironment.state === 'open' ? 'Active' : 'Destroyed')
                        }</Typography>
                      </Grid>
                      <Grid item xs={6} className={classes.gridItem}>
                        <Typography variant="body2"><strong>Created:</strong> {moment(selectedEnvironment.created_at).format('MMMM Do YYYY, h:mm a')}</Typography>
                      </Grid>
                      <Grid item xs={6} className={classes.gridItem}>
                        <Typography variant="body2"><strong>Creator:</strong> {selectedEnvironment.creator}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Labels
                  </Typography>
                  <div className={classes.metadataChips}>
                    {selectedEnvironment.labels.map(label => (
                      <Chip 
                        key={label.name} 
                        label={label.name} 
                        size="small" 
                        className={classes.statusChip} 
                      />
                    ))}
                  </div>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider className={classes.sectionDivider} />
                  <Typography variant="subtitle1" gutterBottom>
                    <DnsIcon className={classes.infoIcon} fontSize="small" /> Environment Outputs
                  </Typography>
                  <div className={classes.outputSection}>
                    <Grid container spacing={2}>
                      {getEnvironmentOutputs(selectedEnvironment.body).clusterName && (
                        <Grid item xs={12} sm={6}>
                          <Paper variant="outlined" className={classes.paperPadding}>
                            <Typography variant="subtitle2" gutterBottom>Kubernetes Cluster</Typography>
                            <Typography variant="body2"><strong>Cluster Name:</strong> {getEnvironmentOutputs(selectedEnvironment.body).clusterName}</Typography>
                          </Paper>
                        </Grid>
                      )}
                      
                      {getEnvironmentOutputs(selectedEnvironment.body).databaseEndpoint && (
                        <Grid item xs={12} sm={6}>
                          <Paper variant="outlined" className={classes.paperPadding}>
                            <Typography variant="subtitle2" gutterBottom>Database</Typography>
                            <Typography variant="body2"><strong>Endpoint:</strong> {getEnvironmentOutputs(selectedEnvironment.body).databaseEndpoint}</Typography>
                            {getEnvironmentOutputs(selectedEnvironment.body).databaseName && (
                              <Typography variant="body2"><strong>Name:</strong> {getEnvironmentOutputs(selectedEnvironment.body).databaseName}</Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}
                      
                      {getEnvironmentOutputs(selectedEnvironment.body).serviceEndpoints && 
                       Object.keys(getEnvironmentOutputs(selectedEnvironment.body).serviceEndpoints || {}).length > 0 && (
                        <Grid item xs={12}>
                          <Paper variant="outlined" className={classes.paperPadding}>
                            <Typography variant="subtitle2" gutterBottom>Service Endpoints</Typography>
                            <Grid container spacing={1}>
                              {Object.entries(getEnvironmentOutputs(selectedEnvironment.body).serviceEndpoints || {}).map(([name, url]) => (
                                <Grid item xs={12} key={name}>
                                  <Typography variant="body2">
                                    <strong>{name}:</strong> <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                                  </Typography>
                                </Grid>
                              ))}
                            </Grid>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                    
                    <Typography variant="subtitle2" style={{ marginTop: '16px', marginBottom: '8px' }}>Raw Output</Typography>
                    <pre className={classes.codeBlock}>
                      {JSON.stringify(getEnvironmentOutputs(selectedEnvironment.body), null, 2)}
                    </pre>
                  </div>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider className={classes.sectionDivider} />
                  <Typography variant="subtitle1" gutterBottom>
                    <ComputerIcon className={classes.infoIcon} fontSize="small" /> Useful Commands
                  </Typography>
                  <div className={classes.commandSection}>
                    <Tabs 
                      value={activeTab} 
                      onChange={(_, newValue) => setActiveTab(newValue)} 
                      indicatorColor="primary" 
                      textColor="primary"
                      variant="fullWidth"
                    >
                      <Tab icon={<DnsIcon />} label="Kubernetes" />
                      <Tab icon={<StorageIcon />} label="Database" />
                      <Tab icon={<ComputerIcon />} label="General" />
                      <Tab icon={<CodeIcon />} label="Terraform" />
                    </Tabs>
                    <div className={classes.tabPanel}>
                      {activeTab === 0 && (
                        <>
                          {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).kubernetes.length > 0 ? (
                            <Box position="relative">
                              <pre className={classes.codeBlock}>
                                {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).kubernetes.join('\n')}
                              </pre>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary" 
                                className={classes.buttonAbsolute}
                                onClick={() => handleCopyCommand(generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).kubernetes.join('\n'))}
                              >
                                Copy
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2">No Kubernetes commands available for this environment</Typography>
                          )}
                        </>
                      )}
                      {activeTab === 1 && (
                        <>
                          {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).database.length > 0 ? (
                            <Box position="relative">
                              <pre className={classes.codeBlock}>
                                {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).database.join('\n')}
                              </pre>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary" 
                                className={classes.buttonAbsolute}
                                onClick={() => handleCopyCommand(generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).database.join('\n'))}
                              >
                                Copy
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2">No database commands available for this environment</Typography>
                          )}
                        </>
                      )}
                      {activeTab === 2 && (
                        <>
                          {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).general.length > 0 ? (
                            <Box position="relative">
                              <pre className={classes.codeBlock}>
                                {generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).general.join('\n')}
                              </pre>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary" 
                                className={classes.buttonAbsolute}
                                onClick={() => handleCopyCommand(generateEnvironmentCommands(selectedEnvironment, getEnvironmentOutputs(selectedEnvironment.body)).general.join('\n'))}
                              >
                                Copy
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2">No general commands available for this environment</Typography>
                          )}
                        </>
                      )}
                      {activeTab === 3 && (
                        <>
                          {getEnvironmentOutputs(selectedEnvironment.body).rawTerraformOutputs && 
                           Object.keys(getEnvironmentOutputs(selectedEnvironment.body).rawTerraformOutputs || {}).length > 0 ? (
                            <Box position="relative">
                              <pre className={classes.codeBlock}>
                                {Object.entries(getEnvironmentOutputs(selectedEnvironment.body).rawTerraformOutputs || {})
                                  .map(([key, value]) => `${key} = ${value}`)
                                  .join('\n')}
                              </pre>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary" 
                                className={classes.buttonAbsolute}
                                onClick={() => handleCopyCommand(
                                  Object.entries(getEnvironmentOutputs(selectedEnvironment.body).rawTerraformOutputs || {})
                                    .map(([key, value]) => `${key} = ${value}`)
                                    .join('\n')
                                )}
                              >
                                Copy
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2">No Terraform outputs available for this environment</Typography>
                          )}
                          
                          {getEnvironmentOutputs(selectedEnvironment.body).applyLog && (
                            <>
                              <Typography variant="subtitle2" style={{ marginTop: '16px', marginBottom: '8px' }}>
                                Terraform Apply Log
                              </Typography>
                              <Box position="relative">
                                <pre className={classes.codeBlock} style={{ maxHeight: '300px', overflow: 'auto' }}>
                                  {getEnvironmentOutputs(selectedEnvironment.body).applyLog}
                                </pre>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="primary" 
                                  className={classes.buttonAbsolute}
                                  onClick={() => handleCopyCommand(getEnvironmentOutputs(selectedEnvironment.body).applyLog || '')}
                                >
                                  Copy
                                </Button>
                              </Box>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        autoHideDuration={6000}
      />
    </div>
  );
};
