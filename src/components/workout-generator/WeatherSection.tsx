
import React, { useState } from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { CloudSun, ChevronDown, ChevronUp } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { TooltipWrapper } from "./TooltipWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sizes, spacing, typography, transitions, animations } from "@/lib/design-tokens";

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
  const { theme } = useTheme();
  
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  return (
    <div className={spacing.gap.md}>
      <Button
        variant="ghost"
        size="lg"
        className={cn(
          "w-full justify-start",
          spacing.component.sm,
          transitions.default,
          "hover:bg-accent"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CloudSun className={cn(sizes.icon.md, "text-primary")} />
        <span className={cn(typography.display.h6, "flex-1 text-left")}>
          Add Weather Conditions
        </span>
        {renderTooltip ? renderTooltip() : <TooltipWrapper content="Add local weather conditions to optimize your workout for the current environment" />}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className={cn(sizes.icon.md, "text-muted-foreground")} />
          ) : (
            <ChevronDown className={cn(sizes.icon.md, "text-muted-foreground")} />
          )}
        </div>
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={animations.slideUp.initial}
            animate={animations.slideUp.animate}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card variant="flat" className={spacing.component.md}>
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
