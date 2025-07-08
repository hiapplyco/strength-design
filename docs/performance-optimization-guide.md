# Performance Optimization Guide

## Overview
This guide addresses the performance issues identified in the Supabase query analysis, particularly focusing on reducing database load and improving response times.

## Key Issues Identified

1. **Realtime queries consuming 85.2% of total query time**
2. **Nutrition settings being fetched 30,000+ times**
3. **Expensive metadata queries running frequently**
4. **HTTP cleanup queries running millions of times**

## Client-Side Optimizations

### 1. Implement React Query Caching

```typescript
// src/hooks/useNutritionSettings.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNutritionSettings(userId: string) {
  return useQuery({
    queryKey: ['nutrition-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

### 2. Debounce Realtime Subscriptions

```typescript
// src/hooks/useRealtimeSubscription.ts
import { useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';

export function useRealtimeSubscription(channel: string, callback: Function) {
  const debouncedCallback = useRef(
    debounce(callback, 1000) // 1 second debounce
  ).current;

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public' 
      }, debouncedCallback)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, debouncedCallback]);
}
```

### 3. Batch API Requests

```typescript
// src/services/batchRequests.ts
import { supabase } from '@/integrations/supabase/client';

export async function batchFetchWorkouts(userIds: string[], days: string[]) {
  // Instead of multiple queries, use a single query with IN clause
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .in('user_id', userIds)
    .in('day', days)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### 4. Implement Local State Management

```typescript
// src/stores/nutritionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NutritionStore {
  settings: NutritionSettings | null;
  lastFetched: number | null;
  setSettings: (settings: NutritionSettings) => void;
  isStale: () => boolean;
}

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      settings: null,
      lastFetched: null,
      setSettings: (settings) => set({ 
        settings, 
        lastFetched: Date.now() 
      }),
      isStale: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > 5 * 60 * 1000; // 5 minutes
      },
    }),
    {
      name: 'nutrition-settings',
    }
  )
);
```

### 5. Optimize Component Re-renders

```typescript
// src/components/nutrition-diary/NutritionSettingsDialog.tsx
import { memo, useCallback, useMemo } from 'react';

export const NutritionSettingsDialog = memo(({ 
  open, 
  onOpenChange, 
  user 
}: Props) => {
  // Memoize expensive computations
  const defaultSettings = useMemo(() => ({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    // ... other defaults
  }), []);

  // Use callback to prevent recreating functions
  const handleSave = useCallback(async (values: FormData) => {
    // Save logic
  }, [user?.id]);

  // Only fetch when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadSettings();
    }
  }, [open, user?.id]);
});
```

## Database Optimizations

### 1. Apply Migration
Run the migration created in `supabase/migrations/20250107_optimize_performance.sql`:

```bash
supabase db push
```

### 2. Enable Connection Pooling
In Supabase Dashboard:
- Go to Settings > Database
- Set Pool Mode to "Transaction"
- Set Pool Size to 25
- Set Max Client Connections to 100

### 3. Configure Statement Timeouts
Add to your database settings:
```sql
ALTER DATABASE postgres SET statement_timeout = '30s';
```

## Monitoring

### 1. Query Performance Dashboard
Create a dashboard to monitor slow queries:

```typescript
// src/pages/admin/QueryMonitor.tsx
export function QueryMonitor() {
  const { data: slowQueries } = useQuery({
    queryKey: ['slow-queries'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_slow_queries');
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Query</TableHead>
          <TableHead>Calls</TableHead>
          <TableHead>Total Time</TableHead>
          <TableHead>Mean Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {slowQueries?.map((query) => (
          <TableRow key={query.query}>
            <TableCell>{query.query.substring(0, 100)}...</TableCell>
            <TableCell>{query.calls}</TableCell>
            <TableCell>{query.total_time}ms</TableCell>
            <TableCell>{query.mean_time}ms</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 2. Error Tracking
Implement error boundaries and logging:

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Supabase
    supabase.from('error_logs').insert({
      error_message: error.message,
      stack_trace: error.stack,
      component_stack: errorInfo.componentStack,
      user_id: this.props.userId,
      created_at: new Date().toISOString(),
    });
  }
}
```

## Best Practices

1. **Cache aggressively** - Use React Query's stale-while-revalidate pattern
2. **Debounce user inputs** - Prevent rapid API calls
3. **Batch requests** - Combine multiple queries when possible
4. **Use local state** - Reduce server round trips
5. **Monitor performance** - Track slow queries and errors
6. **Optimize realtime** - Only subscribe to necessary channels
7. **Implement pagination** - Don't fetch all data at once
8. **Use indexes** - Ensure database queries are optimized

## Testing Performance

### Load Testing Script
```typescript
// scripts/loadTest.ts
import { supabase } from '@/integrations/supabase/client';

async function simulateLoad() {
  const promises = [];
  
  // Simulate 100 concurrent users
  for (let i = 0; i < 100; i++) {
    promises.push(
      supabase
        .from('nutrition_settings')
        .select('*')
        .eq('user_id', 'test-user-id')
    );
  }
  
  console.time('Load test');
  await Promise.all(promises);
  console.timeEnd('Load test');
}
```

## Rollback Plan

If issues arise after implementing optimizations:

1. **Revert migrations**: 
   ```bash
   supabase db reset --db-url $DATABASE_URL
   ```

2. **Disable caching**: Set `staleTime` and `cacheTime` to 0

3. **Remove indexes**: 
   ```sql
   DROP INDEX IF EXISTS idx_name;
   ```

4. **Monitor logs**: Check Supabase logs for errors

## Success Metrics

Track these metrics to measure optimization success:

1. **Query execution time**: Should decrease by 50%+
2. **API response time**: Target < 200ms for common queries
3. **Database connections**: Should remain under 80% of limit
4. **Error rate**: Should remain under 0.1%
5. **User experience**: Page load times < 1 second

## Next Steps

1. Implement the client-side optimizations
2. Run the database migration
3. Monitor performance for 24 hours
4. Adjust caching strategies based on usage patterns
5. Consider implementing a CDN for static assets