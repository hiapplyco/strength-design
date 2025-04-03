
interface TeamRankingPanelProps {
  ranking: string;
}

export function TeamRankingPanel({ ranking }: TeamRankingPanelProps) {
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
        </div>
        <div className="looker-ranking-label">Current Team Ranking</div>
      </div>
    </div>
  );
}
