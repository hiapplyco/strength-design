import { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";
import { motion } from "framer-motion";
import { ChevronDown, Circle } from "lucide-react";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

const Index = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(7);
  const { toast } = useToast();

  const resetWorkouts = () => {
    setWorkouts(null);
    setShowGenerateInput(true);
  };

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    setIsGenerating(true);
    const startTime = performance.now();

    try {
      // Store input data in session_io table
      const { error: sessionError } = await supabase.from('session_io').insert({
        weather_prompt: params.weatherPrompt,
        selected_exercises: params.selectedExercises,
        fitness_level: params.fitnessLevel,
        prescribed_exercises: params.prescribedExercises,
        number_of_days: numberOfDays,
        session_duration_ms: 0, // Will be updated after workout generation
        success: false // Will be updated after successful generation
      });

      if (sessionError) {
        console.error('Error storing session:', sessionError);
      }

      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          ...params,
          numberOfDays
        }
      });

      if (error) {
        console.error('Error generating workout:', error);
        toast({
          title: "Error",
          description: "Failed to generate workout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update session with generated workouts and success status
      const sessionDuration = Math.round(performance.now() - startTime);
      const { error: updateError } = await supabase
        .from('session_io')
        .update({
          generated_workouts: data,
          session_duration_ms: sessionDuration,
          success: true
        })
        .eq('session_duration_ms', 0) // Update the session we just created
        .eq('success', false);

      if (updateError) {
        console.error('Error updating session:', updateError);
      }

      setWorkouts(data);
      setShowGenerateInput(false);
      triggerConfetti();
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (workouts) {
    return (
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
      />
    );
  }

  const NumberedCircle = ({ number }: { number: number }) => (
    <div className="relative w-6 h-6 text-accent">
      <Circle className="w-6 h-6" />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {number}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full bg-black/30 backdrop-blur-sm pt-24 pb-8">
        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] max-w-3xl mx-auto">
          strength.design
        </h1>
      </div>

      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <HeroSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <FeaturesSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <SolutionsSection />
          </div>
        </div>

        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <TestimonialsSection />
          </div>
        </div>

        <div className="relative py-20">
          <Separator className="mb-20 bg-primary/20" />
          <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-oswald text-accent mb-4">
                Try Our Free Program Generator
              </h2>
              <p className="text-lg text-white">
                Experience our lite version - Generate up to 12 days of customized training programs instantly. Perfect for elite athletes, CrossFit competitors, and strength specialists seeking personalized programming. Upgrade to access our full platform generating 8-week periodized programs tailored to any training methodology or competition framework.
              </p>
              
              <div id="input-directions" className="mt-8 max-w-2xl mx-auto text-left space-y-2 bg-white/5 p-6 rounded-lg">
                <h3 className="text-xl font-oswald text-accent mb-4 text-center">Input Order:</h3>
                <ul className="list-none space-y-3">
                  <li className="flex items-center text-white">
                    <NumberedCircle number={1} />
                    <span className="ml-3">Location - Weather affects your performance</span>
                  </li>
                  <li className="flex items-center text-white">
                    <NumberedCircle number={2} />
                    <span className="ml-3">Search Exercises & Equipment - Define your available resources</span>
                  </li>
                  <li className="flex items-center text-white">
                    <NumberedCircle number={3} />
                    <span className="ml-3">Fitness Level - Tailored to your capabilities</span>
                  </li>
                  <li className="flex items-center text-white">
                    <NumberedCircle number={4} />
                    <span className="ml-3">Prescribed Exercises - Upload images/PDFs of required movements</span>
                  </li>
                  <li className="flex items-center text-white">
                    <NumberedCircle number={5} />
                    <span className="ml-3">Injuries & Limitations - Ensures safe, appropriate programming</span>
                  </li>
                  <li className="flex items-center text-white">
                    <NumberedCircle number={6} />
                    <span className="ml-3">Training Days - Design your perfect training cycle</span>
                  </li>
                </ul>
              </div>
            </div>

            <motion.div 
              className="flex justify-center items-center my-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Separator className="my-8 bg-primary/20" />
                <motion.div 
                  className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-accent rounded-full p-2"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>

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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
