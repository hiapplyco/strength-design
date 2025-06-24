
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Calendar, MessageSquare } from 'lucide-react';

interface TrainingScheduleCardProps {
  numberOfDays: number;
  numberOfCycles: number;
  onNumberOfDaysChange: (value: number) => void;
  onNumberOfCyclesChange: (value: number) => void;
}

export const TrainingScheduleCard: React.FC<TrainingScheduleCardProps> = ({
  numberOfDays,
  numberOfCycles,
  onNumberOfDaysChange,
  onNumberOfCyclesChange
}) => {
  const hasCustomSchedule = numberOfDays !== 7 || numberOfCycles !== 1;

  return (
    <Card className={`transition-colors duration-300 ${hasCustomSchedule ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-primary" />
          Training Schedule
          {hasCustomSchedule && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Days per cycle: {numberOfDays}
          </label>
          <Slider
            value={[numberOfDays]}
            onValueChange={([value]) => onNumberOfDaysChange(value)}
            min={1}
            max={7}
            step={1}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Number of cycles: {numberOfCycles}
          </label>
          <Slider
            value={[numberOfCycles]}
            onValueChange={([value]) => onNumberOfCyclesChange(value)}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};
