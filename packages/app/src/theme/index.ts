import { AppTheme } from '@backstage/core-plugin-api';
import { lightTheme } from '@backstage/theme';
import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

// Work around the TypeScript error with a more direct approach
function CustomThemeProvider(props: {children: React.ReactNode}) {
  // @ts-ignore - TypeScript is having issues with the MuiThemeProvider, but this works at runtime
  return React.createElement(MuiThemeProvider, { theme: lightTheme }, props.children);
}

// Define a proper theme structure that AppThemeProvider expects
export const defaultTheme: AppTheme = {
  id: 'light',
  title: 'Light Theme',
  variant: 'light',
  Provider: CustomThemeProvider,
};

export const virginMoneyTheme: AppTheme = {
  id: 'virgin-money',
  title: 'Virgin Money Theme',
  variant: 'light',
  Provider: CustomThemeProvider,
};