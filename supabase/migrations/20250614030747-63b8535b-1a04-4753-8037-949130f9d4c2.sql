
-- Enable RLS on the workouts_backup table to fix the security issue
ALTER TABLE public.workouts_backup ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policy for workouts_backup table (assuming it should follow same pattern as workouts)
CREATE POLICY "workouts_backup_select" ON public.workouts_backup FOR SELECT USING (auth.uid() = user_id);
