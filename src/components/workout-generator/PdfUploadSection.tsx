
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
        "relative flex items-center justify-center w-full min-h-[100px] cursor-pointer rounded-md overflow-hidden", 
        "bg-black/60 border border-transparent",
        "hover:bg-black/80 transition-colors duration-200",
        className
      )}
      onClick={handleClick}
    >
      {/* Gradient border using pseudo-element */}
      <div className="absolute inset-0 -z-10 rounded-md p-[1px] bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70" />
      
      <Upload className="h-6 w-6 text-white/70" />
      
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
