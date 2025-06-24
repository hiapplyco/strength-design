
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Activity } from 'lucide-react';
import { MacroDonutChart } from './MacroDonutChart';
import { DataCard } from '@/components/ui/DataCard';
import { width, spacing, grid, layout } from '@/utils/responsive';

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

  // Calculate percentages and status
  const caloriesPercent = (totalCalories / targetCalories) * 100;
  const proteinPercent = (totalProtein / targetProtein) * 100;
  const carbsPercent = (totalCarbs / targetCarbs) * 100;
  const fatPercent = (totalFat / targetFat) * 100;

  // Calculate remainders
  const caloriesRemaining = Math.max(0, targetCalories - totalCalories);
  const proteinRemaining = Math.max(0, targetProtein - totalProtein);
  const carbsRemaining = Math.max(0, targetCarbs - totalCarbs);
  const fatRemaining = Math.max(0, targetFat - totalFat);

  const views = [
    {
      title: 'Daily Overview',
      content: (
        <div className={`${width.full} ${spacing.gap}`}>
          <div className={`${grid.cols2} lg:grid-cols-4 ${spacing.gap}`}>
            <DataCard
              title="Calories"
              value={`${totalCalories.toFixed(0)} / ${targetCalories}`}
              change={`${caloriesRemaining.toFixed(0)} remaining`}
              changeType={caloriesPercent > 100 ? 'decrease' : 'neutral'}
              icon={Target}
              variant={caloriesPercent > 100 ? 'warning' : caloriesPercent > 80 ? 'success' : 'default'}
              description={`${caloriesPercent.toFixed(1)}% of target`}
            />
            
            <DataCard
              title="Protein"
              value={`${totalProtein.toFixed(1)}g`}
              change={`${proteinPercent.toFixed(0)}%`}
              changeType={proteinPercent >= 100 ? 'increase' : 'neutral'}
              icon={TrendingUp}
              variant={proteinPercent >= 100 ? 'success' : proteinPercent > 50 ? 'default' : 'warning'}
              description={`${proteinRemaining.toFixed(1)}g remaining`}
            />
            
            <DataCard
              title="Carbs"
              value={`${totalCarbs.toFixed(1)}g`}
              change={`${carbsPercent.toFixed(0)}%`}
              changeType={carbsPercent >= 100 ? 'increase' : 'neutral'}
              icon={Activity}
              variant={carbsPercent >= 100 ? 'success' : carbsPercent > 50 ? 'default' : 'warning'}
              description={`${carbsRemaining.toFixed(1)}g remaining`}
            />
            
            <DataCard
              title="Fat"
              value={`${totalFat.toFixed(1)}g`}
              change={`${fatPercent.toFixed(0)}%`}
              changeType={fatPercent >= 100 ? 'increase' : 'neutral'}
              icon={Target}
              variant={fatPercent >= 100 ? 'success' : fatPercent > 50 ? 'default' : 'warning'}
              description={`${fatRemaining.toFixed(1)}g remaining`}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Detailed Progress',
      content: (
        <div className={`${width.full} space-y-6`}>
          <div className={`${grid.cols2} ${spacing.gap}`}>
            <Card className={`${spacing.card} bg-gradient-to-br from-background to-muted/30`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Macronutrient Targets
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Energy</span>
                    <span className="text-sm text-muted-foreground">
                      {totalCalories.toFixed(1)} / {targetCalories} kcal
                    </span>
                  </div>
                  <Progress value={Math.min(caloriesPercent, 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{caloriesPercent.toFixed(1)}%</span>
                    <span className={caloriesPercent > 100 ? 'text-orange-600' : 'text-green-600'}>
                      {caloriesPercent > 100 ? `+${(totalCalories - targetCalories).toFixed(0)} over` : `${caloriesRemaining.toFixed(0)} left`}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">Protein</span>
                    <span className="text-sm text-muted-foreground">
                      {totalProtein.toFixed(1)} / {targetProtein} g
                    </span>
                  </div>
                  <Progress value={Math.min(proteinPercent, 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{proteinPercent.toFixed(1)}%</span>
                    <span className={proteinPercent > 100 ? 'text-orange-600' : 'text-green-600'}>
                      {proteinPercent > 100 ? `+${(totalProtein - targetProtein).toFixed(1)}g over` : `${proteinRemaining.toFixed(1)}g left`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">Net Carbs</span>
                    <span className="text-sm text-muted-foreground">
                      {totalCarbs.toFixed(1)} / {targetCarbs} g
                    </span>
                  </div>
                  <Progress value={Math.min(carbsPercent, 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{carbsPercent.toFixed(1)}%</span>
                    <span className={carbsPercent > 100 ? 'text-orange-600' : 'text-blue-600'}>
                      {carbsPercent > 100 ? `+${(totalCarbs - targetCarbs).toFixed(1)}g over` : `${carbsRemaining.toFixed(1)}g left`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-600">Fat</span>
                    <span className="text-sm text-muted-foreground">
                      {totalFat.toFixed(1)} / {targetFat} g
                    </span>
                  </div>
                  <Progress value={Math.min(fatPercent, 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{fatPercent.toFixed(1)}%</span>
                    <span className={fatPercent > 100 ? 'text-orange-600' : 'text-red-600'}>
                      {fatPercent > 100 ? `+${(totalFat - targetFat).toFixed(1)}g over` : `${fatRemaining.toFixed(1)}g left`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className={`${spacing.card} ${layout.center} bg-gradient-to-br from-background to-muted/30`}>
              <MacroDonutChart
                calories={totalCalories}
                protein={totalProtein}
                carbs={totalCarbs}
                fat={totalFat}
                size={220}
              />
            </Card>
          </div>
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
    <div className={`${width.full} ${spacing.section}`}>
      <Card className={`${spacing.card} bg-gradient-to-r from-background via-background to-muted/20`}>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={prevView} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {views[currentView].title}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextView} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className={`${width.full} ${layout.noOverflow}`}>
          {views[currentView].content}
        </div>
        
        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mt-6">
          {views.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentView(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentView 
                  ? 'bg-primary w-8' 
                  : 'bg-muted hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
