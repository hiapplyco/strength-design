
import React from 'react';
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface PresetCardProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  level: string;
  days: number;
}

export function PresetCard({ 
  title, 
  description, 
  isSelected,
  onClick,
  level,
  days
}: PresetCardProps) {
  const { theme } = useTheme();
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative p-6 cursor-pointer transform transition-all duration-200 hover:scale-[1.02]",
        theme === 'light' ? 'bg-white/80' : 'bg-black/50',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="space-y-4">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-transparent">
          {title}
        </h3>
        <div className="flex gap-2">
          <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
            {level}
          </span>
          <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
            {days} days
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </Card>
  );
}
