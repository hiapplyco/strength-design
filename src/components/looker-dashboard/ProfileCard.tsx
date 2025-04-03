
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileCardProps {
  playerName: string;
  teamName?: string;
  sport?: string;
  photoUrl?: string;
}

export function ProfileCard({ playerName, teamName, sport, photoUrl }: ProfileCardProps) {
  // Get initials from player name for the avatar fallback
  const initials = playerName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <div className="looker-panel looker-profile-card">
      <div className="looker-panel-content">
        <div className="looker-panel-header">
          <h2>Player Profile</h2>
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
        
        <div className="looker-profile-content">
          <div className="looker-profile-photo">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={playerName} 
                className="looker-player-image"
              />
            ) : (
              <Avatar className="looker-player-avatar">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
          
          <div className="looker-profile-info">
            <h3 className="looker-profile-name">{playerName}</h3>
            {teamName && <div className="looker-profile-team">{teamName}</div>}
            {sport && <div className="looker-profile-sport">{sport}</div>}
            <div className="looker-profile-stats">
              <div className="looker-profile-stat">
                <span className="looker-stat-label">Position</span>
                <span className="looker-stat-value">Forward</span>
              </div>
              <div className="looker-profile-stat">
                <span className="looker-stat-label">Height</span>
                <span className="looker-stat-value">6'8"</span>
              </div>
              <div className="looker-profile-stat">
                <span className="looker-stat-label">Year</span>
                <span className="looker-stat-value">Sophomore</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
