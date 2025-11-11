
import { Button } from "@/components/ui/button";
import { FolderPlus, Trash2, X } from "lucide-react";
import React from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onClearSelection,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto bg-card border border-border p-3 rounded-lg shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-foreground">
          selected
        </span>
      </div>
      <div className="h-6 border-l border-border"></div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-muted-foreground"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Add to Collection
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:bg-muted"
        onClick={onClearSelection}
      >
        <span className="sr-only">Clear selection</span>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
