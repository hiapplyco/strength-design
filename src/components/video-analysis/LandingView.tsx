import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoHeader } from "./VideoHeader";

interface LandingViewProps {
  onStartRecording: () => void;
}

export const LandingView = ({ onStartRecording }: LandingViewProps) => {
  return (
    <div className="container mx-auto px-4 pt-16">
      <VideoHeader className="mb-16" />
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Button
            onClick={onStartRecording}
            className="h-64 bg-accent hover:bg-accent/90 flex flex-col items-center justify-center gap-4 p-8 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Camera className="h-24 w-24" />
            <span className="text-2xl font-semibold">Start Recording</span>
          </Button>
        </div>
      </div>
    </div>
  );
};