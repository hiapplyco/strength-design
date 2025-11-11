
import { Avatar } from "@/components/ui/avatar";

interface PlayerHeaderProps {
  playerName: string;
  teamName?: string;
  sport?: string;
}

export function PlayerHeader({ playerName, teamName, sport }: PlayerHeaderProps) {
  // Get initials from player name for the avatar
  const initials = playerName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center space-x-4 animate-in -translate-y-4 opacity-0 transition-all duration-300">
      <Avatar className="h-20 w-20 border-4 border-primary/20">
        <div className="text-xl font-bold">{initials}</div>
      </Avatar>
      
      <div>
        <h1 className="text-3xl font-bold">{playerName}</h1>
        <div className="text-muted-foreground">
          {teamName && <span>{teamName}</span>}
          {teamName && sport && <span className="mx-2">•</span>}
          {sport && <span>{sport}</span>}
        </div>
      </div>
    </div>
  );
}
