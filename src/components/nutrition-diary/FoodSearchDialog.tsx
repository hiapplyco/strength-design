
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { useFoodItems } from '@/hooks/useFoodItems';
import { FoodDetailsDialog } from './FoodDetailsDialog';

interface FoodSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mealGroup: string;
  date: Date;
}

export const FoodSearchDialog = ({ isOpen, onOpenChange, mealGroup, date }: FoodSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const { foodItems, isLoading } = useFoodItems(searchQuery);

  const handleFoodSelect = (food: any) => {
    setSelectedFood(food);
  };

  const handleBack = () => {
    setSelectedFood(null);
  };

  const handleClose = () => {
    setSelectedFood(null);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen && !selectedFood} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Food</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="favorites" disabled>Favorites</TabsTrigger>
                <TabsTrigger value="custom" disabled>Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-2 mt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : foodItems.length > 0 ? (
                  <div className="space-y-2">
                    {foodItems.map((food: any) => (
                      <Button
                        key={food.id}
                        variant="ghost"
                        onClick={() => handleFoodSelect(food)}
                        className="w-full justify-start h-auto p-4"
                      >
                        <div className="text-left">
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.brand && `${food.brand} • `}
                            {food.calories_per_serving} kcal per {food.serving_size}{food.serving_unit}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No foods found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Start typing to search for foods
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {selectedFood && (
        <FoodDetailsDialog
          food={selectedFood}
          mealGroup={mealGroup}
          date={date}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}
    </>
  );
};
