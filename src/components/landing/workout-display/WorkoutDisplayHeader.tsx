
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      
      const { data, error } = await supabase.functions.invoke('generate-tiptap-document', {
        body: { 
          workouts: workoutsForDocument,
          title: allWorkouts._meta?.title,
          summary: allWorkouts._meta?.summary
        }
      });

      if (error) {
        console.error('Error formatting document:', error);
        toast({
          title: "Error",
          description: "Failed to format the document. Please try again.",
          variant: "destructive"
        });
        return;
      }

      navigate('/publish-program', { 
        state: { 
          content: JSON.stringify(data),
          workoutScript: data?.content || JSON.stringify(workoutsForDocument)
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
    <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
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
          onExport={async () => {}} // Make this return a Promise
          isExporting={isExporting}
          workoutText={workoutText}
          allWorkouts={allWorkouts}
        />
      </div>
    </div>
  );
};
