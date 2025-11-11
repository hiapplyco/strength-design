
import React, { useState } from "react";
import { Mic, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface MicrophoneWidgetProps {
  data: any;
  onDataChange: (data: any) => void;
}

export const MicrophoneWidget: React.FC<MicrophoneWidgetProps> = ({ data, onDataChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<string[]>(data?.recordings || []);
  
  const startRecording = () => {
    setIsRecording(true);
    // Implement actual recording functionality
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    // Save recording
    const newRecordings = [...recordings, `Recording ${recordings.length + 1}`];
    setRecordings(newRecordings);
    onDataChange({ ...data, recordings: newRecordings });
  };
  
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-center p-2 bg-muted/30 rounded-md mb-2">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">Recording...</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-2" 
              onClick={stopRecording}
            >
              <Square className="h-3 w-3 mr-1" /> Stop
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-primary/10 hover:bg-primary/20" 
            onClick={startRecording}
          >
            <Mic className="h-3 w-3 mr-1" /> Record
          </Button>
        )}
      </div>
      
      {recordings.length > 0 && (
        <>
          <Separator />
          <div className="text-xs font-medium my-1">Recordings</div>
          <div className="space-y-1 overflow-y-auto flex-1">
            {recordings.map((rec, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-1.5 rounded bg-muted/20 text-xs"
              >
                <span>{rec}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
