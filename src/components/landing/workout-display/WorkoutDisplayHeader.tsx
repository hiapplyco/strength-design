
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { HeaderActions } from "@/components/workout/header/HeaderActions";
import { WorkoutDisplayButtons } from "./WorkoutDisplayButtons";

interface WorkoutDisplayHeaderProps {
  resetWorkouts: () => void;
  isExporting: boolean;
  workoutText: string;
  allWorkouts: Record<string, any>;
}

export const WorkoutDisplayHeader = ({
  resetWorkouts,
  isExporting,
  workoutText,
  allWorkouts
}: WorkoutDisplayHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Create a copy without the _meta field for the document generation
      const workoutsForDocument = { ...allWorkouts };
      delete workoutsForDocument._meta;

      const generateTiptapDocument = httpsCallable<
        {
          workouts: Record<string, any>;
          title?: string;
          summary?: string;
        },
        { content: string }
      >(functions, 'generateTiptapDocument');

      const result = await generateTiptapDocument({
        workouts: workoutsForDocument,
        title: allWorkouts._meta?.title,
        summary: allWorkouts._meta?.summary
      });

      if (!result.data) {
        toast({
          title: "Error",
          description: "Failed to format the document. Please try again.",
          variant: "destructive"
        });
        return;
      }

      navigate('/publish-program', {
        state: {
          content: JSON.stringify(result.data),
          workoutScript: result.data?.content || JSON.stringify(workoutsForDocument)
        }
      });
    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Error",
        description: "Failed to publish the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleViewWorkouts = async () => {
    await new Promise<void>((resolve) => {
      navigate('/generated-workouts');
      resolve();
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Section */}
      {allWorkouts._meta?.summary && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl"></div>
          <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Workout Summary</h3>
                <p className="text-sm text-muted-foreground">AI-generated overview of your personalized plan</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground/90 leading-relaxed">{allWorkouts._meta.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <WorkoutDisplayButtons resetWorkouts={resetWorkouts} />
        
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={handleViewWorkouts}
            className="h-auto text-base sm:text-lg"
          >
            <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            My Workouts
          </Button>

          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-auto text-base sm:text-lg"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>

          <HeaderActions
            onExport={async () => {}}
            isExporting={isExporting}
            workoutText={workoutText}
            allWorkouts={allWorkouts}
          />
        </div>
      </div>
    </div>
  );
};
