import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell } from "lucide-react";

const exercises = [
  "Push-ups",
  "Pull-ups",
  "Squats",
  "Deadlifts",
  "Bench Press",
  "Lunges",
  "Planks",
  "Burpees",
  "Mountain Climbers",
  "Jumping Jacks",
  // Add more exercises as needed
];

export function ExerciseSearch() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Exercise Selection</h3>
      </div>
      <Select>
        <SelectTrigger className="w-full bg-black/50 text-white border-2 border-primary/20">
          <SelectValue placeholder="Select exercises..." />
        </SelectTrigger>
        <SelectContent className="bg-black/95 border-primary max-h-[300px]">
          {exercises.map((exercise) => (
            <SelectItem 
              key={exercise} 
              value={exercise}
              className="text-white hover:bg-primary/20 cursor-pointer"
            >
              {exercise}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
