import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
  currentScreen: string;
  navigate: (screen: string, params?: Record<string, any>) => void;
  goBack: () => void;
  navigationHistory: string[];
  params: Record<string, any>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  initialScreen?: string;
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  initialScreen = 'Home',
  children 
}) => {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initialScreen]);
  const [params, setParams] = useState<Record<string, any>>({});
  
  // Reset history when initial screen changes (useful for auth state changes)
  useEffect(() => {
    setCurrentScreen(initialScreen);
    setNavigationHistory([initialScreen]);
    setParams({});
  }, [initialScreen]);

  const navigate = (screen: string, newParams: Record<string, any> = {}) => {
    setCurrentScreen(screen);
    setParams(newParams);
    
    // Add to navigation history
    setNavigationHistory(prev => [...prev, screen]);
  };

  const goBack = () => {
    if (navigationHistory.length <= 1) {
      return; // Can't go back if there's only one screen in history
    }
    
    // Remove current screen from history
    const newHistory = [...navigationHistory];
    newHistory.pop(); // Remove current screen
    
    // Get the previous screen
    const previousScreen = newHistory[newHistory.length - 1];
    
    setCurrentScreen(previousScreen);
    setNavigationHistory(newHistory);
    setParams({}); // Reset params when going back
  };

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        navigate,
        goBack,
        navigationHistory,
        params
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};