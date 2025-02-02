import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutDisplayHeaderProps {
  resetWorkouts: () => void;
  isExporting: boolean;
  workoutText: string;
  allWorkouts: Record<string, any>;
}

export const WorkoutDisplayHeader = ({
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

  const handleViewWorkouts = () => {
    navigate('/generated-workouts');
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <Button
          onClick={handleViewWorkouts}
          className="w-full sm:w-auto text-lg font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-4 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]"
        >
          <Database className="w-5 h-5 mr-2" />
          My Workouts
        </Button>

        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full sm:w-auto text-lg font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-4 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]"
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
};