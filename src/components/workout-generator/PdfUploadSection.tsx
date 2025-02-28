
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
      className={cn("relative flex items-center justify-center w-full min-h-[100px] cursor-pointer rounded-md bg-black/60 overflow-hidden before:absolute before:inset-0 before:rounded-md before:p-[1px] before:-z-10 before:bg-gradient-to-r before:from-[#4CAF50] before:via-[#9C27B0] before:to-[#FF1493] before:opacity-70", className)}
      onClick={handleClick}
    >
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
