import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { ExerciseSearch } from "@/components/ExerciseSearch";

interface HeroSectionProps {
  generatePrompt: string;
  setGeneratePrompt: (prompt: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (show: boolean) => void;
}

export const HeroSection = ({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput
}: HeroSectionProps) => {
  return (
    <>
      <ExerciseSearch />
      <section className="flex flex-col items-center justify-center space-y-8 pt-12 pb-20">
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-oswald uppercase tracking-tight text-primary text-center max-w-4xl italic">
            Build Stronger, Train Smarter
          </h1>
          <p className="text-2xl font-oswald text-destructive text-center italic">
            with A.Y.S
          </p>
        </div>
        <p className="text-xl md:text-2xl text-destructive font-semibold text-center max-w-2xl">
          Empower your athletes with collegiate-level training tools that build consistency, adaptability, and growth.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
          <GenerateWorkoutInput
            generatePrompt={generatePrompt}
            setGeneratePrompt={setGeneratePrompt}
            handleGenerateWorkout={handleGenerateWorkout}
            isGenerating={isGenerating}
            setShowGenerateInput={setShowGenerateInput}
          />
        </div>
      </section>
    </>
  );
};