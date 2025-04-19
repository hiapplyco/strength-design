
import { Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface PresetOverlayProps {
  isShown: boolean;
}

export function PresetOverlay({ isShown }: PresetOverlayProps) {
  const { theme } = useTheme();
  if (!isShown) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg relative overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-black'
      }`}>
        <div className="absolute inset-0 p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40 rounded-lg"></div>
        <div className={`absolute inset-[1px] rounded-[calc(0.5rem-1px)] ${
          theme === 'light' ? 'bg-white/95' : 'bg-black/95'
        }`}></div>
        <div className="flex items-center space-x-3 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text" />
          <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} text-base font-medium`}>
            Creating your workout plan...
          </p>
        </div>
      </div>
    </div>
  );
}
