
import React from "react";
import { getAllWidgetDefinitions, WidgetType } from "./WidgetRegistry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WidgetPaletteProps {
  onWidgetSelect: (widgetType: WidgetType) => void;
}

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ onWidgetSelect }) => {
  const widgets = getAllWidgetDefinitions();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Widgets</CardTitle>
        <CardDescription>Drag and drop widgets to your journal</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {widgets.map((widget) => (
          <div
            key={widget.type}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md bg-muted/30",
              "hover:bg-primary/10 cursor-pointer border border-transparent",
              "hover:border-primary/30 transition-colors"
            )}
            onClick={() => onWidgetSelect(widget.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("widget-type", widget.type);
            }}
          >
            <div className="text-primary mb-1">{widget.icon}</div>
            <span className="text-xs font-medium">{widget.name}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
