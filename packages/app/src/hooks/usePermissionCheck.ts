import { useApi } from '@backstage/core-plugin-api';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { useEffect, useState } from 'react';
import { Permission } from '@backstage/plugin-permission-common';

/**
 * Hook to check if the current user has permission for a specific action
 */
export const usePermissionCheck = (permission: Permission) => {
  const permissionApi = useApi(permissionApiRef);
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const result = await permissionApi.authorize({
          permission,
        });
        
        setHasPermission(result.result === 'ALLOW');
      } catch (error) {
        console.error(`Permission check failed for ${permission.name}:`, error);
        // Default to deny access on error
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permissionApi, permission]);

  return { hasPermission, loading };
};

/**
 * Hook to check multiple permissions at once
 */
export const useMultiplePermissionCheck = (permissions: Permission[]) => {
  const permissionApi = useApi(permissionApiRef);
  const [permissionResults, setPermissionResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          permissions.map(async (permission) => {
            try {
              const result = await permissionApi.authorize({ permission });
              return { 
                name: permission.name, 
                allowed: result.result === 'ALLOW' 
              };
            } catch (error) {
              console.error(`Permission check failed for ${permission.name}:`, error);
              return { 
                name: permission.name, 
                allowed: false 
              };
            }
          })
        );

        const resultMap = results.reduce((acc, { name, allowed }) => {
          acc[name] = allowed;
          return acc;
        }, {} as Record<string, boolean>);

        setPermissionResults(resultMap);
      } finally {
        setLoading(false);
      }
    };

    if (permissions.length > 0) {
      checkPermissions();
    } else {
      setLoading(false);
    }
  }, [permissionApi, permissions]);

  return { permissionResults, loading };
};
