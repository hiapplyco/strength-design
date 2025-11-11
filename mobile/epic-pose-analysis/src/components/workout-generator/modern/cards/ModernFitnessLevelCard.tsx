
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { ModernInputCard } from '../components/ModernInputCard';

interface ModernFitnessLevelCardProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernFitnessLevelCard: React.FC<ModernFitnessLevelCardProps> = ({
  fitnessLevel,
  onFitnessLevelChange,
  isExpanded,
  onToggle
}) => {
  const getPreview = () => {
    if (!fitnessLevel) return undefined;
    return fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1);
  };

  return (
    <ModernInputCard
      icon={<User className="h-5 w-5" />}
      title="Fitness Level"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!fitnessLevel}
      preview={getPreview()}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Select your current fitness experience level
        </p>
        <Select
          value={fitnessLevel}
          onValueChange={onFitnessLevelChange}
        >
          <SelectTrigger className="bg-background border-border/50 focus:border-green-500">
            <SelectValue placeholder="Select your fitness level" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
            <SelectItem value="intermediate">Intermediate (6+ months)</SelectItem>
            <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
            <SelectItem value="expert">Expert (5+ years)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ModernInputCard>
  );
};
