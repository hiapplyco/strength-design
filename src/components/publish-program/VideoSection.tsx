
import { Card } from "@/components/ui/card";
import { RecordingInterface } from "@/components/video-analysis/RecordingInterface";
import { Button } from "@/components/ui/button";
import { Mic, Upload } from "lucide-react";

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
    <div className="space-y-6">
      <Card className="p-6 bg-background border-primary">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Record Your Video</h2>
          <p className="text-foreground/70">
            Use the teleprompter to read your script while recording your video content.
          </p>
        </div>
        
        <div className="flex gap-4 mb-6">
          <Button
            onClick={onNarrate}
            disabled={isGenerating || !workoutScript}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
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
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            {selectedFile && (
              <span className="text-sm text-foreground/70">
                {selectedFile.name}
              </span>
            )}
          </div>
        </div>
      </Card>

      <RecordingInterface
        workoutScript={workoutScript}
        teleprompterPosition={teleprompterPosition}
        setTeleprompterPosition={setTeleprompterPosition}
      />
    </div>
  );
}
