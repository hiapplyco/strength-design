
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

interface VisualizationProps {
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string | string[];
      borderColor?: string;
    }>;
  };
}

export const InsightsVisualization: React.FC<VisualizationProps> = ({
  type,
  title,
  data
}) => {
  const getIcon = () => {
    switch (type) {
      case 'line':
        return <LineChart className="h-8 w-8 text-primary" />;
      case 'bar':
        return <BarChart3 className="h-8 w-8 text-primary" />;
      case 'doughnut':
        return <PieChart className="h-8 w-8 text-primary" />;
      default:
        return <BarChart3 className="h-8 w-8 text-primary" />;
    }
  };

  const getDataSummary = () => {
    if (!data.datasets.length) return "No data available";
    const firstDataset = data.datasets[0];
    const total = firstDataset.data.reduce((sum, val) => sum + val, 0);
    const average = total / firstDataset.data.length;
    return `${firstDataset.label}: ${average.toFixed(1)} average`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getIcon()}
          {title}
        </CardTitle>
        <CardDescription>
          Chart visualization ({type})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex flex-col items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center space-y-2">
            {getIcon()}
            <p className="text-sm text-muted-foreground">
              {getDataSummary()}
            </p>
            <p className="text-xs text-muted-foreground">
              Chart visualization will be displayed here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
