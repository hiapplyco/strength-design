
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { TargetsCarousel } from './TargetsCarousel';
import { WaterTracker } from './WaterTracker';
import { MealAccordion } from './MealAccordion';
import { useNutritionData } from '@/hooks/useNutritionData';
import { format, addDays, subDays } from 'date-fns';

export const NutritionDiaryContent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { nutritionLog, targets, isLoading } = useNutritionData(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-20 bg-muted rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header with Date Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousDay}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">
              {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Targets Carousel */}
      <TargetsCarousel 
        nutritionLog={nutritionLog} 
        targets={targets} 
      />

      {/* Water Tracker */}
      <WaterTracker 
        consumed={nutritionLog?.water_consumed_ml || 0}
        target={targets?.daily_water_ml || 2000}
        date={selectedDate}
      />

      {/* Meal Groups */}
      <div className="space-y-4">
        {['meal 1', 'meal 2', 'meal 3', 'meal 4', 'meal 5'].map((mealGroup) => (
          <MealAccordion
            key={mealGroup}
            mealGroup={mealGroup}
            nutritionLogId={nutritionLog?.id}
            date={selectedDate}
          />
        ))}
      </div>
    </div>
  );
};
