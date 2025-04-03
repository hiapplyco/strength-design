
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from "recharts";

// Default data if none is provided
const defaultData = [
  { name: 'Jan', strength: 65, endurance: 78, skill: 82, overall: 75 },
  { name: 'Feb', strength: 68, endurance: 80, skill: 80, overall: 76 },
  { name: 'Mar', strength: 71, endurance: 82, skill: 81, overall: 78 },
  { name: 'Apr', strength: 74, endurance: 78, skill: 83, overall: 78 },
  { name: 'May', strength: 77, endurance: 82, skill: 85, overall: 81 },
  { name: 'Jun', strength: 80, endurance: 85, skill: 86, overall: 84 },
  { name: 'Jul', strength: 83, endurance: 87, skill: 88, overall: 86 },
];

interface PerformanceChartProps {
  data?: any[];
}

export function PerformanceChart({ data = defaultData }: PerformanceChartProps) {
  // Use the provided data or default data
  const chartData = Array.isArray(data) && data.length > 0 ? data : defaultData;

  const chartConfig = {
    strength: {
      label: "Strength",
      theme: {
        light: "#4CAF50",
        dark: "#4CAF50",
      },
    },
    endurance: {
      label: "Endurance",
      theme: {
        light: "#9C27B0",
        dark: "#9C27B0",
      },
    },
    skill: {
      label: "Skill",
      theme: {
        light: "#FF1493",
        dark: "#FF1493",
      },
    },
    overall: {
      label: "Overall",
      theme: {
        light: "#333",
        dark: "#fff",
      },
    },
  };

  return (
    <ChartContainer className="h-full w-full" config={chartConfig}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStrength" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorEndurance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#9C27B0" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorSkill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF1493" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF1493" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#333" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#333" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <ChartTooltip 
            content={<ChartTooltipContent />} 
            cursor={{ stroke: "#666", strokeWidth: 1, strokeDasharray: "5 5" }} 
          />
          <Legend wrapperStyle={{ paddingTop: "1rem" }} />
          <Area
            type="monotone"
            dataKey="strength"
            name="Strength"
            stroke="#4CAF50"
            fillOpacity={1}
            fill="url(#colorStrength)"
            activeDot={{ r: 6 }}
            strokeWidth={2}
            className="animate-in"
          />
          <Area
            type="monotone"
            dataKey="endurance"
            name="Endurance"
            stroke="#9C27B0"
            fillOpacity={1}
            fill="url(#colorEndurance)"
            activeDot={{ r: 6 }}
            strokeWidth={2}
            className="animate-in"
          />
          <Area
            type="monotone"
            dataKey="skill"
            name="Skill"
            stroke="#FF1493"
            fillOpacity={1}
            fill="url(#colorSkill)"
            activeDot={{ r: 6 }}
            strokeWidth={2}
            className="animate-in"
          />
          <Line
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#333"
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
            strokeWidth={3}
            className="animate-in"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
