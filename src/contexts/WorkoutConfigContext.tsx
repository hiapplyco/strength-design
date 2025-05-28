
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Exercise } from '@/components/exercise-search/types';
import type { WeatherData } from '@/types/weather';

interface WorkoutConfig {
  fitnessLevel: string;
  selectedExercises: Exercise[];
  prescribedExercises: string;
  injuries: string;
  numberOfDays: number;
  numberOfCycles: number;
  weatherData: WeatherData | null;
  weatherPrompt: string;
}

interface WorkoutConfigContextType {
  config: WorkoutConfig;
  updateConfig: (updates: Partial<WorkoutConfig>) => void;
  clearConfig: () => void;
  getConfigSummary: () => string;
}

const defaultConfig: WorkoutConfig = {
  fitnessLevel: '',
  selectedExercises: [],
  prescribedExercises: '',
  injuries: '',
  numberOfDays: 7,
  numberOfCycles: 1,
  weatherData: null,
  weatherPrompt: ''
};

const WorkoutConfigContext = createContext<WorkoutConfigContextType | undefined>(undefined);

export const WorkoutConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WorkoutConfig>(defaultConfig);

  const updateConfig = useCallback((updates: Partial<WorkoutConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const clearConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const getConfigSummary = useCallback(() => {
    const parts = [];
    
    if (config.fitnessLevel) {
      parts.push(`Fitness Level: ${config.fitnessLevel}`);
    }
    
    if (config.selectedExercises.length > 0) {
      parts.push(`Equipment: ${config.selectedExercises.map(e => e.name).join(', ')}`);
    }
    
    if (config.prescribedExercises) {
      parts.push(`Goals: ${config.prescribedExercises.substring(0, 100)}${config.prescribedExercises.length > 100 ? '...' : ''}`);
    }
    
    if (config.injuries) {
      parts.push(`Limitations: ${config.injuries.substring(0, 100)}${config.injuries.length > 100 ? '...' : ''}`);
    }
    
    parts.push(`Schedule: ${config.numberOfCycles} cycle(s) of ${config.numberOfDays} days`);
    
    if (config.weatherData) {
      parts.push(`Weather: Included for ${config.weatherData.location || 'your location'}`);
    }
    
    return parts.length > 1 ? parts.join('\n') : 'No configuration set yet. Let me help you get started!';
  }, [config]);

  return (
    <WorkoutConfigContext.Provider value={{ config, updateConfig, clearConfig, getConfigSummary }}>
      {children}
    </WorkoutConfigContext.Provider>
  );
};

export const useWorkoutConfig = () => {
  const context = useContext(WorkoutConfigContext);
  if (!context) {
    throw new Error('useWorkoutConfig must be used within a WorkoutConfigProvider');
  }
  return context;
};
