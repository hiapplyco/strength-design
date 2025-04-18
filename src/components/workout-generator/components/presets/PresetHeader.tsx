
import { X } from "lucide-react";

interface PresetHeaderProps {
  onClose: () => void;
}

export function PresetHeader({ onClose }: PresetHeaderProps) {
  return (
    <>
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-red-500/70 hover:text-red-500 transition-colors z-10" 
        aria-label="Close workout presets"
      >
        <X size={20} />
      </button>

      <div className="text-center space-y-2 relative z-10">
        <h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text">
          Starter Workouts
        </h3>
      </div>
    </>
  );
}
