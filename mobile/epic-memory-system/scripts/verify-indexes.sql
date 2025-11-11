-- Verify that indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('nutrition_settings', 'workouts', 'journal_entries', 'workout_sessions', 'nutrition_logs', 'generated_workouts')
ORDER BY tablename, indexname;

-- Check if nutrition_settings RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'nutrition_settings';

-- Check RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'nutrition_settings';