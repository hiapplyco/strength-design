
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, ListFilter, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface WorkoutFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (value: boolean) => void;
}

export const WorkoutFilters: React.FC<WorkoutFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  allTags,
  selectedTags,
  setSelectedTags,
  showOnlyFavorites,
  setShowOnlyFavorites,
}) => {
  return (
    <div className="mb-8 space-y-4 rounded-lg border border-border bg-card p-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search programs by title or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="generated_at_desc">Newest First</SelectItem>
            <SelectItem value="generated_at_asc">Oldest First</SelectItem>
            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border/60">
        {allTags.length > 0 && (
          <div className="flex-grow">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              Filter by Tags
            </h3>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={selectedTags}
              onValueChange={setSelectedTags}
              className="flex-wrap justify-start"
            >
              {allTags.map(tag => (
                <ToggleGroupItem key={tag} value={tag} aria-label={`Toggle ${tag}`}>
                  {tag}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        <div className="flex items-center space-x-2 self-end">
          <Switch
            id="favorites-only"
            checked={showOnlyFavorites}
            onCheckedChange={setShowOnlyFavorites}
          />
          <Label htmlFor="favorites-only" className="flex items-center gap-2 cursor-pointer">
            <Star className="h-4 w-4 text-yellow-400" />
            Favorites Only
          </Label>
        </div>
      </div>
    </div>
  );
};
