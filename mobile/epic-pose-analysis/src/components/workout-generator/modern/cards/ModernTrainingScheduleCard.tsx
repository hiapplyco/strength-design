
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Calendar } from 'lucide-react';
import { ModernInputCard } from '../components/ModernInputCard';

interface ModernTrainingScheduleCardProps {
  numberOfDays: number;
  numberOfCycles: number;
  onNumberOfDaysChange: (value: number) => void;
  onNumberOfCyclesChange: (value: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernTrainingScheduleCard: React.FC<ModernTrainingScheduleCardProps> = ({
  numberOfDays,
  numberOfCycles,
  onNumberOfDaysChange,
  onNumberOfCyclesChange,
  isExpanded,
  onToggle
}) => {
  const getPreview = () => {
    const hasCustomSchedule = numberOfDays !== 7 || numberOfCycles !== 1;
    if (!hasCustomSchedule) return undefined;
    return `${numberOfDays}d × ${numberOfCycles}c`;
  };

  return (
    <ModernInputCard
      icon={<Calendar className="h-5 w-5" />}
      title="Training Schedule"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={numberOfDays !== 7 || numberOfCycles !== 1}
      preview={getPreview()}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Configure your workout frequency and duration
        </p>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Days per cycle</label>
              <span className="text-sm text-muted-foreground">{numberOfDays} days</span>
            </div>
            <Slider
              value={[numberOfDays]}
              onValueChange={([value]) => onNumberOfDaysChange(value)}
              min={1}
              max={7}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>7</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Number of cycles</label>
              <span className="text-sm text-muted-foreground">{numberOfCycles} cycle{numberOfCycles !== 1 ? 's' : ''}</span>
            </div>
            <Slider
              value={[numberOfCycles]}
              onValueChange={([value]) => onNumberOfCyclesChange(value)}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>4</span>
            </div>
          </div>
        </div>
      </div>
    </ModernInputCard>
  );
};
