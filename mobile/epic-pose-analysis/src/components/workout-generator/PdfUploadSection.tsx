
import { Upload } from "lucide-react";
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
    <div 
      className={cn(
        "relative flex items-center justify-center w-full min-h-[60px] cursor-pointer rounded-lg", 
        "bg-black/20 border border-primary/30",
        "hover:bg-black/30 transition-colors duration-200",
        className
      )}
      onClick={handleClick}
    >
      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-[#4CAF50]/10 via-[#9C27B0]/10 to-[#FF1493]/10 opacity-60" />
      
      <div className="flex items-center gap-2 text-white/70 text-xs">
        <Upload className="h-4 w-4" />
        <span>Upload</span>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
      />
    </div>
  );
}
