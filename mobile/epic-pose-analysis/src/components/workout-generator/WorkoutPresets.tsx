
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PRESET_CONFIGS } from "./constants/workoutPresets";
import { useTheme } from "@/contexts/ThemeContext";
import { PresetHeader } from "./components/presets/PresetHeader";
import { PresetGrid } from "./components/presets/PresetGrid";
import { PresetOverlay } from "./components/presets/PresetOverlay";

interface WorkoutPresetsProps {
  onSelectPreset: (preset: {
    title: string;
    prescribedExercises: string;
    fitnessLevel: string;
    numberOfDays: number;
  }) => void;
  currentPrescribedExercises?: string;
}

export function WorkoutPresets({
  onSelectPreset,
  currentPrescribedExercises = ""
}: WorkoutPresetsProps) {
  const [selectedWorkouts, setSelectedWorkouts] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const { theme } = useTheme();

  const handleWorkoutSelect = async (category: string, workoutName: string) => {
    const preset = PRESET_CONFIGS[workoutName as keyof typeof PRESET_CONFIGS];
    if (!preset) return;

    setSelectedWorkouts({
      [category]: workoutName
    });

    const newWorkoutContent = `${preset.title}\n\nWorkout Details:\n${preset.prescribedExercises}`;
    const updatedExercises = currentPrescribedExercises 
      ? `${currentPrescribedExercises}\n\n------ NEW WORKOUT ------\n\n${newWorkoutContent}`
      : newWorkoutContent;

    onSelectPreset({
      title: preset.title,
      prescribedExercises: updatedExercises,
      fitnessLevel: preset.fitnessLevel,
      numberOfDays: preset.numberOfDays
    });
  };

  if (!visible) return null;

  return (
    <div className={`space-y-4 relative rounded-lg p-4 overflow-hidden ${
      theme === 'light' ? 'bg-white/30' : 'bg-black/30'
    }`}>
      <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
      <div className={`absolute inset-[1px] rounded-[calc(0.5rem-1px)] ${
        theme === 'light' ? 'bg-white/80' : 'bg-black/30'
      }`}></div>

      <PresetHeader onClose={() => setVisible(false)} />

      <Button 
        variant="outline" 
        className={`w-full flex items-center justify-between relative z-10 overflow-hidden ${
          theme === 'light'
            ? 'bg-white/70 text-gray-800 border border-gray-200'
            : 'bg-black/50 text-white border border-transparent'
        }`}
        onClick={() => setShowPresets(!showPresets)}
      >
        <span className="text-sm sm:text-base truncate pr-2 relative z-10">
          Start with a pre-filled workout?
        </span>
        {showPresets ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </Button>

      {showPresets && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-center mb-4`}>
            Drawing from our database of thousands of user-submitted and expert-curated workouts, we've handpicked some 
            popular training templates to help you get started.
          </p>

          <PresetGrid 
            selectedWorkouts={selectedWorkouts}
            onWorkoutSelect={handleWorkoutSelect}
          />

          <PresetOverlay isShown={isExtracting} />
        </div>
      )}
    </div>
  );
}
