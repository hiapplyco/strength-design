
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Target, 
  Dumbbell, 
  AlertTriangle, 
  Calendar, 
  CloudSun, 
  Check,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ConfigItem {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  fullValue?: string | null;
  isNew?: boolean;
  isUpdated?: boolean;
  isExpandable?: boolean;
}

export const ModernWorkoutSidebar: React.FC = () => {
  const { config } = useWorkoutConfig();
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<string>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Listen for configuration updates
  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      const { updatedFields } = event.detail;
      
      // Mark fields as recently updated
      setRecentlyUpdatedFields(new Set(updatedFields));
      setAnimationKey(prev => prev + 1);
      
      // Clear the update indicators after animation
      setTimeout(() => {
        setRecentlyUpdatedFields(new Set());
      }, 2000);
    };

    window.addEventListener('configUpdated', handleConfigUpdate as EventListener);
    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getConfigItems = (): ConfigItem[] => {
    const items: ConfigItem[] = [];

    // Fitness Level
    if (config.fitnessLevel) {
      items.push({
        icon: <User className="h-4 w-4" />,
        label: 'Fitness Level',
        value: config.fitnessLevel,
        isUpdated: recentlyUpdatedFields.has('fitnessLevel')
      });
    }

    // Goals/Prescribed Exercises
    if (config.prescribedExercises) {
      const isLong = config.prescribedExercises.length > 100;
      items.push({
        icon: <Target className="h-4 w-4" />,
        label: 'Goals',
        value: isLong ? truncateText(config.prescribedExercises) : config.prescribedExercises,
        fullValue: config.prescribedExercises,
        isExpandable: isLong,
        isUpdated: recentlyUpdatedFields.has('prescribedExercises')
      });
    }

    // Equipment/Selected Exercises
    if (config.selectedExercises && config.selectedExercises.length > 0) {
      const exerciseNames = config.selectedExercises.map(e => e.name);
      const exerciseText = exerciseNames.join(', ');
      const isLong = exerciseText.length > 100;
      
      items.push({
        icon: <Dumbbell className="h-4 w-4" />,
        label: 'Equipment',
        value: isLong ? truncateText(exerciseText) : exerciseText,
        fullValue: exerciseText,
        isExpandable: isLong,
        isUpdated: recentlyUpdatedFields.has('selectedExercises')
      });
    }

    // Injuries/Limitations
    if (config.injuries) {
      const isLong = config.injuries.length > 100;
      items.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Limitations',
        value: isLong ? truncateText(config.injuries) : config.injuries,
        fullValue: config.injuries,
        isExpandable: isLong,
        isUpdated: recentlyUpdatedFields.has('injuries')
      });
    }

    // Training Schedule
    if (config.numberOfDays || config.numberOfCycles) {
      items.push({
        icon: <Calendar className="h-4 w-4" />,
        label: 'Schedule',
        value: `${config.numberOfCycles} cycle(s) of ${config.numberOfDays} days`,
        isUpdated: recentlyUpdatedFields.has('numberOfDays') || recentlyUpdatedFields.has('numberOfCycles')
      });
    }

    // Weather
    if (config.weatherData) {
      items.push({
        icon: <CloudSun className="h-4 w-4" />,
        label: 'Weather',
        value: config.weatherData.location || 'Enabled',
        isUpdated: recentlyUpdatedFields.has('weatherData')
      });
    }

    return items;
  };

  const configItems = getConfigItems();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Workout Configuration</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with AI to build your config
        </p>
      </div>

      {/* Configuration Items */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {configItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-muted-foreground space-y-2">
                  <Target className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">No configuration yet</p>
                  <p className="text-xs">Start chatting to build your workout plan</p>
                </div>
              </motion.div>
            ) : (
              configItems.map((item, index) => {
                const isExpanded = expandedItems.has(item.label);
                const displayValue = isExpanded && item.fullValue ? item.fullValue : item.value;
                
                return (
                  <motion.div
                    key={`${item.label}-${animationKey}-${index}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      damping: 20,
                      stiffness: 300
                    }}
                  >
                    <Card className={`relative overflow-hidden transition-all duration-300 ${
                      item.isUpdated 
                        ? 'border-primary/50 bg-primary/5 shadow-md' 
                        : 'border-border/50 bg-card'
                    }`}>
                      {item.isUpdated && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none"
                        />
                      )}
                      
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md transition-colors ${
                            item.isUpdated 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {item.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium">{item.label}</h3>
                              {item.isUpdated && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center gap-1"
                                >
                                  <Zap className="h-3 w-3 text-primary" />
                                  <Badge variant="secondary" className="text-xs px-1">
                                    Updated
                                  </Badge>
                                </motion.div>
                              )}
                              {item.isExpandable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => toggleExpanded(item.label)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed break-words">
                              {displayValue}
                            </p>
                          </div>
                          
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Progress Indicator */}
      <div className="p-4 border-t border-border/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Configuration</span>
            <span className="font-medium">
              {configItems.length} / 6 fields
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(configItems.length / 6) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {configItems.length === 0 && "Get started by chatting with AI"}
            {configItems.length > 0 && configItems.length < 3 && "Keep chatting to refine your plan"}
            {configItems.length >= 3 && configItems.length < 6 && "Looking good! Almost ready"}
            {configItems.length === 6 && "Perfect! Your configuration is complete"}
          </p>
        </div>
      </div>
    </div>
  );
};
