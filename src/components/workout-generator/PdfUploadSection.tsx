
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PdfUploadSectionProps {
  onFileSelect: (file: File) => Promise<void>;
}

export function PdfUploadSection({ onFileSelect }: PdfUploadSectionProps) {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or supported image file (JPG, PNG, WEBP, HEIC, HEIF)",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 4MB",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    try {
      await onFileSelect(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (error.response) {
        const errorData = await error.response.json();
        toast({
          title: errorData.error || "Upload failed",
          description: errorData.message || "Failed to process file. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
      event.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <Input
        id="pdf"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
        onChange={handleFileChange}
        className="cursor-pointer text-xs h-8 file:text-xs file:font-medium py-0 w-full bg-background/5 hover:bg-background/10 transition-colors"
      />
      <p className="text-[9px] text-muted-foreground/70 mt-1">
        PDF, JPG, PNG, WEBP (max 4MB)
      </p>
    </div>
  );
}
