import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setLocations([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { query: searchQuery }
        });

        if (error) throw error;

        if (data.results) {
          setLocations(data.results.map((result: any) => ({
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country,
            admin1: result.admin1
          })));
        }
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setLocations([]); // Clear the search results
    setSearchQuery(""); // Clear the search input
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search location (e.g., New York, London)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 bg-white text-black placeholder:text-gray-500"
      />

      {locations.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {locations.map((location, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => handleLocationSelect(location)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              <span>
                {location.name}
                {location.admin1 && `, ${location.admin1}`}
                {location.country && `, ${location.country}`}
              </span>
            </Button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="text-sm text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  );
}