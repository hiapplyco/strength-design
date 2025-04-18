
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAnalysisState } from "./FileAnalysisState";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

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
    <div className={cn("flex items-center gap-2", className)}>
      {title && (
        <span className="text-sm font-medium text-foreground/90">
          {title} {isSuccess && <Check className="inline-block h-3 w-3 text-green-500" />}
        </span>
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
              "h-8 w-8",
              theme === 'light' ? 'bg-white hover:bg-gray-50' : 'bg-background hover:bg-accent'
            )}
          >
            <label htmlFor={`file-upload-${title}`} className="cursor-pointer flex items-center justify-center">
              <Upload className="h-4 w-4" />
            </label>
          </Button>
        </div>
      )}
    </div>
  );
}
