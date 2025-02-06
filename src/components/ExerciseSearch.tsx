import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell } from "lucide-react";
import type { Exercise } from "./exercise-search/types";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  selectedExercises?: Exercise[];
}

export function ExerciseSearch({ onExerciseSelect, selectedExercises = [] }: ExerciseSearchProps) {
  const exercises = [
    { name: "Push-ups", level: "beginner", instructions: ["Standard push-up form"] },
    { name: "Pull-ups", level: "intermediate", instructions: ["Standard pull-up form"] },
    { name: "Squats", level: "beginner", instructions: ["Standard squat form"] },
    { name: "Deadlifts", level: "intermediate", instructions: ["Standard deadlift form"] },
    { name: "Bench Press", level: "intermediate", instructions: ["Standard bench press form"] },
    { name: "Lunges", level: "beginner", instructions: ["Standard lunge form"] },
    { name: "Planks", level: "beginner", instructions: ["Standard plank form"] },
    { name: "Burpees", level: "intermediate", instructions: ["Standard burpee form"] },
    { name: "Mountain Climbers", level: "beginner", instructions: ["Standard mountain climber form"] },
    { name: "Jumping Jacks", level: "beginner", instructions: ["Standard jumping jack form"] },
  ];

  const handleSelect = (exerciseName: string) => {
    const exercise = exercises.find(ex => ex.name === exerciseName);
    if (exercise && onExerciseSelect) {
      onExerciseSelect(exercise);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Exercise Selection</h3>
      </div>
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-full bg-black/50 text-white border-2 border-primary/20">
          <SelectValue placeholder="Select exercises..." />
        </SelectTrigger>
        <SelectContent className="bg-black/95 border-primary max-h-[300px]">
          {exercises.map((exercise) => (
            <SelectItem 
              key={exercise.name} 
              value={exercise.name}
              className="text-white hover:bg-primary/20 cursor-pointer"
            >
              {exercise.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}