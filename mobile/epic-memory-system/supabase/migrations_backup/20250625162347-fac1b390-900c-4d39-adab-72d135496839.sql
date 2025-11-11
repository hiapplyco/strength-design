
-- Reset all users' free workout usage to 0 for the new 3 free trial system
UPDATE public.profiles 
SET free_workouts_used = 0;
