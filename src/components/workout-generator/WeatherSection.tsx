
import React, { useState } from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { CloudSun, ChevronDown, ChevronUp } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { TooltipWrapper } from "./TooltipWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
  numberOfDays?: number;
}

export function WeatherSection({ 
  weatherData, 
  onWeatherUpdate,
  renderTooltip,
  numberOfDays = 7
}: WeatherSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  return (
    <div className="space-y-4">
      <button
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-md",
          "bg-background/50 hover:bg-accent transition-colors duration-200",
          "border border-border"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CloudSun className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Add Weather Conditions</h3>
        {renderTooltip ? renderTooltip() : <TooltipWrapper content="Add local weather conditions to optimize your workout for the current environment" />}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-md border border-border bg-card p-4">
              {weatherData ? (
                <WeatherDisplay 
                  weatherData={weatherData} 
                  onClear={handleClearWeather}
                  numberOfDays={numberOfDays}
                />
              ) : (
                <WeatherSearch 
                  onWeatherUpdate={onWeatherUpdate}
                  renderTooltip={renderTooltip}
                  numberOfDays={numberOfDays}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
