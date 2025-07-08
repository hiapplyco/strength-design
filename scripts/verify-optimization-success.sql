-- 1. Verify indexes are in place
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_nutrition_settings_user_id',
    'idx_workouts_user_day',
    'idx_workouts_created_at',
    'idx_journal_entries_user_date',
    'idx_workout_sessions_user_scheduled',
    'idx_nutrition_logs_user_date',
    'idx_generated_workouts_user_created'
)
ORDER BY tablename, indexname;

-- 2. Check RLS is enabled on nutrition_settings
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'nutrition_settings';

-- 3. Verify RLS policies exist
SELECT 
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'nutrition_settings';

-- 4. Check for any recent slow queries on nutrition_settings
SELECT 
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
WHERE query LIKE '%nutrition_settings%'
AND query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 5;