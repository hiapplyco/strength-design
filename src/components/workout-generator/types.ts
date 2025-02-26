
import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";

export interface ActionButtonsProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  isValid: boolean;
}

export interface DaysSelectionCardProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  renderTooltip: () => React.ReactNode;
}

export interface ConfigurationSummaryProps {
  numberOfDays: number;
  fitnessLevel: string;
  selectedExercises: Exercise[];
  prescribedExercises: string;
  injuries: string;
  weatherData?: WeatherData;
}

export interface ConfigSectionProps {
  title: string;
  content: string;
  capitalize?: boolean;
}

export interface GenerateSectionProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  renderTooltip: () => React.ReactNode;
  isValid: boolean;
  selectedExercises?: Exercise[];
  fitnessLevel?: string;
  prescribedExercises?: string;
  injuries?: string;
  numberOfDays?: number;
  setNumberOfDays: (value: number) => void;
  weatherData?: WeatherData;
}

