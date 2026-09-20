import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

export interface RouterContextType {
  location: RouterLocation;
  navigate: (to: string) => void;
}

function parseHashLocation(): RouterLocation {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }
  const rawHash = window.location.hash || '';
  const cleanHash = rawHash.replace(/^#/, '');
  const [pathnamePart, searchPart] = cleanHash.split('?');
  const pathname = pathnamePart ? (pathnamePart.startsWith('/') ? pathnamePart : `/${pathnamePart}`) : '/';
  const search = searchPart ? `?${searchPart}` : '';

  return {
    pathname,
    search,
    hash: rawHash,
  };
}

const RouterContext = createContext<RouterContextType>({
  location: { pathname: '/', search: '', hash: '' },
  navigate: () => {},
});

export function HashRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<RouterLocation>(parseHashLocation);

  useEffect(() => {
    const handleHashChange = () => {
      setLocation(parseHashLocation());
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    const cleanTo = to.startsWith('/') ? to : `/${to}`;
    if (window.location.hash !== `#${cleanTo}`) {
      window.location.hash = cleanTo;
    }
  }, []);

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useLocation(): RouterLocation {
  return useContext(RouterContext).location;
}

export function useNavigate(): (to: string) => void {
  return useContext(RouterContext).navigate;
}
