import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress 
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Permission } from '@backstage/plugin-permission-common';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

const useStyles = makeStyles((theme) => ({
  loadingCard: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  accessDeniedCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: theme.spacing(3),
    textAlign: 'center',
  },
  accessDeniedIcon: {
    fontSize: '3rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  accessDeniedText: {
    color: theme.palette.text.secondary,
  },
}));

interface PermissionWrapperProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideOnDeny?: boolean;
  showAccessDenied?: boolean;
}

/**
 * Wrapper component that checks permissions before rendering children
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permission,
  children,
  fallback,
  hideOnDeny = true, // Changed default to true
  showAccessDenied = false, // New prop to explicitly show access denied messages
}) => {
  const classes = useStyles();
  const { hasPermission, loading } = usePermissionCheck(permission);

  // Show loading state
  if (loading) {
    return (
      <Card className={classes.loadingCard}>
        <CircularProgress />
      </Card>
    );
  }

  // Hide completely if no permission and hideOnDeny is true (default behavior)
  if (!hasPermission && hideOnDeny) {
    return null;
  }

  // Show access denied message only if explicitly requested
  if (!hasPermission && showAccessDenied) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className={classes.accessDeniedCard}>
        <CardContent>
          <Box className={classes.accessDeniedIcon}>
            🔒
          </Box>
          <Typography variant="h6" className={classes.accessDeniedText}>
            Access Restricted
          </Typography>
          <Typography variant="body2" className={classes.accessDeniedText}>
            You don't have permission to view this content.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // If no permission and not showing access denied, return null (hide completely)
  if (!hasPermission) {
    return null;
  }

  // Render children if permission is granted
  return <>{children}</>;
};
