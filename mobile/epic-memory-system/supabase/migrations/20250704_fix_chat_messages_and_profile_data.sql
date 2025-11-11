-- Fix existing chat_messages table and add new tables

-- First, create chat_sessions table if it doesn't exist (needed for foreign key)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'workout', 'nutrition', 'wellness', 'general'
  
  -- Session metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  
  -- Uploaded files in this session
  uploaded_files JSONB DEFAULT '[]', -- Array of file references
  
  -- Extracted profile data from this session
  extracted_profile_data JSONB DEFAULT '{}',
  extracted_nutrition_data JSONB DEFAULT '{}',
  extracted_workout_data JSONB DEFAULT '{}',
  
  -- Session summary
  ai_summary TEXT,
  key_insights TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Then, check if chat_messages exists and add missing columns
DO $$ 
BEGIN
    -- Add session_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'session_id'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE;
    END IF;

    -- Add attachments column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN attachments JSONB DEFAULT '[]';
    END IF;

    -- Add extracted_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'extracted_data'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN extracted_data JSONB DEFAULT '{}';
    END IF;

    -- Add tokens_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'tokens_used'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN tokens_used INTEGER;
    END IF;

    -- Add model_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'model_used'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN model_used TEXT;
    END IF;
END $$;

-- Create user fitness profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_fitness_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic profile info
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  
  -- Fitness goals
  primary_goal TEXT,
  secondary_goals TEXT[],
  target_weight_kg DECIMAL(5,2),
  target_date DATE,
  
  -- Training preferences
  training_experience TEXT CHECK (training_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  preferred_training_days INTEGER CHECK (preferred_training_days BETWEEN 1 AND 7),
  preferred_workout_duration INTEGER, -- in minutes
  preferred_training_time TEXT CHECK (preferred_training_time IN ('morning', 'afternoon', 'evening', 'flexible')),
  
  -- Medical and restrictions
  injuries TEXT[],
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  dietary_restrictions TEXT[],
  
  -- Equipment access
  gym_access BOOLEAN DEFAULT false,
  home_equipment TEXT[],
  
  -- Extracted data from conversations/files
  chat_extracted_data JSONB DEFAULT '{}',
  file_extracted_data JSONB DEFAULT '{}',
  
  -- AI-generated insights
  ai_recommendations JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);


-- Create file uploads tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  
  -- Processing status
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  
  -- Extracted data
  extracted_data JSONB DEFAULT '{}',
  data_type TEXT, -- 'workout', 'nutrition', 'medical', 'progress_photo', etc.
  
  -- AI analysis
  ai_analysis TEXT,
  key_insights TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nutrition plan analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nutrition_plan_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_upload_id UUID REFERENCES public.user_file_uploads(id) ON DELETE CASCADE,
  
  -- File reference
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Parsed data
  analysis JSONB NOT NULL,
  raw_analysis TEXT,
  
  -- Applied to profile
  applied_to_profile BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_fitness_profiles_user_id ON public.user_fitness_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_type ON public.chat_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_file_uploads_user_id ON public.user_file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_uploads_session_id ON public.user_file_uploads(session_id);

-- Enable RLS (if not already enabled)
DO $$ 
BEGIN
    ALTER TABLE public.user_fitness_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_file_uploads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.nutrition_plan_analyses ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- RLS Policies (CREATE IF NOT EXISTS)
DO $$
BEGIN
    -- user_fitness_profiles policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_fitness_profiles' 
        AND policyname = 'Users can view their own fitness profile'
    ) THEN
        CREATE POLICY "Users can view their own fitness profile"
        ON public.user_fitness_profiles FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_fitness_profiles' 
        AND policyname = 'Users can insert their own fitness profile'
    ) THEN
        CREATE POLICY "Users can insert their own fitness profile"
        ON public.user_fitness_profiles FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_fitness_profiles' 
        AND policyname = 'Users can update their own fitness profile'
    ) THEN
        CREATE POLICY "Users can update their own fitness profile"
        ON public.user_fitness_profiles FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- chat_sessions policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_sessions' 
        AND policyname = 'Users can view their own chat sessions'
    ) THEN
        CREATE POLICY "Users can view their own chat sessions"
        ON public.chat_sessions FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_sessions' 
        AND policyname = 'Users can create their own chat sessions'
    ) THEN
        CREATE POLICY "Users can create their own chat sessions"
        ON public.chat_sessions FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_sessions' 
        AND policyname = 'Users can update their own chat sessions'
    ) THEN
        CREATE POLICY "Users can update their own chat sessions"
        ON public.chat_sessions FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- chat_messages policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can view their own chat messages'
    ) THEN
        CREATE POLICY "Users can view their own chat messages"
        ON public.chat_messages FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can create their own chat messages'
    ) THEN
        CREATE POLICY "Users can create their own chat messages"
        ON public.chat_messages FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- user_file_uploads policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_file_uploads' 
        AND policyname = 'Users can view their own file uploads'
    ) THEN
        CREATE POLICY "Users can view their own file uploads"
        ON public.user_file_uploads FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_file_uploads' 
        AND policyname = 'Users can create their own file uploads'
    ) THEN
        CREATE POLICY "Users can create their own file uploads"
        ON public.user_file_uploads FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_file_uploads' 
        AND policyname = 'Users can update their own file uploads'
    ) THEN
        CREATE POLICY "Users can update their own file uploads"
        ON public.user_file_uploads FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- nutrition_plan_analyses policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_plan_analyses' 
        AND policyname = 'Users can view their own nutrition analyses'
    ) THEN
        CREATE POLICY "Users can view their own nutrition analyses"
        ON public.nutrition_plan_analyses FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nutrition_plan_analyses' 
        AND policyname = 'Users can create their own nutrition analyses'
    ) THEN
        CREATE POLICY "Users can create their own nutrition analyses"
        ON public.nutrition_plan_analyses FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Functions to update profile from chat/file data
CREATE OR REPLACE FUNCTION update_profile_from_chat_data(
  p_user_id UUID,
  p_extracted_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- Merge extracted data into user profile
  UPDATE public.user_fitness_profiles
  SET 
    chat_extracted_data = chat_extracted_data || p_extracted_data,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_fitness_profiles (user_id, chat_extracted_data)
    VALUES (p_user_id, p_extracted_data);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate all user data for AI context
CREATE OR REPLACE FUNCTION get_user_complete_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', row_to_json(p.*),
    'recent_workouts', (
      SELECT jsonb_agg(w.*)
      FROM (
        SELECT * FROM public.generated_workouts
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 5
      ) w
    ),
    'recent_nutrition', (
      SELECT jsonb_agg(n.*)
      FROM (
        SELECT * FROM public.nutrition_logs
        WHERE user_id = p_user_id
        ORDER BY date DESC
        LIMIT 8
      ) n
    ),
    'uploaded_files', (
      SELECT jsonb_agg(f.*)
      FROM (
        SELECT * FROM public.user_file_uploads
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) f
    ),
    'workout_templates', (
      SELECT COUNT(*) FROM public.workout_templates WHERE user_id = p_user_id
    )
  ) INTO v_result
  FROM public.user_fitness_profiles p
  WHERE p.user_id = p_user_id;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;