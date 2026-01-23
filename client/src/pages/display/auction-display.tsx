import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useState, useEffect, useCallback } from "react";
import { Gavel, Zap, Target, Shield, Star, TrendingUp, Wallet, Crown, Megaphone, X, Users, Trophy, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AUCTION_CATEGORIES, type Team, type Player, type AuctionState, type AuctionCategory, type Broadcast, type CaptainPair } from "@shared/schema";

export default function AuctionDisplay() {
  const [showSold, setShowSold] = useState(false);
  const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
  const [lastSoldTeam, setLastSoldTeam] = useState<Team | null>(null);
  const [lastSoldPrice, setLastSoldPrice] = useState(0);
  const [previousPlayerId, setPreviousPlayerId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showTeamSold, setShowTeamSold] = useState(false);
  const [lastSoldTeamName, setLastSoldTeamName] = useState<Team | null>(null);
  const [lastSoldTeamCaptain, setLastSoldTeamCaptain] = useState<Player | null>(null);
  const [lastSoldTeamVC, setLastSoldTeamVC] = useState<Player | null>(null);
  const [previousTeamId, setPreviousTeamId] = useState<string | null>(null);
  const [showPlayerFly, setShowPlayerFly] = useState(false);

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

  const { data: broadcasts } = useQuery<Broadcast[]>({
    queryKey: ["/api/broadcasts/active"],
    refetchInterval: 5000,
  });

  const { data: captainPairs } = useQuery<CaptainPair[]>({
    queryKey: ["/api/captain-pairs"],
    refetchInterval: 1000,
  });

  const currentPlayer = players?.find(p => p.id === auctionState?.currentPlayerId);
  const currentBiddingTeam = teams?.find(t => t.id === auctionState?.currentBiddingTeamId);
  const currentTeam = teams?.find(t => t.id === auctionState?.currentTeamId);
  const currentBiddingPair = captainPairs?.find(p => p.id === auctionState?.currentBiddingPairId);

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
    // Detect when the previous player was sold (works when transitioning to next player OR to null)
    if (previousPlayerId && previousPlayerId !== auctionState?.currentPlayerId) {
      const soldPlayer = players?.find(p => p.id === previousPlayerId && p.status === "sold");
      if (soldPlayer && soldPlayer.teamId && !showSold) {
        const soldTeam = teams?.find(t => t.id === soldPlayer.teamId);
        if (soldTeam) {
          setLastSoldPlayer(soldPlayer);
          setLastSoldTeam(soldTeam);
          setLastSoldPrice(soldPlayer.soldPrice || 0);
          setShowSold(true);
          setShowPlayerFly(false);
          triggerConfetti();
          // Start fly animation after confetti (delayed by 800ms)
          setTimeout(() => setShowPlayerFly(true), 800);
          setTimeout(() => setShowSold(false), 2500);
        }
      }
    }
    setPreviousPlayerId(auctionState?.currentPlayerId || null);
  }, [auctionState?.currentPlayerId, players, teams, previousPlayerId, triggerConfetti, showSold]);

  // Detect when a team is sold in Team Names auction
  useEffect(() => {
    if (previousTeamId && previousTeamId !== auctionState?.currentTeamId) {
      const soldTeam = teams?.find(t => t.id === previousTeamId && t.captainId && t.viceCaptainId);
      if (soldTeam && !showTeamSold) {
        const captain = players?.find(p => p.id === soldTeam.captainId);
        const vc = players?.find(p => p.id === soldTeam.viceCaptainId);
        if (captain && vc) {
          setLastSoldTeamName(soldTeam);
          setLastSoldTeamCaptain(captain);
          setLastSoldTeamVC(vc);
          setShowTeamSold(true);
          triggerConfetti();
          setTimeout(() => setShowTeamSold(false), 2500);
        }
      }
    }
    setPreviousTeamId(auctionState?.currentTeamId || null);
  }, [auctionState?.currentTeamId, teams, players, previousTeamId, triggerConfetti, showTeamSold]);

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "batsman": return <Zap className="w-5 h-5" />;
      case "bowler": return <Target className="w-5 h-5" />;
      case "all-rounder": return <Star className="w-5 h-5" />;
      case "wicket-keeper": return <Shield className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category?: string | null) => {
    if (!category) return null;
    return AUCTION_CATEGORIES[category as AuctionCategory] || category;
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category) {
      case "3000": return "from-yellow-400 via-amber-500 to-orange-500";
      case "2500": return "from-purple-400 via-purple-500 to-purple-600";
      case "2000": return "from-cyan-400 via-cyan-500 to-blue-500";
      case "1500": return "from-emerald-400 via-emerald-500 to-green-600";
      default: return "from-gray-400 to-gray-600";
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
              <h1 className="font-display text-2xl tracking-wide">SPL-2026 AUCTION</h1>
              <Badge className="bg-red-500/20 border-red-500 text-red-400">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </div>
          {auctionState?.status === "in_progress" && auctionState?.currentCategory && (
            <motion.div
              key={auctionState.currentCategory}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
              data-testid="category-badge"
            >
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${getCategoryColor(auctionState.currentCategory)} shadow-lg`}>
                <Crown className="w-5 h-5 text-white" />
                <span className="font-display text-lg text-white tracking-wide">
                  {getCategoryName(auctionState.currentCategory)}
                </span>
                <Badge className="bg-white/20 text-white border-0 ml-2">
                  {auctionState.currentCategory} pts
                </Badge>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="pt-20 pb-4 px-2 h-[calc(100vh-80px)] flex">
        {/* Left Side - 6 Teams */}
        <div className="w-80 flex flex-col gap-1">
          {teams?.slice(0, 6).map((team, index) => {
            const captain = players?.find(p => p.id === team.captainId);
            const viceCaptain = players?.find(p => p.id === team.viceCaptainId);
            const hasOwners = captain || viceCaptain;
            const teamPlayers = players?.filter(p => p.teamId === team.id && p.id !== team.captainId && p.id !== team.viceCaptainId) || [];
            const playerCount = teamPlayers.length + (hasOwners ? 2 : 0);
            return (
              <motion.div
                key={team.id}
                id={`team-box-left-${index}`}
                animate={{
                  scale: currentBiddingTeam?.id === team.id ? 1.02 : 1,
                  borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "rgba(255,255,255,0.1)",
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedTeam(team);
                  setShowTeamModal(true);
                }}
                className="flex-1 bg-white/5 rounded-xl p-2 border-2 cursor-pointer transition-all hover:bg-white/10 flex items-center"
                style={{ 
                  borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "rgba(255,255,255,0.1)",
                  background: currentBiddingTeam?.id === team.id ? `linear-gradient(135deg, ${team.primaryColor}30, transparent)` : undefined
                }}
                data-testid={`team-card-${team.id}`}
              >
                <div className="flex items-center gap-2 w-full h-full">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-xl shadow-lg flex-shrink-0"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {team.shortName}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="font-display text-lg text-white block truncate leading-tight">{team.name}</span>
                    {hasOwners ? (
                      <div className="text-base text-yellow-400 truncate font-semibold leading-tight">
                        {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                      </div>
                    ) : (
                      <div className="text-base text-gray-500 leading-tight">No owner yet</div>
                    )}
                    <div className="flex items-center gap-2 text-base text-white leading-tight">
                      <Wallet className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-green-400 text-lg">{team.remainingBudget.toLocaleString()}</span>
                      <span className="text-cyan-300 font-bold text-lg">({playerCount}/8)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Center - Auction Content */}
        <div className="flex-1 overflow-hidden">
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

          {/* Team Names Auction Display */}
          {auctionState?.status === "in_progress" && auctionState?.currentCategory === "Team Names" && currentTeam && (
            <motion.div
              key={currentTeam.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full"
              data-testid="team-names-auction"
            >
              <div className="flex flex-row gap-12 items-center justify-center">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 neon-purple rounded-3xl opacity-50" />
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-10 border-2 border-white/20">
                    <div className="relative mb-8 flex justify-center">
                      <motion.div
                        animate={{ boxShadow: ["0 0 40px rgba(157,78,221,0.5)", "0 0 80px rgba(157,78,221,0.8)", "0 0 40px rgba(157,78,221,0.5)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="rounded-2xl"
                      >
                        <div 
                          className="w-56 h-56 rounded-2xl flex items-center justify-center text-white font-display text-6xl border-4"
                          style={{ 
                            backgroundColor: currentTeam.primaryColor,
                            borderColor: currentTeam.secondaryColor
                          }}
                        >
                          {currentTeam.shortName}
                        </div>
                      </motion.div>
                    </div>

                    <h2 className="font-display text-5xl text-center text-white text-glow-orange mb-6">
                      {currentTeam.name}
                    </h2>

                    <div className="mt-6 text-center">
                      <p className="text-xl text-gray-400 uppercase tracking-wide">BASE PRICE</p>
                      <p className="font-display text-6xl text-yellow-400">{(currentTeam.basePrice || 1000).toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-2xl text-gray-400 uppercase tracking-widest mb-4">Current Bid</p>
                  <motion.div
                    className="bg-black/60 rounded-2xl px-12 py-8 border-4 border-yellow-400/70"
                  >
                    <motion.p
                      key={auctionState.currentBid}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-[12rem] leading-none text-yellow-400"
                      style={{ textShadow: "0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.5)" }}
                    >
                      {(auctionState.currentBid || currentTeam.basePrice || 1000).toLocaleString()}
                    </motion.p>
                  </motion.div>

                  <AnimatePresence>
                    {currentBiddingPair && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="mt-10 flex items-center justify-center gap-4 bg-white/10 rounded-2xl p-6"
                      >
                        <TrendingUp className="w-10 h-10 text-emerald-400" />
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Star className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-base text-gray-400 uppercase tracking-wide">LEADING BID</p>
                            <p className="font-display text-3xl text-white">
                              {players?.find(p => p.id === currentBiddingPair.captainId)?.name || "Captain"} & {players?.find(p => p.id === currentBiddingPair.viceCaptainId)?.name || "VC"}
                            </p>
                            <p className="text-base text-gray-400">Slot {currentBiddingPair.slotNumber}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Player Auction Display */}
          {auctionState?.status === "in_progress" && auctionState?.currentCategory !== "Team Names" && currentPlayer && (
            <motion.div
              key={currentPlayer.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full"
              data-testid="player-auction"
            >
              <div className="flex flex-row gap-12 items-center justify-center">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 neon-purple rounded-3xl opacity-50" />
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-10 border-2 border-white/20">
                    <div className="relative mb-8 flex justify-center">
                      <motion.div
                        animate={{ boxShadow: ["0 0 40px rgba(157,78,221,0.5)", "0 0 80px rgba(157,78,221,0.8)", "0 0 40px rgba(157,78,221,0.5)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="rounded-full"
                      >
                        <Avatar className="w-56 h-56 border-4 border-purple-500/50">
                          <AvatarImage src={currentPlayer.photoUrl} className="object-cover" />
                          <AvatarFallback className="text-6xl font-display bg-gradient-to-br from-purple-600 to-orange-500">
                            {currentPlayer.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-orange-500 border-0 text-white px-4 py-1.5 text-base">
                        {getRoleIcon(currentPlayer.role)}
                        <span className="ml-2 uppercase">{currentPlayer.role}</span>
                      </Badge>
                    </div>

                    <h2 className="font-display text-5xl text-center text-white text-glow-orange mb-6">
                      {currentPlayer.name}
                    </h2>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-orange-500/20 rounded-lg p-4">
                        <Zap className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                        <p className="text-3xl font-display text-orange-400">{currentPlayer.battingRating}</p>
                        <p className="text-sm text-gray-400">BATTING</p>
                      </div>
                      <div className="bg-purple-500/20 rounded-lg p-4">
                        <Target className="w-6 h-6 mx-auto text-purple-400 mb-1" />
                        <p className="text-3xl font-display text-purple-400">{currentPlayer.bowlingRating}</p>
                        <p className="text-sm text-gray-400">BOWLING</p>
                      </div>
                      <div className="bg-emerald-500/20 rounded-lg p-4">
                        <Shield className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                        <p className="text-3xl font-display text-emerald-400">{currentPlayer.fieldingRating}</p>
                        <p className="text-sm text-gray-400">FIELDING</p>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-xl text-gray-400 uppercase tracking-wide">BASE PRICE</p>
                      <p className="font-display text-4xl text-yellow-400">{currentPlayer.basePoints.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-2xl text-gray-400 uppercase tracking-widest mb-4">Current Bid</p>
                  <motion.div className="bg-black/60 rounded-2xl px-12 py-8 border-4 border-yellow-400/70">
                    <motion.p
                      key={auctionState.currentBid}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-[12rem] leading-none text-yellow-400"
                      style={{ textShadow: "0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.5)" }}
                    >
                      {(auctionState.currentBid || currentPlayer.basePoints).toLocaleString()}
                    </motion.p>
                  </motion.div>

                  <AnimatePresence>
                    {currentBiddingTeam && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="mt-10 flex items-center justify-center gap-4 bg-white/10 rounded-2xl p-6"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentBiddingTeam.primaryColor}40 0%, ${currentBiddingTeam.secondaryColor}40 100%)`,
                          borderLeft: `6px solid ${currentBiddingTeam.primaryColor}`
                        }}
                      >
                        <TrendingUp className="w-10 h-10 text-emerald-400" />
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-2xl"
                          style={{ backgroundColor: currentBiddingTeam.primaryColor }}
                        >
                          {currentBiddingTeam.shortName}
                        </div>
                        <div className="text-left">
                          <p className="text-base text-gray-400 uppercase tracking-wide">LEADING BID</p>
                          <p className="font-display text-3xl text-white">{currentBiddingTeam.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              </div>
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

          {auctionState?.categoryBreak && auctionState?.completedCategory && !currentTeam && !currentPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.8, times: [0, 0.5, 1] }}
                className="mb-8"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(157,78,221,0.3)",
                      "0 0 60px rgba(157,78,221,0.6)",
                      "0 0 20px rgba(157,78,221,0.3)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-40 h-40 rounded-full bg-gradient-to-r ${getCategoryColor(auctionState.completedCategory)} flex items-center justify-center`}
                >
                  <Trophy className="w-20 h-20 text-white" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-display text-5xl text-glow-purple mb-4 text-center"
              >
                {getCategoryName(auctionState.completedCategory)}
              </motion.h2>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <p className="text-3xl text-white font-display mb-2">CATEGORY COMPLETE</p>
                <p className="text-xl text-gray-400">All players in this category have been auctioned</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex items-center gap-4"
              >
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-lg text-purple-400 font-medium uppercase tracking-wider">
                  Break - Next Category Starting Soon
                </span>
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-8 flex gap-4"
              >
                {["Team Names", "Batsman", "Bowler", "All-rounder", "Unsold"].map((cat) => (
                  <div
                    key={cat}
                    className={`px-6 py-3 rounded-xl border-2 ${
                      cat === auctionState.completedCategory
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 line-through"
                        : "border-gray-600 bg-white/5 text-gray-400"
                    }`}
                  >
                    <span className="font-display text-lg">{cat}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Right Side - 6 Teams */}
        <div className="w-80 flex flex-col gap-1">
          {teams?.slice(6, 12).map((team, index) => {
            const captain = players?.find(p => p.id === team.captainId);
            const viceCaptain = players?.find(p => p.id === team.viceCaptainId);
            const hasOwners = captain || viceCaptain;
            const teamPlayers = players?.filter(p => p.teamId === team.id && p.id !== team.captainId && p.id !== team.viceCaptainId) || [];
            const playerCount = teamPlayers.length + (hasOwners ? 2 : 0);
            return (
              <motion.div
                key={team.id}
                id={`team-box-right-${index}`}
                animate={{
                  scale: currentBiddingTeam?.id === team.id ? 1.02 : 1,
                  borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "rgba(255,255,255,0.1)",
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedTeam(team);
                  setShowTeamModal(true);
                }}
                className="flex-1 bg-white/5 rounded-xl p-2 border-2 cursor-pointer transition-all hover:bg-white/10 flex items-center"
                style={{ 
                  borderColor: currentBiddingTeam?.id === team.id ? team.primaryColor : "rgba(255,255,255,0.1)",
                  background: currentBiddingTeam?.id === team.id ? `linear-gradient(135deg, ${team.primaryColor}30, transparent)` : undefined
                }}
                data-testid={`team-card-${team.id}`}
              >
                <div className="flex items-center gap-2 w-full h-full">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-xl shadow-lg flex-shrink-0"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {team.shortName}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="font-display text-lg text-white block truncate leading-tight">{team.name}</span>
                    {hasOwners ? (
                      <div className="text-base text-yellow-400 truncate font-semibold leading-tight">
                        {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                      </div>
                    ) : (
                      <div className="text-base text-gray-500 leading-tight">No owner yet</div>
                    )}
                    <div className="flex items-center gap-2 text-base text-white leading-tight">
                      <Wallet className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-green-400 text-lg">{team.remainingBudget.toLocaleString()}</span>
                      <span className="text-cyan-300 font-bold text-lg">({playerCount}/8)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showSold && lastSoldPlayer && lastSoldTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Flying Player Card - starts after confetti */}
            {showPlayerFly && (() => {
              const teamIndex = teams?.findIndex(t => t.id === lastSoldTeam.id) ?? 0;
              const isLeftSide = teamIndex < 6;
              const positionInColumn = isLeftSide ? teamIndex : teamIndex - 6;
              // Calculate Y position based on team box position (each box is roughly 1/6 of the vertical space)
              const targetY = 12 + (positionInColumn * 13);
              const targetX = isLeftSide ? 8 : 92;
              
              return (
                <motion.div
                  initial={{ 
                    x: "50vw", 
                    y: "40vh",
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{ 
                    x: `${targetX}vw`,
                    y: `${targetY}vh`,
                    scale: 0.2,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="absolute"
                >
                  <div 
                    className="w-24 h-32 rounded-xl flex flex-col items-center justify-center text-white font-display shadow-2xl border-2"
                    style={{ 
                      backgroundColor: lastSoldTeam.primaryColor,
                      borderColor: lastSoldTeam.secondaryColor
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-center px-1 truncate w-full">{lastSoldPlayer.name?.split(' ')[0]}</span>
                  </div>
                </motion.div>
              );
            })()}

            {/* SOLD Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 2.5, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20,
                  delay: 0.1
                }}
                className="text-center relative"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 0px rgba(234, 179, 8, 0)",
                      "0 0 60px rgba(234, 179, 8, 0.9)",
                      "0 0 30px rgba(234, 179, 8, 0.5)"
                    ]
                  }}
                  transition={{ duration: 0.5 }}
                  className="border-[6px] border-amber-500 rounded-xl px-8 py-4 bg-black/80 backdrop-blur-md"
                >
                  <motion.h1
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 500 }}
                    className="font-display text-[6rem] md:text-[8rem] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent leading-none tracking-wider"
                    style={{ 
                      textShadow: "0 0 30px rgba(251, 191, 36, 0.6)",
                    }}
                  >
                    SOLD
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-2 space-y-1"
                  >
                    <p className="font-display text-2xl md:text-3xl text-white">{lastSoldPlayer.name}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-lg font-display text-lg md:text-xl text-white"
                        style={{ backgroundColor: lastSoldTeam.primaryColor }}
                      >
                        {lastSoldTeam.shortName || lastSoldTeam.name}
                      </span>
                      <span className="font-display text-2xl md:text-3xl text-emerald-400">
                        {lastSoldPrice.toLocaleString()} pts
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Sold Animation */}
      <AnimatePresence>
        {showTeamSold && lastSoldTeamName && lastSoldTeamCaptain && lastSoldTeamVC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/60"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center relative"
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${lastSoldTeamName.primaryColor}40`,
                    `0 0 80px ${lastSoldTeamName.primaryColor}80`,
                    `0 0 40px ${lastSoldTeamName.primaryColor}60`
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="border-4 rounded-3xl px-12 py-8 bg-black/90 backdrop-blur-md"
                style={{ borderColor: lastSoldTeamName.primaryColor }}
              >
                {/* Team Logo Flying In */}
                <motion.div
                  initial={{ scale: 3, y: -200, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6"
                >
                  <div 
                    className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-white font-display text-5xl shadow-2xl"
                    style={{ backgroundColor: lastSoldTeamName.primaryColor }}
                  >
                    {lastSoldTeamName.shortName}
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-5xl text-white mb-2"
                >
                  {lastSoldTeamName.name}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                  className="font-display text-6xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent mb-6"
                >
                  SOLD
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white/10 rounded-xl p-4"
                >
                  <p className="text-lg text-gray-400 uppercase tracking-wider mb-2">New Owners</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                      <p className="font-display text-2xl text-white">{lastSoldTeamCaptain.name}</p>
                      <p className="text-sm text-yellow-400">Captain</p>
                    </div>
                    <div className="text-3xl text-gray-500">&</div>
                    <div className="text-center">
                      <Star className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                      <p className="font-display text-2xl text-white">{lastSoldTeamVC.name}</p>
                      <p className="text-sm text-orange-400">Vice Captain</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Ticker */}
      {broadcasts && broadcasts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 via-black/95 to-purple-900/95 border-t border-purple-500/30 z-40">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600">
              <Megaphone className="w-5 h-5 text-white" />
              <span className="font-bold text-white text-sm uppercase tracking-wider">Live</span>
            </div>
            <div className="overflow-hidden flex-1 py-2">
              <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 20,
                    ease: "linear",
                  },
                }}
              >
                {[...broadcasts, ...broadcasts].map((broadcast, idx) => (
                  <span key={`broadcast-ticker-${idx}-${broadcast.id}`} className="inline-flex items-center mx-8">
                    <span className="text-purple-400 font-medium mr-2">{broadcast.title}:</span>
                    <span className="text-white">{broadcast.content}</span>
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Team Roster Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="bg-[#0a0e1a] border-white/20 text-white max-w-2xl max-h-[85vh]">
          {selectedTeam && (
            <>
              <DialogHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-2xl"
                    style={{ backgroundColor: selectedTeam.primaryColor }}
                  >
                    {selectedTeam.shortName}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-display text-white">{selectedTeam.name}</DialogTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <Wallet className="w-3 h-3 mr-1" />
                        {selectedTeam.remainingBudget.toLocaleString()} pts remaining
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Users className="w-3 h-3 mr-1" />
                        {players?.filter(p => p.teamId === selectedTeam.id).length || 0} players
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Team Roster
                  </h3>
                  <span className="text-xs text-gray-500">
                    Spent: {(selectedTeam.budget - selectedTeam.remainingBudget).toLocaleString()} pts
                  </span>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {players?.filter(p => p.teamId === selectedTeam.id).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No players bought yet</p>
                      </div>
                    ) : (
                      players?.filter(p => p.teamId === selectedTeam.id)
                        .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
                        .map((player) => (
                          <motion.div
                            key={player.id}
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedPlayer(player);
                              setShowPlayerModal(true);
                            }}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            data-testid={`roster-player-${player.id}`}
                          >
                            <Avatar className="w-12 h-12 border-2" style={{ borderColor: selectedTeam.primaryColor }}>
                              <AvatarImage src={player.photoUrl} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-orange-500 text-white font-display">
                                {player.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{player.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                  {player.role}
                                </Badge>
                                {player.isCaptain && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">C</Badge>
                                )}
                                {player.isViceCaptain && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">VC</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-lg text-emerald-400">{player.soldPrice?.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">pts</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </motion.div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Player Details Modal */}
      <Dialog open={showPlayerModal} onOpenChange={setShowPlayerModal}>
        <DialogContent className="bg-[#0a0e1a] border-white/20 text-white max-w-lg max-h-[85vh]">
          {selectedPlayer && (
            <>
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-4 border-purple-500/50">
                    <AvatarImage src={selectedPlayer.photoUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl font-display bg-gradient-to-br from-purple-600 to-orange-500">
                      {selectedPlayer.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl font-display text-white">{selectedPlayer.name}</DialogTitle>
                    <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-orange-500 border-0 text-white">
                      {getRoleIcon(selectedPlayer.role)}
                      <span className="ml-2 uppercase">{selectedPlayer.role}</span>
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Player Ratings */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                    <Zap className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-display text-orange-400">{selectedPlayer.battingRating}</p>
                    <p className="text-xs text-gray-400">BATTING</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-3 text-center">
                    <Target className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                    <p className="text-2xl font-display text-purple-400">{selectedPlayer.bowlingRating}</p>
                    <p className="text-xs text-gray-400">BOWLING</p>
                  </div>
                  <div className="bg-emerald-500/20 rounded-lg p-3 text-center">
                    <Shield className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                    <p className="text-2xl font-display text-emerald-400">{selectedPlayer.fieldingRating}</p>
                    <p className="text-xs text-gray-400">FIELDING</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-400">BASE PRICE</p>
                    <p className="font-display text-xl text-gray-300">{selectedPlayer.basePoints?.toLocaleString()}</p>
                  </div>
                  {selectedPlayer.soldPrice && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">SOLD FOR</p>
                      <p className="font-display text-xl text-emerald-400">{selectedPlayer.soldPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Team Info */}
                {selectedPlayer.teamId && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">BOUGHT BY</p>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const playerTeam = teams?.find(t => t.id === selectedPlayer.teamId);
                        return playerTeam ? (
                          <>
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display"
                              style={{ backgroundColor: playerTeam.primaryColor }}
                            >
                              {playerTeam.shortName}
                            </div>
                            <span className="font-medium">{playerTeam.name}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Auction History - Show current bid history if this is the current player in auction */}
                {auctionState?.currentPlayerId === selectedPlayer.id && auctionState.bidHistory && auctionState.bidHistory.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Live Bid History
                    </h3>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {[...auctionState.bidHistory].reverse().map((bid, index) => {
                          const bidTeam = teams?.find(t => t.id === bid.teamId);
                          return (
                            <div 
                              key={`${bid.teamId}-${bid.amount}-${index}`}
                              className={`flex items-center justify-between p-2 rounded-lg ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-white/5'}`}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display"
                                  style={{ backgroundColor: bidTeam?.primaryColor || '#666' }}
                                >
                                  {bidTeam?.shortName || '??'}
                                </div>
                                <span className="text-sm text-white">{bidTeam?.name || 'Unknown'}</span>
                              </div>
                              <span className={`font-display ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                {bid.amount.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Category */}
                {selectedPlayer.category && (
                  <div className="flex items-center justify-center">
                    <Badge className={`bg-gradient-to-r ${getCategoryColor(selectedPlayer.category)} text-white border-0 px-4 py-1`}>
                      <Crown className="w-4 h-4 mr-2" />
                      {getCategoryName(selectedPlayer.category)}
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
