import { Search, X } from "lucide-react";
import { Button } from "../ui/button";

interface SearchButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const SearchButton = ({ isOpen, onClick }: SearchButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="shrink-0 text-primary-foreground hover:text-primary-foreground/80"
    >
      {isOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
    </Button>
  );
};