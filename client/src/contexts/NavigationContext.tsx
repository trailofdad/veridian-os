"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  showAIInsights: boolean;
  setShowAIInsights: (show: boolean) => void;
  openAIInsights: () => void;
  closeAIInsights: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [showAIInsights, setShowAIInsights] = useState(false);

  const openAIInsights = () => setShowAIInsights(true);
  const closeAIInsights = () => setShowAIInsights(false);

  const value = {
    showAIInsights,
    setShowAIInsights,
    openAIInsights,
    closeAIInsights,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
