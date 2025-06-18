import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';
import { HomePage } from './components/home/HomePage';

// Import the Tech Radar plugin components
import { TechRadarPage } from '@backstage-community/plugin-tech-radar';

// Import the Bazaar plugin components
import { BazaarPage } from '@backstage-community/plugin-bazaar';

// Import the Copilot plugin components
import { CopilotIndexPage } from '@backstage-community/plugin-copilot';

import {
  AlertDisplay,
  OAuthRequestDialog,
  SignInPage as DefaultSignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';

import { githubAuthApiRef, microsoftAuthApiRef } from '@backstage/core-plugin-api';

// Import the default theme from our theme directory
import { themes, UnifiedThemeProvider } from '@backstage/theme';
import { virginMoneyTheme } from './theme/virgin-money-theme';
import { makeStyles, Grid, Typography, Paper, Theme, Box, Button } from '@material-ui/core';
import { EphemeralenvironmentsPage } from '@internal/plugin-ephemeralenvironments';
import { JiraPluginPage } from '@internal/plugin-jira-plugin';
import { JenkinsInsightsPage } from '@internal/plugin-jenkins-insights';
import { GithubRepositoriesContibutorsPage } from '@internal/plugin-github-repositories-contibutors';
import { PermissionPolicyPage } from '@internal/plugin-permission-policy-frontend';
import { JiraTrendsPage } from '@internal/plugin-jira-trends-frontend';
import { SourceControlTrendsPage } from '@internal/plugin-sourcecontrol-trends-frontend';

// Import permission-aware route component
import { PermissionAwareRoute } from './components/common/PermissionAwareRoute';
import {
  ephemeralEnvironmentsReadPermission,
  permissionsReadPermission,
  bazaarReadPermission,
  copilotReadPermission,
  techRadarReadPermission,
  jiraTrendsReadPermission,
  sourceControlTrendsReadPermission,
} from './permissions/permissions';

// Create custom styles for the modern SignInPage
const useSignInStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundImage: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
  },
  signInBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(6),
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    backgroundColor: theme.palette.background.paper,
    maxWidth: '450px',
    width: '100%',
    animation: '$fadeIn 0.5s ease-in-out',
  },
  header: {
    marginBottom: theme.spacing(4),
    textAlign: 'center',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    background: '-webkit-linear-gradient(45deg, #1E3A8A, #3B82F6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: theme.palette.text.secondary,
    fontSize: '1rem',
    maxWidth: '300px',
    margin: '0 auto',
  },
  providerButton: {
    marginTop: theme.spacing(2),
    width: '100%',
    padding: theme.spacing(1.5),
    textTransform: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  },
  githubButton: {
    backgroundColor: '#333',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#444',
    },
  },
  guestButton: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    marginTop: theme.spacing(2),
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  providerIcon: {
    marginRight: theme.spacing(1),
    fontSize: '1.2rem',
  },
  buttonLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    fontSize: '1rem',
  },
  footer: {
    marginTop: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: '0.85rem',
  },
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  logo: {
    width: 'auto',
    height: '60px',
    marginBottom: theme.spacing(3),
  },
}));

// GitHub icon component
const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// Custom modern SignInPage component
const ModernSignInPage = (props: any) => {
  const classes = useSignInStyles();
  const { providers = [], auto, onSignInSuccess } = props;

  // Use the DefaultSignInPage component under the hood to maintain core functionality
  // but with a completely customized UI
  return (
    <DefaultSignInPage
      {...props}
      auto={auto}
      onSignInSuccess={onSignInSuccess}
      renderProviders={() => (
        <Grid container className={classes.container}>
          <Paper elevation={0} className={classes.signInBox}>
            <svg
              className={classes.logo}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1074 276"
              fill="#3B82F6"
            >
              <title>Backstage</title>
              <path
                d="M142.08,120.04h-17.02v33.53h17.02c8.86,0,14.01-6.38,14.01-16.42C156.09,126.48,150.94,120.04,142.08,120.04 M214.7,171.77h-32.37v-14.13c-9.93,10.21-24.57,16.03-40.89,16.03c-23.2,0-42.19-12.83-42.19-38.84c0-26.56,19.53-39.34,45.86-39.34 h34.64v-3.88c0-14.87-7.56-21.58-27.15-21.58c-13.41,0-29.4,3.51-38.32,9.06l-5.79-25.54c11.09-5.31,32.04-10.4,48.39-10.4 c36.31,0,55.42,13.54,55.42,47.7v80.92H214.7z M372.94,171.77h-32.37v-71.53c0-21.25-7.99-28.26-22.44-28.26 c-15.67,0-25.23,10.9-25.23,28.75v71.04h-32.37V43.51h32.37V103c9.37-14.38,24.45-19.91,37.67-19.91 c26.44,0,42.37,17.34,42.37,48.02V171.77z M537.92,171.77h-32.37v-74.05c0-18.05-6.76-25.79-19.96-25.79 c-14.25,0-23.2,11.09-23.2,29.14v70.7h-32.37V84.51h30.88v13.83c9-11.09,24.13-16.66,37.86-16.66c26.94,0,39.16,18.17,39.16,48.14 V171.77z M554.93,84.51h32.37v87.26h-32.37V84.51z M572.81,35.08c10.77,0,19.34,8.57,19.34,19.34c0,10.52-8.57,19.16-19.34,19.16 c-10.52,0-19.16-8.64-19.16-19.16C553.65,43.66,562.29,35.08,572.81,35.08 M658.66,120.04h-17.02v33.53h17.02 c8.86,0,14.01-6.38,14.01-16.42C672.67,126.48,667.53,120.04,658.66,120.04 M731.29,171.77h-32.37v-14.13 c-9.93,10.21-24.57,16.03-40.89,16.03c-23.2,0-42.19-12.83-42.19-38.84c0-26.56,19.53-39.34,45.86-39.34h34.64v-3.88 c0-14.87-7.56-21.58-27.15-21.58c-13.41,0-29.4,3.51-38.33,9.06l-5.79-25.54c11.09-5.31,32.04-10.4,48.39-10.4 c36.31,0,55.42,13.54,55.42,47.7v80.92H731.29z M854.59,84.51h32.88l-42.94,87.81c-15.11,30.46-31.5,42.44-56.73,42.44 c-7.25,0-20.97-1.94-27.78-4.69l5.97-26.82c5.1,2.37,10.27,3.57,16.42,3.57c13.1,0,19.72-5.42,25.73-18.11l0.74-1.75l-45.43-82.45 h33.97l28.57,57.79L854.59,84.51z M935.39,84.51h21.36v26.69h-21.36v60.58h-32.19v-60.58h-17.41V84.51h17.41V75.7 c0-25.04,15.75-42.44,48.21-42.44c5.54,0,13.66,1.05,18.45,2.55l-3.76,26.5c-2.66-0.83-5.79-1.24-9.31-1.24 c-12.09,0-16.6,5.92-16.6,16.54V84.51z M1065.39,128.04c0-20.83-13.1-30.95-29.33-30.95c-16.54,0-29.4,10.33-30.95,30.95H1065.39z M1073.4,148.33h-68.47c2.18,19.16,15.42,28.02,32.04,28.02c11.39,0,21.14-4,29.58-12.09l16.35,17.57 c-11.68,13.23-29.58,19.77-47.08,19.77c-33.97,0-63.43-21.43-63.43-59.3c0-33.16,24.13-59.62,58.4-59.62 c33.23,0,54.89,25.16,54.89,58.55C1085.67,143.07,1085.17,145.42,1073.4,148.33 M785.06,267.37c0-4.78,3.76-8.07,8.4-8.07 c4.71,0,8.4,3.29,8.4,8.07c0,4.71-3.69,8-8.4,8C788.82,275.37,785.06,272.08,785.06,267.37z M787.13,267.37 c0,3.91,2.98,6.29,6.33,6.29c3.36,0,6.33-2.39,6.33-6.29c0-3.98-2.98-6.37-6.33-6.37C790.1,261,787.13,263.39,787.13,267.37z M792.15,270.93h-1.79v-6.82c0.71-0.14,1.71-0.27,2.39-0.27c1.28,0,1.86,0.22,2.35,0.52c0.46,0.3,0.69,0.79,0.69,1.45 c0,0.74-0.57,1.31-1.31,1.55v0.08c0.61,0.22,0.96,0.79,1.09,1.71c0.17,1.09,0.3,1.5,0.44,1.77h-1.93 c-0.17-0.26-0.3-0.91-0.44-1.71c-0.09-0.74-0.44-1.09-1.28-1.09h-0.22V270.93z M792.24,267.13h0.22c0.79,0,1.45-0.26,1.45-0.96 c0-0.48-0.35-0.96-1.45-0.96c-0.09,0-0.18,0-0.22,0.01V267.13z"
              />
            </svg>
            <Box className={classes.header}>
              <Typography variant="h1" className={classes.title}>
                Welcome
              </Typography>
              <Typography variant="subtitle1" className={classes.subtitle}>
                Sign in to access your developer portal
              </Typography>
            </Box>
            <Box width="100%">
              {providers.map((provider: any) => {
                if (provider === 'guest') {
                  return (
                    <Button
                      key="guest-provider"
                      variant="contained"
                      onClick={() => props.onSignInClick('guest')}
                      className={`${classes.providerButton} ${classes.guestButton}`}
                      data-testid="guest-provider-button"
                    >
                      <span className={classes.buttonLabel}>
                        Continue as Guest
                      </span>
                    </Button>
                  );
                }

                if (provider.id === 'github-auth-provider') {
                  return (
                    <Button
                      key={provider.id}
                      variant="contained"
                      onClick={() => props.onSignInClick(provider.id)}
                      className={`${classes.providerButton} ${classes.githubButton}`}
                      data-testid={`${provider.id}-button`}
                    >
                      <span className={classes.buttonLabel}>
                        <Box component="span" className={classes.providerIcon}>
                          <GitHubIcon />
                        </Box>
                        Sign in with GitHub
                      </span>
                    </Button>
                  );
                }

                return (
                  <Button
                    key={provider.id}
                    variant="contained"
                    color="primary"
                    onClick={() => props.onSignInClick(provider.id)}
                    className={classes.providerButton}
                    data-testid={`${provider.id}-button`}
                  >
                    <span className={classes.buttonLabel}>
                      Sign in with {provider.title}
                    </span>
                  </Button>
                );
              })}
            </Box>
            <Typography variant="body2" className={classes.footer}>
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </Typography>
          </Paper>
        </Grid>
      )}
    />
  );
};

const app = createApp({
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  components: {
    SignInPage: props => (
      <ModernSignInPage 
        {...props} 
        auto 
        providers={['guest', {
          id: 'github-auth-provider', 
          title: 'Github', 
          message: 'SignIn with Github', 
          apiRef: githubAuthApiRef
        },
        {id: 'microsoft-auth-provider',title: 'Microsoft',message: 'Sign in using SSO',apiRef: microsoftAuthApiRef}
      ]} 
      />
    ),
  },
  themes: [
    {
      id: 'light',
      title: 'Light',
      variant: 'light',
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={themes.light} children={children} />
      ),
    },
    {
      id: 'dark',
      title: 'Dark',
      variant: 'dark',
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={themes.dark} children={children} />
      ),
    },
    {
      id: 'aperture',
      title: 'Aperture',
      variant: 'light',
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={virginMoneyTheme} children={children} />
      ),
    },
  ],
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="home" />} />
    <Route path="/home" element={<HomePage />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/catalog-import"
      element={<CatalogImportPage />}
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    
    {/* Permission-protected critical plugin routes */}
    <Route 
      path="/tech-radar" 
      element={
        <PermissionAwareRoute permission={techRadarReadPermission}>
          <TechRadarPage />
        </PermissionAwareRoute>
      } 
    />
    <Route 
      path="/bazaar" 
      element={
        <PermissionAwareRoute permission={bazaarReadPermission}>
          <BazaarPage />
        </PermissionAwareRoute>
      } 
    />
    <Route 
      path="/copilot" 
      element={
        <PermissionAwareRoute permission={copilotReadPermission}>
          <CopilotIndexPage />
        </PermissionAwareRoute>
      } 
    />
    <Route 
      path="/ephemeralenvironments" 
      element={
        <PermissionAwareRoute permission={ephemeralEnvironmentsReadPermission}>
          <EphemeralenvironmentsPage />
        </PermissionAwareRoute>
      } 
    />
    <Route 
      path="/permissions/*" 
      element={
        <PermissionAwareRoute permission={permissionsReadPermission}>
          <PermissionPolicyPage />
        </PermissionAwareRoute>
      } 
    />
    
    {/* Regular plugin routes - typically safe for authenticated users */}
    <Route path="/jira-plugin" element={<JiraPluginPage />} />
    <Route path="/jenkins-insights" element={<JenkinsInsightsPage />} />
    <Route path="/github-repositories-contibutors" element={<GithubRepositoriesContibutorsPage />} />
    
    {/* Permission-protected trends routes */}
    <Route 
      path="/jira-trends" 
      element={
        <PermissionAwareRoute permission={jiraTrendsReadPermission}>
          <JiraTrendsPage />
        </PermissionAwareRoute>
      } 
    />
    <Route 
      path="/sourcecontrol-trends" 
      element={
        <PermissionAwareRoute permission={sourceControlTrendsReadPermission}>
          <SourceControlTrendsPage />
        </PermissionAwareRoute>
      } 
    />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
