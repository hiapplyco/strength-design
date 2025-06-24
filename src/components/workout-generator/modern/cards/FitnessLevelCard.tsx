
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MessageSquare } from 'lucide-react';

interface FitnessLevelCardProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
}

export const FitnessLevelCard: React.FC<FitnessLevelCardProps> = ({
  fitnessLevel,
  onFitnessLevelChange
}) => {
  return (
    <Card className={`transition-colors duration-300 ${fitnessLevel ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" />
          Fitness Level
          {fitnessLevel && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={fitnessLevel}
          onValueChange={onFitnessLevelChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your fitness level" />
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-lg z-50">
            <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
            <SelectItem value="intermediate">Intermediate (6+ months)</SelectItem>
            <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
            <SelectItem value="expert">Expert (5+ years)</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
