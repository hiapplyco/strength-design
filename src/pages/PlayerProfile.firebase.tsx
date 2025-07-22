import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlayerDashboard } from "@/components/looker-dashboard/PlayerDashboard";
import { LoadingState } from "@/components/ui/loading-states/LoadingState";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { typography, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore";

export default function PlayerProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
        // First try exact match
        const playersRef = collection(db, "player_dashboards");
        const exactQuery = query(
          playersRef,
          where("player_name", "==", "Uri Davidfuchs"),
          limit(1)
        );
        
        let playerSnapshot = await getDocs(exactQuery);
        
        // If no exact match, try case-insensitive search by querying all and filtering
        if (playerSnapshot.empty) {
          const allPlayersSnapshot = await getDocs(playersRef);
          const caseInsensitiveMatch = allPlayersSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.player_name?.toLowerCase().includes("davidfuchs");
          });
          
          if (caseInsensitiveMatch) {
            playerSnapshot = {
              empty: false,
              docs: [caseInsensitiveMatch],
              size: 1,
              forEach: (callback: any) => callback(caseInsensitiveMatch),
            } as any;
          }
        }

        if (!playerSnapshot.empty) {
          const doc = playerSnapshot.docs[0];
          const data = { id: doc.id, ...doc.data() };
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
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          try {
            // Try to insert default data
            const docRef = await addDoc(collection(db, "player_dashboards"), defaultData);
            setPlayerData({ id: docRef.id, ...defaultData });
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

  // Display loading state within the StandardPageLayout
  if (isLoading) {
    return (
      <StandardPageLayout
        maxWidth="full"
        noPadding={true}
        className="bg-[#f8f9fa]"
      >
        <div className="flex items-center justify-center h-full">
          <LoadingState 
            variant="spinner" 
            size="lg"
            message="Loading player dashboard..."
            className="py-20"
          />
        </div>
      </StandardPageLayout>
    );
  }

  // Display empty state if no data
  if (!playerData) {
    return (
      <StandardPageLayout
        title="Player Profile"
        maxWidth="full"
        noPadding={true}
        className="bg-[#f8f9fa]"
      >
        <div className="flex flex-col items-center justify-center h-full py-20">
          <h2 className={cn(typography.display.h4, "mb-4")}>No Data Available</h2>
          <p className={cn(typography.body.large, "text-muted-foreground")}>
            Could not find dashboard data for this player.
          </p>
        </div>
      </StandardPageLayout>
    );
  }

  // Display the dashboard with StandardPageLayout wrapper
  // Note: The looker-dashboard class is retained to apply Google Looker styling to the dashboard content
  return (
    <StandardPageLayout
      maxWidth="full"
      noPadding={true}
      className="bg-[#f8f9fa] looker-dashboard"
    >
      <PlayerDashboard 
        playerData={playerData} 
        newsData={newsData}
        playerPhotoUrl={playerPhotoUrl} 
      />
    </StandardPageLayout>
  );
}