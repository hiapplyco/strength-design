
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface UserDataSummary {
  workoutSessions: any[];
  nutritionLogs: any[];
  journalEntries: any[];
  recentMetrics: any[];
  workoutTemplates?: any[]; // Add workout templates to the interface
  progressTrends: {
    weeklyWorkouts: number;
    avgCalories: number;
    avgProtein: number;
    moodTrend: number;
    energyTrend: number;
  };
}

export const useUserDataIntegration = () => {
  const { session } = useAuth();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-data-integration', session?.user?.id],
    queryFn: async (): Promise<UserDataSummary> => {
      if (!session?.user?.id) throw new Error('No user session');

      const now = new Date();
      const twoWeeksAgo = subDays(now, 14);
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);

      // Fetch recent workout sessions
      const { data: workoutSessions } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          generated_workouts (title, summary, workout_data),
          workout_metrics (*)
        `)
        .eq('user_id', session.user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent nutrition logs
      const { data: nutritionLogs } = await supabase
        .from('nutrition_logs')
        .select(`
          *,
          meal_entries (
            *,
            food_items (*)
          ),
          exercise_entries (*)
        `)
        .eq('user_id', session.user.id)
        .gte('date', format(twoWeeksAgo, 'yyyy-MM-dd'))
        .order('date', { ascending: false })
        .limit(14);

      // Fetch recent journal entries
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(twoWeeksAgo, 'yyyy-MM-dd'))
        .order('date', { ascending: false })
        .limit(14);

      // Get nutrition targets
      const { data: nutritionTargets } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Calculate recent metrics and trends
      const weeklyWorkouts = workoutSessions?.filter(session => 
        new Date(session.created_at) >= weekStart && new Date(session.created_at) <= weekEnd
      ).length || 0;

      const recentNutritionData = nutritionLogs?.slice(0, 7) || [];
      const avgCalories = recentNutritionData.reduce((sum, log) => {
        const totalCalories = log.meal_entries?.reduce((mealSum: number, entry: any) => 
          mealSum + (entry.food_items?.calories_per_serving * entry.serving_multiplier || 0), 0) || 0;
        return sum + totalCalories;
      }, 0) / Math.max(recentNutritionData.length, 1);

      const avgProtein = recentNutritionData.reduce((sum, log) => {
        const totalProtein = log.meal_entries?.reduce((mealSum: number, entry: any) => 
          mealSum + (entry.food_items?.protein_per_serving * entry.serving_multiplier || 0), 0) || 0;
        return sum + totalProtein;
      }, 0) / Math.max(recentNutritionData.length, 1);

      const recentJournalData = journalEntries?.slice(0, 7) || [];
      const avgMood = recentJournalData.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / Math.max(recentJournalData.length, 1);
      const avgEnergy = recentJournalData.reduce((sum, entry) => sum + (entry.energy_level || 0), 0) / Math.max(recentJournalData.length, 1);

      // Aggregate workout metrics
      const recentMetrics = workoutSessions?.flatMap(session => session.workout_metrics || []) || [];

      return {
        workoutSessions: workoutSessions || [],
        nutritionLogs: nutritionLogs || [],
        journalEntries: journalEntries || [],
        recentMetrics,
        progressTrends: {
          weeklyWorkouts,
          avgCalories: Math.round(avgCalories),
          avgProtein: Math.round(avgProtein * 10) / 10,
          moodTrend: Math.round(avgMood * 10) / 10,
          energyTrend: Math.round(avgEnergy * 10) / 10,
        }
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateUserContext = (userData: UserDataSummary) => {
    if (!userData) return '';

    const { workoutSessions, nutritionLogs, journalEntries, progressTrends } = userData;
    
    return `
CURRENT USER FITNESS PROFILE:
=================================

RECENT ACTIVITY SUMMARY:
- This week: ${progressTrends.weeklyWorkouts} workouts completed
- Average daily calories: ${progressTrends.avgCalories} kcal
- Average daily protein: ${progressTrends.avgProtein}g
- Current mood trend: ${progressTrends.moodTrend}/10
- Current energy trend: ${progressTrends.energyTrend}/10

RECENT WORKOUT PERFORMANCE:
${workoutSessions.slice(0, 5).map(session => `
- ${format(new Date(session.created_at), 'MMM dd')}: ${session.status} - ${session.generated_workouts?.title || 'Custom workout'}
  Satisfaction: ${session.satisfaction_rating || 'Not rated'}/10, Duration: ${session.actual_duration_minutes || 'Not tracked'} min
`).join('')}

NUTRITION PATTERNS (Last 7 days):
${nutritionLogs.slice(0, 7).map(log => {
  const totalCals = log.meal_entries?.reduce((sum: number, entry: any) => 
    sum + (entry.food_items?.calories_per_serving * entry.serving_multiplier || 0), 0) || 0;
  const totalProtein = log.meal_entries?.reduce((sum: number, entry: any) => 
    sum + (entry.food_items?.protein_per_serving * entry.serving_multiplier || 0), 0) || 0;
  return `- ${log.date}: ${Math.round(totalCals)} kcal, ${Math.round(totalProtein * 10) / 10}g protein`;
}).join('\n')}

RECENT WELLNESS DATA:
${journalEntries.slice(0, 5).map(entry => `
- ${entry.date}: Mood ${entry.mood_rating || 'N/A'}/10, Energy ${entry.energy_level || 'N/A'}/10, Sleep ${entry.sleep_quality || 'N/A'}/10
`).join('')}

COACHING INSTRUCTIONS:
- Use this data to provide personalized, actionable advice
- Reference specific patterns and trends you observe
- Suggest improvements based on actual performance data
- Be encouraging about progress and realistic about areas for improvement
- Always relate advice back to their actual data when possible
`;
  };

  return {
    userData,
    isLoading,
    generateUserContext: userData ? () => generateUserContext(userData) : () => '',
  };
};
