import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalysisFormProps {
  movement: string;
  setMovement: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled: boolean;
}

export const AnalysisForm = ({
  movement,
  setMovement,
  onAnalyze,
  isAnalyzing,
  disabled,
}: AnalysisFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="movement">Movement Type</Label>
        <Input
          id="movement"
          value={movement}
          onChange={(e) => setMovement(e.target.value)}
          placeholder="e.g., Squat, Deadlift, etc."
        />
      </div>
      <Button
        onClick={onAnalyze}
        disabled={disabled || isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze Video"}
      </Button>
    </div>
  );
};