import { useState } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SearchFormProps {
  onSearch: (location: string) => void;
  location: string;
  setLocation: (location: string) => void;
}

export function SearchForm({ onSearch, location, setLocation }: SearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="text"
        placeholder="Enter city name..."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="bg-black text-white placeholder:text-gray-400 rounded-lg border-[6px] border-primary font-oswald transform -skew-x-12 uppercase tracking-wider text-center shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_#C4A052,12px_12px_0px_0px_#B8860B] focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {location && (
        <button
          type="button"
          onClick={() => setLocation("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}