import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface AnalysisResultsProps {
  isLoading: boolean;
  analysis: string | null;
}

export const AnalysisResults = ({ isLoading, analysis }: AnalysisResultsProps) => {
  return (
    <div className="bg-black/20 border border-gray-700 rounded-lg p-4 min-h-[350px]">
      <h3 className="text-lg font-medium text-white mb-4">Analysis Results</h3>
      
      {isLoading && (
        <div className="flex items-center justify-center h-[300px]">
          <LoadingIndicator>
            Analyzing your technique...
          </LoadingIndicator>
        </div>
      )}
      
      {!isLoading && !analysis && (
        <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400">
          <div className="text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <p>Upload a video and ask a question to receive expert feedback</p>
        </div>
      )}
      
      {!isLoading && analysis && (
        <div className="overflow-y-auto h-[300px] pr-2 text-white/90">
          <div className="prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-white">
            {/* Split analysis into paragraphs and handle markdown-style headers */}
            {analysis.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('##')) {
                return <h3 key={i} className="text-primary font-medium mt-4">{paragraph.replace('##', '').trim()}</h3>;
              } else if (paragraph.startsWith('•')) {
                return <li key={i} className="ml-4">{paragraph.substring(1).trim()}</li>;
              } else if (paragraph.trim() === '') {
                return <br key={i} />;
              } else {
                return <p key={i}>{paragraph}</p>;
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};
