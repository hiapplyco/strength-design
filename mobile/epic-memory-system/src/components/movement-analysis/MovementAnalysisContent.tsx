
import { AnalysisForm } from "./AnalysisForm";
import { AnalysisResults } from "./AnalysisResults";
import { AnalysisTips } from "./AnalysisTips";
import { useMovementAnalysis } from "@/hooks/useMovementAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";

export const MovementAnalysisContent = () => {
  const {
    isLoading,
    isSaving,
    uploadedVideo,
    setUploadedVideo,
    question,
    setQuestion,
    analysis,
    setAnalysis,
    analysisMetadata,
    handleReset,
    handleSubmitForAnalysis,
    saveAnalysis
  } = useMovementAnalysis();

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative isolate">
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8">
              <LogoHeader>MOVEMENT ANALYSIS</LogoHeader>
              <p className="text-lg text-foreground/80 max-w-2xl mx-auto mt-4">
                Get expert AI feedback on your technique. Powered by Gemini with advanced video understanding.
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Analysis Form */}
              <div className="space-y-6">
                <AnalysisForm
                  uploadedVideo={uploadedVideo}
                  setUploadedVideo={setUploadedVideo}
                  question={question}
                  setQuestion={setQuestion}
                  analysis={analysis}
                  setAnalysis={setAnalysis}
                  isLoading={isLoading}
                  isSaving={isSaving}
                  handleSubmitForAnalysis={handleSubmitForAnalysis}
                  handleReset={handleReset}
                  saveAnalysis={saveAnalysis}
                />
                
                <AnalysisTips />
              </div>
              
              {/* Right Column - Results */}
              <div className="space-y-6">
                <AnalysisResults 
                  isLoading={isLoading} 
                  analysis={analysis} 
                />
                
                {/* Analysis Metadata Display */}
                {analysisMetadata && (
                  <div className="bg-black/20 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">Analysis Details</h4>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Model: {analysisMetadata.processingModel}</div>
                      <div>Type: {analysisMetadata.analysisType}</div>
                      {analysisMetadata.frameRate && <div>Frame Rate: {analysisMetadata.frameRate} FPS</div>}
                      {analysisMetadata.videoClipping && (
                        <div>Clipped: {analysisMetadata.videoClipping.startOffset || '0:00'} - {analysisMetadata.videoClipping.endOffset || 'end'}</div>
                      )}
                      <div>Timestamps: {analysisMetadata.timestampsUsed ? 'Enabled' : 'Disabled'}</div>
                      <div>Video Size: {(analysisMetadata.videoSize / 1024 / 1024).toFixed(2)}MB</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
