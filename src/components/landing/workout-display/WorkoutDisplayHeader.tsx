import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExportActions } from "./ExportActions";
import { useNavigate } from "react-router-dom";

interface WorkoutDisplayHeaderProps {
  resetWorkouts: () => void;
  onExportCalendar: () => Promise<void>;
  onCopy: () => Promise<void>;
  isExporting: boolean;
  workoutText: string;
}

export const WorkoutDisplayHeader = ({
  resetWorkouts,
  onExportCalendar,
  onCopy,
  isExporting,
  workoutText
}: WorkoutDisplayHeaderProps) => {
  const navigate = useNavigate();

  const handlePublish = () => {
    // Format each section with proper HTML structure
    const formattedContent = workoutText
      .split('\n\n---\n\n')
      .map(day => {
        // Split each day into sections and wrap them in paragraphs
        const sections = day.split('\n\n').map(section => {
          // Add heading class for day titles
          if (section.startsWith('Day:')) {
            return `<h2 class="text-2xl font-bold mb-4">${section}</h2>`;
          }
          // Add specific classes for different sections
          if (section.startsWith('Strength:')) {
            return `<div class="mb-4"><h3 class="text-xl font-semibold mb-2">Strength</h3><p>${section.replace('Strength:', '')}</p></div>`;
          }
          if (section.startsWith('Warmup:')) {
            return `<div class="mb-4"><h3 class="text-xl font-semibold mb-2">Warmup</h3><p>${section.replace('Warmup:', '')}</p></div>`;
          }
          if (section.startsWith('Workout:')) {
            return `<div class="mb-4"><h3 class="text-xl font-semibold mb-2">Workout</h3><p>${section.replace('Workout:', '')}</p></div>`;
          }
          if (section.startsWith('Notes:')) {
            return `<div class="mb-4"><h3 class="text-xl font-semibold mb-2">Notes</h3><p>${section.replace('Notes:', '')}</p></div>`;
          }
          return `<p class="mb-4">${section}</p>`;
        }).join('');
        return `<div class="workout-day mb-8">${sections}</div>`;
      })
      .join('<hr class="my-8" />');

    navigate('/document-editor', { 
      state: { 
        content: `<div class="workout-content">${formattedContent}</div>`
      } 
    });
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4">
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
            className="text-2xl font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-6 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]"
          >
            Publish
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