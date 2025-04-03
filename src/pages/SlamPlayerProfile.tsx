
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlayerDashboard } from "@/components/looker-dashboard/PlayerDashboard";
import { LoadingSpinner } from "@/components/looker-dashboard/LoadingSpinner";

export default function SlamPlayerProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
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

  // Remove all app styling and show a completely standalone dashboard
  if (isLoading) {
    return <LoadingSpinner />;
  }

  const newsData = {
    title: "David Fuchs Enters Transfer Portal",
    details: "David Fuchs, a sophomore forward, has entered the transfer portal. He averaged 7.4 points and 7.5 rebounds per game across 29 games this season.",
    highlights: [
      "Led the team with 218 total rebounds",
      "Shot 65.9% on two-point field goals",
      "Posted several double-doubles including 16 points and 8 rebounds against Fordham"
    ],
    imageSrc: "/lovable-uploads/87fa814a-1a62-45af-b6cc-70b57bfc5a1e.png"
  };

  return (
    <div className="looker-dashboard">
      {playerData ? (
        <PlayerDashboard playerData={playerData} newsData={newsData} />
      ) : (
        <div className="looker-empty-state">
          <h2>No Data Available</h2>
          <p>Could not find dashboard data for this player.</p>
        </div>
      )}
    </div>
  );
}
