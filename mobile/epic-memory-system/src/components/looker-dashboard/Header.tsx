
interface HeaderProps {
  playerName: string;
  teamName?: string;
  sport?: string;
}

export function Header({ playerName, teamName, sport }: HeaderProps) {
  return (
    <div className="looker-header">
      <div className="looker-branding">
        <span className="looker-logo">Looker</span>
        <span className="looker-subtitle">Athletics Dashboard</span>
      </div>
      
      <div className="looker-title">
        <h1>{playerName}</h1>
        <div className="looker-subtitle">
          {teamName && <span>{teamName}</span>}
          {teamName && sport && <span> • </span>}
          {sport && <span>{sport}</span>}
        </div>
      </div>
      
      <div className="looker-actions">
        <button className="looker-button">Export</button>
        <button className="looker-button">Share</button>
        <div className="looker-time-selector">
          <span>Last 30 days</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}
