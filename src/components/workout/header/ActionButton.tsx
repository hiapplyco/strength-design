import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ActionButton({ icon: Icon, onClick, isLoading, disabled }: ActionButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full text-primary"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </Button>
  );
}