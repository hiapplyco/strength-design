import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExportActions } from "./ExportActions";
import { useNavigate } from "react-router-dom";
import { formatWorkoutToMarkdown } from "@/utils/workout-formatting";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutDisplayHeaderProps {
  resetWorkouts: () => void;
  onExportCalendar: () => Promise<void>;
  onCopy: () => Promise<void>;
  isExporting: boolean;
  workoutText: string;
  allWorkouts: Record<string, any>;
}

export const WorkoutDisplayHeader = ({
  resetWorkouts,
  onExportCalendar,
  onCopy,
  isExporting,
  workoutText,
  allWorkouts
}: WorkoutDisplayHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      
      // Call the Gemini function to format the workout
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

      // Navigate to document editor with the formatted content
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

  return (
    <div 
      className={`fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2"
          onClick={resetWorkouts}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>

        <div className="flex items-center gap-4">
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="text-2xl font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-6 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
          
          <ExportActions
            onExportCalendar={onExportCalendar}
            onCopy={onCopy}
            isExporting={isExporting}
            workoutText={workoutText}
          />
        </div>
      </div>
    </div>
  );
};