# VACUUM Commands for Supabase

Run each of these commands **separately** in the Supabase SQL Editor:

## 1. Vacuum nutrition_settings (Most Important)
```sql
VACUUM ANALYZE public.nutrition_settings;
```

## 2. Vacuum workouts
```sql
VACUUM ANALYZE public.workouts;
```

## 3. Vacuum profiles
```sql
VACUUM ANALYZE public.profiles;
```

## 4. Vacuum journal_entries
```sql
VACUUM ANALYZE public.journal_entries;
```

## 5. Vacuum workout_sessions
```sql
VACUUM ANALYZE public.workout_sessions;
```

## 6. Vacuum generated_workouts
```sql
VACUUM ANALYZE public.generated_workouts;
```

## 7. Vacuum nutrition_logs
```sql
VACUUM ANALYZE public.nutrition_logs;
```

## 8. Check Statistics (Run this after all VACUUMs)
```sql
SELECT 
    schemaname || '.' || relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```

## Alternative: Use Supabase CLI

If you prefer, you can run VACUUM using psql directly:

```bash
# Connect to your database
psql postgresql://postgres.ulnsvkrrdcmfiguibkpx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Then run each VACUUM command
\c postgres
VACUUM ANALYZE public.nutrition_settings;
VACUUM ANALYZE public.workouts;
# ... etc
```

## Note on Auto-VACUUM

Supabase has auto-vacuum enabled by default, which will handle this automatically over time. Manual VACUUM is only needed for immediate optimization after adding indexes.