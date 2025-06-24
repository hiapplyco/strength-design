
import { FileAnalysisState } from "./FileAnalysisState";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { sizes, spacing, typography, colors } from "@/lib/design-tokens";

interface FileUploadSectionProps {
  title: string;
  isAnalyzing: boolean;
  isSuccess?: boolean;
  content: string;
  onFileSelect: (file: File) => Promise<void>;
  analysisSteps: string[];
  className?: string;
}

export function FileUploadSection({
  title,
  isAnalyzing,
  isSuccess,
  content,
  onFileSelect,
  analysisSteps,
  className = ""
}: FileUploadSectionProps) {
  const { theme } = useTheme();
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={cn("flex items-center", spacing.gap.xs, className)}>
      {title && (
        <div className="flex items-center gap-1">
          <span className={cn(typography.label, "text-foreground/90")}>
            {title}
          </span>
          {isSuccess && (
            <Badge variant="success" className="h-5 px-1.5">
              <Check className={sizes.icon.xs} />
            </Badge>
          )}
        </div>
      )}
      
      {isAnalyzing ? (
        <FileAnalysisState title={`Analyzing ${title}`} steps={analysisSteps} />
      ) : (
        <div className="flex items-center">
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            className="hidden"
            id={`file-upload-${title}`}
          />
          <Button
            variant="outline"
            size="icon"
            asChild
            className={cn(
              sizes.touch.iconButton,
              "transition-colors"
            )}
          >
            <label 
              htmlFor={`file-upload-${title}`} 
              className="cursor-pointer flex items-center justify-center"
            >
              <Upload className={sizes.icon.sm} />
            </label>
          </Button>
        </div>
      )}
    </div>
  );
}
