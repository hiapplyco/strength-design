import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WorkoutPreset {
  title: string;
  prescribedExercises: string;
  fitnessLevel: string;
  numberOfDays: number;
}

const PRESETS: WorkoutPreset[] = [
  {
    title: "CrossFit Program",
    prescribedExercises: `CrossFit-Inspired Program: "The Functional Firestorm"

Week 1 & Week 2 (Repeat with added intensity):
Day 1:
- Strength: Back Squat 5x5 @ 75% of 1-rep max
- Conditioning: AMRAP (10 minutes):
  - 10 Thrusters (95/65 lbs)
  - 10 Pull-ups
  - 200m Run

Day 3:
- Strength: Deadlift 5x3 @ 80% of max
- Conditioning: EMOM (12 minutes):
  - Odd Minutes: 15 Kettlebell Swings
  - Even Minutes: 10 Burpees

Day 5:
- Strength: Shoulder Press 7x3 @ 70% of max
- Conditioning: For Time:
  - 400m Run
  - 21-15-9 Reps of Deadlifts and Box Jumps`,
    fitnessLevel: "advanced",
    numberOfDays: 5
  },
  {
    title: "Military Precision",
    prescribedExercises: `Military Precision Fitness Program by Erik Bartell

Week Breakdown:
Day 1 & Day 8: Assessment Day
- Push-ups, Pull-ups, Squats, and timed mile run

Day 2 & Day 9: Cardio Capacity Work
- Ruck or run for distance (30-45 minutes)
- Aim to improve pace in Week 2

Day 4 & Day 11: Strength Circuit
AMRAP in 15 minutes:
- Push-ups x15
- Air Squats x20
- Lunges x10 per leg
- Plank Hold x30 seconds`,
    fitnessLevel: "advanced",
    numberOfDays: 5
  },
  {
    title: "Yoga Flow",
    prescribedExercises: `Two-Week Yoga Flow Program

Daily Routine (30-45 minutes):
Days 1-6 & Days 8-13: Vinyasa Flow Sequence
- Sun Salutations A & B (5 rounds)
- Warrior Series (I, II, III) with transitions
- Core Flow: Plank to Side Plank
- Cooldown stretches

Days 7 & 14: Restorative Yoga
- Deep stretches (Pigeon Pose, Child's Pose)
- Hold poses for up to two minutes`,
    fitnessLevel: "intermediate",
    numberOfDays: 5
  }
];

interface WorkoutPresetsProps {
  onSelectPreset: (preset: WorkoutPreset) => void;
}

export function WorkoutPresets({ onSelectPreset }: WorkoutPresetsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Try a Sample Program</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESETS.map((preset) => (
          <Card 
            key={preset.title}
            className="p-4 bg-black/50 border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => onSelectPreset(preset)}
          >
            <Button 
              variant="ghost" 
              className="w-full h-full text-lg font-semibold text-white hover:text-primary"
            >
              {preset.title}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}