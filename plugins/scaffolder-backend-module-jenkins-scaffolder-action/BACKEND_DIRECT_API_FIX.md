# Jenkins Scaffolder Backend Direct API Fix

## Issue Identified
The Jenkins scaffolder action was failing with authentication errors because it was trying to use Backstage's frontend proxy configuration from a backend context. Backend scaffolder actions run on the server side and cannot use frontend proxy configurations.

## Root Cause Analysis
1. **Backend vs Frontend Context**: Scaffolder actions run in the backend Node.js environment, not the browser
2. **Proxy Configuration Mismatch**: The action was trying to use `/api/proxy/jenkins/api` which is a frontend proxy route
3. **Authentication Service Interference**: The Backstage authentication service was trying to handle authentication for what it thought was an internal API call

## Solution: Direct Jenkins API Calls
Backend scaffolder actions should make direct HTTP calls to external services (like Jenkins) with proper authentication headers.

## Changes Made

### 1. Updated Constructor (`jenkins-client.ts`)
- **Before**: Configured to use Backstage proxy path `/api/proxy/jenkins/api`
- **After**: Configured for direct Jenkins API calls with required authentication
- **Result**: Throws error if Jenkins credentials are not provided (required for backend actions)

### 2. Updated URL Construction
- **Before**: `getApiUrl()` constructed proxy URLs like `http://localhost:7007/api/proxy/jenkins/api`
- **After**: `getApiUrl()` constructs direct Jenkins URLs like `http://localhost:8082/api`
- **Result**: Direct calls to Jenkins server without proxy

### 3. Updated Authentication Headers
- **Before**: Conditionally added auth headers only when not using proxy
- **After**: Always adds auth headers for direct Jenkins API calls
- **Result**: Proper authentication for all Jenkins API requests

### 4. Simplified Configuration
- **Before**: Required `backend.baseUrl` configuration for proxy URLs
- **After**: Only requires `jenkins.baseUrl`, `jenkins.username`, and `jenkins.apiKey`
- **Result**: Cleaner configuration focused on Jenkins connection

## Configuration Requirements

### app-config.yaml
```yaml
# Jenkins configuration for backend actions
jenkins:
  baseUrl: http://localhost:8082
  username: ${JENKINS_USERNAME}
  apiKey: ${JENKINS_API_KEY}

# Proxy configuration (still needed for frontend plugins)
proxy:
  endpoints:
    '/jenkins/api':
      target: http://localhost:8082
      changeOrigin: true
      allowedHeaders: ['Authorization', 'Content-Type']
      headers:
        Authorization: "Basic ${JENKINS_BASIC_AUTH_HEADER}"
```

### Environment Variables
```bash
JENKINS_USERNAME=your_jenkins_username
JENKINS_API_KEY=your_jenkins_api_key
JENKINS_BASIC_AUTH_HEADER=$(echo -n "$JENKINS_USERNAME:$JENKINS_API_KEY" | base64)
```

## Expected Behavior
- ✅ Scaffolder actions make direct calls to Jenkins API
- ✅ Authentication handled via Basic Auth headers
- ✅ No interference from Backstage authentication middleware
- ✅ Proper error handling for missing credentials
- ✅ Clear logging for troubleshooting

## Architecture

```
┌─────────────────┐    Direct HTTP     ┌─────────────────┐
│  Backstage      │    with Auth       │     Jenkins     │
│  Scaffolder     │ ────────────────── │     Server      │
│  Backend Action │                    │                 │
└─────────────────┘                    └─────────────────┘
```

## Testing
1. Set proper Jenkins credentials in environment variables
2. Restart Backstage backend to reload configuration
3. Test scaffolder action with Jenkins job creation
4. Verify direct API calls in Jenkins access logs

## Files Modified
- `/src/actions/jenkins-client.ts` - Updated for direct API calls

## Key Benefits
1. **Correct Architecture**: Backend actions make direct external API calls
2. **Proper Authentication**: Uses Jenkins credentials directly
3. **No Proxy Confusion**: Clear separation between frontend and backend API usage
4. **Better Error Handling**: Clear error messages for missing credentials
5. **Simplified Debugging**: Direct API calls are easier to troubleshoot

The Jenkins scaffolder action now correctly operates as a backend action with direct Jenkins API integration.
