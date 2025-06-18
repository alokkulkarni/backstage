# Shell Script Scaffolder Action - Environment Variable Mapping Implementation

## Overview

The `shell:execute` scaffolder action has been enhanced to automatically map environment variables from the `app-config.yaml` file, eliminating the need for manual environment variable configuration in templates.

## Implementation Summary

### 🔧 **Core Changes**

1. **Enhanced Action Function**: Updated `createShellExecuteAction()` to accept a config parameter
2. **Environment Variable Mapping**: Automatic mapping from various app-config.yaml sections
3. **Module Registration**: Updated to pass config to the action
4. **App Configuration**: Added scaffolder environment variable configuration section

### 🌍 **Environment Variable Sources**

The action now automatically maps environment variables from:

| Source | Variables Mapped | Example |
|--------|-----------------|---------|
| **Global Scaffolder Config** | `scaffolder.environment.*` | `NODE_ENV`, `DOCKER_REGISTRY`, `PLATFORM_NAME` |
| **Action-Specific Config** | `scaffolder.actions.shell:execute.environment.*` | `MAVEN_OPTS`, `GRADLE_OPTS`, `NPM_CONFIG_REGISTRY` |
| **GitHub Integration** | `integrations.github[0].token` → `GITHUB_TOKEN` | Automatic token mapping |
| **Jenkins Integration** | `jenkins.*` → `JENKINS_*` | `JENKINS_BASE_URL`, `JENKINS_USERNAME`, `JENKINS_API_KEY` |
| **Jira Integration** | `jira.instances[0].*` → `JIRA_*` | `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_USERNAME` |
| **SonarQube Integration** | `sonarqube.*` → `SONARQUBE_*` | `SONARQUBE_BASE_URL`, `SONARQUBE_API_KEY` |
| **Backstage App Config** | `app.*`, `backend.*` → `BACKSTAGE_*` | `BACKSTAGE_BASE_URL`, `BACKSTAGE_BACKEND_URL` |
| **Terraform Config** | `app.terraformEnvironments.*` → `TERRAFORM_*` | `TERRAFORM_DEFAULT_OWNER`, `TERRAFORM_DEFAULT_REPO` |

### 📋 **Files Modified**

#### **Core Implementation Files**
- `src/actions/shellExecute.ts` - Enhanced with config-based environment mapping
- `src/module.ts` - Updated to pass config to actions
- `src/actions/index.ts` - Updated exports

#### **Configuration Files**  
- `app-config.yaml` - Added comprehensive scaffolder environment configuration

#### **Documentation Files**
- `README.md` - Updated with configuration examples and environment variable mapping
- `examples/environment-mapping-template.yaml` - Complete template demonstrating all features

### 🔄 **Environment Variable Precedence**

Variables are merged in this order (later overrides earlier):

1. **Global scaffolder environment** (`scaffolder.environment`)
2. **Action-specific environment** (`scaffolder.actions.shell:execute.environment`)  
3. **Automatically mapped variables** (from integrations, jenkins, jira, etc.)
4. **Template input environment** (specified in the `environment` parameter)

### ✨ **Key Features**

#### **Automatic Integration Mapping**
- No need to manually configure common tokens and URLs
- Secure credential management through Backstage configuration
- Consistent environment variable naming across templates

#### **Flexible Configuration**
- Global defaults for all templates
- Action-specific overrides
- Template-level customization

#### **Production Ready**
- Comprehensive error handling
- Detailed logging of environment variable sources
- TypeScript type safety
- Cross-platform compatibility

### 🚀 **Usage Examples**

#### **Basic Usage with Auto-Mapped Variables**
```yaml
steps:
  - id: deploy
    name: Deploy Application
    action: shell:execute
    input:
      script: |
        # These variables are automatically available:
        echo "Deploying to: $PLATFORM_ENVIRONMENT"
        echo "Platform: $PLATFORM_NAME"
        echo "Registry: $DOCKER_REGISTRY"
        
        # Integration credentials automatically mapped:
        git clone https://$GITHUB_TOKEN@github.com/owner/repo.git
        
        # Build and deploy
        docker build -t $DOCKER_REGISTRY/${{ parameters.name }}:latest .
        helm upgrade --install ${{ parameters.name }} ./chart
```

#### **Template with Integration Setup**
```yaml
steps:
  - id: setup-ci-cd
    name: Setup CI/CD Pipeline
    action: shell:execute
    input:
      script: |
        # Jenkins pipeline creation using auto-mapped credentials
        curl -X POST "$JENKINS_BASE_URL/createItem" \
          -u "$JENKINS_USERNAME:$JENKINS_API_KEY" \
          -H "Content-Type: application/xml" \
          --data-binary @Jenkinsfile
        
        # Jira project setup using auto-mapped API token
        curl -X POST "$JIRA_BASE_URL/rest/api/2/project" \
          -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"key": "${{ parameters.name }}", "name": "${{ parameters.name }}"}'
```

### 📦 **Benefits**

1. **Simplified Templates**: No need to manually pass common environment variables
2. **Centralized Configuration**: All environment variables managed in `app-config.yaml`
3. **Secure Credentials**: Integration tokens automatically mapped without exposure
4. **Consistent Naming**: Standardized environment variable names across all templates
5. **Reduced Boilerplate**: Less repetitive configuration in templates
6. **Easy Maintenance**: Update credentials in one place, affects all templates

### 🔒 **Security Considerations**

- Sensitive values (tokens, API keys) are automatically mapped but not logged
- Environment variables maintain the same security model as Backstage configuration
- Template inputs can override config values but cannot access raw config objects
- All credential mapping goes through Backstage's secure configuration system

### 🧪 **Testing**

The implementation includes:
- TypeScript compilation validation
- Module build verification  
- Example template with comprehensive environment variable demonstration
- Documentation with multiple usage patterns

### 📚 **Documentation**

- **README.md**: Complete usage guide with configuration examples
- **examples/environment-mapping-template.yaml**: Full template demonstrating all features
- **app-config.yaml**: Example configuration with all supported sections

## Next Steps

1. **Deploy and Test**: Use the new environment mapping in your Backstage instance
2. **Create Templates**: Build templates that leverage the automatic environment mapping
3. **Customize Configuration**: Adjust the `app-config.yaml` scaffolder section for your needs
4. **Monitor Usage**: Check logs to see which environment variables are being mapped

The shell script scaffolder action now provides a seamless bridge between Backstage configuration and template execution, making it easier to create maintainable and secure software templates.
