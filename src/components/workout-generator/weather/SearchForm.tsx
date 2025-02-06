
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
        className="bg-black text-white placeholder:text-gray-400 w-full"
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
