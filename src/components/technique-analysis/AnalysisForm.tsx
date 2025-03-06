
import { VideoUploadSection } from "./VideoUploadSection";
import { QuestionInput } from "./QuestionInput";
import { ActionButtons } from "./ActionButtons";

interface AnalysisFormProps {
  uploadedVideo: File | null;
  setUploadedVideo: (file: File | null) => void;
  question: string;
  setQuestion: (question: string) => void;
  analysis: string | null;
  setAnalysis: (analysis: string | null) => void;
  isLoading: boolean;
  isSaving: boolean;
  handleSubmitForAnalysis: () => void;
  handleReset: () => void;
  saveAnalysis: () => void;
}

export const AnalysisForm = ({
  uploadedVideo,
  setUploadedVideo,
  question,
  setQuestion,
  analysis,
  setAnalysis,
  isLoading,
  isSaving,
  handleSubmitForAnalysis,
  handleReset,
  saveAnalysis
}: AnalysisFormProps) => {
  return (
    <div className="space-y-6">
      <VideoUploadSection 
        uploadedVideo={uploadedVideo} 
        setUploadedVideo={setUploadedVideo}
        setAnalysis={setAnalysis}
      />
      
      <QuestionInput 
        question={question} 
        setQuestion={setQuestion} 
      />
      
      <ActionButtons 
        handleSubmitForAnalysis={handleSubmitForAnalysis}
        handleReset={handleReset}
        saveAnalysis={saveAnalysis}
        isLoading={isLoading}
        isSaving={isSaving}
        uploadedVideo={uploadedVideo}
        question={question}
        analysis={analysis}
      />
    </div>
  );
};
