
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Droplets, Plus, Minus } from 'lucide-react';
import { useUpdateWater } from '@/hooks/useUpdateWater';

interface WaterTrackerProps {
  consumed: number;
  target: number;
  date: Date;
}

export const WaterTracker = ({ consumed, target, date }: WaterTrackerProps) => {
  const { updateWater, isUpdating } = useUpdateWater();
  
  const percentage = Math.min((consumed / target) * 100, 100);
  const consumedOz = Math.round(consumed / 29.5735); // Convert ml to fl oz
  const targetOz = Math.round(target / 29.5735);

  const handleAddWater = (amount: number) => {
    updateWater({
      date,
      amount: consumed + amount
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <span className="font-medium">Water</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {consumedOz} / {targetOz} fl oz
        </span>
      </div>
      
      <Progress value={percentage} className="h-3 mb-3" />
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {percentage.toFixed(0)}% of daily goal
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWater(-250)}
            disabled={isUpdating || consumed <= 0}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWater(250)}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
