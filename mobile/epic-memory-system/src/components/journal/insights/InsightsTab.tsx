
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InsightsVisualization } from './InsightsVisualization';
import { useWorkoutInsights } from '@/hooks/useWorkoutInsights';
import { TrendingUp, Brain, Target, Calendar, Loader2 } from 'lucide-react';

export const InsightsTab: React.FC = () => {
  const { insights, isLoading, generateInsights } = useWorkoutInsights();

  useEffect(() => {
    // Auto-generate insights on component mount
    generateInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Analyzing your fitness data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Get personalized insights based on your workout and wellness data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => generateInsights()} className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Insights
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{insights.overallSummary}</p>
          <Button onClick={() => generateInsights()} variant="outline" size="sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Refresh Insights
          </Button>
        </CardContent>
      </Card>

      {/* Workout Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workout Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(insights.workoutInsights.completionRate * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(insights.workoutInsights.consistencyScore * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Consistency Score</div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Trend Analysis</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {insights.workoutInsights.trendAnalysis}
            </p>
            <div className="space-y-2">
              {insights.workoutInsights.recommendations.map((rec, index) => (
                <div key={index} className="text-sm bg-muted p-2 rounded">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wellness Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold">
                {insights.wellnessInsights.averageMood.toFixed(1)}/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Mood</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">
                {insights.wellnessInsights.averageEnergy.toFixed(1)}/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Energy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">
                {insights.wellnessInsights.averageSleep.toFixed(1)}/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">
                {insights.wellnessInsights.averageStress.toFixed(1)}/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Stress</div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Correlations</h4>
            <p className="text-sm text-muted-foreground">
              {insights.wellnessInsights.correlations}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      {insights.visualizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.visualizations.map((viz, index) => (
            <InsightsVisualization
              key={index}
              type={viz.type}
              title={viz.title}
              data={viz.data}
            />
          ))}
        </div>
      )}

      {/* Actionable Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>
            AI-generated suggestions to improve your fitness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.actionableRecommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant={getPriorityColor(rec.priority) as any}
                    className="capitalize"
                  >
                    {rec.priority} Priority
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {rec.category}
                  </Badge>
                </div>
                <h4 className="font-medium mb-1">{rec.recommendation}</h4>
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
