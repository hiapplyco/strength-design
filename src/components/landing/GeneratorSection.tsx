
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { InputDirections } from "./InputDirections";
import { useEffect, useState } from "react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const updateScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  const renderTooltip = (content: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-white/60 hover:text-white/80 transition-colors" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center min-h-screen w-full px-2 sm:px-4 py-12 transition-all duration-300 ${
        hasScrolled ? 'bg-black/90' : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <motion.div 
          className="text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-oswald text-accent mb-4 tracking-tight transition-all duration-300 ${
            hasScrolled ? 'scale-90' : 'scale-100'
          }`}>
            Generate Your Program
          </h2>
          <div className={`text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8 transition-all duration-300 ${
            hasScrolled ? 'opacity-80' : 'opacity-100'
          }`}>
            <p className="mb-2">Generate up to 12 days of customized training programs instantly, perfect for elite athletes, CrossFit competitors, and strength specialists.</p>
          </div>
        </motion.div>

        <div className="w-full max-w-3xl mx-auto">
          <InputDirections />
        </div>

        <div id="generate-workout" className="w-full max-w-3xl mx-auto overflow-x-hidden">
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
      
      <Separator className="mt-12 bg-primary/20 w-full max-w-5xl mx-auto" />
    </motion.div>
  );
};
