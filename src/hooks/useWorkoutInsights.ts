import { useState } from 'react';
import { functions } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface WorkoutInsights {
  overallSummary: string;
  workoutInsights: {
    completionRate: number;
    consistencyScore: number;
    trendAnalysis: string;
    recommendations: string[];
  };
  wellnessInsights: {
    averageMood: number;
    averageEnergy: number;
    averageSleep: number;
    averageStress: number;
    correlations: string;
  };
  visualizations: Array<{
    type: 'line' | 'bar' | 'doughnut';
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string | string[];
        borderColor?: string;
      }>;
    };
  }>;
  actionableRecommendations: Array<{
    category: 'workout' | 'nutrition' | 'recovery' | 'motivation';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    reasoning: string;
  }>;
}

interface GenerateInsightsRequest {
  userId: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export const useWorkoutInsights = () => {
  const [insights, setInsights] = useState<WorkoutInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const generateInsights = async (daysBack: number = 30) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate insights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, daysBack);

      const generateWorkoutInsights = httpsCallable<GenerateInsightsRequest, WorkoutInsights>(
        functions,
        'generateWorkoutInsights'
      );

      const result = await generateWorkoutInsights({
        userId: session.user.id,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd')
        }
      });

      setInsights(result.data);
      toast({
        title: "Insights Generated",
        description: "Your fitness insights have been updated with the latest data."
      });

    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insights,
    isLoading,
    generateInsights
  };
};
