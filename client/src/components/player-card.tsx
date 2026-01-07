import { User, Target, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Player } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  variant?: "default" | "auction" | "compact";
  teamColor?: string;
  showPrice?: boolean;
}

export function PlayerCard({ player, variant = "default", teamColor, showPrice }: PlayerCardProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Batsman":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "Bowler":
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400";
      case "All-rounder":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Batsman":
        return "🏏";
      case "Bowler":
        return "⚾";
      case "All-rounder":
        return "⭐";
      default:
        return "";
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50" data-testid={`player-card-${player.id}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={player.photoUrl} alt={player.name} />
          <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{player.name}</p>
          <p className="text-sm text-muted-foreground">{player.role}</p>
        </div>
        {showPrice && player.soldPrice && (
          <span className="font-display text-xl text-accent">{player.soldPrice.toLocaleString()}</span>
        )}
      </div>
    );
  }

  if (variant === "auction") {
    return (
      <Card 
        className={cn(
          "overflow-hidden relative",
          teamColor && `border-2`
        )}
        style={teamColor ? { borderColor: teamColor } : undefined}
        data-testid={`player-card-auction-${player.id}`}
      >
        <div className="relative aspect-[3/4] bg-gradient-to-b from-muted to-background">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Badge className={cn("mb-2", getRoleBadgeColor(player.role))}>
              {player.role}
            </Badge>
            <h3 className="font-display text-4xl mb-1">{player.name}</h3>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Target className="w-4 h-4" />
              </div>
              <p className="font-display text-3xl">{player.battingRating}</p>
              <p className="text-xs text-muted-foreground">Batting</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <CircleDot className="w-4 h-4" />
              </div>
              <p className="font-display text-3xl">{player.bowlingRating}</p>
              <p className="text-xs text-muted-foreground">Bowling</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <User className="w-4 h-4" />
              </div>
              <p className="font-display text-3xl">{player.fieldingRating}</p>
              <p className="text-xs text-muted-foreground">Fielding</p>
            </div>
          </div>
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Base Points</p>
            <p className="font-display text-5xl text-accent">{player.basePoints.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`player-card-${player.id}`}>
      <div className="relative aspect-[4/3] bg-gradient-to-b from-muted to-background">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge className={getRoleBadgeColor(player.role)}>
            {player.role}
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-display text-2xl truncate">{player.name}</h3>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-orange-500" title="Batting">
              <Target className="w-4 h-4 inline mr-1" />{player.battingRating}
            </span>
            <span className="text-purple-500" title="Bowling">
              <CircleDot className="w-4 h-4 inline mr-1" />{player.bowlingRating}
            </span>
            <span className="text-emerald-500" title="Fielding">
              <User className="w-4 h-4 inline mr-1" />{player.fieldingRating}
            </span>
          </div>
          <span className="font-display text-xl text-accent">{player.basePoints.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
