
export interface Exercise {
  id: string;
  name: string;
  level?: string;
  equipment?: string;
  instructions?: string[];
  images?: string[];
  type?: string;
  muscle?: string;
  difficulty?: string;
  mechanic?: string;
  force?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}
