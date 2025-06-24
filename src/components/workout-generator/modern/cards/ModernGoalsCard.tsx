
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Target } from 'lucide-react';
import { ModernInputCard } from '../components/ModernInputCard';

interface ModernGoalsCardProps {
  prescribedExercises: string;
  onPrescribedExercisesChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernGoalsCard: React.FC<ModernGoalsCardProps> = ({
  prescribedExercises,
  onPrescribedExercisesChange,
  isExpanded,
  onToggle
}) => {
  const getPreview = () => {
    if (!prescribedExercises) return undefined;
    const words = prescribedExercises.trim().split(/\s+/).length;
    return `${words} word${words !== 1 ? 's' : ''}`;
  };

  return (
    <ModernInputCard
      icon={<Target className="h-5 w-5" />}
      title="Your Goals"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!prescribedExercises}
      preview={getPreview()}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Describe your fitness goals, preferred workout style, or any specific requirements
        </p>
        <Textarea
          placeholder="I want to build muscle in my upper body, focusing on chest and shoulders. I prefer compound movements and have about 45 minutes per session..."
          value={prescribedExercises}
          onChange={(e) => onPrescribedExercisesChange(e.target.value)}
          className="min-h-[120px] resize-none bg-background border-border/50 focus:border-green-500"
        />
      </div>
    </ModernInputCard>
  );
};
