
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlayerDashboardContent } from "@/components/player-dashboard/PlayerDashboardContent";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { LogoHeader } from "@/components/ui/logo-header";

export default function SlamPlayerProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        // Use the correct table name with explicit typing
        const { data, error } = await supabase
          .from("player_dashboards")
          .select("*")
          .eq("player_name", "Uri Davidfuchs")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setPlayerData(data);
        } else {
          toast({
            title: "Player not found",
            description: "Could not find player profile data.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching player data:", error);
        toast({
          title: "Error",
          description: "Failed to load player dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator className="scale-150">
          <h2 className="text-xl font-bold">Loading Dashboard</h2>
          <p className="text-foreground/70">Preparing performance insights...</p>
        </LoadingIndicator>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <LogoHeader>Player Profile Dashboard</LogoHeader>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Comprehensive performance insights and analytics for Uri Davidfuchs
          </p>
        </div>
        
        {playerData ? (
          <PlayerDashboardContent 
            playerData={playerData} 
            newsData={{
              title: "David Fuchs Enters Transfer Portal",
              details: "David Fuchs, a sophomore forward, has entered the transfer portal. He averaged 7.4 points and 7.5 rebounds per game across 29 games this season.",
              highlights: [
                "Led the team with 218 total rebounds",
                "Shot 65.9% on two-point field goals",
                "Posted several double-doubles including 16 points and 8 rebounds against Fordham"
              ],
              imageSrc: "/lovable-uploads/87fa814a-1a62-45af-b6cc-70b57bfc5a1e.png"
            }}
          />
        ) : (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold">No Data Available</h2>
            <p className="text-foreground/70 mt-2">
              Could not find dashboard data for this player.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
