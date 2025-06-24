
import React, { useState } from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { CloudSun, ChevronDown, ChevronUp } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { TooltipWrapper } from "./TooltipWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { spacing, transitions, animations } from "@/lib/design-tokens";

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
    <div className={spacing.gap.md}>
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-4 rounded-md",
          "bg-card hover:bg-card/80 transition-colors duration-200",
          "border border-border/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CloudSun className="h-5 w-5 text-primary flex-shrink-0" />
        <h3 className="font-medium text-lg flex-1">Add Weather Conditions</h3>
        {renderTooltip ? renderTooltip() : <TooltipWrapper content="Add local weather conditions to optimize your workout for the current environment" />}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={animations.slideUp.initial}
            animate={animations.slideUp.animate}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card variant="flat" className={cn(spacing.component.md, "ml-8")}>
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
