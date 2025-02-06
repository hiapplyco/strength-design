
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAnalysisState } from "./FileAnalysisState";
import { PdfUploadSection } from "./PdfUploadSection";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  className = "",
}: FileUploadSectionProps) {
  return (
    <Card className={`border-none bg-transparent ${className}`}>
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {isSuccess && <Check className="h-4 w-4 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isAnalyzing ? (
          <FileAnalysisState 
            title={`Analyzing ${title}`}
            steps={analysisSteps}
          />
        ) : (
          <PdfUploadSection onFileSelect={onFileSelect} />
        )}
      </CardContent>
    </Card>
  );
}
