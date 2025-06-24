
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MacroDonutChart } from './MacroDonutChart';

interface TargetsCarouselProps {
  nutritionLog: any;
  targets: any;
}

export const TargetsCarousel = ({ nutritionLog, targets }: TargetsCarouselProps) => {
  const [currentView, setCurrentView] = useState(0);
  
  const totalCalories = nutritionLog?.totalCalories || 0;
  const totalProtein = nutritionLog?.totalProtein || 0;
  const totalCarbs = nutritionLog?.totalCarbs || 0;
  const totalFat = nutritionLog?.totalFat || 0;

  const targetCalories = targets?.daily_calories || 2000;
  const targetProtein = targets?.daily_protein || 150;
  const targetCarbs = targets?.daily_carbs || 250;
  const targetFat = targets?.daily_fat || 65;

  const views = [
    {
      title: 'Macronutrient Targets',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Energy</span>
              <span className="text-sm text-muted-foreground">
                {totalCalories.toFixed(1)} / {targetCalories} kcal
              </span>
            </div>
            <Progress value={(totalCalories / targetCalories) * 100} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {((totalCalories / targetCalories) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Protein</span>
              <span className="text-sm text-muted-foreground">
                {totalProtein.toFixed(1)} / {targetProtein} g
              </span>
            </div>
            <Progress value={(totalProtein / targetProtein) * 100} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {((totalProtein / targetProtein) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600">Net Carbs</span>
              <span className="text-sm text-muted-foreground">
                {totalCarbs.toFixed(1)} / {targetCarbs} g
              </span>
            </div>
            <Progress value={(totalCarbs / targetCarbs) * 100} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {((totalCarbs / targetCarbs) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Fat</span>
              <span className="text-sm text-muted-foreground">
                {totalFat.toFixed(1)} / {targetFat} g
              </span>
            </div>
            <Progress value={(totalFat / targetFat) * 100} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {((totalFat / targetFat) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Energy Summary',
      content: (
        <div className="flex justify-center">
          <MacroDonutChart
            calories={totalCalories}
            protein={totalProtein}
            carbs={totalCarbs}
            fat={totalFat}
            size={200}
          />
        </div>
      )
    }
  ];

  const nextView = () => {
    setCurrentView((prev) => (prev + 1) % views.length);
  };

  const prevView = () => {
    setCurrentView((prev) => (prev - 1 + views.length) % views.length);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevView} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{views[currentView].title}</h2>
        <Button variant="ghost" size="icon" onClick={nextView} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="min-h-[200px] flex items-center justify-center">
        {views[currentView].content}
      </div>
      
      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {views.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentView(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentView ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </Card>
  );
};
