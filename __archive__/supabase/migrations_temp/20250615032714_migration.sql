
-- Create journal_entries table for daily journal entries
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  content TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_sessions table for tracking actual workout completions
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  generated_workout_id UUID REFERENCES public.generated_workouts,
  journal_entry_id UUID REFERENCES public.journal_entries,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped', 'modified')),
  actual_duration_minutes INTEGER,
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
  notes TEXT,
  modifications_made TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_insights table for storing AI-generated insights
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pre_workout', 'post_workout', 'weekly_summary', 'progress_analysis', 'recommendation')),
  related_workout_session_id UUID REFERENCES public.workout_sessions,
  related_journal_entry_id UUID REFERENCES public.journal_entries,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  action_required BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_metrics table for detailed exercise tracking
CREATE TABLE public.workout_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID REFERENCES public.workout_sessions NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used DECIMAL(6,2),
  rest_time_seconds INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  form_rating INTEGER CHECK (form_rating >= 1 AND form_rating <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to generated_workouts table
ALTER TABLE public.generated_workouts
ADD COLUMN scheduled_date DATE,
ADD COLUMN estimated_duration_minutes INTEGER,
ADD COLUMN difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
ADD COLUMN target_muscle_groups TEXT[],
ADD COLUMN equipment_needed TEXT[];

-- Enable Row Level Security on all new tables
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_insights
CREATE POLICY "Users can view their own AI insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_metrics
CREATE POLICY "Users can view their own workout metrics" ON public.workout_metrics FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id)
);
CREATE POLICY "Users can create their own workout metrics" ON public.workout_metrics FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id)
);
CREATE POLICY "Users can update their own workout metrics" ON public.workout_metrics FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id)
);
CREATE POLICY "Users can delete their own workout metrics" ON public.workout_metrics FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id)
);

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_user_date ON public.journal_entries(user_id, date);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, scheduled_date);
CREATE INDEX idx_workout_sessions_status ON public.workout_sessions(status);
CREATE INDEX idx_ai_insights_user_type ON public.ai_insights(user_id, insight_type);
CREATE INDEX idx_ai_insights_unread ON public.ai_insights(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_workout_metrics_session ON public.workout_metrics(workout_session_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
