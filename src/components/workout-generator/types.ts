import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";

export interface ConfigSectionProps {
  title: string;
  content: string;
  capitalize?: boolean;
}

export interface ConfigurationSummaryProps {
  numberOfDays: number;
  numberOfCycles: number;
  fitnessLevel: string;
  selectedExercises: Exercise[];
  prescribedExercises: string;
  injuries: string;
  weatherData: WeatherData | null | string;
}

export interface GenerateSectionProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  renderTooltip?: () => React.ReactNode;
  isValid: boolean;
  numberOfDays?: number;
  numberOfCycles?: number;
  selectedExercises?: Exercise[];
  fitnessLevel?: string;
  prescribedExercises?: string;
  injuries?: string;
  weatherData?: WeatherData | null | string;
}

export interface DaysSelectionCardProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  renderTooltip?: () => React.ReactNode;
}
