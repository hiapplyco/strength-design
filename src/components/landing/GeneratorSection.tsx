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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-oswald text-accent mb-4 tracking-tight">
            Generate Your Free Program
          </h2>
          <div className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8 space-y-2">
            <p>Experience our lite version:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Generate up to 12 days of customized training programs instantly</li>
              <li>Perfect for elite athletes</li>
              <li>Ideal for CrossFit competitors</li>
              <li>Designed for strength specialists seeking personalized programming</li>
            </ul>
          </div>
        </div>
        
        <div className="container mx-auto max-w-[1000px]">
          <InputDirections />
        </div>

        <div id="generate-workout" className="w-full">
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
      
      <Separator className="mt-12 bg-primary/20" />
    </div>
  );
};