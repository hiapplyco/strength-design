
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
      tooltipContent="List any injuries, medical conditions, or physical limitations we should consider when creating your workout."
      textAreaPlaceholder="e.g., Lower back injury, knee surgery recovery, shoulder impingement..."
      fileUploadTitle="Medical Reports"
      fileAnalysisSteps={[
        "Reading medical document...",
        "Extracting injury information...",
        "Identifying limitations...",
        "Processing recommendations..."
      ]}
      content={injuries}
      setContent={setInjuries}
      isAnalyzing={isAnalyzingInjuries}
      handleFileSelect={handleInjuriesFileSelect}
    />
  );
}
