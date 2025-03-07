
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon } from "lucide-react";

interface StreamlitEmbedProps {
  streamlitUrl: string;
  height?: string;
}

export const StreamlitEmbed = ({ streamlitUrl, height = "600px" }: StreamlitEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const fetchStreamlitData = async () => {
      if (!streamlitUrl) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // This is a placeholder for actual API communication
        // In a real implementation, you would make API calls to your Streamlit backend
        const response = await fetch(`${streamlitUrl}/api/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestType: 'getAnalysisData' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to connect to Streamlit application: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        console.error("Error connecting to Streamlit:", err);
        setError(err.message || "Failed to connect to the Streamlit application");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStreamlitData();
  }, [streamlitUrl]);

  const openStreamlitApp = () => {
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full border border-gray-700 rounded-lg overflow-hidden bg-black/30">
      <div className="p-3 bg-black/50 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-medium">Streamlit Analysis Tool</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openStreamlitApp} 
          className="text-xs"
        >
          Open Streamlit App <ExternalLinkIcon className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="p-4" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-12 bg-gray-800/50" />
            <Skeleton className="w-full h-40 bg-gray-800/50" />
            <Skeleton className="w-3/4 h-8 bg-gray-800/50" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={openStreamlitApp}>
              Try Opening Directly <ExternalLinkIcon className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-sm text-gray-400">
              Note: You may need to open the Streamlit application in a separate browser window 
              due to cross-origin restrictions.
            </p>
          </div>
        ) : (
          <div className="text-white">
            {data ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium mb-2">Analysis Results</h4>
                  <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>
                </div>
                <p className="text-sm text-gray-400">
                  For the full interactive experience, please open the Streamlit application using the button above.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No data available from the Streamlit application.</p>
                <Button onClick={openStreamlitApp} className="mt-4">
                  Launch Streamlit App <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
