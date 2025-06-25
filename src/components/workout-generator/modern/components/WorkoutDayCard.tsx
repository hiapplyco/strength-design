
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { WorkoutDay } from '@/types/fitness';

interface WorkoutDayCardProps {
  dayKey: string;
  workout: WorkoutDay;
  index: number;
}

const WorkoutSection = ({ title, content, emoji }: { title: string; content: string | undefined; emoji: string }) => {
  if (!content) return null;
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h4>
      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export const WorkoutDayCard: React.FC<WorkoutDayCardProps> = ({ dayKey, workout, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDayName = dayKey.replace(/day(\d+)/, 'Day $1').replace(/([A-Z])/g, ' $1').trim();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg capitalize">{formattedDayName}</CardTitle>
                  {workout.description && (
                    <CardDescription className="line-clamp-2">
                      {workout.description}
                    </CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <WorkoutSection 
                title="Warmup" 
                content={workout.warmup} 
                emoji="🏃‍♂️" 
              />
              <WorkoutSection 
                title="Strength" 
                content={workout.strength} 
                emoji="💪" 
              />
              <WorkoutSection 
                title="Workout" 
                content={workout.workout} 
                emoji="🏋️‍♂️" 
              />
              <WorkoutSection 
                title="Notes" 
                content={workout.notes} 
                emoji="📝" 
              />
              
              {/* Debug section - only show if there's additional data */}
              {Object.keys(workout).some(key => !['description', 'warmup', 'strength', 'workout', 'notes', 'exercises', 'images'].includes(key)) && (
                <div className="mt-4 p-3 bg-muted/20 rounded-md">
                  <details>
                    <summary className="text-xs text-muted-foreground cursor-pointer">Debug: Raw Data</summary>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(workout, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};
