import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchInput = ({ value, onChange, onClear }: SearchInputProps) => {
  const placeholderExamples = [
    "dumbbell bench press",
    "bodyweight squats",
    "resistance band workout",
    "yoga poses",
    "stretching exercises"
  ];
  
  const randomPlaceholder = placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)];
  
  return (
    <div className="relative">
      <Input
        placeholder={`Try searching: ${randomPlaceholder}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white text-black placeholder:text-gray-500"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      )}
    </div>
  );
};