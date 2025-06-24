
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sizes, spacing } from "@/lib/design-tokens";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  id?: string;
}

export const FileUpload = ({ onFileSelect, className, id = "file-upload" }: FileUploadProps) => {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, image, or text file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 4MB",
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className={cn("flex items-center", spacing.gap.xs, className)}>
      <Input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
        className="hidden"
        id={id}
        borderStyle="multicolor"
      />
      <Button
        variant="outline"
        size="icon"
        className={sizes.touch.iconButton}
        asChild
      >
        <label htmlFor={id} className="cursor-pointer">
          <Upload className={sizes.icon.sm} />
        </label>
      </Button>
    </div>
  );
}
