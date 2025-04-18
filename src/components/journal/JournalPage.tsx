
import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { WidgetPalette } from "./widgets/WidgetPalette";
import { WidgetContainer } from "./widgets/WidgetContainer";
import { MicrophoneWidget } from "./widgets/widget-types/MicrophoneWidget";
import { WeatherWidget } from "./widgets/widget-types/WeatherWidget";
import { JournalPageData, WidgetInstance } from "./types";
import { WidgetType, getWidgetDefinition } from "./widgets/WidgetRegistry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Trash } from "lucide-react";

const renderWidget = (
  widget: WidgetInstance, 
  onDataChange: (id: string, data: any) => void
) => {
  switch (widget.type) {
    case "microphone":
      return (
        <MicrophoneWidget 
          data={widget.data} 
          onDataChange={(data) => onDataChange(widget.id, data)} 
        />
      );
    case "weather":
      return (
        <WeatherWidget 
          data={widget.data} 
          onDataChange={(data) => onDataChange(widget.id, data)} 
        />
      );
    // Placeholder for other widget types
    default:
      return (
        <div className="p-2 text-sm text-muted-foreground">
          {getWidgetDefinition(widget.type).name} widget (Coming soon)
        </div>
      );
  }
};

export const JournalPage: React.FC = () => {
  const [page, setPage] = useState<JournalPageData>({
    id: uuidv4(),
    title: "My Journal Page",
    date: new Date().toISOString(),
    widgets: []
  });
  
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(prevPage => ({
      ...prevPage,
      title: e.target.value
    }));
  };
  
  const addWidget = useCallback((type: WidgetType, position: { x: number, y: number }) => {
    const widgetDef = getWidgetDefinition(type);
    const newWidget: WidgetInstance = {
      id: uuidv4(),
      type,
      position,
      size: widgetDef.defaultSize,
      data: {},
      isMinimized: false
    };
    
    setPage(prevPage => ({
      ...prevPage,
      widgets: [...prevPage.widgets, newWidget]
    }));
    
    setSelectedWidgetId(newWidget.id);
  }, []);
  
  const removeWidget = useCallback((id: string) => {
    setPage(prevPage => ({
      ...prevPage,
      widgets: prevPage.widgets.filter(w => w.id !== id)
    }));
    
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId]);
  
  const updateWidgetPosition = useCallback((id: string, position: { x: number, y: number }) => {
    setPage(prevPage => ({
      ...prevPage,
      widgets: prevPage.widgets.map(w => 
        w.id === id ? { ...w, position } : w
      )
    }));
  }, []);
  
  const updateWidgetSize = useCallback((id: string, size: { width: number, height: number }) => {
    setPage(prevPage => ({
      ...prevPage,
      widgets: prevPage.widgets.map(w => 
        w.id === id ? { ...w, size } : w
      )
    }));
  }, []);
  
  const updateWidgetMinimize = useCallback((id: string, isMinimized: boolean) => {
    setPage(prevPage => ({
      ...prevPage,
      widgets: prevPage.widgets.map(w => 
        w.id === id ? { ...w, isMinimized } : w
      )
    }));
  }, []);
  
  const updateWidgetData = useCallback((id: string, data: any) => {
    setPage(prevPage => ({
      ...prevPage,
      widgets: prevPage.widgets.map(w => 
        w.id === id ? { ...w, data } : w
      )
    }));
  }, []);
  
  const handleWidgetSelect = (type: WidgetType) => {
    // Calculate position based on current widgets to avoid overlap
    const position = calculateNewWidgetPosition(type);
    addWidget(type, position);
  };
  
  const calculateNewWidgetPosition = (type: WidgetType) => {
    const widgetDef = getWidgetDefinition(type);
    const baseX = 20;
    const baseY = 20;
    const offsetX = 20;
    const offsetY = 20;
    
    // Find the highest x and y positions of existing widgets
    if (page.widgets.length === 0) {
      return { x: baseX, y: baseY };
    }
    
    const lastWidget = page.widgets[page.widgets.length - 1];
    return {
      x: lastWidget.position.x + offsetX,
      y: lastWidget.position.y + offsetY
    };
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData("widget-type") as WidgetType;
    if (widgetType) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      addWidget(widgetType, { x, y });
    }
    setIsDraggingOver(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const saveJournal = () => {
    const journalData = JSON.stringify(page);
    localStorage.setItem(`journal_${page.id}`, journalData);
    console.log("Journal saved:", page);
    // Here you would typically save to a database
  };
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Input
            value={page.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-none shadow-none h-auto text-primary px-0 focus-visible:ring-0"
            placeholder="Untitled Journal"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={saveJournal}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <WidgetPalette onWidgetSelect={handleWidgetSelect} />
          </div>
          
          <div 
            className="lg:col-span-3 relative border rounded-md bg-muted/10"
            style={{ minHeight: "600px" }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => setSelectedWidgetId(null)}
          >
            {isDraggingOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary/30 rounded-md z-10">
                <div className="flex items-center justify-center h-full text-primary/70">
                  Drop widget here
                </div>
              </div>
            )}
            
            {page.widgets.map(widget => (
              <WidgetContainer
                key={widget.id}
                widget={widget}
                onRemove={removeWidget}
                onResize={updateWidgetSize}
                onMove={updateWidgetPosition}
                onMinimize={updateWidgetMinimize}
                isSelected={selectedWidgetId === widget.id}
                onSelect={setSelectedWidgetId}
              >
                {renderWidget(widget, updateWidgetData)}
              </WidgetContainer>
            ))}
            
            {page.widgets.length === 0 && !isDraggingOver && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Drag and drop widgets here or select from the palette
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
