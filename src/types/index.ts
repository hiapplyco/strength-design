
// Base types
export interface AnalysisResult {
  analysis: string;
  error?: string;
}

export interface VideoAnalysisRequest {
  videoUrl: string;
  userPrompt?: string;
}

export interface VideoAnalysisResponse {
  result: string;
  error?: string;
}

export interface UploadResponse {
  url: string;
  error?: string;
}

export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

// Authentication related types
export interface AuthState {
  isAuthenticated: boolean;
  user: any; // Replace with proper user type if available
  loading: boolean;
  error?: string;
}

// Exercise related types kept from existing file
export interface Exercise {
  name: string;
  level: string;
  instructions: string[];
  images?: string[];
}

// Weather data types kept from existing types
export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  weatherCode: number;
  forecast?: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    weatherCodes: number[];
    precipitationProb: number[];
  };
}

