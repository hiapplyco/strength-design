
-- Only create the INSERT policy for food_items (SELECT policy already exists)
CREATE POLICY "Authenticated users can insert food items" 
  ON public.food_items 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create exercise_entries table to track exercises in nutrition logs
CREATE TABLE public.exercise_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutrition_log_id UUID REFERENCES public.nutrition_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  meal_group TEXT NOT NULL DEFAULT 'meal 1',
  workout_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for exercise_entries
ALTER TABLE public.exercise_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_entries (via nutrition_logs)
CREATE POLICY "Users can view their own exercise entries" 
  ON public.exercise_entries 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = exercise_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own exercise entries" 
  ON public.exercise_entries 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = exercise_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own exercise entries" 
  ON public.exercise_entries 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = exercise_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own exercise entries" 
  ON public.exercise_entries 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = exercise_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));
