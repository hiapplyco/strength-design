
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchInput = ({ value, onChange, onClear }: SearchInputProps) => {
  return (
    <div className="relative">
      <Input
        placeholder="Search for exercises or equipment..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background text-foreground placeholder:text-muted-foreground rounded-[20px] border border-input/50 focus-visible:ring-1 focus-visible:ring-ring pr-10 h-12"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
