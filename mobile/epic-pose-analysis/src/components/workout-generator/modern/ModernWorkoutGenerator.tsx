import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernWorkoutForm } from './ModernWorkoutForm';

export const ModernWorkoutGenerator: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Workout Generator</CardTitle>
        <CardDescription>
          Generate a workout plan using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 overflow-hidden">
          <ModernWorkoutForm onClose={() => console.log('Workout form closed')} />
        </div>
      </CardContent>
    </Card>
  );
};
