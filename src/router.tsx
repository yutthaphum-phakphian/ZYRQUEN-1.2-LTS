import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface Location {
  pathname: string;
  search: string;
  hash: string;
}

export interface RouterContextType {
  location: Location;
  navigate: (to: string) => void;
}

const parseHashLocation = (): Location => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }
  const rawHash = window.location.hash.replace(/^#/, '').trim();
  if (!rawHash) {
    return { pathname: '/', search: '', hash: '' };
  }
  const [pathAndQuery, hashPart = ''] = rawHash.split('#');
  const [pathPart, queryPart = ''] = pathAndQuery.split('?');
  const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return {
    pathname: cleanPath,
    search: queryPart ? `?${queryPart}` : '',
    hash: hashPart ? `#${hashPart}` : '',
  };
};

const RouterContext = createContext<RouterContextType>({
  location: { pathname: '/', search: '', hash: '' },
  navigate: () => {},
});

export interface HashRouterProps {
  children: React.ReactNode;
}

export function HashRouter({ children }: HashRouterProps) {
  const [location, setLocation] = useState<Location>(parseHashLocation);

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
    if (typeof window !== 'undefined') {
      const currentTarget = window.location.hash.replace(/^#/, '');
      if (currentTarget !== cleanTo) {
        window.location.hash = cleanTo;
      }
    }
    setLocation(parseHashLocation());
  }, []);

  const value = useMemo(() => ({
    location,
    navigate,
  }), [location, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export function useLocation(): Location {
  return useContext(RouterContext).location;
}

export function useNavigate(): (to: string) => void {
  return useContext(RouterContext).navigate;
}
