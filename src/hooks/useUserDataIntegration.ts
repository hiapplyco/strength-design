import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface UserDataSummary {
  workoutSessions: any[];
  nutritionLogs: any[];
  journalEntries: any[];
  recentMetrics: any[];
  workoutTemplates?: any[];
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

      const userId = session.user.id;
      const now = new Date();
      const twoWeeksAgo = subDays(now, 14);
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);

      // Fetch recent workout sessions
      const workoutSessionsQuery = query(
        collection(db, `users/${userId}/workout_sessions`),
        where('created_at', '>=', Timestamp.fromDate(twoWeeksAgo)),
        orderBy('created_at', 'desc')
      );
      const workoutSessionsSnapshot = await getDocs(workoutSessionsQuery);

      const workoutSessions = await Promise.all(
        workoutSessionsSnapshot.docs.slice(0, 20).map(async (docSnapshot) => {
          const sessionData = docSnapshot.data();

          // Fetch generated workout if exists
          let generatedWorkout = null;
          if (sessionData.generated_workout_id) {
            const workoutDoc = await getDoc(doc(db, `users/${userId}/workouts`, sessionData.generated_workout_id));
            if (workoutDoc.exists()) {
              generatedWorkout = {
                title: workoutDoc.data().title,
                summary: workoutDoc.data().summary,
                workout_data: workoutDoc.data().workout_data
              };
            }
          }

          // Fetch workout metrics
          const metricsQuery = query(
            collection(db, `users/${userId}/workout_sessions/${docSnapshot.id}/workout_metrics`)
          );
          const metricsSnapshot = await getDocs(metricsQuery);
          const workout_metrics = metricsSnapshot.docs.map(metricDoc => ({
            id: metricDoc.id,
            ...metricDoc.data()
          }));

          return {
            id: docSnapshot.id,
            ...sessionData,
            created_at: sessionData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            generated_workouts: generatedWorkout,
            workout_metrics
          };
        })
      );

      // Fetch recent nutrition logs
      const nutritionLogsQuery = query(
        collection(db, `users/${userId}/nutrition_logs`),
        where('date', '>=', format(twoWeeksAgo, 'yyyy-MM-dd')),
        orderBy('date', 'desc')
      );
      const nutritionLogsSnapshot = await getDocs(nutritionLogsQuery);

      const nutritionLogs = await Promise.all(
        nutritionLogsSnapshot.docs.slice(0, 14).map(async (docSnapshot) => {
          const logData = docSnapshot.data();

          // Fetch meal entries with food items
          const mealEntriesQuery = query(
            collection(db, `users/${userId}/nutrition_logs/${docSnapshot.id}/meal_entries`)
          );
          const mealEntriesSnapshot = await getDocs(mealEntriesQuery);

          const meal_entries = await Promise.all(
            mealEntriesSnapshot.docs.map(async (mealDoc) => {
              const mealData = mealDoc.data();

              // Fetch food item
              let food_items = null;
              if (mealData.food_id) {
                const foodDoc = await getDoc(doc(db, `users/${userId}/food_items`, mealData.food_id));
                if (foodDoc.exists()) {
                  food_items = foodDoc.data();
                }
              }

              return {
                id: mealDoc.id,
                ...mealData,
                food_items
              };
            })
          );

          // Fetch exercise entries
          const exerciseEntriesQuery = query(
            collection(db, `users/${userId}/nutrition_logs/${docSnapshot.id}/exercise_entries`)
          );
          const exerciseEntriesSnapshot = await getDocs(exerciseEntriesQuery);
          const exercise_entries = exerciseEntriesSnapshot.docs.map(exDoc => ({
            id: exDoc.id,
            ...exDoc.data()
          }));

          return {
            id: docSnapshot.id,
            ...logData,
            meal_entries,
            exercise_entries
          };
        })
      );

      // Fetch recent journal entries
      const journalEntriesQuery = query(
        collection(db, `users/${userId}/journal_entries`),
        where('date', '>=', format(twoWeeksAgo, 'yyyy-MM-dd')),
        orderBy('date', 'desc')
      );
      const journalEntriesSnapshot = await getDocs(journalEntriesQuery);
      const journalEntries = journalEntriesSnapshot.docs.slice(0, 14).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate recent metrics and trends
      const weeklyWorkouts = workoutSessions.filter(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      }).length;

      const recentNutritionData = nutritionLogs.slice(0, 7);
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

      const recentJournalData = journalEntries.slice(0, 7);
      const avgMood = recentJournalData.reduce((sum, entry: any) => sum + (entry.mood_rating || 0), 0) / Math.max(recentJournalData.length, 1);
      const avgEnergy = recentJournalData.reduce((sum, entry: any) => sum + (entry.energy_level || 0), 0) / Math.max(recentJournalData.length, 1);

      // Aggregate workout metrics
      const recentMetrics = workoutSessions.flatMap(session => session.workout_metrics || []);

      return {
        workoutSessions,
        nutritionLogs,
        journalEntries,
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
