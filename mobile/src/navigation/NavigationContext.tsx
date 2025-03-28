import React, { createContext, useContext, useState, ReactNode } from 'react';

type Route = {
  name: string;
  params?: Record<string, any>;
};

interface NavigationContextType {
  currentRoute: Route;
  history: Route[];
  navigate: (routeName: string, params?: Record<string, any>) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  resetTo: (routeName: string, params?: Record<string, any>) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  currentRoute: { name: 'Login' },
  history: [],
  navigate: () => {},
  goBack: () => {},
  canGoBack: () => false,
  resetTo: () => {},
});

export const NavigationProvider: React.FC<{ 
  children: ReactNode;
  initialRoute?: string;
}> = ({ children, initialRoute = 'Login' }) => {
  const [history, setHistory] = useState<Route[]>([{ name: initialRoute }]);

  const navigate = (routeName: string, params?: Record<string, any>) => {
    setHistory(prev => [...prev, { name: routeName, params }]);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, prev.length - 1));
    }
  };

  const canGoBack = () => {
    return history.length > 1;
  };

  const resetTo = (routeName: string, params?: Record<string, any>) => {
    setHistory([{ name: routeName, params }]);
  };

  const value = {
    currentRoute: history[history.length - 1],
    history,
    navigate,
    goBack,
    canGoBack,
    resetTo,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};

export const useRoute = () => {
  const { currentRoute } = useNavigation();
  return currentRoute;
};