
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Globe } from 'lucide-react';
import { useEnhancedFoodSearch } from '@/hooks/useEnhancedFoodSearch';
import { FoodDetailsDialog } from './FoodDetailsDialog';
import type { NormalizedFood } from '@/services/usdaApi';

interface FoodSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mealGroup: string;
  date: Date;
}

export const FoodSearchDialog = ({ isOpen, onOpenChange, mealGroup, date }: FoodSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);
  const { foods, isLoading, hasUSDAError, localCount, usdaCount } = useEnhancedFoodSearch(searchQuery);

  const handleFoodSelect = (food: NormalizedFood) => {
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

            {/* Search Results Summary */}
            {searchQuery && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Local: {localCount}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  USDA: {usdaCount}
                </span>
                {hasUSDAError && (
                  <span className="text-orange-500">(USDA search unavailable)</span>
                )}
              </div>
            )}
            
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Results</TabsTrigger>
                <TabsTrigger value="local">Local Database</TabsTrigger>
                <TabsTrigger value="usda">USDA Database</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-2 mt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : foods.length > 0 ? (
                  <div className="space-y-2">
                    {foods.map((food) => (
                      <Button
                        key={food.id}
                        variant="ghost"
                        onClick={() => handleFoodSelect(food)}
                        className="w-full justify-start h-auto p-4"
                      >
                        <div className="text-left w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{food.name}</span>
                            <Badge 
                              variant={food.data_source === 'usda' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {food.data_source === 'usda' ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  USDA
                                </>
                              ) : (
                                <>
                                  <Database className="h-3 w-3 mr-1" />
                                  Local
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {food.brand && `${food.brand} • `}
                            {Math.round(food.calories_per_serving)} kcal per {food.serving_size}{food.serving_unit}
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
                    Start typing to search for foods from local database and USDA
                  </div>
                )}
              </TabsContent>

              <TabsContent value="local" className="space-y-2 mt-4">
                {foods.filter(f => f.data_source === 'local').length > 0 ? (
                  <div className="space-y-2">
                    {foods.filter(f => f.data_source === 'local').map((food) => (
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
                            {Math.round(food.calories_per_serving)} kcal per {food.serving_size}{food.serving_unit}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No local foods found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="usda" className="space-y-2 mt-4">
                {foods.filter(f => f.data_source === 'usda').length > 0 ? (
                  <div className="space-y-2">
                    {foods.filter(f => f.data_source === 'usda').map((food) => (
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
                            {Math.round(food.calories_per_serving)} kcal per {food.serving_size}{food.serving_unit}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : hasUSDAError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    USDA search is currently unavailable
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No USDA foods found
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
