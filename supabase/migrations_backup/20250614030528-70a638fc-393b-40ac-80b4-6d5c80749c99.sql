
-- COMPLETE RLS RESET AND REBUILD
-- This will fix all the redundant, conflicting, and dangerous policies

-- First, disable RLS temporarily to drop all policies cleanly
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_dashboard DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_io DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_generation_inputs DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing RLS policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Public read access for shared documents" ON public.documents;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;

DROP POLICY IF EXISTS "Users can view their own generated workouts" ON public.generated_workouts;
DROP POLICY IF EXISTS "Users can create their own generated workouts" ON public.generated_workouts;
DROP POLICY IF EXISTS "Users can update their own generated workouts" ON public.generated_workouts;
DROP POLICY IF EXISTS "Users can delete their own generated workouts" ON public.generated_workouts;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

DROP POLICY IF EXISTS "Users can view their own technique analyses" ON public.technique_analyses;
DROP POLICY IF EXISTS "Users can create their own technique analyses" ON public.technique_analyses;
DROP POLICY IF EXISTS "Users can update their own technique analyses" ON public.technique_analyses;
DROP POLICY IF EXISTS "Users can delete their own technique analyses" ON public.technique_analyses;

DROP POLICY IF EXISTS "Users can view their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can create their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;

DROP POLICY IF EXISTS "Users can view their own voice recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "Users can create their own voice recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "Users can update their own voice recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "Users can delete their own voice recordings" ON public.voice_recordings;

DROP POLICY IF EXISTS "Users can view their own workout dashboard" ON public.workout_dashboard;
DROP POLICY IF EXISTS "Users can create their own workout dashboard" ON public.workout_dashboard;
DROP POLICY IF EXISTS "Users can update their own workout dashboard" ON public.workout_dashboard;
DROP POLICY IF EXISTS "Users can delete their own workout dashboard" ON public.workout_dashboard;

DROP POLICY IF EXISTS "Users can view their own workout history" ON public.workout_history;
DROP POLICY IF EXISTS "Users can create their own workout history" ON public.workout_history;
DROP POLICY IF EXISTS "Users can update their own workout history" ON public.workout_history;
DROP POLICY IF EXISTS "Users can delete their own workout history" ON public.workout_history;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.shared_content;
DROP POLICY IF EXISTS "Users can view their own shared content" ON public.shared_content;
DROP POLICY IF EXISTS "Users can create their own shared content" ON public.shared_content;
DROP POLICY IF EXISTS "Users can update their own shared content" ON public.shared_content;
DROP POLICY IF EXISTS "Users can delete their own shared content" ON public.shared_content;
DROP POLICY IF EXISTS "Public read access for shared content with shareable link" ON public.shared_content;

DROP POLICY IF EXISTS "Enable anonymous access" ON public.session_io;
DROP POLICY IF EXISTS "Authenticated users can create session data" ON public.session_io;
DROP POLICY IF EXISTS "Authenticated users can view session data" ON public.session_io;

DROP POLICY IF EXISTS "Enable anonymous access" ON public.workout_generation_inputs;
DROP POLICY IF EXISTS "Users can view their own workout inputs" ON public.workout_generation_inputs;
DROP POLICY IF EXISTS "Users can create their own workout inputs" ON public.workout_generation_inputs;

-- Re-enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_io ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_generation_inputs ENABLE ROW LEVEL SECURITY;

-- CREATE SIMPLIFIED, CONSISTENT RLS POLICIES
-- Pattern: 4 policies per user table (SELECT, INSERT, UPDATE, DELETE)

-- Documents policies
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "documents_public_select" ON public.documents FOR SELECT USING (share_link IS NOT NULL);

-- Workouts policies
CREATE POLICY "workouts_select" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workouts_insert" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workouts_update" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workouts_delete" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- Generated workouts policies
CREATE POLICY "generated_workouts_select" ON public.generated_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "generated_workouts_insert" ON public.generated_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generated_workouts_update" ON public.generated_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "generated_workouts_delete" ON public.generated_workouts FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Technique analyses policies
CREATE POLICY "technique_analyses_select" ON public.technique_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "technique_analyses_insert" ON public.technique_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Videos policies
CREATE POLICY "videos_select" ON public.videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "videos_insert" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "videos_update" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "videos_delete" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- Voice recordings policies
CREATE POLICY "voice_recordings_select" ON public.voice_recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "voice_recordings_insert" ON public.voice_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workout dashboard policies
CREATE POLICY "workout_dashboard_select" ON public.workout_dashboard FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_dashboard_insert" ON public.workout_dashboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_dashboard_update" ON public.workout_dashboard FOR UPDATE USING (auth.uid() = user_id);

-- Workout history policies
CREATE POLICY "workout_history_select" ON public.workout_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_history_insert" ON public.workout_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared content policies
CREATE POLICY "shared_content_select" ON public.shared_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shared_content_insert" ON public.shared_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shared_content_public_select" ON public.shared_content FOR SELECT USING (shareable_link IS NOT NULL);

-- Session IO policies (for forms and analytics)
CREATE POLICY "session_io_select" ON public.session_io FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "session_io_insert" ON public.session_io FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Workout generation inputs policies
CREATE POLICY "workout_generation_inputs_select" ON public.workout_generation_inputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_generation_inputs_insert" ON public.workout_generation_inputs FOR INSERT WITH CHECK (auth.uid() = user_id);
