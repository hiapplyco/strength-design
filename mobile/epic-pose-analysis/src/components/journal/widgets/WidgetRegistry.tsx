
import React from "react";
import { Mic, Video, CloudSun, Dumbbell, Activity, Zap } from "lucide-react";

export type WidgetType = 
  | "microphone" 
  | "video" 
  | "weather" 
  | "gym-equipment" 
  | "exercise" 
  | "intensity";

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize?: {
    width: number;
    height: number;
  };
  maxSize?: {
    width: number;
    height: number;
  };
}

export const widgetDefinitions: Record<WidgetType, WidgetDefinition> = {
  "microphone": {
    type: "microphone",
    name: "Microphone",
    description: "Record audio notes for your workout",
    icon: <Mic className="h-5 w-5" />,
    defaultSize: {
      width: 300,
      height: 200
    },
    minSize: {
      width: 200,
      height: 150
    }
  },
  "video": {
    type: "video",
    name: "Video",
    description: "Record or upload video for your workout",
    icon: <Video className="h-5 w-5" />,
    defaultSize: {
      width: 400,
      height: 300
    },
    minSize: {
      width: 250,
      height: 200
    }
  },
  "weather": {
    type: "weather",
    name: "Weather",
    description: "Add current weather conditions",
    icon: <CloudSun className="h-5 w-5" />,
    defaultSize: {
      width: 300,
      height: 250
    },
    minSize: {
      width: 200,
      height: 150
    }
  },
  "gym-equipment": {
    type: "gym-equipment",
    name: "Gym Equipment",
    description: "Track equipment used in your workout",
    icon: <Dumbbell className="h-5 w-5" />,
    defaultSize: {
      width: 300,
      height: 200
    },
    minSize: {
      width: 200,
      height: 150
    }
  },
  "exercise": {
    type: "exercise",
    name: "Exercise",
    description: "Log specific exercises",
    icon: <Activity className="h-5 w-5" />,
    defaultSize: {
      width: 350,
      height: 250
    },
    minSize: {
      width: 200,
      height: 150
    }
  },
  "intensity": {
    type: "intensity",
    name: "Intensity",
    description: "Track workout intensity",
    icon: <Zap className="h-5 w-5" />,
    defaultSize: {
      width: 250,
      height: 180
    },
    minSize: {
      width: 150,
      height: 100
    }
  }
};

export const getWidgetDefinition = (type: WidgetType): WidgetDefinition => {
  return widgetDefinitions[type];
};

export const getAllWidgetDefinitions = (): WidgetDefinition[] => {
  return Object.values(widgetDefinitions);
};
