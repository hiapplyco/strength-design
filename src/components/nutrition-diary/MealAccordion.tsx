
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, Apple, Activity, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodSearchDialog } from './FoodSearchDialog';
import { ExerciseSearchDialog } from './ExerciseSearchDialog';
import { useMealEntries } from '@/hooks/useMealEntries';
import { useExerciseEntries } from '@/hooks/useExerciseEntries';

interface MealAccordionProps {
  mealGroup: string;
  nutritionLogId?: string;
  date: Date;
}

export const MealAccordion = ({ mealGroup, nutritionLogId, date }: MealAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const { mealEntries, mealSummary, isLoading: isLoadingMeals } = useMealEntries(nutritionLogId, mealGroup);
  const { exerciseEntries, isLoading: isLoadingExercises } = useExerciseEntries(nutritionLogId, mealGroup);

  const hasEntries = (mealEntries && mealEntries.length > 0) || (exerciseEntries && exerciseEntries.length > 0);
  const isLoading = isLoadingMeals || isLoadingExercises;

  // Calculate total calories including exercises
  const totalCalories = (mealSummary?.calories || 0) + (exerciseEntries?.reduce((sum, entry) => sum + entry.calories_burned, 0) || 0);
  const exerciseCalories = exerciseEntries?.reduce((sum, entry) => sum + entry.calories_burned, 0) || 0;

  React.useEffect(() => {
    if (hasEntries && !isOpen) {
      setIsOpen(true);
    }
  }, [hasEntries, isOpen]);

  // Close add menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowAddMenu(false);
    if (showAddMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAddMenu]);

  const handleAddMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddMenu(!showAddMenu);
    // Auto-expand accordion when opening add menu
    if (!showAddMenu && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleFoodClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFoodSearch(true);
    setShowAddMenu(false);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleExerciseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExerciseSearch(true);
    setShowAddMenu(false);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer flex-1">
                  <span className="font-medium capitalize">{mealGroup}</span>
                  {hasEntries && (
                    <span className="text-sm text-muted-foreground">
                      {totalCalories.toFixed(0)} kcal
                      {mealSummary?.protein > 0 && `, ${mealSummary.protein.toFixed(0)}g Protein`}
                      {mealSummary?.carbs > 0 && `, ${mealSummary.carbs.toFixed(0)}g Carbs`}
                      {mealSummary?.fat > 0 && `, ${mealSummary.fat.toFixed(0)}g Fat`}
                      {exerciseCalories > 0 && ` • ${exerciseCalories} cal burned`}
                    </span>
                  )}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform ml-auto",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              
              {/* Add button - always visible */}
              <div className="relative ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMenuClick}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[60] min-w-[140px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFoodClick}
                      className="w-full justify-start gap-2 h-9 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Apple className="h-4 w-4" />
                      Add Food
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExerciseClick}
                      className="w-full justify-start gap-2 h-9 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Activity className="h-4 w-4" />
                      Add Exercise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t">
              {isLoading ? (
                <div className="py-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
              ) : hasEntries ? (
                <div className="py-4 space-y-3">
                  {/* Food entries */}
                  {mealEntries?.map((entry: any) => (
                    <div key={`food-${entry.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Apple className="h-4 w-4 text-green-600" />
                        <div>
                          <span className="font-medium">{entry.food_items.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {entry.amount}g
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(entry.food_items.calories_per_serving * entry.serving_multiplier)} kcal
                      </div>
                    </div>
                  ))}
                  
                  {/* Exercise entries */}
                  {exerciseEntries?.map((entry: any) => (
                    <div key={`exercise-${entry.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <div>
                          <span className="font-medium">{entry.exercise_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {entry.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-orange-600">
                        -{entry.calories_burned} kcal
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No items added yet
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <FoodSearchDialog
        isOpen={showFoodSearch}
        onOpenChange={setShowFoodSearch}
        mealGroup={mealGroup}
        date={date}
      />

      <ExerciseSearchDialog
        isOpen={showExerciseSearch}
        onOpenChange={setShowExerciseSearch}
        mealGroup={mealGroup}
        date={date}
      />
    </Card>
  );
};
