
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SaveIcon } from "lucide-react";

interface ActionButtonsProps {
  handleSubmitForAnalysis: () => void;
  handleReset: () => void;
  saveAnalysis: () => void;
  isLoading: boolean;
  isSaving: boolean;
  uploadedVideo: File | null;
  question: string;
  analysis: string | null;
}

export const ActionButtons = ({ 
  handleSubmitForAnalysis, 
  handleReset, 
  saveAnalysis,
  isLoading, 
  isSaving,
  uploadedVideo, 
  question,
  analysis
}: ActionButtonsProps) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col space-y-3">
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
      
      {analysis && user && (
        <Button 
          onClick={saveAnalysis} 
          disabled={isSaving || !analysis}
          variant="secondary"
          className="w-full"
        >
          {isSaving ? "Saving..." : (
            <>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Analysis to My Account
            </>
          )}
        </Button>
      )}
    </div>
  );
};
