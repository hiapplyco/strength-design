
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Send } from "lucide-react";

export interface HeaderActionsProps {
  isExporting: boolean;
  onExport: () => Promise<void>;
  onEdit: () => void;  // Added this prop to fix the type error
}

export function HeaderActions({ isExporting, onExport, onEdit }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={onEdit}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
