
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, SettingsContextType, AIModel } from '../types';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';

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
  selectedModelId: 'gemini-3-flash-preview', // STRICT DEFAULT: Gemini 3 Flash Preview
  userGeminiModels: [],
  imgBBApiKey: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
     try {
         const savedGlobal = localStorage.getItem('wajid_ai_global_settings_v2');
         if (savedGlobal) {
             const parsed = JSON.parse(savedGlobal);
             // Force migration to Gemini 3 Flash Preview if old defaults are found
             if (
                 parsed.selectedModelId === 'default-gemini' || 
                 parsed.selectedModelId === 'gemini-2.0-flash-exp' || 
                 parsed.selectedModelId === 'gemini-2.0-flash-001'
             ) {
                 parsed.selectedModelId = 'gemini-3-flash-preview';
             }
             return { ...defaultSettings, ...parsed };
         }
     } catch (e) {
         console.error("Failed to load global settings", e);
     }
     return defaultSettings;
  });

  const [adminModels, setAdminModels] = useState<AIModel[]>([]);

  // Load Admin Models (OpenRouter) from Firebase
  useEffect(() => {
      const modelsRef = ref(db, 'system_settings/models');
      const unsub = onValue(modelsRef, (snapshot) => {
          if (snapshot.exists()) {
              const data = snapshot.val();
              const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                  id: key,
                  name: val.name,
                  modelId: val.modelId,
                  provider: 'openrouter' as const,
                  isCustom: false
              }));
              setAdminModels(list);
          } else {
              setAdminModels([]);
          }
      });
      return () => unsub();
  }, []);

  const saveToStorage = (newSettings: Settings) => {
      const globalToSave = {
          enableCustomCursor: newSettings.enableCustomCursor,
          selectedModelId: newSettings.selectedModelId,
          imgBBApiKey: newSettings.imgBBApiKey,
          userGeminiModels: newSettings.userGeminiModels
      };
      localStorage.setItem('wajid_ai_global_settings_v2', JSON.stringify(globalToSave));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        saveToStorage(updated);
        return updated;
    });
  };

  const addUserModel = (name: string, apiKey: string) => {
      const newModel: AIModel = {
          id: `custom-${Date.now()}`,
          name,
          apiKey,
          provider: 'gemini',
          modelId: 'gemini-3-flash-preview', // User custom keys also default to 3 Flash
          isCustom: true
      };
      const updatedModels = [...settings.userGeminiModels, newModel];
      const updatedSettings = { ...settings, userGeminiModels: updatedModels, selectedModelId: newModel.id };
      setSettings(updatedSettings);
      saveToStorage(updatedSettings);
  };

  const removeUserModel = (id: string) => {
      const updatedModels = settings.userGeminiModels.filter(m => m.id !== id);
      const isCurrent = settings.selectedModelId === id;
      const updatedSettings = { 
          ...settings, 
          userGeminiModels: updatedModels,
          selectedModelId: isCurrent ? 'gemini-3-flash-preview' : settings.selectedModelId
      };
      setSettings(updatedSettings);
      saveToStorage(updatedSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, adminModels, updateSettings, addUserModel, removeUserModel }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
