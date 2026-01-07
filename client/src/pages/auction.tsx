import { useQuery } from "@tanstack/react-query";
import { Gavel, Clock, Users, Wallet, Trophy, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlayerCard } from "@/components/player-card";
import type { Team, Player, AuctionState } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Auction() {
  const { data: auctionState, isLoading: auctionLoading } = useQuery<AuctionState>({
    queryKey: ["/api/auction/state"],
    refetchInterval: 2000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 2000,
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    refetchInterval: 2000,
  });

  const currentPlayer = players?.find(p => p.id === auctionState?.currentPlayerId);
  const currentBiddingTeam = teams?.find(t => t.id === auctionState?.currentBiddingTeamId);

  const getStatusBadge = () => {
    switch (auctionState?.status) {
      case "in_progress":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600/30 gap-1">
            <Clock className="w-3 h-3" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-primary/20 text-primary gap-1">
            <Trophy className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "lost_gold_round":
        return (
          <Badge className="bg-accent text-accent-foreground gap-1">
            <Gavel className="w-3 h-3" />
            Lost Gold Round
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Not Started
          </Badge>
        );
    }
  };

  if (auctionLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto" />
          </div>
          <Skeleton className="h-96 max-w-md mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gavel className="w-8 h-8 text-primary" />
            <h1 className="font-display text-4xl sm:text-5xl">Auction</h1>
          </div>
          {getStatusBadge()}
        </div>

        {teams && teams.length > 0 && (
          <div className="mb-8">
            <ScrollArea className="w-full pb-4">
              <div className="flex gap-3 px-1">
                {teams.map((team) => (
                  <Card 
                    key={team.id}
                    className={cn(
                      "shrink-0 w-40 overflow-hidden",
                      currentBiddingTeam?.id === team.id && "ring-2 ring-primary"
                    )}
                    data-testid={`auction-team-${team.id}`}
                  >
                    <div 
                      className="h-1"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white font-display text-xs"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shortName}
                        </div>
                        <span className="text-sm font-medium truncate">{team.shortName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Wallet className="w-3 h-3" />
                        <span>{team.remainingBudget.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={((team.budget - team.remainingBudget) / team.budget) * 100} 
                        className="h-1" 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {auctionState?.status === "not_started" || !auctionState ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Gavel className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-3xl mb-4">Auction Not Started</h3>
              <p className="text-muted-foreground">
                The admin will start the auction soon. Stay tuned!
              </p>
            </CardContent>
          </Card>
        ) : auctionState.status === "completed" ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-3xl mb-4">Auction Complete</h3>
              <p className="text-muted-foreground mb-6">
                All players have been assigned to their teams.
              </p>
              <a href="/teams" className="text-primary hover:underline">
                View Team Squads
              </a>
            </CardContent>
          </Card>
        ) : currentPlayer ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <PlayerCard player={currentPlayer} variant="auction" teamColor={currentBiddingTeam?.primaryColor} />
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Current Bid</p>
                    <p className="font-display text-7xl sm:text-8xl text-primary">
                      {(auctionState.currentBid || currentPlayer.basePoints).toLocaleString()}
                    </p>
                  </div>

                  {currentBiddingTeam && (
                    <div className="flex items-center justify-center gap-3 p-4 rounded-md bg-muted/50">
                      <div 
                        className="w-10 h-10 rounded-md flex items-center justify-center text-white font-display"
                        style={{ backgroundColor: currentBiddingTeam.primaryColor }}
                      >
                        {currentBiddingTeam.shortName}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Leading Bid</p>
                        <p className="font-medium">{currentBiddingTeam.name}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Bid History
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {auctionState.bidHistory && auctionState.bidHistory.length > 0 ? (
                      [...auctionState.bidHistory].reverse().map((bid, i) => {
                        const team = teams?.find(t => t.id === bid.teamId);
                        return (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              {team && (
                                <div 
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-display"
                                  style={{ backgroundColor: team.primaryColor }}
                                >
                                  {team.shortName}
                                </div>
                              )}
                              <span className="text-sm">{team?.shortName || "Unknown"}</span>
                            </div>
                            <span className="font-display text-lg">{bid.amount.toLocaleString()}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No bids yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-bounce" />
              <h3 className="text-lg font-semibold mb-2">Waiting for Next Player</h3>
              <p className="text-muted-foreground">
                The admin is preparing the next player for auction.
              </p>
            </CardContent>
          </Card>
        )}

        {players && players.filter(p => p.status === "lost_gold").length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-3xl mb-6 flex items-center gap-2">
              <span className="text-accent">The Lost Gold</span>
              <Badge variant="outline">{players.filter(p => p.status === "lost_gold").length}</Badge>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {players.filter(p => p.status === "lost_gold").map((player) => (
                <Card key={player.id} className="overflow-hidden" data-testid={`lost-gold-${player.id}`}>
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
