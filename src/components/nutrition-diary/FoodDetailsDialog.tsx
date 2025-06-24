
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Database, Globe } from 'lucide-react';
import { MacroDonutChart } from './MacroDonutChart';
import { useAddMealEntry } from '@/hooks/useAddMealEntry';
import type { NormalizedFood } from '@/services/usdaApi';

interface FoodDetailsDialogProps {
  food: NormalizedFood;
  mealGroup: string;
  date: Date;
  onBack: () => void;
  onClose: () => void;
}

export const FoodDetailsDialog = ({ food, mealGroup, date, onBack, onClose }: FoodDetailsDialogProps) => {
  const [amount, setAmount] = useState(food.serving_size.toString());
  const [servingSize, setServingSize] = useState('1');
  const { addMealEntry, isLoading } = useAddMealEntry();

  // Calculate nutritional values based on amount
  const multiplier = (parseFloat(amount) || 0) / food.serving_size;
  const calories = food.calories_per_serving * multiplier;
  const protein = food.protein_per_serving * multiplier;
  const carbs = food.carbs_per_serving * multiplier;
  const fat = food.fat_per_serving * multiplier;
  const fiber = food.fiber_per_serving * multiplier;

  const handleAddToDiary = async () => {
    try {
      // For USDA foods, we need to save them to our local database first
      if (food.data_source === 'usda') {
        await addMealEntry({
          usdaFood: food,
          mealGroup,
          date,
          amount: parseFloat(amount),
          servingMultiplier: multiplier
        });
      } else {
        await addMealEntry({
          foodId: food.id,
          mealGroup,
          date,
          amount: parseFloat(amount),
          servingMultiplier: multiplier
        });
      }
      onClose();
    } catch (error) {
      console.error('Error adding food to diary:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <DialogTitle>{food.name}</DialogTitle>
              <Badge variant={food.data_source === 'usda' ? 'default' : 'secondary'}>
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
          </div>
          {food.brand && (
            <p className="text-sm text-muted-foreground">{food.brand}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Energy Summary */}
          <div className="flex justify-center">
            <MacroDonutChart
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              size={180}
            />
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="serving-size">Serving Size</Label>
                <Select value={servingSize} onValueChange={setServingSize}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{food.serving_size}{food.serving_unit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Nutrition Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Calories:</span>
                  <span className="font-medium">{calories.toFixed(0)} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-medium">{protein.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbohydrates:</span>
                  <span className="font-medium">{carbs.toFixed(1)}g</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fat:</span>
                  <span className="font-medium">{fat.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fiber:</span>
                  <span className="font-medium">{fiber.toFixed(1)}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <Button 
            onClick={handleAddToDiary}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Adding...' : 'ADD TO DIARY'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
