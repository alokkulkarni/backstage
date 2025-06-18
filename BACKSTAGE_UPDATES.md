# Backstage Platform Updates

This document outlines all the changes and enhancements made to the Backstage platform. Each section details specific plugins added, customizations, and other modifications.

## Table of Contents

- [Core Platform Customizations](#core-platform-customizations)
  - [Core Libraries and Frameworks](#core-libraries-and-frameworks)
  - [Theme Customization](#theme-customization)
  - [Authentication](#authentication)
  - [Configuration Updates](#configuration-updates)
- [Added Plugins](#added-plugins)
  - [Official Backstage Plugins](#official-backstage-plugins)
  - [Third-Party Plugins](#third-party-plugins)
- [Custom Plugins](#custom-plugins)
- [User Experience Enhancements](#user-experience-enhancements)
- [Integrations](#integrations)
- [Backend Modules and Extensions](#backend-modules-and-extensions)
- [Recent Changes](#recent-changes)
- [Upcoming Planned Changes](#upcoming-planned-changes)
- [Platform Maintenance and Governance](#platform-maintenance-and-governance)

## How to Read This Document

For each plugin, we provide the following information:
- Description and features
- **NPM Package**: The package name used for installation
- **Repository**: For official and third-party plugins, the GitHub repository location
- **Version**: The current version of the package
- **Dependencies**: For custom plugins, the key dependencies required
- **Related Packages**: For plugins with associated modules or extensions
- **Backend Package**: For plugins with separate backend components

## Core Platform Customizations

### Core Libraries and Frameworks
- **Backstage Core Libraries**:
  - `@backstage/app-defaults`: ^1.6.1 - Default configurations for Backstage applications
  - `@backstage/catalog-model`: ^1.7.3 - Core catalog entity model
  - `@backstage/core-app-api`: ^1.16.1 - Core application API
  - `@backstage/core-components`: ^0.17.1 - Common UI components
  - `@backstage/core-plugin-api`: ^1.10.6 - Plugin development API
  - `@backstage/integration-react`: ^1.2.6 - Integration utilities for React components
  - `@backstage/plugin-permission-react`: ^0.4.33 - Permission system for React components
  - `@backstage/plugin-catalog-react`: ^1.17.0 - Catalog utilities for React components
  - `@backstage/theme`: ^0.6.5 - Theming support for Backstage
- **UI Framework**:
  - Material-UI v4 components and icons (^4.12.2, ^4.9.1)
- **Backend Fundamentals**:
  - `@backstage/backend-defaults`: ^0.9.0
  - `@backstage/backend-plugin-api`: ^1.3.0
  - `@backstage/config`: ^1.3.2
  - PostgreSQL database integration (`pg`: ^8.11.3)

### Theme Customization
- Updated theme colors to match Virgin Money's branding
- Customized typography and spacing
- Added Virgin Money logo to the header and favicon

### Authentication
- Configured authentication to work with company SSO
- Set up local development credentials for easier testing

### Configuration Updates
- Modified app-config.yaml to include necessary API endpoints
- Added app-config.local.yaml for development-specific settings
- Created app-config.production.yaml with production-specific configurations

## Added Plugins

### Official Backstage Plugins

#### Core Plugins
- **TechDocs Plugin**: Documentation platform built right into Backstage
  - **NPM Package**: `@backstage/plugin-techdocs`
  - **Version**: ^1.12.5
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/techdocs
  - **Related Packages**:
    - `@backstage/plugin-techdocs-module-addons-contrib` (Version ^1.1.23)
    - `@backstage/plugin-techdocs-react` (Version ^1.2.16)
- **Scaffolder Plugin**: Templates for creating standardized components
  - **NPM Package**: `@backstage/plugin-scaffolder`
  - **Version**: ^1.30.0
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/scaffolder
- **Catalog Graph**: Visualization of catalog entity relationships
  - **NPM Package**: `@backstage/plugin-catalog-graph`
  - **Version**: ^0.4.18
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/catalog-graph
- **Search Plugin**: Unified search experience for the platform
  - **NPM Package**: `@backstage/plugin-search`
  - **Version**: ^1.4.25
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/search
  - **Related Packages**:
    - `@backstage/plugin-search-react` (Version ^1.8.8)
- **User Settings**: User preference management
  - **NPM Package**: `@backstage/plugin-user-settings`
  - **Version**: ^0.8.21
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/user-settings
- **Org Plugin**: Visualize your organizational structure
  - **NPM Package**: `@backstage/plugin-org`
  - **Version**: ^0.6.38
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/org

#### Kubernetes Plugin
- Added Kubernetes plugin for viewing and managing K8s resources
- Configured cluster access and namespace filtering
- Integrated with entity pages to show relevant Kubernetes resources
- **NPM Package**: `@backstage/plugin-kubernetes`
- **Version**: ^0.12.6
- **Repository**: https://github.com/backstage/backstage/tree/master/plugins/kubernetes

#### GitHub and Source Control Plugins
- **GitHub Plugin**
  - Integrated GitHub plugin for repository browsing
  - Configured repository discovery for the organization
  - Added GitHub Actions workflow display
  - **NPM Package**: `@backstage-community/plugin-github-actions`
  - **Version**: ^0.10.0
  - **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/github-actions
- **SonarQube Plugin**
  - Integration with SonarQube for code quality metrics
  - Project status and code quality visualization
  - Issues and code smells tracking
  - **NPM Package**: `@backstage/plugin-sonarqube`
  - **Version**: ^0.7.17
  - **Repository**: https://github.com/backstage/backstage/tree/master/plugins/sonarqube

#### API Documentation
- Added OpenAPI documentation viewer
- Configured API entity scanning from repositories
- Set up automatic API documentation generation
- **NPM Package**: `@backstage/plugin-api-docs`
- **Version**: ^0.12.6
- **Repository**: https://github.com/backstage/backstage/tree/master/plugins/api-docs

#### Catalog Import
- Enabled catalog import functionality for teams to add their components
- Configured import form with organization-specific presets
- Added validation rules for imported entities
- **NPM Package**: `@backstage/plugin-catalog-import`
- **Version**: ^0.12.13
- **Repository**: https://github.com/backstage/backstage/tree/master/plugins/catalog-import

### Third-Party Plugins

#### Cost Insights
- Added cost insights plugin for cloud resource cost monitoring
- Configured with AWS billing data
- Set up team attribution for costs
- **NPM Package**: `@backstage/plugin-cost-insights`
- **Repository**: https://github.com/backstage/backstage/tree/master/plugins/cost-insights

#### Roadie's Jira Plugin
- Added Jira plugin for task management visualization
- Connected to company Jira instance
- Configured project mapping and issue display
- **NPM Package**: `@roadiehq/backstage-plugin-jira`
- **Repository**: https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/backstage-plugin-jira
- **Version**: ^2.8.3

#### Roadie's ArgoCD Plugin
- Integration with ArgoCD for application deployment visualization
- Real-time monitoring of deployment status
- Direct access to ArgoCD UI from Backstage
- **NPM Package**: `@roadiehq/backstage-plugin-argo-cd`
- **Repository**: https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/argo-cd
- **Version**: ^2.8.7
- **Backend Package**: `@roadiehq/backstage-plugin-argo-cd-backend` (Version ^4.3.0)

#### Roadie's GitHub Insights Plugin
- Added GitHub analytics and insights
- Repository statistics and contributor analysis
- Codebase health metrics visualization
- **NPM Package**: `@roadiehq/backstage-plugin-github-insights`
- **Repository**: https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-github-insights
- **Version**: ^3.1.4

#### Roadie's GitHub Pull Requests Plugin
- Pull request tracking and management
- PR status visualization
- Review workflow integration
- **NPM Package**: `@roadiehq/backstage-plugin-github-pull-requests`
- **Repository**: https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-github-pull-requests
- **Version**: ^3.4.2

#### Roadie's LaunchDarkly Plugin
- Feature flag management integration
- Toggle feature flags directly from Backstage
- Flag status visualization
- **NPM Package**: `@roadiehq/backstage-plugin-launchdarkly`
- **Repository**: https://github.com/RoadieHQ/roadie-backstage-plugins/tree/main/plugins/frontend/backstage-plugin-launchdarkly
- **Version**: ^0.0.11

#### Dynatrace Plugins
- **Dynatrace Query Language (DQL) Plugin**
  - Advanced Dynatrace metrics visualization
  - Custom queries for application performance monitoring
  - Real-time data analysis and charting
  - **NPM Package**: `@dynatrace/backstage-plugin-dql`
  - **Repository**: https://github.com/dynatrace-oss/backstage-plugin-dql
  - **Version**: ^2.2.0
  - **Backend Packages**: 
    - `@dynatrace/backstage-plugin-dql-backend` (Version ^2.2.0)
    - `@dynatrace/backstage-plugin-dql-common` (Version ^2.2.0)
- **Dynatrace Plugin**
  - Application monitoring and performance management
  - Integration with Dynatrace observability platform
  - Real-time problem detection and user experience monitoring
  - **NPM Package**: `@backstage-community/plugin-dynatrace`
  - **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/dynatrace
  - **Version**: ^10.5.0

#### Azure DevOps Plugin
- Azure DevOps integration for CI/CD pipelines
- Work item tracking and visualization
- Repository and build management
- **NPM Package**: `@backstage-community/plugin-azure-devops`
- **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/azure-devops
- **Version**: ^0.14.0

#### Bazaar Plugin
- Marketplace for internal projects and ideas
- Project discovery and collaboration tools
- Resource allocation and team building
- **NPM Package**: `@backstage-community/plugin-bazaar`
- **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/bazaar
- **Version**: ^0.10.0
- **Backend Package**: `@backstage-community/plugin-bazaar-backend` (Version ^0.10.0)

#### Copilot Plugin
- AI-assisted development tools integration
- Code generation and suggestions
- Developer productivity enhancements
- **NPM Package**: `@backstage-community/plugin-copilot`
- **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/copilot
- **Version**: ^0.9.2
- **Backend Package**: `@backstage-community/plugin-copilot-backend` (Version ^0.9.2)

#### Tech Radar Plugin
- Visualization of technology adoption across the organization
- Technology categorization and assessment
- Strategic technology planning tool
- **NPM Package**: `@backstage-community/plugin-tech-radar`
- **Repository**: https://github.com/backstage/backstage-community-plugins/tree/main/plugins/tech-radar
- **Version**: ^1.6.0

## Custom Plugins

### Ephemeral Environments Plugin
- Created custom plugin for managing ephemeral environments
- Implemented GitHub issue-based environment tracking
- Added features:
  - Environment creation via GitHub issues
  - Environment destruction workflow
  - Metadata display with database and Kubernetes details
  - Environment details dialog with deployment commands
  - Command copying functionality for easier developer onboarding
  - Automatic environment status refresh
- **NPM Package**: `@internal/plugin-ephemeralenvironments`
- **Version**: 0.1.0
- **Dependencies**:
  - @backstage/core-components: ^0.17.1
  - @backstage/core-plugin-api: ^1.9.3
  - @backstage/integration-react: ^1.1.24
  - @backstage/theme: ^0.6.5
  - @material-ui/core: ^4.9.13
  - @material-ui/icons: ^4.9.1
  - @material-ui/lab: ^4.0.0-alpha.61
  - @octokit/rest: ^21.1.1
  - moment: ^2.30.1
  - react-use: ^17.2.4

### Test Backstage Plugin
- Created template/example plugin for rapid development
- Implemented basic scaffolding for future plugins
- Added documentation for extending this plugin
- **NPM Package**: `@internal/plugin-test-backstage-plugin`
- **Version**: 0.1.0
- **Dependencies**:
  - @backstage/core-components: ^0.17.1
  - @backstage/core-plugin-api: ^1.9.3
  - @backstage/theme: ^0.6.5
  - @material-ui/core: ^4.9.13
  - @material-ui/icons: ^4.9.1
  - @material-ui/lab: ^4.0.0-alpha.61
  - react-use: ^17.2.4

## User Experience Enhancements

### Dashboard Customization
- Redesigned homepage with relevant company information
- Added quick access cards for common tasks
- Implemented news feed for platform updates

### Navigation Improvements
- Reorganized sidebar for better discoverability
- Added custom category groupings
- Implemented role-based navigation items

### Entity Page Enhancements
- Extended component pages with custom tabs
- Added service health indicators
- Implemented ownership clarity and contact information

## Integrations

### CI/CD Integration
- Connected with GitHub Actions workflows
- Added visualization for build and deployment statuses
- Implemented triggering of workflows from Backstage

### Monitoring Integration
- Added links to Grafana dashboards
- Integrated Prometheus alerts
- Added service uptime tracking

### Documentation
- Set up MkDocs integration for technical documentation
- Added custom templates for documentation generation
- Implemented documentation search capability
- Enhanced TechDocs with additional modules:
  - **NPM Package**: `@backstage/plugin-techdocs-module-addons-contrib` (Version ^1.1.23)
  - **NPM Package**: `@backstage/plugin-techdocs-react` (Version ^1.2.16)

---

## Backend Modules and Extensions

### Authentication Modules
- Added various authentication providers for flexible identity management
- **NPM Packages**:
  - `@backstage/plugin-auth-backend-module-azure-easyauth-provider` (Version ^0.2.7)
  - `@backstage/plugin-auth-backend-module-github-provider` (Version ^0.3.2)
  - `@backstage/plugin-auth-backend-module-guest-provider` (Version ^0.2.7)
  - `@backstage/plugin-auth-backend-module-microsoft-provider` (Version ^0.3.2)

### Scaffolder Backend Modules
- Extended templating capabilities with additional actions and integrations
- **NPM Packages**:
  - `@backstage/plugin-scaffolder-backend-module-github` (Version ^0.7.0)
  - `@backstage/plugin-scaffolder-backend-module-azure` (Version ^0.2.8)
  - `@invincible/plugin-scaffolder-backend-module-createvalues` (Version 0.3.0)
  - `@parfuemerie-douglas/scaffolder-backend-module-azure-repositories` (Version ^0.3.0)
  - `@roadiehq/scaffolder-backend-module-http-request` (Version ^5.3.1)

### Catalog Backend Modules
- Extended catalog functionality with additional processors and providers
- **NPM Packages**:
  - `@backstage/plugin-catalog-backend-module-github` (Version ^0.8.0)
  - `@backstage/plugin-catalog-backend-module-github-org` (Version ^0.3.9)
  - `@backstage/plugin-catalog-backend-module-logs` (Version ^0.1.9)
  - `@backstage/plugin-catalog-backend-module-scaffolder-entity-model` (Version ^0.2.7)

### Search Backend Modules
- Enhanced search functionality with additional indexers and engines
- **NPM Packages**:
  - `@backstage/plugin-search-backend-module-catalog` (Version ^0.3.3)
  - `@backstage/plugin-search-backend-module-pg` (Version ^0.5.43)
  - `@backstage/plugin-search-backend-module-techdocs` (Version ^0.4.1)

## Recent Changes

### Enhanced Ephemeral Environments Plugin (May 2025)
- Updated metadata field in the environments table to show:
  - Cluster name information
  - Database availability
  - Service endpoint counts
- Added environment details dialog with tabs for:
  - Kubernetes commands
  - Database connection information
  - General environment commands
- Improved UX:
  - Added command copy functionality
  - Enhanced visual styling
  - Added tooltips for better information discovery

### Theme Enhancements (April 2025)
- Updated color palette for better accessibility
- Improved mobile responsiveness
- Enhanced dark mode support

## Upcoming Planned Changes
- Cost optimization plugin enhancements
- Integration with internal service catalog
- Advanced RBAC implementation
- Performance optimizations for large catalogs

## Platform Maintenance and Governance

### Version Management
- Platform core dependencies are regularly updated to maintain security and feature compatibility
- Plugins follow semantic versioning to ensure compatibility
- Version updates are managed through a quarterly review cycle

### Plugin Selection Criteria
- Official plugins are preferred for core functionality
- Community plugins are evaluated based on:
  - Maintenance activity and release frequency
  - Documentation quality
  - Integration capabilities
  - Performance impact
- Custom plugins are developed only when existing plugins cannot meet requirements

### Documentation Standards
- All plugins must be documented in this file
- Custom plugins require additional internal documentation
- Templates must be provided for any custom development
- Major changes are communicated through release notes

### Testing and Quality Assurance
- E2E tests using Playwright (^1.32.3)
- Unit tests for custom plugins
- Manual verification for integration points
- Staging environment testing before production deployment
