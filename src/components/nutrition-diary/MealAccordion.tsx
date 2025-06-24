
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, Apple, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodSearchDialog } from './FoodSearchDialog';
import { useMealEntries } from '../hooks/useMealEntries';

interface MealAccordionProps {
  mealGroup: string;
  nutritionLogId?: string;
  date: Date;
}

export const MealAccordion = ({ mealGroup, nutritionLogId, date }: MealAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { mealEntries, mealSummary, isLoading } = useMealEntries(nutritionLogId, mealGroup);

  const hasEntries = mealEntries && mealEntries.length > 0;

  React.useEffect(() => {
    if (hasEntries && !isOpen) {
      setIsOpen(true);
    }
  }, [hasEntries, isOpen]);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium capitalize">{mealGroup}</span>
                {hasEntries && (
                  <span className="text-sm text-muted-foreground">
                    {mealSummary?.calories.toFixed(0)} kcal, {mealSummary?.protein.toFixed(0)}g Protein, {mealSummary?.carbs.toFixed(0)}g Carbs, {mealSummary?.fat.toFixed(0)}g Fat
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMenu(!showAddMenu);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  {showAddMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFoodSearch(true);
                          setShowAddMenu(false);
                        }}
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Apple className="h-4 w-4" />
                        Add Food
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Activity className="h-4 w-4" />
                        Add Exercise
                      </Button>
                    </div>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t">
            {isLoading ? (
              <div className="py-4 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
              </div>
            ) : hasEntries ? (
              <div className="py-4 space-y-3">
                {mealEntries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{entry.food_items.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {entry.amount}g
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(entry.food_items.calories_per_serving * entry.serving_multiplier)} kcal
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

      <FoodSearchDialog
        isOpen={showFoodSearch}
        onOpenChange={setShowFoodSearch}
        mealGroup={mealGroup}
        date={date}
      />
    </Card>
  );
};
