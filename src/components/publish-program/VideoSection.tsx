
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Upload, Video, FileText } from "lucide-react";
import { CompactRecordingInterface } from "./CompactRecordingInterface";

interface VideoSectionProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
  onNarrate: () => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  isGenerating: boolean;
}

export function VideoSection({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
  onNarrate,
  onFileSelect,
  selectedFile,
  isGenerating
}: VideoSectionProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Card */}
      <div className="flex-shrink-0 mb-4">
        <Card className="p-4 bg-background/50 border-primary/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Record Your Video
              </h2>
              <p className="text-sm text-foreground/70">
                Use the teleprompter to read your script while recording.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onNarrate}
                disabled={isGenerating || !workoutScript}
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Generate Script"}
              </Button>
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
          
          {selectedFile && (
            <div className="mt-3 p-2 bg-background/70 rounded-md border border-border/50">
              <span className="text-sm text-foreground/70">
                Selected: {selectedFile.name}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Recording Interface */}
      <div className="flex-1 min-h-0">
        <CompactRecordingInterface
          workoutScript={workoutScript}
          teleprompterPosition={teleprompterPosition}
          setTeleprompterPosition={setTeleprompterPosition}
        />
      </div>
    </div>
  );
}
