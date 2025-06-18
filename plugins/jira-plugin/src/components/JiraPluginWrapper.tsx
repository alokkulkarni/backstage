import { useState, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { identityApiRef } from '@backstage/core-plugin-api';
import { Progress, ErrorPanel } from '@backstage/core-components';
import { JiraDashboard } from './JiraDashboard';
import { jiraApiRef } from '../api';

export const JiraPluginWrapper = () => {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const identityApi = useApi(identityApiRef);
  const jiraApi = useApi(jiraApiRef);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Get profile info which contains user display name and email
        console.log('[JiraPluginWrapper] Fetching user profile');
        
        // Try to check Jira connectivity first using the myself endpoint
        try {
          console.log('[JiraPluginWrapper] Verifying Jira API connectivity');
          const jiraUser = await jiraApi.getUserProfile();
          console.log('[JiraPluginWrapper] Successfully connected to Jira API as:', jiraUser.displayName);
          
          // If we can get the Jira user directly, use that email
          if (jiraUser.emailAddress) {
            console.log('[JiraPluginWrapper] Using Jira user email:', jiraUser.emailAddress);
            setUserId(jiraUser.emailAddress);
            setLoading(false);
            return;
          }
        } catch (jiraError) {
          console.error('[JiraPluginWrapper] Jira API connectivity test failed:', jiraError);
          // Continue to try with backstage identity
        }
        
        // Fallback to using backstage identity
        const profile = await identityApi.getProfileInfo();
        console.log('[JiraPluginWrapper] Backstage profile obtained:', profile);
        
        // Use email as the userId for Jira integration
        if (profile.email) {
          console.log('[JiraPluginWrapper] User profile email:', profile.email);
          setUserId(profile.email);
        } else {
          // Fallback to user entity ref if email is not available
          const identity = await identityApi.getBackstageIdentity();
          console.log('[JiraPluginWrapper] Identity obtained:', identity);
          
          const id = identity.userEntityRef.split(':')[1] || 'default-user';
          setUserId(id);
          console.log('[JiraPluginWrapper] No email available, using entity ref:', id);
        }
        setLoading(false);
      } catch (error) {
        console.error('[JiraPluginWrapper] Error fetching user profile', error);
        setError('Failed to fetch user profile. Please make sure you are logged in and Jira is properly configured.');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [identityApi, jiraApi]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ErrorPanel title="Jira Plugin Error" error={new Error(error)} />;
  }

  return <JiraDashboard userId={userId} showRefreshButton={true} />;
};
