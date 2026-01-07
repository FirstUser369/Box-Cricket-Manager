import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Play, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CricketEventAnimation, BallIndicator } from "@/components/cricket-animations";
import type { Team, Match, BallEvent } from "@shared/schema";

type CricketEventType = "wicket" | "six" | "four" | "no-ball" | "wide" | "dot" | null;

export default function MatchDisplay() {
  const [currentEvent, setCurrentEvent] = useState<CricketEventType>(null);
  const [lastBallCount, setLastBallCount] = useState(0);

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    refetchInterval: 1000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 5000,
  });

  const { data: ballEvents } = useQuery<BallEvent[]>({
    queryKey: ["/api/ball-events"],
    refetchInterval: 1000,
  });

  const liveMatch = matches?.find(m => m.status === "live");
  const team1 = teams?.find(t => t.id === liveMatch?.team1Id);
  const team2 = teams?.find(t => t.id === liveMatch?.team2Id);
  const matchBallEvents = ballEvents?.filter(e => e.matchId === liveMatch?.id) || [];
  const currentInningsBalls = matchBallEvents.filter(e => e.innings === liveMatch?.currentInnings);

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

  const target = liveMatch?.currentInnings === 2 ? (liveMatch.team1Score + 1) : null;
  const requiredRuns = target ? target - (liveMatch?.team2Score || 0) : null;

  const getThisOver = () => {
    if (!liveMatch) return [];
    const currentOver = Math.floor(parseFloat(liveMatch.currentInnings === 1 ? liveMatch.team1Overs : liveMatch.team2Overs || "0"));
    return currentInningsBalls.filter(b => b.overNumber === currentOver + 1).slice(-6);
  };

  if (!liveMatch) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-8"
          >
            <Play className="w-16 h-16 text-white" />
          </motion.div>
          <h2 className="font-display text-5xl text-glow-purple mb-4">NO LIVE MATCH</h2>
          <p className="text-xl text-gray-400">Waiting for the next match to begin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden relative">
      <div className="absolute inset-0 stadium-spotlight opacity-30" />

      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 via-black/80 to-orange-900/80 backdrop-blur-sm border-b border-white/10 z-40">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-red-500/20 border-red-500 text-red-400 text-lg px-4 py-1">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
            <span className="text-gray-400">Match #{liveMatch.matchNumber}</span>
          </div>
          <h1 className="font-display text-3xl tracking-wide">BCL LIVE</h1>
        </div>
      </div>

      <div className="pt-28 px-8">
        <div className="flex items-center justify-center gap-12 mb-12">
          <motion.div 
            className="text-center"
            animate={{ scale: liveMatch.currentInnings === 1 ? 1.1 : 1 }}
          >
            <div 
              className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white font-display text-3xl mb-3"
              style={{ backgroundColor: team1?.primaryColor }}
            >
              {team1?.shortName}
            </div>
            <p className="font-display text-2xl">{team1?.name}</p>
            <p className="font-display text-5xl text-white mt-2">
              {liveMatch.team1Score}/{liveMatch.team1Wickets}
              <span className="text-2xl text-gray-400 ml-2">({liveMatch.team1Overs})</span>
            </p>
          </motion.div>

          <div className="text-center">
            <p className="text-gray-500 text-xl mb-2">VS</p>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-auto" />
          </div>

          <motion.div 
            className="text-center"
            animate={{ scale: liveMatch.currentInnings === 2 ? 1.1 : 1 }}
          >
            <div 
              className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white font-display text-3xl mb-3"
              style={{ backgroundColor: team2?.primaryColor }}
            >
              {team2?.shortName}
            </div>
            <p className="font-display text-2xl">{team2?.name}</p>
            <p className="font-display text-5xl text-white mt-2">
              {liveMatch.team2Score}/{liveMatch.team2Wickets}
              <span className="text-2xl text-gray-400 ml-2">({liveMatch.team2Overs})</span>
            </p>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display"
                  style={{ backgroundColor: battingTeam?.primaryColor }}
                >
                  {battingTeam?.shortName}
                </div>
                <div>
                  <p className="text-sm text-gray-400">BATTING</p>
                  <p className="font-display text-2xl">{battingTeam?.name}</p>
                </div>
              </div>
              <motion.div
                key={battingScore?.score}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-right"
              >
                <p className="font-display text-7xl text-glow-orange">
                  {battingScore?.score}<span className="text-4xl text-gray-400">/{battingScore?.wickets}</span>
                </p>
                <p className="text-xl text-gray-400">({battingScore?.overs} overs)</p>
              </motion.div>
            </div>

            {target && (
              <div className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">TARGET</p>
                  <p className="font-display text-3xl text-yellow-400">{target}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">NEED</p>
                  <p className="font-display text-3xl text-emerald-400">{requiredRuns}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">RUN RATE</p>
                  <p className="font-display text-3xl text-cyan-400">
                    {((battingScore?.score || 0) / (parseFloat(battingScore?.overs || "0") || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <h3 className="font-display text-xl mb-4 flex items-center gap-2">
              <Circle className="w-4 h-4 text-emerald-400" />
              THIS OVER
            </h3>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {getThisOver().map((ball, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
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
                <p className="text-gray-500">New over starting...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <CricketEventAnimation event={currentEvent} onComplete={handleEventComplete} />
    </div>
  );
}
