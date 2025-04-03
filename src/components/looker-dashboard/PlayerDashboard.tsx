
import { useEffect } from "react";
import { NewsPanel } from "./NewsPanel";
import { PerformancePanel } from "./PerformancePanel";
import { StatsPanel } from "./StatsPanel";
import { KpiRow } from "./KpiRow";
import { TeamRankingPanel } from "./TeamRankingPanel";
import { ActivityPanel } from "./ActivityPanel";
import { Header } from "./Header";
import { ProfileCard } from "./ProfileCard";

interface NewsDataType {
  title: string;
  details: string;
  highlights: string[];
  imageSrc?: string;
}

interface PlayerDashboardProps {
  playerData: any;
  newsData?: NewsDataType;
  playerPhotoUrl?: string;
}

export function PlayerDashboard({ playerData, newsData, playerPhotoUrl }: PlayerDashboardProps) {
  const dashboardData = playerData.dashboard_json || {};
  
  // Setup animations on load
  useEffect(() => {
    const panels = document.querySelectorAll('.looker-panel');
    panels.forEach((panel, index) => {
      setTimeout(() => {
        panel.classList.add('panel-visible');
      }, index * 120);
    });
  }, []);

  return (
    <div className="looker-container">
      <Header 
        playerName={playerData.player_name}
        teamName={playerData.team_name}
        sport={playerData.sport}
      />
      
      <KpiRow dashboardData={dashboardData} />
      
      <div className="looker-grid">
        <ProfileCard 
          playerName={playerData.player_name}
          teamName={playerData.team_name}
          sport={playerData.sport}
          photoUrl={playerPhotoUrl}
        />
        
        {newsData && (
          <div className="looker-panel">
            <NewsPanel 
              title={newsData.title}
              details={newsData.details}
              highlights={newsData.highlights}
              imageSrc={newsData.imageSrc}
            />
          </div>
        )}
        
        <div className="looker-panel">
          <PerformancePanel data={dashboardData.performanceData} />
        </div>
        
        <div className="looker-panel looker-panel-tall">
          <StatsPanel stats={dashboardData.stats} />
        </div>
        
        <div className="looker-panel">
          <TeamRankingPanel ranking={dashboardData.teamRanking || "#3"} />
        </div>
        
        <div className="looker-panel">
          <ActivityPanel activities={dashboardData.activities} />
        </div>
      </div>
    </div>
  );
}
