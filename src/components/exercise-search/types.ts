
export interface Exercise {
  id: string; // Changed from optional to required
  name: string;
  level: string;
  instructions: string[];
  images?: string[];
}
