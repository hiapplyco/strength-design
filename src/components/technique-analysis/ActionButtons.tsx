
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  handleSubmitForAnalysis: () => void;
  handleReset: () => void;
  isLoading: boolean;
  uploadedVideo: File | null;
  question: string;
}

export const ActionButtons = ({ 
  handleSubmitForAnalysis, 
  handleReset, 
  isLoading, 
  uploadedVideo, 
  question 
}: ActionButtonsProps) => {
  return (
    <div className="flex space-x-3">
      <Button 
        onClick={handleSubmitForAnalysis} 
        disabled={!uploadedVideo || !question.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? "Analyzing..." : "Analyze My Technique"}
      </Button>
      <Button variant="outline" onClick={handleReset} disabled={isLoading}>
        Reset
      </Button>
    </div>
  );
};
