import { useQuery } from "@tanstack/react-query";
import { Play, Calendar, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreDisplay } from "@/components/score-display";
import type { Match, Team, BallEvent, Player, PlayerMatchStats } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Matches() {
  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    refetchInterval: 3000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: ballEvents } = useQuery<BallEvent[]>({
    queryKey: ["/api/ball-events"],
    refetchInterval: 2000,
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const liveMatches = matches?.filter(m => m.status === "live") || [];
  const upcomingMatches = matches?.filter(m => m.status === "scheduled") || [];
  const completedMatches = matches?.filter(m => m.status === "completed") || [];

  const getTeam = (teamId: string) => teams?.find(t => t.id === teamId);
  const getPlayer = (playerId: string) => players?.find(p => p.id === playerId);
  const getMatchBalls = (matchId: string) => ballEvents?.filter(b => b.matchId === matchId) || [];

  if (matchesLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Matches</h1>
          <p className="text-muted-foreground">
            Live scores and match updates
          </p>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="live" className="gap-2" data-testid="tab-live">
              <Play className="w-4 h-4" />
              Live ({liveMatches.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2" data-testid="tab-upcoming">
              <Calendar className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
              <Trophy className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {liveMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Live Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Check back later or view upcoming matches
                  </p>
                </CardContent>
              </Card>
            ) : (
              liveMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);
                const balls = getMatchBalls(match.id);
                const recentBalls = balls.slice(-12);

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} className="overflow-hidden" data-testid={`match-live-${match.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">Match #{match.matchNumber}</span>
                        <Badge className="bg-destructive/20 text-destructive gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ScoreDisplay match={match} team1={team1} team2={team2} variant="full" />

                      <div>
                        <p className="text-sm text-muted-foreground mb-3">This Over</p>
                        <div className="flex gap-2 flex-wrap">
                          {recentBalls.map((ball, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-display text-lg",
                                ball.isWicket 
                                  ? "bg-destructive text-destructive-foreground"
                                  : ball.runs === 4
                                    ? "bg-blue-500 text-white"
                                    : ball.runs === 6
                                      ? "bg-emerald-500 text-white"
                                      : ball.extraType
                                        ? "bg-amber-500 text-white"
                                        : "bg-muted"
                              )}
                            >
                              {ball.isWicket ? "W" : ball.extraType ? (ball.extraType === "wide" ? "Wd" : "Nb") : ball.runs}
                            </div>
                          ))}
                        </div>
                      </div>

                      {balls.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">Last Ball</p>
                          <div className="p-3 rounded-md bg-muted/50">
                            <p className="text-sm">
                              {(() => {
                                const lastBall = balls[balls.length - 1];
                                const batsman = getPlayer(lastBall.batsmanId);
                                const bowler = getPlayer(lastBall.bowlerId);
                                
                                if (lastBall.isWicket) {
                                  return `WICKET! ${batsman?.name || "Batsman"} is out (${lastBall.wicketType})`;
                                } else if (lastBall.runs === 6) {
                                  return `SIX! ${batsman?.name || "Batsman"} hits it out of the park!`;
                                } else if (lastBall.runs === 4) {
                                  return `FOUR! Beautiful shot by ${batsman?.name || "Batsman"}`;
                                } else if (lastBall.extraType === "wide") {
                                  return `Wide ball by ${bowler?.name || "Bowler"}`;
                                } else if (lastBall.extraType === "no_ball") {
                                  return `No ball by ${bowler?.name || "Bowler"}`;
                                } else {
                                  return `${lastBall.runs} run${lastBall.runs !== 1 ? "s" : ""} by ${batsman?.name || "Batsman"}`;
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Upcoming Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Matches will be scheduled by the admin
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} data-testid={`match-upcoming-${match.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                            style={{ backgroundColor: team1.primaryColor }}
                          >
                            {team1.shortName}
                          </div>
                          <span className="font-medium">{team1.name}</span>
                        </div>

                        <div className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Match #{match.matchNumber}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="font-medium">{team2.name}</span>
                          <div 
                            className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                            style={{ backgroundColor: team2.primaryColor }}
                          >
                            {team2.shortName}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Completed Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Results will appear here after matches are played
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);
                const winner = match.winnerId ? getTeam(match.winnerId) : null;

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} data-testid={`match-completed-${match.id}`}>
                    <CardContent className="p-6">
                      <ScoreDisplay match={match} team1={team1} team2={team2} />
                      {winner && (
                        <div className="mt-4 pt-4 border-t border-border text-center">
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {winner.name} won {match.result === "super_over" ? "by Super Over" : ""}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
