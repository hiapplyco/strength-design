
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb, Target, TrendingUp, AlertTriangle } from "lucide-react";

// Default insights if none are provided
const defaultInsights = [
  {
    title: "Strength Improvement Opportunity",
    description: "Your lower body strength metrics show potential for faster improvement. Consider adding more quad-focused exercises.",
    type: "opportunity",
    icon: TrendingUp
  },
  {
    title: "Recovery Pattern Detected",
    description: "You consistently perform better after 2 full rest days. Consider adjusting your training schedule to maximize this pattern.",
    type: "pattern",
    icon: Lightbulb
  },
  {
    title: "Approaching Peak Performance",
    description: "Your metrics indicate optimal training load. Maintain current intensity for the next 2 weeks to reach peak performance.",
    type: "goal",
    icon: Target
  },
  {
    title: "Potential Overtraining Risk",
    description: "Recent metrics show declining performance despite increased training volume. Consider implementing an additional recovery day.",
    type: "warning",
    icon: AlertTriangle
  }
];

interface TrainingInsightsProps {
  insights?: any[];
}

export function TrainingInsights({ insights = defaultInsights }: TrainingInsightsProps) {
  // Use the provided insights or default insights
  const trainingInsights = Array.isArray(insights) && insights.length > 0 ? insights : defaultInsights;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {trainingInsights.map((insight, index) => {
        const Icon = insight.icon || Lightbulb;
        
        return (
          <Card key={index} className="animate-in -translate-y-4 opacity-0 transition-all duration-300" style={{
            animationDelay: `${index * 100}ms`,
            transitionDelay: `${index * 100}ms`
          }}>
            <CardHeader className="flex flex-row items-start space-x-4">
              <div className={`
                rounded-full p-2
                ${insight.type === "opportunity" ? "bg-blue-100 text-blue-600" :
                  insight.type === "pattern" ? "bg-purple-100 text-purple-600" : 
                  insight.type === "goal" ? "bg-green-100 text-green-600" :
                  "bg-amber-100 text-amber-600"}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                <CardDescription>{insight.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full mt-2" size="sm">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
