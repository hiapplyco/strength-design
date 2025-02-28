
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
      
      const { data, error } = await supabase.functions.invoke('generate-tiptap-document', {
        body: { workouts: allWorkouts }
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

      navigate('/document-editor', { 
        state: { 
          content: JSON.stringify(data)
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
          className="h-auto text-base sm:text-lg font-oswald font-bold text-black dark:text-white 
            transform -skew-x-12 uppercase tracking-wider text-center border-[2px] sm:border-[3px] 
            border-black rounded-md px-3 py-1.5 sm:px-4 sm:py-2 
            shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),3px_3px_0px_0px_#C4A052,6px_6px_0px_0px_rgba(0,0,0,1)] 
            hover:shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] 
            transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E] flex items-center gap-2"
        >
          <div className="relative">
            <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md"></div>
          </div>
          My Workouts
        </Button>

        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="h-auto text-base sm:text-lg font-oswald font-bold text-black dark:text-white 
            transform -skew-x-12 uppercase tracking-wider text-center border-[2px] sm:border-[3px] 
            border-black rounded-md px-3 py-1.5 sm:px-4 sm:py-2 
            shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),3px_3px_0px_0px_#C4A052,6px_6px_0px_0px_rgba(0,0,0,1)] 
            hover:shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] 
            transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E] flex items-center gap-2"
        >
          <div className="relative">
            <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md"></div>
          </div>
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
