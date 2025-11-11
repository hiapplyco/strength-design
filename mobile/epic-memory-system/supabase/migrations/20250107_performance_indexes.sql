-- Performance indexes and RLS fixes for Supabase
-- Addresses the critical performance issues identified

-- 1. FIX NUTRITION_SETTINGS RLS
-- This addresses the 30,000+ request loop issue

-- Enable RLS
ALTER TABLE public.nutrition_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own nutrition settings" ON public.nutrition_settings;
DROP POLICY IF EXISTS "Users can insert own nutrition settings" ON public.nutrition_settings;
DROP POLICY IF EXISTS "Users can update own nutrition settings" ON public.nutrition_settings;
DROP POLICY IF EXISTS "Users can delete own nutrition settings" ON public.nutrition_settings;

CREATE POLICY "Users can view own nutrition settings" 
ON public.nutrition_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition settings" 
ON public.nutrition_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition settings" 
ON public.nutrition_settings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition settings" 
ON public.nutrition_settings FOR DELETE 
USING (auth.uid() = user_id);

-- 2. ADD CRITICAL PERFORMANCE INDEXES

-- Nutrition settings - most critical due to loop issue
CREATE INDEX IF NOT EXISTS idx_nutrition_settings_user_id 
ON public.nutrition_settings(user_id);

-- Workouts - frequently queried
CREATE INDEX IF NOT EXISTS idx_workouts_user_day 
ON public.workouts(user_id, day);

CREATE INDEX IF NOT EXISTS idx_workouts_created_at 
ON public.workouts(created_at DESC);

-- Journal entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date 
ON public.journal_entries(user_id, date);

-- Workout sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_scheduled 
ON public.workout_sessions(user_id, scheduled_date);

-- Nutrition logs
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date 
ON public.nutrition_logs(user_id, date);

-- Generated workouts
CREATE INDEX IF NOT EXISTS idx_generated_workouts_user_created 
ON public.generated_workouts(user_id, generated_at);