
import React, { useState } from "react";
import { X, Minus, Plus, Settings, RotateCcw } from "lucide-react";
import { WidgetInstance } from "../types";
import { getWidgetDefinition } from "./WidgetRegistry";
import { cn } from "@/lib/utils";

interface WidgetContainerProps {
  widget: WidgetInstance;
  onRemove: (id: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onMinimize: (id: string, isMinimized: boolean) => void;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  onRemove,
  onResize,
  onMove,
  onMinimize,
  children,
  isSelected,
  onSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  const widgetDef = getWidgetDefinition(widget.type);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as any).dataset.handle !== "drag") return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({ x: widget.position.x, y: widget.position.y });
    onSelect(widget.id);
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: widget.size.width, height: widget.size.height });
    onSelect(widget.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onMove(widget.id, {
        x: initialPosition.x + dx,
        y: initialPosition.y + dy,
      });
    } else if (isResizing && resizeDirection) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(initialSize.width + dx, widgetDef.minSize?.width || 100);
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(initialSize.height + dy, widgetDef.minSize?.height || 100);
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.max(initialSize.width - dx, widgetDef.minSize?.width || 100);
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.max(initialSize.height - dy, widgetDef.minSize?.height || 100);
      }
      
      onResize(widget.id, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, widget.id]);

  const handleMinimize = () => {
    onMinimize(widget.id, !widget.isMinimized);
  };

  return (
    <div
      className={cn(
        "absolute bg-card border shadow-md rounded-md overflow-hidden transition-all",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-70"
      )}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.isMinimized ? 40 : widget.size.height,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={() => onSelect(widget.id)}
    >
      <div 
        className="h-9 flex items-center justify-between px-2 bg-muted/20 cursor-move"
        onMouseDown={handleMouseDown}
        data-handle="drag"
      >
        <div className="flex items-center gap-2 text-sm font-medium" data-handle="drag">
          {widgetDef.icon}
          <span data-handle="drag">{widgetDef.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground"
            onClick={handleMinimize}
          >
            {widget.isMinimized ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </button>
          <button
            className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(widget.id)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {!widget.isMinimized && (
        <div className="p-3">
          {children}
        </div>
      )}
      
      {!widget.isMinimized && (
        <>
          <div 
            className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize" 
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div 
            className="absolute right-0 top-1/2 w-4 h-8 -mt-4 cursor-e-resize" 
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div 
            className="absolute bottom-0 left-1/2 w-8 h-4 -ml-4 cursor-s-resize" 
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
        </>
      )}
    </div>
  );
};
