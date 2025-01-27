import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VideoSectionProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VideoSection = ({ isMuted, onToggleMute }: VideoSectionProps) => {
  return (
    <section className="relative w-full h-screen flex items-center justify-center p-8">
      <div className="relative w-full max-w-5xl aspect-video">
        <video
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z" type="video/mp4" />
        </video>
        <Button
          onClick={onToggleMute}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70"
          size="icon"
          variant="ghost"
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      </div>
    </section>
  );
};