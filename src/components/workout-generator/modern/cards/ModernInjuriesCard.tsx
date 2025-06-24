
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { ModernInputCard } from '../components/ModernInputCard';

interface ModernInjuriesCardProps {
  injuries: string;
  onInjuriesChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernInjuriesCard: React.FC<ModernInjuriesCardProps> = ({
  injuries,
  onInjuriesChange,
  isExpanded,
  onToggle
}) => {
  const getPreview = () => {
    if (!injuries) return undefined;
    const lines = injuries.trim().split('\n').filter(line => line.trim()).length;
    return `${lines} item${lines !== 1 ? 's' : ''}`;
  };

  return (
    <ModernInputCard
      icon={<AlertTriangle className="h-5 w-5" />}
      title="Injuries & Limitations"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!injuries}
      preview={getPreview()}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          List any injuries, physical limitations, or exercises to avoid
        </p>
        <Textarea
          placeholder="Lower back injury - avoid deadlifts and heavy squats&#10;Right shoulder impingement - no overhead pressing&#10;Knee issues - prefer low-impact exercises..."
          value={injuries}
          onChange={(e) => onInjuriesChange(e.target.value)}
          className="min-h-[100px] resize-none bg-background border-border/50 focus:border-green-500"
        />
      </div>
    </ModernInputCard>
  );
};
