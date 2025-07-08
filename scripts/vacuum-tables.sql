-- Run VACUUM ANALYZE on critical tables
-- Execute this manually in Supabase SQL Editor

VACUUM ANALYZE public.nutrition_settings;
VACUUM ANALYZE public.workouts;
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.journal_entries;
VACUUM ANALYZE public.workout_sessions;
VACUUM ANALYZE public.generated_workouts;
VACUUM ANALYZE public.nutrition_logs;

-- Check table statistics after vacuum
SELECT 
    schemaname || '.' || relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;