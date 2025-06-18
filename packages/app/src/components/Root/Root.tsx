import { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import TrackChangesIcon from '@material-ui/icons/TrackChanges';
import StorefrontIcon from '@material-ui/icons/Storefront'; // Icon for Bazaar
import CodeIcon from '@material-ui/icons/Code'; // Icon for Copilot
import CloudIcon from '@material-ui/icons/Cloud'; // Icon for Terraform Environments
import SecurityIcon from '@material-ui/icons/Security'; // Icon for Permissions
import AssessmentIcon from '@material-ui/icons/Assessment'; // Icon for Metrics
import TrendingUpIcon from '@material-ui/icons/TrendingUp'; // Icon for Source Control Trends
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import GroupIcon from '@material-ui/icons/People';
import { PermissionAwareSidebarItem } from '../common/PermissionAwareSidebarItem';
import {
  ephemeralEnvironmentsReadPermission,
  permissionsReadPermission,
  bazaarReadPermission,
  copilotReadPermission,
  techRadarReadPermission,
  jiraTrendsReadPermission,
  sourceControlTrendsReadPermission,
} from '../../permissions/permissions';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <SidebarSearchModal />
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MenuIcon />}>
          {/* Global nav, not org-specific */}
          <SidebarItem icon={HomeIcon} to="home" text="Home" />
          <SidebarItem icon={ExtensionIcon} to="catalog" text="Catalog" />
          
          <MyGroupsSidebarItem
            singularTitle="My Group"
            pluralTitle="My Groups"
            icon={GroupIcon}
          />
          <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
          <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
          
          {/* Permission-protected critical plugins */}
          <PermissionAwareSidebarItem 
            permission={ephemeralEnvironmentsReadPermission} 
            icon={CloudIcon} 
            to="ephemeralenvironments" 
            text="Environments" 
          />
          <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
          <PermissionAwareSidebarItem 
            permission={permissionsReadPermission} 
            icon={SecurityIcon} 
            to="permissions" 
            text="Permissions" 
          />
          
          {/* Divider to separate the tool items */}
          <SidebarDivider />
          
          {/* Permission-protected metrics section */}
          <PermissionAwareSidebarItem 
            permission={jiraTrendsReadPermission} 
            icon={AssessmentIcon} 
            to="jira-trends" 
            text="Jira Metrics" 
          />
          <PermissionAwareSidebarItem 
            permission={sourceControlTrendsReadPermission} 
            icon={TrendingUpIcon} 
            to="sourcecontrol-trends" 
            text="Source Control" 
          />
          
          {/* Permission-protected grouped tools */}
          <PermissionAwareSidebarItem 
            permission={techRadarReadPermission} 
            icon={TrackChangesIcon} 
            to="tech-radar" 
            text="Tech Radar" 
          />
          <PermissionAwareSidebarItem 
            permission={bazaarReadPermission} 
            icon={StorefrontIcon} 
            to="bazaar" 
            text="Bazaar" 
          />
          <PermissionAwareSidebarItem 
            permission={copilotReadPermission} 
            icon={CodeIcon} 
            to="copilot" 
            text="Copilot" 
          />
          
          {/* End global nav */}
          <SidebarDivider />
          <SidebarScrollWrapper>
            {/* Items in this group will be scrollable if they run out of space */}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
      </Sidebar>
      {children}
    </SidebarPage>
  );
};
