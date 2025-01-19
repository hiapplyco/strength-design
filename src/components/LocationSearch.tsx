import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search location (e.g., New York, London)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-white text-black placeholder:text-gray-500"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearching}
          className="min-w-[100px]"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {locations.length > 0 && (
        <div className="space-y-2">
          {locations.map((location, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => onLocationSelect(location)}
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
    </div>
  );
}