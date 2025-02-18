
import React, { useState } from "react";
import { HeaderActions } from "./header/HeaderActions";
import { WorkoutModifier } from "./WorkoutModifier";
import { Card, CardHeader } from "@/components/ui/card";
import type { WorkoutDay } from "@/types/fitness";

interface WorkoutHeaderProps {
  title: string;
  isExporting: boolean;
  onExport: () => Promise<void>;
  warmup: string;
  workout: string;
  notes?: string;
  strength: string;
  allWorkouts: Record<string, WorkoutDay>;
  onUpdate: (updates: Partial<WorkoutDay>) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function WorkoutHeader({
  title,
  isExporting,
  onExport,
  warmup,
  workout,
  notes,
  strength,
  allWorkouts,
  onUpdate,
  searchInputRef
}: WorkoutHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h2>
        </div>
        <HeaderActions
          isExporting={isExporting}
          onExport={onExport}
          onEdit={() => setIsEditing(true)}
        />
      </CardHeader>
      {isEditing && (
        <WorkoutModifier
          warmup={warmup}
          workout={workout}
          notes={notes}
          strength={strength}
          onClose={() => setIsEditing(false)}
          onUpdate={onUpdate}
          allWorkouts={allWorkouts}
          searchInputRef={searchInputRef}
        />
      )}
    </Card>
  );
}
