# Ephemeral Environments Plugin

A Backstage plugin for managing ephemeral environments through GitHub issues.

## Overview

The Ephemeral Environments plugin provides a unified view of all environments represented as GitHub issues tagged with the 'environment' label. This plugin allows platform engineering teams to track and manage environments, and provides functionality to destroy environments by triggering GitHub Actions workflows.

## Features

- **Environment List**: Displays all GitHub issues tagged as 'environment' from a configured repository
- **Environment Status**: Shows whether an environment is active (open) or destroyed (closed)
- **Metadata Exploration**: Displays environment metadata extracted from the issue body JSON
- **Environment Destruction**: Trigger a GitHub workflow to destroy an environment

## Installation

### Step 1: Install the Plugin

```bash
# From your Backstage root directory
yarn add @internal/plugin-ephemeralenvironments
```

### Step 2: Add the Plugin to Your App

#### Frontend Integration

Add the plugin to your `packages/app/src/App.tsx`:

```tsx
import { EphemeralenvironmentsPage } from '@internal/plugin-ephemeralenvironments';

// In your app routes
<Route path="/ephemeralenvironments" element={<EphemeralenvironmentsPage />} />
```

Add the route to your sidebar in `packages/app/src/components/Root/Root.tsx`:

```tsx
import CloudIcon from '@material-ui/icons/Cloud';

// In your sidebar
<SidebarItem icon={CloudIcon} to="ephemeralenvironments" text="Environments" />
```

### Step 3: Configure GitHub Integration

#### Prerequisites

- GitHub authentication configured in Backstage
- A GitHub repository with issues labeled as "environment"
- A GitHub Actions workflow file named `destroy-environment.yaml` in the repository

#### Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# GitHub integration (if not already configured)
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}

# GitHub authentication (if not already configured)
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}

# Terraform environments configuration
terraformenvironments:
  defaultowner: <github-owner>  # GitHub username or organization
  defaultrepo: <github-repo>    # Repository name containing environment issues

# App configuration for ephemeral environments
app:
  terraformEnvironments:
    defaultOwner: <github-owner>
    defaultRepo: <github-repo>
```

### Step 4: Set Up GitHub Workflow

Create a GitHub workflow file named `.github/workflows/destroy-environment.yaml` in your target repository:

```yaml
name: Destroy Environment

on:
  workflow_dispatch:
    inputs:
      issue_number:
        required: true
        description: 'The issue number of the environment to destroy'

jobs:
  destroy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Destroy Environment
        run: |
          echo "Destroying environment from issue #${{ github.event.inputs.issue_number }}"
          # Your destruction script here (terraform destroy, kubectl delete, etc.)
          
      - name: Close Issue
        uses: peter-evans/close-issue@v3
        with:
          issue-number: ${{ github.event.inputs.issue_number }}
          comment: "Environment destroyed successfully"
```

### Step 5: Create Environment Issues

Create GitHub issues in your repository with the following format:

```markdown
## Environment Request

**Environment Name**: my-test-env
**Owner**: @username
**Purpose**: Testing new feature

### Metadata
```json
{
  "version": "1.0.0",
  "region": "us-east-1",
  "size": "small"
}
```

### Environment Outputs
```
cluster_name = my-cluster
database_endpoint = db.example.com
service_urls = {
  "app": "https://app.example.com",
  "api": "https://api.example.com"
}
```

### Status
✅ Provisioning complete
```

**Important**: Tag the issue with the `environment` label.

## Usage

1. Navigate to the "Environments" page in your Backstage instance (`/ephemeralenvironments`)
2. View the list of all environments (GitHub issues with 'environment' label)
3. Click on any environment to see detailed information including:
   - Environment metadata
   - Kubernetes cluster details
   - Database connection information
   - Service endpoints
   - Useful commands for accessing the environment
4. Click "Destroy" on an active environment to trigger the destruction workflow
5. Use the refresh button to update environment status

## GitHub Integration

This plugin integrates with GitHub through the following mechanisms:

1. **Authentication**: Uses Backstage's GitHub authentication to make authorized API calls
2. **Issue Management**: Reads issues from a configured GitHub repository
3. **Workflow Dispatch**: Triggers GitHub Actions workflows to destroy environments

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure GitHub authentication is properly configured and the token has repo access
2. **No Environments Found**: Check that issues are tagged with the 'environment' label
3. **Workflow Not Found**: Ensure the `destroy-environment.yaml` workflow exists in the target repository
4. **Permission Denied**: Verify the GitHub token has workflow dispatch permissions

### Debugging

Check the browser console and Backstage backend logs for detailed error messages. The plugin provides comprehensive logging for troubleshooting.

## Development

### Local Development

```bash
yarn install
yarn start
```

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

## License

Apache-2.0
