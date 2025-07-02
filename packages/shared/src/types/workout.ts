export interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  duration?: string
  tempo?: string
  rir?: string
}

export interface WorkoutDay {
  day: string
  exercises: Exercise[]
  focus?: string
  duration?: string
  notes?: string
}

export interface WorkoutPlan {
  id?: string
  title: string
  description?: string
  days: WorkoutDay[]
  created_at?: string
  user_id?: string
}

export interface WorkoutSession {
  id: string
  workout_id: string
  user_id: string
  started_at: string
  completed_at?: string
  exercises_completed: number
  total_exercises: number
  notes?: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  title: string
  description?: string
  is_public: boolean
  content: WorkoutPlan
  created_at: string
  updated_at: string
}