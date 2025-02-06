import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { InputDirections } from "./InputDirections";

interface GeneratorSectionProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: any) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  showGenerateInput: boolean;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export const GeneratorSection = ({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  showGenerateInput,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
}: GeneratorSectionProps) => {
  return (
    <div className="relative py-8">
      <Separator className="mb-20 bg-primary/20" />
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-oswald text-accent mb-4">
          Try Our Free Program Generator
        </h2>
        <p className="text-lg text-white">
          Experience our lite version - Generate up to 12 days of customized training programs instantly. Perfect for elite athletes, CrossFit competitors, and strength specialists seeking personalized programming. Upgrade to access our full platform generating 8-week periodized programs tailored to any training methodology or competition framework.
        </p>
        
        <div className="container mx-auto px-4 max-w-[1200px]">
          <InputDirections />
        </div>
      </div>

      <div id="generate-workout">
        <GenerateWorkoutInput
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
          handleGenerateWorkout={handleGenerateWorkout}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          showGenerateInput={showGenerateInput}
          setShowGenerateInput={setShowGenerateInput}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
        />
      </div>
    </div>
  );
};