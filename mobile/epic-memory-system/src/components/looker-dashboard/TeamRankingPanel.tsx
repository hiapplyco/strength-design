
import { TrendingUp, TrendingDown } from "lucide-react";

interface TeamRankingPanelProps {
  ranking: string;
}

export function TeamRankingPanel({ ranking }: TeamRankingPanelProps) {
  // Extract just the numeric part if ranking has a # symbol
  const rankNumber = ranking.startsWith('#') ? ranking.substring(1) : ranking;
  
  // Determine if ranking is improving or declining (assuming lower number is better)
  const isImproving = true; // This would ideally be determined by comparing to previous data
  
  return (
    <div className="looker-panel-content">
      <div className="looker-panel-header">
        <h2>Team Ranking</h2>
        <div className="looker-panel-actions">
          <button className="looker-icon-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="looker-ranking-display">
        <div className="looker-ranking-circle">
          <span className="looker-ranking-value">{ranking}</span>
          <div className="looker-ranking-trend">
            {isImproving ? (
              <TrendingUp className="looker-trend-icon improving" />
            ) : (
              <TrendingDown className="looker-trend-icon declining" />
            )}
          </div>
        </div>
        <div className="looker-ranking-label">Current Team Ranking</div>
        <div className="looker-ranking-context">
          <span className="looker-ranking-text">Among {parseInt(rankNumber) + 12} teams in division</span>
        </div>
      </div>
    </div>
  );
}
