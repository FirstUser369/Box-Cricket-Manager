import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Play, Circle, Target, TrendingUp, Trophy, User, Zap, ChevronRight, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CricketEventAnimation, BallIndicator } from "@/components/cricket-animations";
import type { Team, Match, BallEvent, Player, PlayerMatchStats } from "@shared/schema";

type CricketEventType = "wicket" | "six" | "four" | "no-ball" | "wide" | "dot" | null;

export default function MatchDisplay() {
  const [currentEvent, setCurrentEvent] = useState<CricketEventType>(null);
  const [lastBallCount, setLastBallCount] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedLiveTeamId, setSelectedLiveTeamId] = useState<{ id: string; name: string } | null>(null);

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    refetchInterval: 3000, // Optimized - check for live match every 3s
  });

  const liveMatch = matches?.find(m => m.status === "live");
  const hasLiveMatch = !!liveMatch;

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 10000, // Teams rarely change during matches
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    refetchInterval: 10000, // Players rarely change during matches
  });

  const { data: ballEvents } = useQuery<BallEvent[]>({
    queryKey: ["/api/ball-events"],
    refetchInterval: hasLiveMatch ? 2000 : 10000, // Poll faster only during live match
  });

  const completedMatches = matches?.filter(m => m.status === "completed") || [];
  const selectedMatch = matches?.find(m => m.id === selectedMatchId);

  const { data: matchStats } = useQuery<PlayerMatchStats[]>({
    queryKey: ["/api/matches", liveMatch?.id, "player-stats"],
    enabled: !!liveMatch?.id,
    refetchInterval: hasLiveMatch ? 2000 : 10000, // Poll faster only during live match
  });

  const { data: selectedMatchStats } = useQuery<PlayerMatchStats[]>({
    queryKey: ["/api/matches", selectedMatchId, "player-stats"],
    enabled: !!selectedMatchId,
  });

  const team1 = teams?.find(t => t.id === liveMatch?.team1Id);
  const team2 = teams?.find(t => t.id === liveMatch?.team2Id);
  const matchBallEvents = ballEvents?.filter(e => e.matchId === liveMatch?.id) || [];
  const currentInningsBalls = matchBallEvents.filter(e => e.innings === liveMatch?.currentInnings);

  const getPlayerName = (playerId: string | null | undefined) => {
    if (!playerId) return "TBD";
    const player = players?.find(p => p.id === playerId);
    return player?.name || "Unknown";
  };

  const getPlayerShortName = (playerId: string | null | undefined) => {
    if (!playerId) return "TBD";
    const player = players?.find(p => p.id === playerId);
    if (!player?.name) return "Unknown";
    const parts = player.name.split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  };

  const triggerEventAnimation = useCallback((event: BallEvent) => {
    if (event.isWicket) {
      setCurrentEvent("wicket");
    } else if (event.runs === 6) {
      setCurrentEvent("six");
    } else if (event.runs === 4) {
      setCurrentEvent("four");
    } else if (event.extraType === "no-ball") {
      setCurrentEvent("no-ball");
    } else if (event.extraType === "wide") {
      setCurrentEvent("wide");
    } else if (event.runs === 0 && !event.extras) {
      setCurrentEvent("dot");
    }
  }, []);

  useEffect(() => {
    if (currentInningsBalls.length > lastBallCount && lastBallCount > 0) {
      const latestBall = currentInningsBalls[currentInningsBalls.length - 1];
      triggerEventAnimation(latestBall);
    }
    setLastBallCount(currentInningsBalls.length);
  }, [currentInningsBalls.length, lastBallCount, currentInningsBalls, triggerEventAnimation]);

  const handleEventComplete = () => {
    setCurrentEvent(null);
  };

  const battingTeam = liveMatch?.currentInnings === 1 ? team1 : team2;
  const bowlingTeam = liveMatch?.currentInnings === 1 ? team2 : team1;
  const battingScore = liveMatch?.currentInnings === 1 
    ? { score: liveMatch.team1Score, wickets: liveMatch.team1Wickets, overs: liveMatch.team1Overs }
    : { score: liveMatch?.team2Score, wickets: liveMatch?.team2Wickets, overs: liveMatch?.team2Overs };

  const target = liveMatch?.currentInnings === 2 ? ((liveMatch.team1Score || 0) + 1) : null;
  const requiredRuns = target ? target - (liveMatch?.team2Score || 0) : null;
  const remainingBalls = liveMatch?.currentInnings === 2 
    ? Math.max(0, 36 - (parseFloat(liveMatch?.team2Overs || "0") * 6))
    : null;
  const requiredRate = remainingBalls && remainingBalls > 0 && requiredRuns
    ? ((requiredRuns / remainingBalls) * 6).toFixed(2)
    : null;

  const getThisOver = () => {
    if (!liveMatch) return [];
    const currentOvers = liveMatch.currentInnings === 1 ? liveMatch.team1Overs : liveMatch.team2Overs;
    const [o, b] = (currentOvers || "0.0").split(".").map(Number);
    const currentOver = b === 0 ? o : o + 1;
    return currentInningsBalls.filter(ball => ball.overNumber === currentOver).slice(-6);
  };

  const getStrikerStats = () => {
    if (!liveMatch?.strikerId || !matchStats) return null;
    const stats = matchStats.find(s => s.playerId === liveMatch.strikerId && s.innings === liveMatch.currentInnings);
    return {
      name: getPlayerName(liveMatch.strikerId),
      runs: stats?.runsScored || 0,
      balls: stats?.ballsFaced || 0,
      fours: stats?.fours || 0,
      sixes: stats?.sixes || 0,
      strikeRate: stats?.ballsFaced ? ((stats.runsScored || 0) / stats.ballsFaced * 100).toFixed(1) : "0.0",
      isStriker: true,
    };
  };

  const getNonStrikerStats = () => {
    if (!liveMatch?.nonStrikerId || !matchStats) return null;
    const stats = matchStats.find(s => s.playerId === liveMatch.nonStrikerId && s.innings === liveMatch.currentInnings);
    return {
      name: getPlayerName(liveMatch.nonStrikerId),
      runs: stats?.runsScored || 0,
      balls: stats?.ballsFaced || 0,
      fours: stats?.fours || 0,
      sixes: stats?.sixes || 0,
      strikeRate: stats?.ballsFaced ? ((stats.runsScored || 0) / stats.ballsFaced * 100).toFixed(1) : "0.0",
      isStriker: false,
    };
  };

  const getBowlerStats = () => {
    if (!liveMatch?.currentBowlerId || !matchStats) return null;
    const stats = matchStats.find(s => s.playerId === liveMatch.currentBowlerId && s.innings === liveMatch.currentInnings);
    const overs = parseFloat(stats?.oversBowled || "0.0");
    return {
      name: getPlayerName(liveMatch.currentBowlerId),
      overs: stats?.oversBowled || "0.0",
      runs: stats?.runsConceded || 0,
      wickets: stats?.wicketsTaken || 0,
      economy: overs > 0 ? ((stats?.runsConceded || 0) / overs).toFixed(2) : "0.00",
    };
  };

  const getBattingScorecard = () => {
    if (!matchStats || !liveMatch) return [];
    const battingTeamId = liveMatch.currentInnings === 1 ? liveMatch.team1Id : liveMatch.team2Id;
    const battingPlayers = players?.filter(p => p.teamId === battingTeamId) || [];
    
    return battingPlayers
      .map(player => {
        const stats = matchStats.find(s => s.playerId === player.id && s.innings === liveMatch.currentInnings);
        if (!stats || (stats.ballsFaced === 0 && !stats.isOut)) return null;
        return {
          id: player.id,
          name: getPlayerName(player.id),
          runs: stats.runsScored || 0,
          balls: stats.ballsFaced || 0,
          fours: stats.fours || 0,
          sixes: stats.sixes || 0,
          strikeRate: stats.ballsFaced ? ((stats.runsScored || 0) / stats.ballsFaced * 100).toFixed(1) : "0.0",
          isOut: stats.isOut || false,
          dismissal: stats.dismissalType || "not out",
          dismissedBy: stats.dismissedBy ? getPlayerName(stats.dismissedBy) : null,
          isStriker: player.id === liveMatch.strikerId,
          isNonStriker: player.id === liveMatch.nonStrikerId,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.isStriker || a!.isNonStriker ? -1 : 1));
  };

  const getBowlingScorecard = () => {
    if (!matchStats || !liveMatch) return [];
    const bowlingTeamId = liveMatch.currentInnings === 1 ? liveMatch.team2Id : liveMatch.team1Id;
    const bowlingPlayers = players?.filter(p => p.teamId === bowlingTeamId) || [];
    
    return bowlingPlayers
      .map(player => {
        const stats = matchStats.find(s => s.playerId === player.id && s.innings === liveMatch.currentInnings);
        if (!stats || stats.oversBowled === "0.0") return null;
        const overs = parseFloat(stats.oversBowled || "0.0");
        return {
          id: player.id,
          name: getPlayerName(player.id),
          overs: stats.oversBowled || "0.0",
          maidens: 0,
          runs: stats.runsConceded || 0,
          wickets: stats.wicketsTaken || 0,
          economy: overs > 0 ? ((stats.runsConceded || 0) / overs).toFixed(2) : "0.00",
          isCurrent: player.id === liveMatch.currentBowlerId,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.isCurrent ? -1 : 1));
  };

  const getRecentOvers = () => {
    if (!liveMatch) return [];
    const overs: { over: number; balls: BallEvent[]; runs: number }[] = [];
    const currentOvers = liveMatch.currentInnings === 1 ? liveMatch.team1Overs : liveMatch.team2Overs;
    const [o] = (currentOvers || "0.0").split(".").map(Number);
    
    for (let i = Math.max(1, o - 3); i <= o + 1; i++) {
      const overBalls = currentInningsBalls.filter(ball => ball.overNumber === i);
      if (overBalls.length > 0) {
        const totalRuns = overBalls.reduce((sum, ball) => sum + (ball.runs || 0) + (ball.extras || 0), 0);
        overs.push({ over: i, balls: overBalls, runs: totalRuns });
      }
    }
    return overs.slice(-4);
  };

  // Helper function to get scorecard for a completed match
  const getCompletedMatchScorecard = (match: Match, stats: PlayerMatchStats[], innings: number) => {
    const battingTeamId = innings === 1 ? match.team1Id : match.team2Id;
    const bowlingTeamId = innings === 1 ? match.team2Id : match.team1Id;
    const battingPlayers = players?.filter(p => p.teamId === battingTeamId) || [];
    const bowlingPlayers = players?.filter(p => p.teamId === bowlingTeamId) || [];

    const batters = battingPlayers
      .map(player => {
        const playerStats = stats.find(s => s.playerId === player.id && s.innings === innings);
        if (!playerStats || (playerStats.ballsFaced === 0 && !playerStats.isOut)) return null;
        return {
          id: player.id,
          name: getPlayerName(player.id),
          runs: playerStats.runsScored || 0,
          balls: playerStats.ballsFaced || 0,
          fours: playerStats.fours || 0,
          sixes: playerStats.sixes || 0,
          strikeRate: playerStats.ballsFaced ? ((playerStats.runsScored || 0) / playerStats.ballsFaced * 100).toFixed(1) : "0.0",
          isOut: playerStats.isOut || false,
          dismissal: playerStats.dismissalType || "not out",
          dismissedBy: playerStats.dismissedBy ? getPlayerName(playerStats.dismissedBy) : null,
        };
      })
      .filter(Boolean);

    const bowlers = bowlingPlayers
      .map(player => {
        const playerStats = stats.find(s => s.playerId === player.id && s.innings === innings);
        if (!playerStats || playerStats.oversBowled === "0.0") return null;
        const overs = parseFloat(playerStats.oversBowled || "0.0");
        return {
          id: player.id,
          name: getPlayerName(player.id),
          overs: playerStats.oversBowled || "0.0",
          runs: playerStats.runsConceded || 0,
          wickets: playerStats.wicketsTaken || 0,
          economy: overs > 0 ? ((playerStats.runsConceded || 0) / overs).toFixed(2) : "0.00",
        };
      })
      .filter(Boolean);

    return { batters, bowlers };
  };

  if (!liveMatch) {
    const selectedMatchTeam1 = selectedMatch ? teams?.find(t => t.id === selectedMatch.team1Id) : null;
    const selectedMatchTeam2 = selectedMatch ? teams?.find(t => t.id === selectedMatch.team2Id) : null;

    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <div className="absolute inset-0 auction-spotlight opacity-20" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-500 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl text-glow-purple mb-2">MATCH HISTORY</h1>
            <p className="text-gray-400">No live match. View completed match scorecards below.</p>
          </motion.div>

          {completedMatches.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-6"
              >
                <Play className="w-12 h-12 text-white" />
              </motion.div>
              <p className="text-xl text-gray-400">No completed matches yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMatches.map((match, idx) => {
                const matchTeam1 = teams?.find(t => t.id === match.team1Id);
                const matchTeam2 = teams?.find(t => t.id === match.team2Id);
                const winnerTeam = match.winnerId ? teams?.find(t => t.id === match.winnerId) : null;
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card 
                      className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
                      onClick={() => setSelectedMatchId(match.id)}
                      data-testid={`match-history-${match.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-gray-400 border-gray-600">
                              Match #{match.matchNumber}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-sm"
                                style={{ backgroundColor: matchTeam1?.primaryColor }}
                              >
                                {matchTeam1?.shortName}
                              </div>
                              <div className="text-center">
                                <p className="font-display text-lg">
                                  {match.team1Score}/{match.team1Wickets}
                                </p>
                                <p className="text-xs text-gray-500">({match.team1Overs})</p>
                              </div>
                              <span className="text-gray-500 text-sm">vs</span>
                              <div className="text-center">
                                <p className="font-display text-lg">
                                  {match.team2Score}/{match.team2Wickets}
                                </p>
                                <p className="text-xs text-gray-500">({match.team2Overs})</p>
                              </div>
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-sm"
                                style={{ backgroundColor: matchTeam2?.primaryColor }}
                              >
                                {matchTeam2?.shortName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {winnerTeam ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                <Trophy className="w-3 h-3 mr-1" />
                                {winnerTeam.shortName} won
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                Tie
                              </Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Match Scorecard Dialog */}
        <Dialog open={!!selectedMatchId} onOpenChange={(open) => !open && setSelectedMatchId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-[#0d1117] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedMatchId(null)}
                    className="hover:bg-white/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <span className="font-display text-xl">
                    Match #{selectedMatch?.matchNumber} Scorecard
                  </span>
                </div>
                {selectedMatch?.winnerId ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    {teams?.find(t => t.id === selectedMatch.winnerId)?.shortName} won
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Tie
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              {selectedMatch && selectedMatchStats && (
                <Tabs defaultValue="innings1" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5">
                    <TabsTrigger value="innings1" className="data-[state=active]:bg-white/10">
                      {selectedMatchTeam1?.shortName} - {selectedMatch.team1Score}/{selectedMatch.team1Wickets} ({selectedMatch.team1Overs})
                    </TabsTrigger>
                    <TabsTrigger value="innings2" className="data-[state=active]:bg-white/10">
                      {selectedMatchTeam2?.shortName} - {selectedMatch.team2Score}/{selectedMatch.team2Wickets} ({selectedMatch.team2Overs})
                    </TabsTrigger>
                  </TabsList>

                  {[1, 2].map(innings => {
                    const scorecard = getCompletedMatchScorecard(selectedMatch, selectedMatchStats, innings);
                    const battingTeam = innings === 1 ? selectedMatchTeam1 : selectedMatchTeam2;
                    const bowlingTeam = innings === 1 ? selectedMatchTeam2 : selectedMatchTeam1;
                    
                    return (
                      <TabsContent key={innings} value={`innings${innings}`} className="space-y-4 mt-4">
                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: battingTeam?.primaryColor }}
                              >
                                {battingTeam?.shortName?.[0]}
                              </div>
                              {battingTeam?.name} - Batting
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 text-xs border-b border-white/10">
                                    <th className="text-left py-2 px-3">Batter</th>
                                    <th className="text-center py-2 px-2">R</th>
                                    <th className="text-center py-2 px-2">B</th>
                                    <th className="text-center py-2 px-2">4s</th>
                                    <th className="text-center py-2 px-2">6s</th>
                                    <th className="text-center py-2 px-2">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.batters.map((batter) => (
                                    <tr key={batter!.id} className="border-b border-white/5">
                                      <td className="py-2 px-3">
                                        <span className={batter!.isOut ? 'text-gray-500' : 'text-white'}>{batter!.name}</span>
                                        {batter!.isOut && (
                                          <p className="text-xs text-gray-500">{batter!.dismissal} {batter!.dismissedBy && `b ${batter!.dismissedBy}`}</p>
                                        )}
                                      </td>
                                      <td className="text-center py-2 px-2 font-medium">{batter!.runs}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.balls}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.fours}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.sixes}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.strikeRate}</td>
                                    </tr>
                                  ))}
                                  {scorecard.batters.length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="text-center py-4 text-gray-500">No batting data</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: bowlingTeam?.primaryColor }}
                              >
                                {bowlingTeam?.shortName?.[0]}
                              </div>
                              {bowlingTeam?.name} - Bowling
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 text-xs border-b border-white/10">
                                    <th className="text-left py-2 px-3">Bowler</th>
                                    <th className="text-center py-2 px-2">O</th>
                                    <th className="text-center py-2 px-2">R</th>
                                    <th className="text-center py-2 px-2">W</th>
                                    <th className="text-center py-2 px-2">Eco</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.bowlers.map((bowler) => (
                                    <tr key={bowler!.id} className="border-b border-white/5">
                                      <td className="py-2 px-3 text-white">{bowler!.name}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.overs}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.runs}</td>
                                      <td className="text-center py-2 px-2 font-medium text-purple-300">{bowler!.wickets}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.economy}</td>
                                    </tr>
                                  ))}
                                  {scorecard.bowlers.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="text-center py-4 text-gray-500">No bowling data</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const strikerStats = getStrikerStats();
  const nonStrikerStats = getNonStrikerStats();
  const bowlerStats = getBowlerStats();
  const battingScorecard = getBattingScorecard();
  const bowlingScorecard = getBowlingScorecard();
  const recentOvers = getRecentOvers();

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden relative">
      <div className="absolute inset-0 stadium-spotlight opacity-30" />

      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 via-black/80 to-orange-900/80 backdrop-blur-sm border-b border-white/10 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Badge className="bg-red-500/20 border-red-500 text-red-400 text-sm px-3 py-1" data-testid="badge-live">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
            <span className="text-gray-400 text-sm">Match #{liveMatch.matchNumber}</span>
          </div>
          <h1 className="font-display text-2xl tracking-wide">BCL LIVE</h1>
        </div>
      </div>

      <div className="pt-20 px-4 pb-8">
        {/* Giant Score Display - Only Batting Team */}
        <div className="flex flex-col items-center justify-center mb-6">
          <motion.div 
            className="text-center cursor-pointer"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={() => battingTeam && setSelectedLiveTeamId({ id: battingTeam.id, name: battingTeam.name })}
          >
            {battingTeam?.logoUrl ? (
              <img 
                src={battingTeam.logoUrl} 
                alt={battingTeam.name} 
                className="w-40 h-40 md:w-56 md:h-56 mx-auto rounded-2xl object-cover mb-4"
                data-testid="batting-team-logo"
              />
            ) : (
              <div 
                className="w-40 h-40 md:w-56 md:h-56 mx-auto rounded-2xl flex items-center justify-center text-white font-display text-5xl md:text-6xl mb-4"
                style={{ backgroundColor: battingTeam?.primaryColor }}
                data-testid="batting-team-logo"
              >
                {battingTeam?.shortName}
              </div>
            )}
            <p className="font-display text-2xl md:text-3xl text-gray-300 uppercase tracking-wider mb-2">{battingTeam?.name}</p>
            <p className="font-display text-[12vw] md:text-[14vw] text-white leading-none" data-testid="batting-score">
              {battingScore?.score}/{battingScore?.wickets}
            </p>
            <p className="text-3xl md:text-4xl text-gray-400 mt-2">({battingScore?.overs} overs)</p>
          </motion.div>

          {/* Second Innings - Required Runs Display */}
          {liveMatch.currentInnings === 2 && target && requiredRuns !== null && remainingBalls !== null && (
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {requiredRuns > 0 ? (
                <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl px-8 py-6 border border-yellow-500/30">
                  <p className="font-display text-[8vw] md:text-[6vw] text-yellow-400 leading-none" data-testid="text-required-runs">
                    Need {requiredRuns} runs
                  </p>
                  <p className="font-display text-[5vw] md:text-[4vw] text-white mt-2" data-testid="text-remaining-balls">
                    in {remainingBalls} balls
                  </p>
                  <p className="text-xl md:text-2xl text-orange-400 mt-3">RRR: {requiredRate}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl px-8 py-6 border border-emerald-500/30">
                  <p className="font-display text-[6vw] md:text-[5vw] text-emerald-400 leading-none">
                    {battingTeam?.name} WON!
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* First Innings indicator */}
          {liveMatch.currentInnings === 1 && (
            <div className="mt-6 text-center">
              <Badge className="bg-blue-500/20 border-blue-500 text-blue-300 text-lg px-4 py-2">
                1st Innings
              </Badge>
            </div>
          )}
        </div>

        {/* Simplified Display - Only Current Players & This Over */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Current Batsmen */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl md:text-3xl text-white flex items-center gap-3">
                <Target className="w-8 h-8 text-emerald-400" />
                At The Crease
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strikerStats && (
                  <div className="flex items-center justify-between bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/30">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-emerald-500 text-white text-xl px-4 py-2">*</Badge>
                      <span className="font-display text-2xl md:text-4xl text-white" data-testid="text-striker-name">{strikerStats.name}</span>
                    </div>
                    <div className="flex items-center gap-6 md:gap-10">
                      <div className="text-center">
                        <p className="text-5xl md:text-7xl font-display text-white" data-testid="text-striker-runs">{strikerStats.runs}</p>
                        <p className="text-white/70 text-xl">({strikerStats.balls})</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl md:text-3xl text-white">{strikerStats.fours}</p>
                        <p className="text-white/70 text-lg">4s</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl md:text-3xl text-white">{strikerStats.sixes}</p>
                        <p className="text-white/70 text-lg">6s</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {nonStrikerStats && (
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-5">
                    <div className="flex items-center gap-4">
                      <User className="w-8 h-8 text-white/70" />
                      <span className="font-display text-xl md:text-3xl text-white" data-testid="text-nonstriker-name">{nonStrikerStats.name}</span>
                    </div>
                    <div className="flex items-center gap-6 md:gap-10">
                      <div className="text-center">
                        <p className="text-4xl md:text-5xl font-display text-white" data-testid="text-nonstriker-runs">{nonStrikerStats.runs}</p>
                        <p className="text-white/60 text-lg">({nonStrikerStats.balls})</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl text-white">{nonStrikerStats.fours}</p>
                        <p className="text-white/60 text-base">4s</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl text-white">{nonStrikerStats.sixes}</p>
                        <p className="text-white/60 text-base">6s</p>
                      </div>
                    </div>
                  </div>
                )}

                {!strikerStats && !nonStrikerStats && (
                  <div className="text-center text-white/50 py-8 text-2xl">
                    Waiting for batsmen to be selected...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Bowler */}
          {bowlerStats && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl md:text-3xl text-white flex items-center gap-3">
                  <Zap className="w-8 h-8 text-purple-400" />
                  Bowler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-purple-500/10 rounded-xl p-5 border border-purple-500/30">
                  <span className="font-display text-2xl md:text-4xl text-white" data-testid="text-bowler-name">{bowlerStats.name}</span>
                  <div className="flex items-center gap-6 md:gap-10">
                    <div className="text-center">
                      <p className="text-5xl md:text-6xl font-display text-white" data-testid="text-bowler-figures">{bowlerStats.wickets}-{bowlerStats.runs}</p>
                      <p className="text-white/60 text-xl">({bowlerStats.overs} ov)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl text-white">{bowlerStats.economy}</p>
                      <p className="text-white/60 text-lg">Econ</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* This Over */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl md:text-3xl text-white flex items-center gap-3">
                <Circle className="w-8 h-8 text-emerald-400" />
                This Over
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 flex-wrap min-h-[100px]">
                {getThisOver().map((ball, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="transform scale-125"
                  >
                    <BallIndicator
                      type={
                        ball.isWicket ? "wicket" :
                        ball.extraType === "wide" ? "wide" :
                        ball.extraType === "no-ball" ? "no-ball" :
                        ball.runs === 6 ? "six" :
                        ball.runs === 4 ? "boundary" :
                        "normal"
                      }
                      runs={ball.runs + (ball.extras || 0)}
                    />
                  </motion.div>
                ))}
                {getThisOver().length === 0 && (
                  <p className="text-white/50 text-2xl">New over starting...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
{/* Live Team Scorecard Dialog */}
      <Dialog open={!!selectedLiveTeamId} onOpenChange={(open) => !open && setSelectedLiveTeamId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-[#0d1117] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{selectedLiveTeamId?.name} Scorecard</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedLiveTeamId && liveMatch && matchStats && (() => {
               // Logic to determine which innings to show and handle "Inning not yet started"
               // Team 1 = Innings 1
               // Team 2 = Innings 2
               const isTeam1 = selectedLiveTeamId.id === liveMatch.team1Id;
               const targetInnings = isTeam1 ? 1 : 2;
               const teamHasStarted = (liveMatch.currentInnings || 1) >= targetInnings;
               
               if (!teamHasStarted) {
                 return (
                   <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                     <Clock className="w-12 h-12 mb-4 opacity-50" />
                     <p className="text-xl font-medium">Inning not yet started</p>
                   </div>
                 );
               }

               const scorecard = getCompletedMatchScorecard(liveMatch, matchStats, targetInnings);
               // Determine team objects for display
               const battingTeamObj = targetInnings === 1 ? team1 : team2;
               const bowlingTeamObj = targetInnings === 1 ? team2 : team1;

               return (
                 <div className="space-y-4 pt-4">
                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: battingTeamObj?.primaryColor }}
                              >
                                {battingTeamObj?.shortName?.[0]}
                              </div>
                              {battingTeamObj?.name} - Batting
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 text-xs border-b border-white/10">
                                    <th className="text-left py-2 px-3">Batter</th>
                                    <th className="text-center py-2 px-2">R</th>
                                    <th className="text-center py-2 px-2">B</th>
                                    <th className="text-center py-2 px-2">4s</th>
                                    <th className="text-center py-2 px-2">6s</th>
                                    <th className="text-center py-2 px-2">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.batters.map((batter) => (
                                    <tr key={batter!.id} className="border-b border-white/5">
                                      <td className="py-2 px-3">
                                        <span className={batter!.isOut ? 'text-gray-500' : 'text-white'}>{batter!.name}</span>
                                        {batter!.isOut && (
                                          <p className="text-xs text-gray-500">{batter!.dismissal} {batter!.dismissedBy && `b ${batter!.dismissedBy}`}</p>
                                        )}
                                      </td>
                                      <td className="text-center py-2 px-2 font-medium">{batter!.runs}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.balls}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.fours}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.sixes}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{batter!.strikeRate}</td>
                                    </tr>
                                  ))}
                                  {scorecard.batters.length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="text-center py-4 text-gray-500">No batting data</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: bowlingTeamObj?.primaryColor }}
                              >
                                {bowlingTeamObj?.shortName?.[0]}
                              </div>
                              {bowlingTeamObj?.name} - Bowling
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 text-xs border-b border-white/10">
                                    <th className="text-left py-2 px-3">Bowler</th>
                                    <th className="text-center py-2 px-2">O</th>
                                    <th className="text-center py-2 px-2">R</th>
                                    <th className="text-center py-2 px-2">W</th>
                                    <th className="text-center py-2 px-2">Eco</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scorecard.bowlers.map((bowler) => (
                                    <tr key={bowler!.id} className="border-b border-white/5">
                                      <td className="py-2 px-3 text-white">{bowler!.name}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.overs}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.runs}</td>
                                      <td className="text-center py-2 px-2 font-medium text-purple-300">{bowler!.wickets}</td>
                                      <td className="text-center py-2 px-2 text-gray-400">{bowler!.economy}</td>
                                    </tr>
                                  ))}
                                  {scorecard.bowlers.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="text-center py-4 text-gray-500">No bowling data</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                 </div>
               );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      
      <CricketEventAnimation event={currentEvent} onComplete={handleEventComplete} />
    </div>
  );
}
