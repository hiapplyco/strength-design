
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "./PerformanceChart";
import { PlayerStats } from "./PlayerStats";
import { TrainingInsights } from "./TrainingInsights";
import { RecentActivities } from "./RecentActivities";
import { PlayerHeader } from "./PlayerHeader";
import { ChevronUp, ChevronDown, TrendingUp, Users, Activity, BarChart } from "lucide-react";
import { NewsCard } from "./NewsCard";

interface NewsDataType {
  title: string;
  details: string;
  highlights: string[];
  imageSrc?: string;
}

interface PlayerDashboardContentProps {
  playerData: any;
  newsData?: NewsDataType;
}

export function PlayerDashboardContent({ playerData, newsData }: PlayerDashboardContentProps) {
  const dashboardData = playerData.dashboard_json || {};
  
  // Simple animation entry effect
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-in');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('opacity-100', 'translate-y-0');
        element.classList.remove('-translate-y-4', 'opacity-0');
      }, index * 100);
    });
  }, []);

  return (
    <div className="space-y-8">
      <PlayerHeader 
        playerName={playerData.player_name} 
        teamName={playerData.team_name}
        sport={playerData.sport}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-in -translate-y-4 opacity-0 transition-all duration-300 ease-in-out">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.performanceScore || "87"}/100
              <span className="text-green-500 text-sm ml-2 flex items-center">
                <ChevronUp className="h-4 w-4" />
                4%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +2.5% from previous period
            </p>
          </CardContent>
        </Card>
        
        <Card className="animate-in -translate-y-4 opacity-0 transition-all duration-300 ease-in-out delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Training Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.trainingSessions || "24"}
              <span className="text-green-500 text-sm ml-2 flex items-center">
                <ChevronUp className="h-4 w-4" />
                12%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card className="animate-in -translate-y-4 opacity-0 transition-all duration-300 ease-in-out delay-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Ranking
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.teamRanking || "#3"}
              <span className="text-red-500 text-sm ml-2 flex items-center">
                <ChevronDown className="h-4 w-4" />
                1
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Among all players
            </p>
          </CardContent>
        </Card>
        
        <Card className="animate-in -translate-y-4 opacity-0 transition-all duration-300 ease-in-out delay-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <BarChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.completionRate || "92%"}
              <span className="text-green-500 text-sm ml-2 flex items-center">
                <ChevronUp className="h-4 w-4" />
                3%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Training program completion
            </p>
          </CardContent>
        </Card>
      </div>

      {newsData && (
        <NewsCard 
          title={newsData.title}
          details={newsData.details}
          highlights={newsData.highlights}
          imageSrc={newsData.imageSrc}
        />
      )}

      <Tabs defaultValue="performance" className="animate-in opacity-0 transition-all duration-300 delay-400">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <PerformanceChart data={dashboardData.performanceData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <PlayerStats stats={dashboardData.stats} />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <TrainingInsights insights={dashboardData.insights} />
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <RecentActivities activities={dashboardData.activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
