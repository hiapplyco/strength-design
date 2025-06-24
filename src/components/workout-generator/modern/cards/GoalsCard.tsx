
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Target, MessageSquare } from 'lucide-react';

interface GoalsCardProps {
  prescribedExercises: string;
  onPrescribedExercisesChange: (value: string) => void;
}

export const GoalsCard: React.FC<GoalsCardProps> = ({
  prescribedExercises,
  onPrescribedExercisesChange
}) => {
  return (
    <Card className={`transition-colors duration-300 ${prescribedExercises ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Your Goals
          {prescribedExercises && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Describe your fitness goals, preferred workout style, or any specific requirements..."
          value={prescribedExercises}
          onChange={(e) => onPrescribedExercisesChange(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </CardContent>
    </Card>
  );
};
