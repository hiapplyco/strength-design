
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { FileUploadSection } from "./FileUploadSection";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface InjuriesSectionProps {
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
  renderTooltip?: () => React.ReactNode;
}

export function InjuriesSection({ 
  injuries, 
  setInjuries, 
  isAnalyzingInjuries, 
  handleInjuriesFileSelect,
  renderTooltip 
}: InjuriesSectionProps) {
  return (
    <ExpandableSectionContainer
      icon={<AlertCircle className="h-5 w-5" />}
      title="Injuries & Limitations"
      renderTooltip={renderTooltip}
      fileUploadSection={
        <FileUploadSection
          title="Medical Reports"
          isAnalyzing={isAnalyzingInjuries}
          isSuccess={false}
          content=""
          onFileSelect={handleInjuriesFileSelect}
          analysisSteps={[
            "Reading medical document...",
            "Extracting injury information...",
            "Identifying limitations...",
            "Processing recommendations..."
          ]}
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          List any injuries, medical conditions, or physical limitations we should consider when creating your workout.
        </p>
        <Textarea
          placeholder="e.g., Lower back injury, knee surgery recovery, shoulder impingement..."
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>
    </ExpandableSectionContainer>
  );
}
