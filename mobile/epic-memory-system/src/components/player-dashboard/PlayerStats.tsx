
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Default stats if none are provided
const defaultStats = [
  { category: "Strength", metric: "Squat Max", value: "315 lbs", change: "+15 lbs", status: "improved" },
  { category: "Strength", metric: "Bench Press Max", value: "225 lbs", change: "+10 lbs", status: "improved" },
  { category: "Strength", metric: "Deadlift Max", value: "405 lbs", change: "+20 lbs", status: "improved" },
  { category: "Endurance", metric: "Mile Run Time", value: "5:45", change: "-0:15", status: "improved" },
  { category: "Endurance", metric: "Recovery Rate", value: "84%", change: "+2%", status: "improved" },
  { category: "Skill", metric: "Movement Accuracy", value: "92%", change: "+1%", status: "improved" },
  { category: "Skill", metric: "Technical Execution", value: "88%", change: "+3%", status: "improved" },
  { category: "Nutrition", metric: "Protein Intake", value: "145g/day", change: "+5g/day", status: "improved" },
  { category: "Nutrition", metric: "Hydration Level", value: "Good", change: "", status: "neutral" }
];

interface PlayerStatsProps {
  stats?: any[];
}

export function PlayerStats({ stats = defaultStats }: PlayerStatsProps) {
  // Use the provided stats or default stats
  const playerStats = Array.isArray(stats) && stats.length > 0 ? stats : defaultStats;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics</CardTitle>
        <CardDescription>Detailed performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((stat, index) => (
                <TableRow key={index} className="animate-in opacity-0 transition-all duration-300" style={{
                  animationDelay: `${index * 50}ms`,
                  transitionDelay: `${index * 50}ms`
                }}>
                  <TableCell className="font-medium">{stat.category}</TableCell>
                  <TableCell>{stat.metric}</TableCell>
                  <TableCell>{stat.value}</TableCell>
                  <TableCell className={
                    stat.status === "improved" ? "text-green-500" : 
                    stat.status === "declined" ? "text-red-500" : "text-muted-foreground"
                  }>
                    {stat.change}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
