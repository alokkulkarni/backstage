# Jenkins Scaffolder Action URL Fix Summary

## Issue Identified
The Jenkins scaffolder action was failing with "Only absolute URLs are supported" when trying to create Jenkins jobs. The core problem was URL construction in the Jenkins client.

## Root Cause
1. **Relative URL Issue**: The `getApiUrl()` method was returning `/api/proxy/jenkins/api` (a relative path) instead of an absolute URL required by the fetch API
2. **Pipeline Job Type**: The create job URL wasn't specifying the pipeline job type, causing Jenkins to default to freestyle jobs
3. **Authentication Conflicts**: Both proxy and client were trying to handle authentication

## Fixes Applied

### 1. URL Construction Fix (`jenkins-client.ts`)
- **Before**: `proxyPath: '/jenkins/api'` → relative path causing fetch errors
- **After**: `proxyPath: '/api/proxy/jenkins/api'` → full Backstage proxy path
- **Result**: Constructs absolute URLs like `http://localhost:7007/api/proxy/jenkins/api`

### 2. Pipeline Job Creation
- **Before**: `${this.getApiUrl()}/createItem?name=${name}` → creates freestyle job
- **After**: `${this.getApiUrl()}/createItem?name=${name}&mode=org.jenkinsci.plugins.workflow.job.WorkflowJob` → creates pipeline job
- **Result**: Creates proper pipeline jobs that can use Jenkinsfiles

### 3. Authentication Simplification
- **Before**: Client sent Authorization headers even when using proxy (conflicting auth)
- **After**: Proxy handles authentication, client focuses on job creation
- **Result**: Clean authentication through Backstage proxy configuration

### 4. Enhanced Logging
- Added comprehensive logging throughout the Jenkins client for better debugging
- Logs show exact URLs being called, response status, and operation details
- Makes troubleshooting much easier

## Configuration Requirements

### app-config.yaml
```yaml
# Jenkins configuration
jenkins:
  baseUrl: http://localhost:8082
  username: alokkulkarni
  apiKey: 11ee8c483603502eb77e78a2ab07ad3378

# Proxy configuration
proxy:
  endpoints:
    '/jenkins/api':
      target: http://localhost:8082
      changeOrigin: true
      allowedHeaders: ['Authorization', 'Content-Type']
      headers:
        Authorization: "Basic YWxva2t1bGthcm5pOjExZWU4YzQ4MzYwMzUwMmViNzdlNzhhMmFiMDdhZDMzNzg="
```

## Expected Behavior Now

1. **Job Existence Check**: `GET http://localhost:7007/api/proxy/jenkins/api/job/[jobname]/api/json`
2. **Job Creation**: `POST http://localhost:7007/api/proxy/jenkins/api/createItem?name=[jobname]&mode=org.jenkinsci.plugins.workflow.job.WorkflowJob`
3. **Pipeline Configuration**: Sends proper XML config for pipeline jobs with Jenkinsfile content

## Testing
- ✅ TypeScript compilation passes
- ✅ No import/export errors
- ✅ Proper method signatures
- 🔄 Runtime testing pending

## Files Modified
- `plugins/scaffolder-backend-module-jenkins-scaffolder-action/src/actions/jenkins-client.ts` - Complete rewrite with URL fixes
- Fixed all issues in one comprehensive update

## Key Improvements
1. **Absolute URL Support**: All fetch calls now use proper absolute URLs
2. **Pipeline Job Support**: Creates actual pipeline jobs, not freestyle jobs
3. **Proxy Integration**: Properly leverages Backstage proxy configuration
4. **Better Error Handling**: Enhanced logging and error messages
5. **Simplified Authentication**: Lets proxy handle auth instead of double-auth

The Jenkins scaffolder action should now successfully:
- ✅ Find Jenkinsfiles in skeleton directories (previous fix)
- ✅ Create pipeline jobs in Jenkins (this fix)
- ✅ Handle authentication through Backstage proxy
- ✅ Provide detailed logging for troubleshooting
