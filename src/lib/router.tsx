import React, { type ReactNode } from 'react';
import {
  HashRouter as RRDHashRouter,
  useLocation as RRDLocation,
  useNavigate as RRDNavigate,
  type Location as RRDLocationType,
} from 'react-router-dom';

export interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

export function HashRouter({ children }: { children: ReactNode }) {
  return <RRDHashRouter>{children}</RRDHashRouter>;
}

export function useLocation(): RouterLocation {
  const loc: RRDLocationType = RRDLocation();
  return {
    pathname: loc.pathname,
    search: loc.search,
    hash: loc.hash,
  };
}

export function useNavigate(): (to: string) => void {
  const nav = RRDNavigate();
  return (to: string) => {
    nav(to);
  };
}
