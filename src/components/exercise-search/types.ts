
export interface Exercise {
  id: string;
  name: string;
  video_url?: string;
  images?: string[];
  instructions?: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  type: string[];
  mechanics_type: string[];
}
