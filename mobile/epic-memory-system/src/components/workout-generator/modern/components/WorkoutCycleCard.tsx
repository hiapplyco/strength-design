
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkoutDayCard } from './WorkoutDayCard';
import type { WorkoutCycle } from '@/types/fitness';
import { isWorkoutDay } from '@/types/fitness';

interface WorkoutCycleCardProps {
  cycleKey: string;
  cycle: WorkoutCycle;
  index: number;
}

export const WorkoutCycleCard: React.FC<WorkoutCycleCardProps> = ({ cycleKey, cycle, index }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expand cycles by default
  
  const formattedCycleName = cycleKey.replace(/([A-Z])/g, ' $1').trim();
  const dayCount = Object.entries(cycle).filter(([key, value]) => isWorkoutDay(value)).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-2 border-green-500/20">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors bg-green-500/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl capitalize text-green-600 dark:text-green-400">
                    {formattedCycleName}
                  </CardTitle>
                  <CardDescription>
                    {dayCount} workout {dayCount === 1 ? 'day' : 'days'}
                  </CardDescription>
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
            <CardContent className="space-y-4">
              {Object.entries(cycle)
                .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
                .map(([dayKey, dayValue], dayIndex) => (
                  <WorkoutDayCard
                    key={dayKey}
                    dayKey={dayKey}
                    workout={dayValue as any}
                    index={dayIndex}
                  />
                ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};
