import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Button,
  makeStyles 
} from '@material-ui/core';
import { Permission } from '@backstage/plugin-permission-common';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  accessDeniedContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
    padding: theme.spacing(3),
  },
  accessDeniedCard: {
    maxWidth: 600,
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  icon: {
    fontSize: '4rem',
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
  title: {
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
  },
  homeButton: {
    marginTop: theme.spacing(2),
  },
}));

interface PermissionAwareRouteProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Permission-aware route wrapper that blocks access to restricted routes
 */
export const PermissionAwareRoute: React.FC<PermissionAwareRouteProps> = ({
  permission,
  children,
  fallback,
}) => {
  const classes = useStyles();
  const { hasPermission, loading } = usePermissionCheck(permission);

  // Show loading state
  if (loading) {
    return (
      <Box className={classes.accessDeniedContainer}>
        <Card className={classes.accessDeniedCard}>
          <CardContent>
            <Typography variant="h6">
              Checking permissions...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Show access denied if no permission
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box className={classes.accessDeniedContainer}>
        <Card className={classes.accessDeniedCard}>
          <CardContent>
            <Box className={classes.icon}>
              🔒
            </Box>
            <Typography variant="h4" className={classes.title}>
              Access Restricted
            </Typography>
            <Typography variant="body1" className={classes.description}>
              You don't have permission to access this page. This page is restricted to authorized users only.
            </Typography>
            <Typography variant="body2" className={classes.description}>
              Permission required: <strong>{permission.name}</strong>
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/home"
              className={classes.homeButton}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
};
