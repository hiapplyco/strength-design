
import { ArrowUp } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface PdfUploadSectionProps {
  onFileSelect: (file: File) => Promise<void>;
  className?: string;
}

export function PdfUploadSection({
  onFileSelect,
  className,
}: PdfUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 text-xs text-white/80">
        Upload Exercise Program
      </div>
      
      <div 
        className="relative flex flex-col items-center justify-center w-full min-h-[120px] cursor-pointer border-0 rounded-md"
        onClick={handleClick}
      >
        {/* Gradient border with background */}
        <div className="absolute inset-0 rounded-md bg-black/60"></div>
        <div className="absolute inset-0 rounded-md p-[1px] -z-10 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center p-4">
          <ArrowUp className="h-6 w-6 text-white/70 mb-2" />
          <span className="text-xs text-white/70">Upload PDF</span>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
