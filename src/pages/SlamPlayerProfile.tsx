
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlayerDashboard } from "@/components/looker-dashboard/PlayerDashboard";
import { LoadingSpinner } from "@/components/looker-dashboard/LoadingSpinner";

export default function SlamPlayerProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const { toast } = useToast();

  // Add CSS to hide the sidebar and make the dashboard full-screen
  useEffect(() => {
    // Hide sidebar and any other app chrome elements
    const hideAppChrome = () => {
      // Create a style element to inject custom CSS
      const style = document.createElement('style');
      style.innerHTML = `
        /* Hide sidebar, navbar and other app elements */
        aside, nav, .sidebar-toggle { 
          display: none !important; 
        }
        
        /* Make the dashboard take full width */
        main, .looker-container { 
          width: 100% !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        
        /* Remove any margins that might be causing spacing */
        body, #root, main > div {
          padding: 0 !important;
          margin: 0 !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    };
    
    const cleanup = hideAppChrome();
    return cleanup;
  }, []);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
        // First try exact match
        let { data, error } = await supabase
          .from("player_dashboards")
          .select("*")
          .eq("player_name", "Uri Davidfuchs")
          .maybeSingle();

        // If no exact match, try case-insensitive search
        if (!data && !error) {
          const { data: caseInsensitiveResults, error: searchError } = await supabase
            .from("player_dashboards")
            .select("*")
            .ilike("player_name", "%davidfuchs%")
            .maybeSingle();
            
          if (searchError) throw searchError;
          data = caseInsensitiveResults;
        }

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Player data found:", data);
          setPlayerData(data);
        } else {
          console.log("No player data found, creating default data");
          // Create default player data if none exists
          const defaultData = {
            player_name: "Uri Davidfuchs",
            team_name: "University of Rhode Island",
            sport: "Basketball",
            dashboard_json: {
              performanceScore: "87",
              trainingSessions: "24",
              teamRanking: "#3",
              completionRate: "92%",
              performanceData: [
                { name: 'Jan', strength: 65, endurance: 78, skill: 82, overall: 75 },
                { name: 'Feb', strength: 68, endurance: 80, skill: 80, overall: 76 },
                { name: 'Mar', strength: 71, endurance: 82, skill: 81, overall: 78 },
                { name: 'Apr', strength: 74, endurance: 78, skill: 83, overall: 78 },
                { name: 'May', strength: 77, endurance: 82, skill: 85, overall: 81 },
                { name: 'Jun', strength: 80, endurance: 85, skill: 86, overall: 84 },
                { name: 'Jul', strength: 83, endurance: 87, skill: 88, overall: 86 },
              ],
              stats: [
                { category: "Strength", metric: "Squat Max", value: "315 lbs", change: "+15 lbs", status: "improved" },
                { category: "Strength", metric: "Bench Press Max", value: "225 lbs", change: "+10 lbs", status: "improved" },
                { category: "Strength", metric: "Deadlift Max", value: "405 lbs", change: "+20 lbs", status: "improved" },
                { category: "Game Stats", metric: "Points Per Game", value: "7.4", change: "+1.2", status: "improved" },
                { category: "Game Stats", metric: "Rebounds Per Game", value: "7.5", change: "+0.8", status: "improved" },
                { category: "Game Stats", metric: "2PT Field Goal %", value: "65.9%", change: "+3.2%", status: "improved" },
                { category: "Game Stats", metric: "3PT Field Goal %", value: "23.1%", change: "-1.5%", status: "declined" }
              ],
              activities: [
                {
                  date: "2025-03-25",
                  time: "12:00 PM",
                  type: "Transfer Portal",
                  details: "Entered transfer portal after sophomore season"
                },
                {
                  date: "2025-02-08",
                  time: "7:30 PM",
                  type: "Game",
                  details: "17 points, 8 rebounds vs George Mason"
                },
                {
                  date: "2025-02-05",
                  time: "7:00 PM",
                  type: "Game",
                  details: "16 points, 8 rebounds vs Fordham"
                }
              ]
            }
          };
          
          try {
            // Try to insert default data
            const { data: inserted, error: insertError } = await supabase
              .from("player_dashboards")
              .insert(defaultData)
              .select()
              .single();
              
            if (insertError) throw insertError;
            setPlayerData(inserted);
            toast({
              title: "Created default player profile",
              description: "A default profile has been created for Uri Davidfuchs",
            });
          } catch (insertErr: any) {
            console.error("Failed to insert default data:", insertErr);
            // If insert fails, still use the default data for display
            setPlayerData(defaultData);
          }
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

  // Display the dashboard fullscreen without any app styling
  if (isLoading) {
    return (
      <div className="looker-fullscreen">
        <LoadingSpinner />
      </div>
    );
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

  // URI's official photo from the gorhody.com website
  const playerPhotoUrl = "https://gorhody.com/images/2024/9/26/websize-fuchs.png";

  return (
    <div className="looker-fullscreen">
      {playerData ? (
        <PlayerDashboard 
          playerData={playerData} 
          newsData={newsData}
          playerPhotoUrl={playerPhotoUrl} 
        />
      ) : (
        <div className="looker-empty-state">
          <h2>No Data Available</h2>
          <p>Could not find dashboard data for this player.</p>
        </div>
      )}
    </div>
  );
}
