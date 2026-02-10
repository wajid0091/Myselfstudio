
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, SettingsContextType } from '../types';

const defaultSettings: Settings = {
  enableTailwind: true,
  enableBootstrap: false,
  enableAdminPanel: false,
  enableSEO: false,
  enablePWA: false,
  enableFirebaseRules: false,
  enableCustomCursor: false,
  enableMobileResponsive: true,
  enableDesktopResponsive: true,
  customDomain: '',
  firebaseConfig: '',
  selectedModel: 'google/gemini-2.0-flash-001', 
  imgBBApiKey: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
     try {
         const savedGlobal = localStorage.getItem('wajid_ai_global_settings');
         if (savedGlobal) {
             const parsed = JSON.parse(savedGlobal);
             return { ...defaultSettings, ...parsed };
         }
     } catch (e) {
         console.error("Failed to load global settings", e);
     }
     return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        
        const globalToSave = {
            enableCustomCursor: updated.enableCustomCursor,
            selectedModel: updated.selectedModel,
            imgBBApiKey: updated.imgBBApiKey
        };
        
        localStorage.setItem('wajid_ai_global_settings', JSON.stringify(globalToSave));
        
        return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
