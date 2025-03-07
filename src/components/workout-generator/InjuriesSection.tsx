
import { HeartPulse } from "lucide-react";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

export interface InjuriesSectionProps {
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
}

export function InjuriesSection({
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect
}: InjuriesSectionProps) {
  return (
    <ExpandableSectionContainer
      icon={<HeartPulse className="h-5 w-5 text-primary" />}
      title="Any Injuries or Health Considerations?"
      tooltipContent="Share any injuries, medical conditions, or movement limitations that may affect your workout"
      textAreaPlaceholder="List any injuries, medical conditions, or movement limitations"
      fileUploadTitle="Upload Medical Information"
      fileAnalysisSteps={["Processing file", "Extracting information", "Analyzing content"]}
      content={injuries}
      setContent={setInjuries}
      isAnalyzing={isAnalyzingInjuries}
      handleFileSelect={handleInjuriesFileSelect}
    />
  );
}
