
-- Create nutrition diary related tables
CREATE TABLE public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT NOT NULL,
  serving_unit TEXT NOT NULL,
  calories_per_serving NUMERIC NOT NULL,
  protein_per_serving NUMERIC NOT NULL DEFAULT 0,
  carbs_per_serving NUMERIC NOT NULL DEFAULT 0,
  fat_per_serving NUMERIC NOT NULL DEFAULT 0,
  fiber_per_serving NUMERIC DEFAULT 0,
  sugar_per_serving NUMERIC DEFAULT 0,
  sodium_per_serving NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition targets table for user preferences
CREATE TABLE public.nutrition_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  daily_calories NUMERIC NOT NULL DEFAULT 2000,
  daily_protein NUMERIC NOT NULL DEFAULT 150,
  daily_carbs NUMERIC NOT NULL DEFAULT 250,
  daily_fat NUMERIC NOT NULL DEFAULT 65,
  daily_water_ml NUMERIC NOT NULL DEFAULT 2000,
  macro_method TEXT NOT NULL DEFAULT 'ratios',
  protein_ratio NUMERIC DEFAULT 0.3,
  carbs_ratio NUMERIC DEFAULT 0.4,
  fat_ratio NUMERIC DEFAULT 0.3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create daily nutrition logs
CREATE TABLE public.nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  water_consumed_ml NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create meal entries
CREATE TABLE public.meal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutrition_log_id UUID REFERENCES public.nutrition_logs(id) ON DELETE CASCADE NOT NULL,
  food_item_id UUID REFERENCES public.food_items(id) NOT NULL,
  meal_group TEXT NOT NULL DEFAULT 'meal 1',
  amount NUMERIC NOT NULL DEFAULT 1,
  serving_multiplier NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nutrition_targets
CREATE POLICY "Users can view their own nutrition targets" 
  ON public.nutrition_targets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition targets" 
  ON public.nutrition_targets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition targets" 
  ON public.nutrition_targets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for nutrition_logs
CREATE POLICY "Users can view their own nutrition logs" 
  ON public.nutrition_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition logs" 
  ON public.nutrition_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs" 
  ON public.nutrition_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for meal_entries (via nutrition_logs)
CREATE POLICY "Users can view their own meal entries" 
  ON public.meal_entries 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = meal_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own meal entries" 
  ON public.meal_entries 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = meal_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own meal entries" 
  ON public.meal_entries 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = meal_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own meal entries" 
  ON public.meal_entries 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_logs 
    WHERE nutrition_logs.id = meal_entries.nutrition_log_id 
    AND nutrition_logs.user_id = auth.uid()
  ));

-- Food items are public for all authenticated users
CREATE POLICY "Authenticated users can view food items" 
  ON public.food_items 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Insert some sample food items
INSERT INTO public.food_items (name, brand, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving) VALUES
('White Rice', 'Generic', '100', 'g', 130, 2.7, 28, 0.3, 0.4),
('Chicken Breast', 'Generic', '100', 'g', 165, 31, 0, 3.6, 0),
('Banana', 'Generic', '1', 'medium', 105, 1.3, 27, 0.4, 3.1),
('Oatmeal', 'Generic', '40', 'g', 150, 5, 27, 3, 4),
('Greek Yogurt', 'Generic', '170', 'g', 100, 17, 6, 0, 0),
('Almonds', 'Generic', '28', 'g', 160, 6, 6, 14, 3.5),
('Broccoli', 'Generic', '100', 'g', 34, 2.8, 7, 0.4, 2.6),
('Salmon', 'Generic', '100', 'g', 208, 25, 0, 12, 0),
('Sweet Potato', 'Generic', '100', 'g', 86, 1.6, 20, 0.1, 3);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nutrition_targets_updated_at BEFORE UPDATE ON public.nutrition_targets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON public.nutrition_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
