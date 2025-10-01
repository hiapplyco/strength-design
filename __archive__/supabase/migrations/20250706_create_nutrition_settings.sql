-- Create nutrition_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Macro targets
  target_calories INTEGER DEFAULT 2000,
  target_protein INTEGER DEFAULT 150,
  target_carbs INTEGER DEFAULT 250,
  target_fat INTEGER DEFAULT 65,
  target_fiber INTEGER DEFAULT 25,
  target_sugar INTEGER DEFAULT 50,
  target_sodium INTEGER DEFAULT 2300,
  target_cholesterol INTEGER DEFAULT 300,
  target_saturated_fat INTEGER DEFAULT 20,
  target_water_ml INTEGER DEFAULT 2000,
  
  -- Custom macro targets (for additional nutrients)
  custom_targets JSONB DEFAULT '{}',
  
  -- Health integrations
  integrations JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one settings row per user
  UNIQUE(user_id)
);

-- Create storage bucket for nutrition plan uploads (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutrition-uploads',
  'nutrition-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.nutrition_settings ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_settings' 
        AND policyname = 'Users can view their own nutrition settings'
    ) THEN
        CREATE POLICY "Users can view their own nutrition settings"
        ON public.nutrition_settings FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_settings' 
        AND policyname = 'Users can insert their own nutrition settings'
    ) THEN
        CREATE POLICY "Users can insert their own nutrition settings"
        ON public.nutrition_settings FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_settings' 
        AND policyname = 'Users can update their own nutrition settings'
    ) THEN
        CREATE POLICY "Users can update their own nutrition settings"
        ON public.nutrition_settings FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_settings' 
        AND policyname = 'Users can delete their own nutrition settings'
    ) THEN
        CREATE POLICY "Users can delete their own nutrition settings"
        ON public.nutrition_settings FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Storage policies for nutrition uploads
DO $$
BEGIN
    -- Check if bucket exists before creating policies
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'nutrition-uploads') THEN
        -- Only create policies if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = 'Users can upload their own nutrition files'
        ) THEN
            CREATE POLICY "Users can upload their own nutrition files"
            ON storage.objects FOR INSERT
            WITH CHECK (
              bucket_id = 'nutrition-uploads' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = 'Users can view their own nutrition files'
        ) THEN
            CREATE POLICY "Users can view their own nutrition files"
            ON storage.objects FOR SELECT
            USING (
              bucket_id = 'nutrition-uploads' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND policyname = 'Users can delete their own nutrition files'
        ) THEN
            CREATE POLICY "Users can delete their own nutrition files"
            ON storage.objects FOR DELETE
            USING (
              bucket_id = 'nutrition-uploads' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
        END IF;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutrition_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_nutrition_settings_updated_at'
    ) THEN
        CREATE TRIGGER update_nutrition_settings_updated_at
        BEFORE UPDATE ON public.nutrition_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_nutrition_settings_updated_at();
    END IF;
END $$;