import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAnalysisState } from "./FileAnalysisState";
import { PdfUploadSection } from "./PdfUploadSection";

interface FileUploadSectionProps {
  title: string;
  isAnalyzing: boolean;
  content: string;
  onFileSelect: (file: File) => Promise<void>;
  analysisSteps: string[];
  className?: string;
}

export function FileUploadSection({
  title,
  isAnalyzing,
  content,
  onFileSelect,
  analysisSteps,
  className = "",
}: FileUploadSectionProps) {
  return (
    <Card className={`border-none bg-transparent ${className}`}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
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