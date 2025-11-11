
import { WidgetType } from "./widgets/WidgetRegistry";

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  data?: any; // Widget-specific state data
  isMinimized?: boolean;
}

export interface JournalPageData {
  id: string;
  title: string;
  date: string;
  widgets: WidgetInstance[];
}

export interface DraggableItemType {
  type: "WIDGET";
  widgetType?: WidgetType;
  id?: string;
}
