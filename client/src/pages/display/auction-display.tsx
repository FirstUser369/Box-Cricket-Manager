import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useState, useEffect, useCallback } from "react";
import { Gavel, Zap, Target, Shield, Star, TrendingUp, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Team, Player, AuctionState } from "@shared/schema";

export default function AuctionDisplay() {
  const [showSold, setShowSold] = useState(false);
  const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
  const [lastSoldTeam, setLastSoldTeam] = useState<Team | null>(null);
  const [lastSoldPrice, setLastSoldPrice] = useState(0);
  const [previousPlayerId, setPreviousPlayerId] = useState<string | null>(null);

  const { data: auctionState } = useQuery<AuctionState>({
    queryKey: ["/api/auction/state"],
    refetchInterval: 1000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 1000,
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    refetchInterval: 1000,
  });

  const currentPlayer = players?.find(p => p.id === auctionState?.currentPlayerId);
  const currentBiddingTeam = teams?.find(t => t.id === auctionState?.currentBiddingTeamId);

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ["#ff6b35", "#9d4edd", "#ffd60a", "#00f5ff", "#10b981"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (previousPlayerId && !auctionState?.currentPlayerId && previousPlayerId !== auctionState?.currentPlayerId) {
      const soldPlayer = players?.find(p => p.id === previousPlayerId && p.status === "sold");
      if (soldPlayer && soldPlayer.teamId) {
        const soldTeam = teams?.find(t => t.id === soldPlayer.teamId);
        if (soldTeam) {
          setLastSoldPlayer(soldPlayer);
          setLastSoldTeam(soldTeam);
          setLastSoldPrice(soldPlayer.soldPrice || 0);
          setShowSold(true);
          triggerConfetti();
          setTimeout(() => setShowSold(false), 4000);
        }
      }
    }
    setPreviousPlayerId(auctionState?.currentPlayerId || null);
  }, [auctionState?.currentPlayerId, players, teams, previousPlayerId, triggerConfetti]);

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "batsman": return <Zap className="w-5 h-5" />;
      case "bowler": return <Target className="w-5 h-5" />;
      case "all-rounder": return <Star className="w-5 h-5" />;
      case "wicket-keeper": return <Shield className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden relative">
      <div className="absolute inset-0 auction-spotlight" />
      
      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-white/10 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gavel className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide">BCL AUCTION</h1>
              <Badge className="bg-red-500/20 border-red-500 text-red-400">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-8 px-8">
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {teams?.map((team) => (
              <motion.div
                key={team.id}
                animate={{
                  scale: currentBiddingTeam?.id === team.id ? 1.05 : 1,
                  borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "transparent",
                }}
                className="shrink-0 bg-white/5 rounded-xl p-3 border-2 min-w-[140px]"
                style={{ borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "transparent" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display text-sm"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {team.shortName}
                  </div>
                  <span className="font-medium text-sm">{team.shortName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <Wallet className="w-3 h-3" />
                  <span>{team.remainingBudget.toLocaleString()}</span>
                </div>
                <Progress 
                  value={((team.budget - team.remainingBudget) / team.budget) * 100} 
                  className="h-1" 
                />
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {auctionState?.status === "not_started" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-8"
              >
                <Gavel className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="font-display text-5xl text-glow-purple mb-4">AUCTION STARTING SOON</h2>
              <p className="text-xl text-gray-400">Stay tuned for the action!</p>
            </motion.div>
          )}

          {auctionState?.status === "in_progress" && currentPlayer && (
            <motion.div
              key={currentPlayer.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col lg:flex-row gap-8 items-center justify-center"
            >
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 neon-purple rounded-3xl opacity-50" />
                <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-8 border border-white/20">
                  <div className="relative mb-6">
                    <motion.div
                      animate={{ boxShadow: ["0 0 30px rgba(157,78,221,0.5)", "0 0 60px rgba(157,78,221,0.8)", "0 0 30px rgba(157,78,221,0.5)"] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="rounded-full"
                    >
                      <Avatar className="w-48 h-48 border-4 border-purple-500/50">
                        <AvatarImage src={currentPlayer.photoUrl} className="object-cover" />
                        <AvatarFallback className="text-5xl font-display bg-gradient-to-br from-purple-600 to-orange-500">
                          {currentPlayer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-orange-500 border-0 text-white px-4 py-1">
                      {getRoleIcon(currentPlayer.role)}
                      <span className="ml-2 uppercase">{currentPlayer.role}</span>
                    </Badge>
                  </div>

                  <h2 className="font-display text-4xl text-center text-white text-glow-orange mb-4">
                    {currentPlayer.name}
                  </h2>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-orange-500/20 rounded-lg p-3">
                      <Zap className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                      <p className="text-2xl font-display text-orange-400">{currentPlayer.battingRating}</p>
                      <p className="text-xs text-gray-400">BATTING</p>
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-3">
                      <Target className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                      <p className="text-2xl font-display text-purple-400">{currentPlayer.bowlingRating}</p>
                      <p className="text-xs text-gray-400">BOWLING</p>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-3">
                      <Shield className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                      <p className="text-2xl font-display text-emerald-400">{currentPlayer.fieldingRating}</p>
                      <p className="text-xs text-gray-400">FIELDING</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">BASE PRICE</p>
                    <p className="font-display text-2xl text-yellow-400">{currentPlayer.basePoints.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-xl text-gray-400 uppercase tracking-widest mb-2">Current Bid</p>
                <motion.p
                  key={auctionState.currentBid}
                  initial={{ scale: 1.5, color: "#ffd60a" }}
                  animate={{ scale: 1, color: "#ff6b35" }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-[12rem] leading-none text-glow-gold animate-pulse-glow"
                >
                  {(auctionState.currentBid || currentPlayer.basePoints).toLocaleString()}
                </motion.p>

                <AnimatePresence>
                  {currentBiddingTeam && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="mt-8 flex items-center justify-center gap-4 bg-white/10 rounded-2xl p-6"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentBiddingTeam.primaryColor}40 0%, ${currentBiddingTeam.secondaryColor}40 100%)`,
                        borderLeft: `6px solid ${currentBiddingTeam.primaryColor}`
                      }}
                    >
                      <TrendingUp className="w-8 h-8 text-emerald-400" />
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-xl"
                        style={{ backgroundColor: currentBiddingTeam.primaryColor }}
                      >
                        {currentBiddingTeam.shortName}
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-400">LEADING BID</p>
                        <p className="font-display text-3xl text-white">{currentBiddingTeam.name}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {auctionState?.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-8"
              >
                <Gavel className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="font-display text-5xl text-glow-gold mb-4">AUCTION COMPLETE</h2>
              <p className="text-xl text-gray-400">All players have been assigned!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSold && lastSoldPlayer && lastSoldTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <motion.h1
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-[10rem] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent text-glow-gold"
              >
                SOLD!
              </motion.h1>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <p className="font-display text-5xl text-white">{lastSoldPlayer.name}</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl text-gray-400">to</span>
                  <div 
                    className="px-6 py-3 rounded-xl font-display text-3xl text-white"
                    style={{ backgroundColor: lastSoldTeam.primaryColor }}
                  >
                    {lastSoldTeam.name}
                  </div>
                </div>
                <p className="font-display text-7xl text-emerald-400 text-glow-gold">
                  {lastSoldPrice.toLocaleString()}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
