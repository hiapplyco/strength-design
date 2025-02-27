
import type { Exercise } from "../exercise-search/types";

export interface ConfigSectionProps {
  title: string;
  content: string;
  capitalize?: boolean;
}

export interface ConfigurationSummaryProps {
  numberOfDays: number;
  fitnessLevel: string;
  selectedExercises: Exercise[];
  prescribedExercises: string;
  injuries: string;
  weatherData: string;
}

export interface WeatherLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}
