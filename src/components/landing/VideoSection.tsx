import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VideoSectionProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VideoSection = ({ isMuted, onToggleMute }: VideoSectionProps) => {
  return (
    <section className="relative h-screen mb-12 w-full overflow-hidden">
      <div className="absolute inset-0 px-4 md:px-6 lg:px-8">
        <div className="relative h-full w-full">
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover rounded-lg"
          >
            <source src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z" type="video/mp4" />
          </video>
        </div>
      </div>

      <Button
        onClick={onToggleMute}
        className="absolute top-4 right-8 z-50 bg-black/50 hover:bg-black/70"
        size="icon"
        variant="ghost"
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>
    </section>
  );
};