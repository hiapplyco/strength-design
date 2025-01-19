import { Button } from "@/components/ui/button";
import { ExerciseSearch } from "@/components/ExerciseSearch";
import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  GraduationCap, 
  Trophy, 
  BookOpen,
  Users,
  BarChart,
  Globe,
  Star,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { exportToCalendar } from "@/utils/calendar";

interface WorkoutDay {
  description: string;
  warmup: string;
  wod: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

const Index = () => {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const { toast } = useToast();
  const { isSpeaking, audioRef, handleSpeakWorkout } = useAudioPlayback();
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateWorkout = async () => {
    if (!generatePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for workout generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke<WeeklyWorkouts>('generate-weekly-workouts', {
        body: { prompt: generatePrompt }
      });

      if (error) throw error;

      if (data) {
        setWorkouts(data);
        toast({
          title: "Success",
          description: "Workouts generated successfully!",
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetWorkouts = () => {
    setWorkouts(null);
    setGeneratePrompt("");
  };

  if (workouts) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <Button 
          variant="ghost" 
          className="mb-8 flex items-center gap-2"
          onClick={resetWorkouts}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
        
        <h1 className="text-4xl font-oswald text-primary mb-8 italic">Your Weekly Workout Plan</h1>
        
        <div className="grid gap-8">
          {Object.entries(workouts).map(([day, workout]) => (
            <div key={day} className="bg-card rounded-xl">
              <WorkoutHeader
                title={day}
                isSpeaking={isSpeaking}
                isExporting={isExporting}
                onSpeak={() => handleSpeakWorkout(day, workouts, workout.warmup, workout.wod, workout.notes || '')}
                onExport={async () => {
                  try {
                    setIsExporting(true);
                    await exportToCalendar(day, workout.warmup, workout.wod, workout.notes || '', toast);
                  } finally {
                    setIsExporting(false);
                  }
                }}
                warmup={workout.warmup}
                wod={workout.wod}
                notes={workout.notes}
                strength={workout.strength}
              />
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Description</h3>
                  <p className="text-white">{workout.description}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
                  <p className="text-white whitespace-pre-line">{workout.warmup}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Workout of the Day</h3>
                  <p className="text-white whitespace-pre-line">{workout.wod}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
                  <p className="text-white">{workout.strength}</p>
                </div>
                
                {workout.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
                    <p className="text-white">{workout.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen">
      <ExerciseSearch />
      
      {/* Hero Section */}
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

      <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4 italic">
            Train Smarter, Not Harder
          </h2>
          <p className="text-lg text-destructive">
            From customized programming to tracking progress, Apply Your Strength is the toolset you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-4">
            <GraduationCap className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-2xl font-oswald text-primary italic">Adaptive Programming</h3>
            <p className="text-white">Precision-crafted plans tailored to your athletes' goals.</p>
          </div>
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-2xl font-oswald text-primary italic">Performance Analytics</h3>
            <p className="text-white">Data-driven insights to drive smarter decisions.</p>
          </div>
          <div className="text-center space-y-4">
            <BookOpen className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-2xl font-oswald text-primary italic">Strategic Progression</h3>
            <p className="text-white">Build lasting results through structured periodization.</p>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4 italic">
            The Ultimate Platform for Coaches
          </h2>
          <p className="text-lg text-destructive">
            Apply Your Strength combines the science of periodization with the flexibility of a modern coaching platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-card p-8 rounded-xl space-y-4">
            <Users className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary italic">Connect with Athletes</h3>
            <p className="text-white">Real-time chat, form review, and leaderboards to engage clients.</p>
          </div>
          <div className="bg-card p-8 rounded-xl space-y-4">
            <BarChart className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary italic">Build Your Program</h3>
            <p className="text-white">Design scalable training plans and save time with reusable templates.</p>
          </div>
          <div className="bg-card p-8 rounded-xl space-y-4">
            <Globe className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary italic">Grow Anywhere</h3>
            <p className="text-white">Sell your programs online or coach remotely from anywhere in the world.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16 italic">
          What Coaches Are Saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-muted p-8 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-current" />
              ))}
            </div>
            <p className="text-white mb-4">"Apply Your Strength changed how I coach my athletes—streamlined, efficient, and easy to use!"</p>
            <p className="text-primary font-oswald">– Jane D.</p>
          </div>
          <div className="bg-muted p-8 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-current" />
              ))}
            </div>
            <p className="text-white mb-4">"The analytics give me the edge I need to refine my programming and keep my clients progressing."</p>
            <p className="text-primary font-oswald">– John S.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-8 italic">
          Join a Community of Excellence
        </h2>
        <div className="w-full max-w-3xl mx-auto">
          <GenerateWorkoutInput
            generatePrompt={generatePrompt}
            setGeneratePrompt={setGeneratePrompt}
            handleGenerateWorkout={handleGenerateWorkout}
            isGenerating={isGenerating}
            setShowGenerateInput={setShowGenerateInput}
          />
        </div>
      </section>

      {/* CrossFit Link */}
      <div className="absolute top-4 right-4 max-w-md text-right">
        <Link to="/best-app-of-day" className="text-primary hover:underline font-bold inline-flex items-center">
          Check out our CrossFit focused builder→
        </Link>
        <p className="text-sm text-foreground mt-2">
          CrossFit's unique blend of complex movements and intense metrics inspired our journey.
        </p>
      </div>
    </div>
  );
};

export default Index;
