
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MessageSquare } from 'lucide-react';

interface InjuriesCardProps {
  injuries: string;
  onInjuriesChange: (value: string) => void;
}

export const InjuriesCard: React.FC<InjuriesCardProps> = ({
  injuries,
  onInjuriesChange
}) => {
  return (
    <Card className={`transition-colors duration-300 ${injuries ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Injuries & Limitations
          {injuries && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Any injuries, physical limitations, or exercises to avoid..."
          value={injuries}
          onChange={(e) => onInjuriesChange(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </CardContent>
    </Card>
  );
};
