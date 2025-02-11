
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingViewProps {
  onStartRecording: () => void;
}

export const LandingView = ({ onStartRecording }: LandingViewProps) => {
  return (
    <div className="container mx-auto px-4 pt-8 md:pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          <Button
            onClick={onStartRecording}
            className="h-48 md:h-64 bg-accent hover:bg-accent/90 flex flex-col items-center justify-center gap-4 p-4 md:p-8 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Camera className="h-16 w-16 md:h-24 md:w-24" />
            <span className="text-xl md:text-2xl font-semibold">Start Recording</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
