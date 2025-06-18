import React from 'react';
import { SidebarItem } from '@backstage/core-components';
import { Permission } from '@backstage/plugin-permission-common';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

interface PermissionAwareSidebarItemProps {
  permission: Permission;
  icon: React.ComponentType<any>;
  to: string;
  text: string;
  hideOnDeny?: boolean;
}

/**
 * Permission-aware sidebar item that only shows if user has permission
 */
export const PermissionAwareSidebarItem: React.FC<PermissionAwareSidebarItemProps> = ({
  permission,
  icon,
  to,
  text,
  hideOnDeny = true,
}) => {
  const { hasPermission, loading } = usePermissionCheck(permission);

  // Hide loading state for sidebar items
  if (loading) {
    return null;
  }

  // Hide item if no permission and hideOnDeny is true
  if (!hasPermission && hideOnDeny) {
    return null;
  }

  return (
    <SidebarItem 
      icon={icon} 
      to={to} 
      text={text}
    />
  );
};
