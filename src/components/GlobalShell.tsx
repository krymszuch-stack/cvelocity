import React from 'react';
import { Shell, ShellProps } from './layout/Shell';

export type NavTabId =
  | 'home'
  | 'matcher'
  | 'vault'
  | 'parser'
  | 'profiler'
  | 'pricing'
  | 'applications';

export type GlobalShellProps = ShellProps;

export const GlobalShell: React.FC<GlobalShellProps> = (props) => {
  return <Shell {...props} />;
};

export { Shell } from './layout/Shell';
export { Sidebar } from './layout/Sidebar';
export { Topbar } from './layout/Topbar';
export { NavItem } from './layout/NavItem';
