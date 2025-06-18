# Jira Metadata Annotations Template

This template allows you to add Jira metadata annotations to any component's catalog-info.yaml file in your Backstage catalog.

## Purpose

The Jira metadata annotations enable components in your Backstage catalog to connect with Jira, allowing features such as:

- Display Jira issues related to a component
- Show Jira activity streams
- Query Jira issues using customizable JQL
- Link components to specific Jira projects and components

## Annotations Added

This template adds the following Jira annotations to a component:

- `jira/project-key`: The Jira project key (e.g., PROJ, ENG, PLATFORM)
- `jira/component`: (Optional) The name of the Jira component in the project
- `jira/token-type`: (Optional) Auth token type for Activity stream feed (Bearer or Basic)
- `jira/label`: (Optional) Refine filter based on a label or labels (comma-separated values)
- `jira/all-issues-jql`: (Optional) JQL query for EntityJiraQueryCard with template support

## Example Result

After running this template, your catalog-info.yaml file will have Jira annotations like:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: example-service
  description: An example service
  annotations:
    jira/project-key: ENG
    jira/component: backend
    jira/token-type: Bearer
    jira/label: important,backend
    jira/all-issues-jql: project = 'ENG' AND component = 'backend' AND assignee = '{{ userEmail }}'
spec:
  type: service
  owner: team-a
  lifecycle: production
```

## How to Use This Template

1. Navigate to the "Create" page in your Backstage instance
2. Select "Add Jira Metadata Annotations" from the available templates
3. Fill in the required information:
   - Component Path: The GitHub URL of the component you want to annotate
   - Jira Project Key: The key of the Jira project to link to the component
4. (Optional) Fill in additional fields as needed:
   - Jira Component: If you want to link to a specific component in the Jira project
   - Token Type: Authentication type for Jira API (Bearer or Basic)
   - Jira Label: For filtering issues with specific labels
   - JQL Query: For customizing which issues are displayed
5. Submit the form to create a pull request that adds these annotations

## Integration with Jira Plugin

These annotations are designed to work with the [@roadiehq/backstage-plugin-jira](https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-jira) plugin, which provides Jira integration features in Backstage.