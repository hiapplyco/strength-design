import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
}

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function WeatherSection({ weatherData, onWeatherUpdate, renderTooltip }: WeatherSectionProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSearch = async () => {
    if (!location) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-weather", {
        body: { query: location },
      });

      if (error) {
        console.error("Error fetching weather data:", error);
        return;
      }

      if (data) {
        onWeatherUpdate(data, `The weather in ${location} is ${data.current?.weather[0]?.description || 'available'}.`);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleLocationSearch} disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Weather"}
        </Button>
      </div>
      {weatherData && (
        <div className="mt-4">
          <p>Temperature: {weatherData.temperature}°C</p>
          <p>Humidity: {weatherData.humidity}%</p>
          <p>Wind Speed: {weatherData.windSpeed} km/h</p>
        </div>
      )}
    </div>
  );
}