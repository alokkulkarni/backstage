# Fix GitHub API Authentication in Contributors Plugin

## Summary
This PR fixes GitHub API authentication issues in the GitHub Repositories Contributors plugin by leveraging Backstage's built-in GitHub authentication system instead of trying to read tokens from configuration or environment variables.

## Changes
- Refactored the token retrieval process to use `githubAuthApi.getAccessToken(['repo'])`
- Fixed initialization logic to prevent infinite loops and token determination issues
- Added proper error handling via ErrorApi
- Improved username detection with better fallback mechanisms
- Updated documentation in README.md and TROUBLESHOOTING.md

## Implementation Details
The implementation is inspired by the Ephemeral Environments plugin's approach to GitHub authentication, which properly uses Backstage's GitHub authentication system. Key changes include:

1. Added required dependencies:
   - `githubAuthApiRef` for token retrieval
   - `errorApiRef` for error reporting

2. Simplified token determination:
   - Removed complex token retrieval from config and environment variables
   - Replaced with direct call to `githubAuthApi.getAccessToken(['repo'])`

3. Fixed initialization workflow:
   - Added proper promise handling to prevent multiple initialization attempts
   - Added initialization state tracking with timeout protection
   - Better error reporting through ErrorApi

4. Enhanced graceful degradation:
   - Added fallbacks for when GitHub auth is unavailable
   - Improved username detection fallbacks

## Testing
- Verified that the plugin properly retrieves the GitHub token from Backstage's auth session
- Confirmed that the plugin falls back to alternative methods when needed
- Tested error scenarios to ensure proper handling and user feedback

## Notes for Reviewers
This change focuses on proper authentication handling while maintaining compatibility with existing usage patterns. The user experience should be improved as the plugin will now leverage the user's GitHub login session in Backstage instead of requiring separate token configuration.
