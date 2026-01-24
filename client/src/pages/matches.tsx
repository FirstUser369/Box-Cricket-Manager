import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Calendar, Trophy, Clock, Eye, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreDisplay } from "@/components/score-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Match, Team, BallEvent, Player, PlayerMatchStats } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Matches() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    refetchInterval: 5000, // Optimized polling
  });

  const hasLiveMatch = matches?.some(m => m.status === "live");

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 30000, // Teams rarely change
  });

  const { data: ballEvents } = useQuery<BallEvent[]>({
    queryKey: ["/api/ball-events"],
    refetchInterval: hasLiveMatch ? 3000 : 15000, // Poll faster only during live match
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    refetchInterval: 30000, // Players rarely change
  });

  const { data: matchStats } = useQuery<PlayerMatchStats[]>({
    queryKey: ["/api/matches", selectedMatchId, "stats"],
    queryFn: async () => {
      if (!selectedMatchId) return [];
      const response = await fetch(`/api/matches/${selectedMatchId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch match stats");
      return response.json();
    },
    enabled: !!selectedMatchId,
  });

  const liveMatches = matches?.filter(m => m.status === "live") || [];
  const upcomingMatches = matches?.filter(m => m.status === "scheduled") || [];
  const completedMatches = matches?.filter(m => m.status === "completed") || [];

  const getTeam = (teamId: string | null | undefined) => teamId ? teams?.find(t => t.id === teamId) : undefined;
  const getPlayer = (playerId: string | null | undefined) => playerId ? players?.find(p => p.id === playerId) : undefined;
  const getMatchBalls = (matchId: string) => ballEvents?.filter(b => b.matchId === matchId) || [];

  const selectedMatch = selectedMatchId ? matches?.find(m => m.id === selectedMatchId) : null;

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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => setSelectedMatchId(match.id)}
                            data-testid={`btn-view-scorecard-${match.id}`}
                          >
                            <Eye className="w-3 h-3" />
                            Scorecard
                          </Button>
                          <Badge className="bg-destructive/20 text-destructive gap-1">
                            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                            LIVE
                          </Badge>
                        </div>
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
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                        {winner && (
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {winner.name} won {match.result === "super_over" ? "by Super Over" : ""}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setSelectedMatchId(match.id)}
                          data-testid={`btn-view-scorecard-${match.id}`}
                        >
                          <Eye className="w-3 h-3" />
                          View Scorecard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Scorecard Dialog */}
      <Dialog open={!!selectedMatchId} onOpenChange={(open) => !open && setSelectedMatchId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Match Scorecard</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            {selectedMatch && (
              <ScorecardContent 
                match={selectedMatch}
                teams={teams || []}
                players={players || []}
                stats={matchStats || []}
                balls={getMatchBalls(selectedMatch.id)}
                getTeam={getTeam}
                getPlayer={getPlayer}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScorecardContent({
  match,
  teams,
  players,
  stats,
  balls,
  getTeam,
  getPlayer,
}: {
  match: Match;
  teams: Team[];
  players: Player[];
  stats: PlayerMatchStats[];
  balls: BallEvent[];
  getTeam: (teamId: string | null | undefined) => Team | undefined;
  getPlayer: (playerId: string | null | undefined) => Player | undefined;
}) {
  const team1 = getTeam(match.team1Id);
  const team2 = getTeam(match.team2Id);
  const winner = getTeam(match.winnerId);

  if (!team1 || !team2) return null;

  const innings1Stats = stats.filter(s => s.innings === 1);
  const innings2Stats = stats.filter(s => s.innings === 2);

  const team1Batters = innings1Stats.filter(s => {
    const player = getPlayer(s.playerId);
    return player?.teamId === team1.id;
  });

  const team2Batters = innings2Stats.filter(s => {
    const player = getPlayer(s.playerId);
    return player?.teamId === team2.id;
  });

  const team1Bowlers = innings2Stats.filter(s => {
    const player = getPlayer(s.playerId);
    return player?.teamId === team1.id && (s.oversBowled || parseFloat(s.oversBowled || "0") > 0);
  });

  const team2Bowlers = innings1Stats.filter(s => {
    const player = getPlayer(s.playerId);
    return player?.teamId === team2.id && (s.oversBowled || parseFloat(s.oversBowled || "0") > 0);
  });

  const sortedTeam1Batters = [...team1Batters].sort((a, b) => (a.battingPosition || 99) - (b.battingPosition || 99));
  const sortedTeam2Batters = [...team2Batters].sort((a, b) => (a.battingPosition || 99) - (b.battingPosition || 99));

  return (
    <div className="space-y-6 p-4">
      {/* Match Summary */}
      <div className="text-center space-y-2">
        <ScoreDisplay match={match} team1={team1} team2={team2} variant="full" />
        {winner && (
          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            {winner.name} won
          </Badge>
        )}
      </div>

      {/* Team 1 Innings */}
      <Card>
        <CardHeader className="pb-2" style={{ borderBottom: `3px solid ${team1.primaryColor}` }}>
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-display"
              style={{ backgroundColor: team1.primaryColor }}
            >
              {team1.shortName}
            </div>
            <span>{team1.name} - 1st Innings</span>
            <span className="ml-auto font-display text-xl">
              {match.team1Score || 0}/{match.team1Wickets || 0} ({match.team1Overs || "0.0"})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Batting */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Batting</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Batter</th>
                    <th className="text-center py-2 px-2">R</th>
                    <th className="text-center py-2 px-2">B</th>
                    <th className="text-center py-2 px-2">4s</th>
                    <th className="text-center py-2 px-2">6s</th>
                    <th className="text-center py-2 px-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeam1Batters.length > 0 ? sortedTeam1Batters.map((stat) => {
                    const player = getPlayer(stat.playerId);
                    const sr = stat.ballsFaced && stat.ballsFaced > 0 
                      ? ((stat.runsScored || 0) / stat.ballsFaced * 100).toFixed(1) 
                      : "0.0";
                    return (
                      <tr key={stat.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <span className={stat.isOut ? "text-muted-foreground" : "font-medium"}>
                            {player?.name || "Unknown"}
                          </span>
                          {stat.isOut && <span className="text-muted-foreground text-xs ml-1">(out)</span>}
                        </td>
                        <td className="text-center py-2 px-2 font-medium">{stat.runsScored || 0}</td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{stat.ballsFaced || 0}</td>
                        <td className="text-center py-2 px-2">{stat.fours || 0}</td>
                        <td className="text-center py-2 px-2">{stat.sixes || 0}</td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{sr}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">No batting data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bowling by Team 2 */}
          {team2Bowlers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Bowling</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Bowler</th>
                      <th className="text-center py-2 px-2">O</th>
                      <th className="text-center py-2 px-2">R</th>
                      <th className="text-center py-2 px-2">W</th>
                      <th className="text-center py-2 px-2">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team2Bowlers.map((stat) => {
                      const player = getPlayer(stat.playerId);
                      const overs = parseFloat(stat.oversBowled || "0");
                      const economy = overs > 0 ? ((stat.runsConceded || 0) / overs).toFixed(2) : "0.00";
                      return (
                        <tr key={stat.id} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium">{player?.name || "Unknown"}</td>
                          <td className="text-center py-2 px-2">{stat.oversBowled || "0"}</td>
                          <td className="text-center py-2 px-2">{stat.runsConceded || 0}</td>
                          <td className="text-center py-2 px-2 font-medium">{stat.wicketsTaken || 0}</td>
                          <td className="text-center py-2 px-2 text-muted-foreground">{economy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team 2 Innings */}
      <Card>
        <CardHeader className="pb-2" style={{ borderBottom: `3px solid ${team2.primaryColor}` }}>
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-display"
              style={{ backgroundColor: team2.primaryColor }}
            >
              {team2.shortName}
            </div>
            <span>{team2.name} - 2nd Innings</span>
            <span className="ml-auto font-display text-xl">
              {match.team2Score || 0}/{match.team2Wickets || 0} ({match.team2Overs || "0.0"})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Batting */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Batting</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Batter</th>
                    <th className="text-center py-2 px-2">R</th>
                    <th className="text-center py-2 px-2">B</th>
                    <th className="text-center py-2 px-2">4s</th>
                    <th className="text-center py-2 px-2">6s</th>
                    <th className="text-center py-2 px-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeam2Batters.length > 0 ? sortedTeam2Batters.map((stat) => {
                    const player = getPlayer(stat.playerId);
                    const sr = stat.ballsFaced && stat.ballsFaced > 0 
                      ? ((stat.runsScored || 0) / stat.ballsFaced * 100).toFixed(1) 
                      : "0.0";
                    return (
                      <tr key={stat.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <span className={stat.isOut ? "text-muted-foreground" : "font-medium"}>
                            {player?.name || "Unknown"}
                          </span>
                          {stat.isOut && <span className="text-muted-foreground text-xs ml-1">(out)</span>}
                        </td>
                        <td className="text-center py-2 px-2 font-medium">{stat.runsScored || 0}</td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{stat.ballsFaced || 0}</td>
                        <td className="text-center py-2 px-2">{stat.fours || 0}</td>
                        <td className="text-center py-2 px-2">{stat.sixes || 0}</td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{sr}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">No batting data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bowling by Team 1 */}
          {team1Bowlers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Bowling</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Bowler</th>
                      <th className="text-center py-2 px-2">O</th>
                      <th className="text-center py-2 px-2">R</th>
                      <th className="text-center py-2 px-2">W</th>
                      <th className="text-center py-2 px-2">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team1Bowlers.map((stat) => {
                      const player = getPlayer(stat.playerId);
                      const overs = parseFloat(stat.oversBowled || "0");
                      const economy = overs > 0 ? ((stat.runsConceded || 0) / overs).toFixed(2) : "0.00";
                      return (
                        <tr key={stat.id} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium">{player?.name || "Unknown"}</td>
                          <td className="text-center py-2 px-2">{stat.oversBowled || "0"}</td>
                          <td className="text-center py-2 px-2">{stat.runsConceded || 0}</td>
                          <td className="text-center py-2 px-2 font-medium">{stat.wicketsTaken || 0}</td>
                          <td className="text-center py-2 px-2 text-muted-foreground">{economy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
