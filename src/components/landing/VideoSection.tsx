import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VideoSectionProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VideoSection = ({ isMuted, onToggleMute }: VideoSectionProps) => {
  return (
    <section className="relative h-screen w-full overflow-hidden mt-16 px-12 md:px-24 lg:px-32">
      <div className="absolute inset-12 md:inset-24 lg:inset-32">
        <div className="relative h-full w-full max-w-[1400px] mx-auto">
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z" type="video/mp4" />
          </video>
        </div>
      </div>

      <Button
        onClick={onToggleMute}
        className="absolute top-16 right-16 z-50 bg-black/50 hover:bg-black/70 md:top-28 md:right-28 lg:top-36 lg:right-36"
        size="icon"
        variant="ghost"
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>
    </section>
  );
};