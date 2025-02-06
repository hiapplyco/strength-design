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
        className="w-full bg-jupyter-cell text-white placeholder:text-gray-400 rounded-[20px] border border-jupyter-border focus-visible:ring-primary pr-10"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-jupyter-hover rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-primary" />
        </button>
      )}
    </div>
  );
};