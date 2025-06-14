
import { VideoUploadSection } from "./VideoUploadSection";
import { QuestionInput } from "./QuestionInput";
import { AnalysisOptionsForm } from "./AnalysisOptionsForm";
import { ActionButtons } from "./ActionButtons";
import { useState } from "react";

interface AnalysisOptions {
  analysisType?: 'technique' | 'form' | 'performance' | 'beginner' | 'injury-prevention';
  customFrameRate?: number;
  startOffset?: string;
  endOffset?: string;
  useTimestamps?: boolean;
  customSystemPrompt?: string;
}

interface AnalysisFormProps {
  uploadedVideo: File | null;
  setUploadedVideo: (file: File | null) => void;
  question: string;
  setQuestion: (question: string) => void;
  analysis: string | null;
  setAnalysis: (analysis: string | null) => void;
  isLoading: boolean;
  isSaving: boolean;
  handleSubmitForAnalysis: (options?: AnalysisOptions) => void;
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
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    analysisType: 'technique',
    useTimestamps: true
  });

  const handleAnalysisSubmit = () => {
    handleSubmitForAnalysis(analysisOptions);
  };

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
      
      <AnalysisOptionsForm
        options={analysisOptions}
        onOptionsChange={setAnalysisOptions}
      />
      
      <ActionButtons 
        handleSubmitForAnalysis={handleAnalysisSubmit}
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
