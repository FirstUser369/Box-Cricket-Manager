import { cn } from "@/lib/utils";
import type { Match, Team } from "@shared/schema";

interface ScoreDisplayProps {
  match: Match;
  team1: Team;
  team2: Team;
  variant?: "compact" | "full";
}

export function ScoreDisplay({ match, team1, team2, variant = "compact" }: ScoreDisplayProps) {
  const battingTeam = match.currentInnings === 1 ? team1 : team2;
  const bowlingTeam = match.currentInnings === 1 ? team2 : team1;
  
  const currentScore = match.currentInnings === 1 
    ? { runs: match.team1Score, wickets: match.team1Wickets, overs: match.team1Overs }
    : { runs: match.team2Score, wickets: match.team2Wickets, overs: match.team2Overs };

  const targetScore = match.currentInnings === 2 
    ? { runs: match.team1Score, wickets: match.team1Wickets, overs: match.team1Overs }
    : null;

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-md" data-testid={`score-display-${match.id}`}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-md flex items-center justify-center text-white font-display text-sm"
            style={{ backgroundColor: team1.primaryColor }}
          >
            {team1.shortName}
          </div>
          <div>
            <p className="font-medium">{team1.shortName}</p>
            <p className="font-display text-xl">
              {match.team1Score}/{match.team1Wickets}
              <span className="text-sm text-muted-foreground ml-1">({match.team1Overs})</span>
            </p>
          </div>
        </div>
        
        <div className="text-center">
          {match.status === "live" ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/20 text-destructive text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              LIVE
            </span>
          ) : match.status === "completed" ? (
            <span className="text-sm text-muted-foreground">Completed</span>
          ) : (
            <span className="text-sm text-muted-foreground">vs</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-medium">{team2.shortName}</p>
            <p className="font-display text-xl">
              {match.team2Score}/{match.team2Wickets}
              <span className="text-sm text-muted-foreground ml-1">({match.team2Overs})</span>
            </p>
          </div>
          <div 
            className="w-10 h-10 rounded-md flex items-center justify-center text-white font-display text-sm"
            style={{ backgroundColor: team2.primaryColor }}
          >
            {team2.shortName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md p-6 border border-border" data-testid={`score-display-full-${match.id}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Match #{match.matchNumber}</h3>
        {match.status === "live" && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/20 text-destructive font-medium">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className={cn(
          "p-4 rounded-md border-2 transition-colors",
          match.currentInnings === 1 ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
              style={{ backgroundColor: team1.primaryColor }}
            >
              {team1.shortName}
            </div>
            <div>
              <p className="font-medium">{team1.name}</p>
              {match.tossWinnerId === team1.id && (
                <p className="text-xs text-muted-foreground">Won toss, elected to {match.tossDecision}</p>
              )}
            </div>
          </div>
          <div className="font-display">
            <span className="text-5xl">{match.team1Score}</span>
            <span className="text-3xl text-muted-foreground">/{match.team1Wickets}</span>
            <span className="text-lg text-muted-foreground ml-2">({match.team1Overs} ov)</span>
          </div>
        </div>

        <div className={cn(
          "p-4 rounded-md border-2 transition-colors",
          match.currentInnings === 2 ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
              style={{ backgroundColor: team2.primaryColor }}
            >
              {team2.shortName}
            </div>
            <div>
              <p className="font-medium">{team2.name}</p>
              {match.tossWinnerId === team2.id && (
                <p className="text-xs text-muted-foreground">Won toss, elected to {match.tossDecision}</p>
              )}
            </div>
          </div>
          <div className="font-display">
            <span className="text-5xl">{match.team2Score}</span>
            <span className="text-3xl text-muted-foreground">/{match.team2Wickets}</span>
            <span className="text-lg text-muted-foreground ml-2">({match.team2Overs} ov)</span>
          </div>
        </div>
      </div>

      {match.currentInnings === 2 && targetScore && (
        <div className="mt-4 p-3 rounded-md bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            {team2.shortName} need <span className="font-display text-xl text-foreground">
              {(targetScore.runs ?? 0) - (match.team2Score ?? 0) + 1}
            </span> runs from <span className="font-display text-lg text-foreground">
              {(36 - (parseFloat(match.team2Overs || "0") * 6)).toFixed(0)}
            </span> balls
          </p>
        </div>
      )}
    </div>
  );
}
