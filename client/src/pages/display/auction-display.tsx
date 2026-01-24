import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [lastAnimatedTimestamp, setLastAnimatedTimestamp] = useState<number | null>(null);
  const [showTeamFly, setShowTeamFly] = useState(false);
  const [flyingTeam, setFlyingTeam] = useState<Team | null>(null);
  const [targetPairIndex, setTargetPairIndex] = useState<number | null>(null);
  const previousAssignedTeamsRef = useRef<Set<string>>(new Set());

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

  // Detect when a player is sold using lastSoldTimestamp from auction state
  useEffect(() => {
    const soldTimestamp = auctionState?.lastSoldTimestamp;
    const soldPlayerId = auctionState?.lastSoldPlayerId;
    const soldTeamId = auctionState?.lastSoldTeamId;
    const soldPriceValue = auctionState?.lastSoldPrice;
    
    // Only trigger if we have a new timestamp that we haven't animated yet
    if (soldTimestamp && soldPlayerId && soldTeamId && soldTimestamp !== lastAnimatedTimestamp) {
      const soldPlayer = players?.find(p => p.id === soldPlayerId);
      const soldTeam = teams?.find(t => t.id === soldTeamId);
      
      if (soldPlayer && soldTeam && !showSold) {
        setLastSoldPlayer(soldPlayer);
        setLastSoldTeam(soldTeam);
        setLastSoldPrice(soldPriceValue || 0);
        setShowSold(true);
        setShowPlayerFly(false);
        setLastAnimatedTimestamp(soldTimestamp);
        triggerConfetti();
        // Start fly animation after confetti (delayed by 800ms)
        setTimeout(() => setShowPlayerFly(true), 800);
        setTimeout(() => setShowSold(false), 2500);
      }
    }
  }, [auctionState?.lastSoldTimestamp, auctionState?.lastSoldPlayerId, auctionState?.lastSoldTeamId, auctionState?.lastSoldPrice, players, teams, lastAnimatedTimestamp, triggerConfetti, showSold]);

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

  // Detect when a team is newly assigned to a captain pair and trigger flying animation
  useEffect(() => {
    if (!captainPairs || !teams) return;
    
    const currentAssigned = new Set<string>();
    captainPairs.forEach(pair => {
      if (pair.assignedTeamId) {
        currentAssigned.add(pair.assignedTeamId);
      }
    });
    
    // Find newly assigned team (one that wasn't assigned before but is now)
    currentAssigned.forEach(teamId => {
      if (!previousAssignedTeamsRef.current.has(teamId)) {
        const assignedTeam = teams.find(t => t.id === teamId);
        const assignedPair = captainPairs.find(p => p.assignedTeamId === teamId);
        if (assignedTeam && assignedPair) {
          // Find the index of this captain pair
          const sortedPairs = [...captainPairs].sort((a, b) => a.slotNumber - b.slotNumber);
          const pairIndex = sortedPairs.findIndex(p => p.id === assignedPair.id);
          
          setFlyingTeam(assignedTeam);
          setTargetPairIndex(pairIndex);
          setShowTeamFly(true);
          triggerConfetti();
          
          setTimeout(() => {
            setShowTeamFly(false);
            setFlyingTeam(null);
            setTargetPairIndex(null);
          }, 2000);
        }
      }
    });
    
    previousAssignedTeamsRef.current = currentAssigned;
  }, [captainPairs, teams, triggerConfetti]);

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
      <div className="absolute inset-0 auction-spotlight pointer-events-none" />
      
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-white/10 z-40">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gavel className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl tracking-wide">SPL-2026 AUCTION</h1>
              <Badge className="bg-red-500/20 border-red-500 text-red-400 text-xs">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Category Title Bar */}
      {auctionState?.status === "in_progress" && auctionState?.currentCategory && (
        <motion.div
          key={`category-bar-${auctionState.currentCategory}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-[60px] left-0 right-0 z-30"
          data-testid="category-title-bar"
        >
          <div 
            className={`w-full py-3 ${
              auctionState.currentCategory === "Team Names" 
                ? "bg-gradient-to-r from-violet-900 via-purple-800 to-violet-900 border-b-2 border-purple-400/50" 
                : auctionState.currentCategory === "Batsman" 
                ? "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b-2 border-blue-400/50"
                : auctionState.currentCategory === "Bowler"
                ? "bg-gradient-to-r from-red-900 via-rose-800 to-red-900 border-b-2 border-red-400/50"
                : auctionState.currentCategory === "All-rounder"
                ? "bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-900 border-b-2 border-emerald-400/50"
                : "bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 border-b-2 border-amber-400/50"
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/50" />
              <Crown className="w-8 h-8 text-white/90" />
              <h1 className="font-display text-5xl text-white tracking-widest uppercase">
                {auctionState.currentCategory === "Team Names" ? "TEAM NAMES" : auctionState.currentCategory} AUCTION
              </h1>
              <Crown className="w-8 h-8 text-white/90" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/50" />
            </div>
          </div>
        </motion.div>
      )}

      <div className={`pb-2 px-2 flex ${auctionState?.status === "in_progress" && auctionState?.currentCategory ? "pt-28 h-[calc(100vh-112px)]" : "pt-16 h-[calc(100vh-64px)]"}`}>
        {/* Left Side - Show Captain Pairs during Team Names auction, otherwise show Teams */}
        <div className="w-[420px] flex flex-col gap-1">
          {auctionState?.currentCategory === "Team Names" ? (
            // During Team Names auction: Show Captain Pairs (first 6)
            [...(captainPairs || [])].sort((a, b) => a.slotNumber - b.slotNumber).slice(0, 6).map((pair, index) => {
              const captain = players?.find(p => p.id === pair.captainId);
              const viceCaptain = players?.find(p => p.id === pair.viceCaptainId);
              const assignedTeam = teams?.find(t => t.id === pair.assignedTeamId);
              const isCurrentBidder = currentBiddingPair?.id === pair.id;
              
              return (
                <motion.div
                  key={pair.id}
                  id={`captain-pair-left-${index}`}
                  animate={{
                    scale: isCurrentBidder ? 1.02 : 1,
                    borderColor: isCurrentBidder ? "#9d4edd" : "rgba(255,255,255,0.1)",
                  }}
                  className="flex-1 bg-white/5 rounded-xl p-2 border-2 flex items-center"
                  style={{ 
                    borderColor: isCurrentBidder ? "#9d4edd" : "rgba(255,255,255,0.1)",
                    background: isCurrentBidder ? "linear-gradient(135deg, rgba(157,78,221,0.3), transparent)" : undefined
                  }}
                  data-testid={`captain-pair-${pair.id}`}
                >
                  <div className="flex items-center gap-3 w-full h-full">
                    {/* Logo placeholder - shows team logo if assigned, otherwise empty slot */}
                    <div 
                      className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-display text-3xl shadow-lg flex-shrink-0 overflow-hidden border-2 border-dashed"
                      style={{ 
                        backgroundColor: assignedTeam?.primaryColor || "#1a1a2e",
                        borderColor: assignedTeam ? assignedTeam.primaryColor : "#4a4a5a"
                      }}
                    >
                      {assignedTeam ? (
                        assignedTeam.logoUrl ? (
                          <img src={assignedTeam.logoUrl} alt={assignedTeam.name} className="w-full h-full object-cover" />
                        ) : (
                          assignedTeam.shortName
                        )
                      ) : (
                        <span className="text-gray-500 text-3xl">?</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {assignedTeam ? (
                        <span className="font-display text-2xl text-white block truncate leading-tight">{assignedTeam.name}</span>
                      ) : (
                        <span className="font-display text-2xl text-gray-400 block truncate leading-tight">Slot #{pair.slotNumber}</span>
                      )}
                      <div className="text-xl text-cyan-300 truncate font-bold leading-tight">
                        {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                      </div>
                      <div className="flex items-center gap-2 text-xl text-white leading-tight">
                        <Wallet className="w-7 h-7 text-green-400" />
                        <span className="font-bold text-green-400 text-2xl">{pair.remainingBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // During Player auction: Show Teams sorted by captain pair slot number
            (() => {
              const sortedPairs = [...(captainPairs || [])].sort((a, b) => a.slotNumber - b.slotNumber);
              const sortedTeams = sortedPairs
                .filter(pair => pair.assignedTeamId)
                .map(pair => teams?.find(t => t.id === pair.assignedTeamId))
                .filter((t): t is Team => t !== undefined);
              return sortedTeams.slice(0, 6);
            })().map((team, index) => {
              const captain = players?.find(p => p.id === team.captainId);
              const viceCaptain = players?.find(p => p.id === team.viceCaptainId);
              const hasOwners = captain || viceCaptain;
              const teamPlayers = players?.filter(p => p.teamId === team.id && p.id !== team.captainId && p.id !== team.viceCaptainId) || [];
              const playerCount = teamPlayers.length + (hasOwners ? 2 : 0);
              return (
                <motion.div
                  key={team.id}
                  id={`team-box-left-${index}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowTeamModal(true);
                  }}
                  className="flex-1 bg-white/5 rounded-xl p-3 border-2 cursor-pointer transition-all hover:bg-white/10 flex items-center"
                  style={{ 
                    borderColor: "rgba(255,255,255,0.1)"
                  }}
                  data-testid={`team-card-${team.id}`}
                >
                  <div className="flex items-center gap-3 w-full h-full">
                    <div 
                      className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-display text-3xl shadow-lg flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        team.shortName
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="font-display text-2xl text-white block truncate leading-tight">{team.name}</span>
                      {hasOwners ? (
                        <div className="text-xl text-cyan-300 truncate font-bold leading-tight">
                          {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                        </div>
                      ) : (
                        <div className="text-xl text-gray-500 leading-tight">No owner yet</div>
                      )}
                      <div className="flex items-center gap-2 text-xl text-white leading-tight">
                        <Wallet className="w-7 h-7 text-green-400" />
                        <span className="font-bold text-green-400 text-2xl">{team.remainingBudget.toLocaleString()}</span>
                        <span className="text-cyan-300 font-bold text-2xl">({playerCount}/8)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-6 border-2 border-white/20">
                    <div className="relative mb-4 flex justify-center">
                      <motion.div
                        animate={{ boxShadow: ["0 0 40px rgba(157,78,221,0.5)", "0 0 80px rgba(157,78,221,0.8)", "0 0 40px rgba(157,78,221,0.5)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="rounded-2xl"
                      >
                        <div 
                          className="w-40 h-40 rounded-2xl flex items-center justify-center text-white font-display text-5xl border-4 overflow-hidden"
                          style={{ 
                            backgroundColor: currentTeam.primaryColor,
                            borderColor: currentTeam.secondaryColor
                          }}
                        >
                          {currentTeam.logoUrl ? (
                            <img src={currentTeam.logoUrl} alt={currentTeam.name} className="w-full h-full object-cover" />
                          ) : (
                            currentTeam.shortName
                          )}
                        </div>
                      </motion.div>
                    </div>

                    <h2 className="font-display text-5xl text-center text-white text-glow-orange mb-4">
                      {currentTeam.name}
                    </h2>

                    <div className="mt-4 text-center">
                      <p className="text-xl text-gray-400 uppercase tracking-wide">BASE PRICE</p>
                      <p className="font-display text-5xl text-yellow-400">{(currentTeam.basePrice || 1000).toLocaleString()}</p>
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
                  <motion.div
                    className="bg-black/60 rounded-2xl px-8 py-4 border-4 border-yellow-400/70"
                  >
                    <motion.p
                      key={auctionState.currentBid}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-[8rem] leading-none text-yellow-400"
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
                        className="mt-6 flex items-center justify-center gap-3 bg-white/10 rounded-2xl p-4"
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
              <div className="flex flex-row gap-16 items-center justify-center">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 neon-purple rounded-3xl opacity-50" />
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-8 border-2 border-white/20">
                    <div className="relative mb-6 flex justify-center">
                      <motion.div
                        animate={{ boxShadow: ["0 0 40px rgba(157,78,221,0.5)", "0 0 80px rgba(157,78,221,0.8)", "0 0 40px rgba(157,78,221,0.5)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="rounded-full"
                      >
                        <Avatar className="w-64 h-64 border-4 border-purple-500/50">
                          <AvatarImage src={currentPlayer.photoUrl} className="object-cover" />
                          <AvatarFallback className="text-6xl font-display bg-gradient-to-br from-purple-600 to-orange-500">
                            {currentPlayer.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-orange-500 border-0 text-white px-6 py-3 text-2xl">
                        {getRoleIcon(currentPlayer.role)}
                        <span className="ml-2 uppercase">{currentPlayer.role}</span>
                      </Badge>
                    </div>

                    <h2 className="font-display text-5xl text-center text-white text-glow-orange mb-6">
                      {currentPlayer.name}
                    </h2>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-orange-500/20 rounded-lg p-4">
                        <Zap className="w-10 h-10 mx-auto text-orange-400 mb-2" />
                        <p className="text-5xl font-display text-orange-400">{currentPlayer.battingRating}</p>
                        <p className="text-lg text-gray-400">BATTING</p>
                      </div>
                      <div className="bg-purple-500/20 rounded-lg p-4">
                        <Target className="w-10 h-10 mx-auto text-purple-400 mb-2" />
                        <p className="text-5xl font-display text-purple-400">{currentPlayer.bowlingRating}</p>
                        <p className="text-lg text-gray-400">BOWLING</p>
                      </div>
                      <div className="bg-emerald-500/20 rounded-lg p-4">
                        <Shield className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                        <p className="text-5xl font-display text-emerald-400">{currentPlayer.fieldingRating}</p>
                        <p className="text-lg text-gray-400">FIELDING</p>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-2xl text-gray-400 uppercase tracking-wide">BASE PRICE</p>
                      <p className="font-display text-5xl text-yellow-400">{currentPlayer.basePoints.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-3xl text-gray-400 uppercase tracking-widest mb-4">Base Price</p>
                  <motion.div className="bg-black/60 rounded-2xl px-12 py-8 border-4 border-yellow-400/70">
                    <motion.p
                      className="font-display text-[10rem] leading-none text-yellow-400"
                      style={{ textShadow: "0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.5)" }}
                    >
                      {(currentPlayer.basePoints).toLocaleString()}
                    </motion.p>
                  </motion.div>

                  <div className="mt-8 text-4xl text-gray-400 uppercase tracking-widest">
                    Bidding in Progress...
                  </div>
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

        {/* Right Side - Show Captain Pairs during Team Names auction, otherwise show Teams */}
        <div className="w-[420px] flex flex-col gap-1">
          {auctionState?.currentCategory === "Team Names" ? (
            // During Team Names auction: Show Captain Pairs (last 6)
            [...(captainPairs || [])].sort((a, b) => a.slotNumber - b.slotNumber).slice(6, 12).map((pair, index) => {
              const captain = players?.find(p => p.id === pair.captainId);
              const viceCaptain = players?.find(p => p.id === pair.viceCaptainId);
              const assignedTeam = teams?.find(t => t.id === pair.assignedTeamId);
              const isCurrentBidder = currentBiddingPair?.id === pair.id;
              
              return (
                <motion.div
                  key={pair.id}
                  id={`captain-pair-right-${index}`}
                  animate={{
                    scale: isCurrentBidder ? 1.02 : 1,
                    borderColor: isCurrentBidder ? "#9d4edd" : "rgba(255,255,255,0.1)",
                  }}
                  className="flex-1 bg-white/5 rounded-xl p-2 border-2 flex items-center"
                  style={{ 
                    borderColor: isCurrentBidder ? "#9d4edd" : "rgba(255,255,255,0.1)",
                    background: isCurrentBidder ? "linear-gradient(135deg, rgba(157,78,221,0.3), transparent)" : undefined
                  }}
                  data-testid={`captain-pair-${pair.id}`}
                >
                  <div className="flex items-center gap-3 w-full h-full">
                    {/* Logo placeholder - shows team logo if assigned, otherwise empty slot */}
                    <div 
                      className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-display text-3xl shadow-lg flex-shrink-0 overflow-hidden border-2 border-dashed"
                      style={{ 
                        backgroundColor: assignedTeam?.primaryColor || "#1a1a2e",
                        borderColor: assignedTeam ? assignedTeam.primaryColor : "#4a4a5a"
                      }}
                    >
                      {assignedTeam ? (
                        assignedTeam.logoUrl ? (
                          <img src={assignedTeam.logoUrl} alt={assignedTeam.name} className="w-full h-full object-cover" />
                        ) : (
                          assignedTeam.shortName
                        )
                      ) : (
                        <span className="text-gray-500 text-3xl">?</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {assignedTeam ? (
                        <span className="font-display text-2xl text-white block truncate leading-tight">{assignedTeam.name}</span>
                      ) : (
                        <span className="font-display text-2xl text-gray-400 block truncate leading-tight">Slot #{pair.slotNumber}</span>
                      )}
                      <div className="text-xl text-cyan-300 truncate font-bold leading-tight">
                        {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                      </div>
                      <div className="flex items-center gap-2 text-xl text-white leading-tight">
                        <Wallet className="w-7 h-7 text-green-400" />
                        <span className="font-bold text-green-400 text-2xl">{pair.remainingBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // During Player auction: Show Teams sorted by captain pair slot number
            (() => {
              const sortedPairs = [...(captainPairs || [])].sort((a, b) => a.slotNumber - b.slotNumber);
              const sortedTeams = sortedPairs
                .filter(pair => pair.assignedTeamId)
                .map(pair => teams?.find(t => t.id === pair.assignedTeamId))
                .filter((t): t is Team => t !== undefined);
              return sortedTeams.slice(6, 12);
            })().map((team, index) => {
              const captain = players?.find(p => p.id === team.captainId);
              const viceCaptain = players?.find(p => p.id === team.viceCaptainId);
              const hasOwners = captain || viceCaptain;
              const teamPlayers = players?.filter(p => p.teamId === team.id && p.id !== team.captainId && p.id !== team.viceCaptainId) || [];
              const playerCount = teamPlayers.length + (hasOwners ? 2 : 0);
              return (
                <motion.div
                  key={team.id}
                  id={`team-box-right-${index}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowTeamModal(true);
                  }}
                  className="flex-1 bg-white/5 rounded-xl p-3 border-2 cursor-pointer transition-all hover:bg-white/10 flex items-center"
                  style={{ 
                    borderColor: "rgba(255,255,255,0.1)"
                  }}
                  data-testid={`team-card-${team.id}`}
                >
                  <div className="flex items-center gap-3 w-full h-full">
                    <div 
                      className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-display text-3xl shadow-lg flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        team.shortName
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="font-display text-2xl text-white block truncate leading-tight">{team.name}</span>
                      {hasOwners ? (
                        <div className="text-xl text-cyan-300 truncate font-bold leading-tight">
                          {captain?.name?.split(' ')[0] || ''} & {viceCaptain?.name?.split(' ')[0] || ''}
                        </div>
                      ) : (
                        <div className="text-xl text-gray-500 leading-tight">No owner yet</div>
                      )}
                      <div className="flex items-center gap-2 text-xl text-white leading-tight">
                        <Wallet className="w-7 h-7 text-green-400" />
                        <span className="font-bold text-green-400 text-2xl">{team.remainingBudget.toLocaleString()}</span>
                        <span className="text-cyan-300 font-bold text-2xl">({playerCount}/8)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
                    className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-white font-display text-5xl shadow-2xl overflow-hidden"
                    style={{ backgroundColor: lastSoldTeamName.primaryColor }}
                  >
                    {lastSoldTeamName.logoUrl ? (
                      <img src={lastSoldTeamName.logoUrl} alt={lastSoldTeamName.name} className="w-full h-full object-cover" />
                    ) : (
                      lastSoldTeamName.shortName
                    )}
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

      {/* Flying Team Animation - when team is assigned to captain pair */}
      <AnimatePresence>
        {showTeamFly && flyingTeam && targetPairIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {(() => {
              const sortedPairs = [...(captainPairs || [])].sort((a, b) => a.slotNumber - b.slotNumber);
              const isLeftSide = targetPairIndex < 6;
              const positionInColumn = isLeftSide ? targetPairIndex : targetPairIndex - 6;
              const targetY = 16 + (positionInColumn * 12);
              const targetX = isLeftSide ? 10 : 88;
              
              return (
                <motion.div
                  initial={{ 
                    x: "50vw", 
                    y: "40vh",
                    scale: 1.5,
                    opacity: 1
                  }}
                  animate={{ 
                    x: `${targetX}vw`,
                    y: `${targetY}vh`,
                    scale: 0.3,
                    opacity: 0.8
                  }}
                  transition={{ 
                    duration: 1.5,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div 
                    className="w-32 h-32 rounded-2xl flex items-center justify-center text-white font-display shadow-2xl border-4 overflow-hidden"
                    style={{ 
                      backgroundColor: flyingTeam.primaryColor,
                      borderColor: flyingTeam.secondaryColor || flyingTeam.primaryColor,
                      boxShadow: `0 0 60px ${flyingTeam.primaryColor}`
                    }}
                  >
                    {flyingTeam.logoUrl ? (
                      <img src={flyingTeam.logoUrl} alt={flyingTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{flyingTeam.shortName}</span>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Feed Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 via-black/95 to-purple-900/95 border-t border-purple-500/30 z-40">
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600">
            <Megaphone className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-sm uppercase tracking-wider">Live</span>
          </div>
          <div className="overflow-hidden flex-1 py-2">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: [0, -2500] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
            >
              {/* Dynamic Live Feed Items */}
              {(() => {
                const feedItems: { type: string; content: React.ReactNode; key: string }[] = [];
                
                // Add sold players info
                const soldPlayers = players?.filter(p => p.status === "sold" && p.teamId) || [];
                soldPlayers.slice(-5).forEach((player, idx) => {
                  const playerTeam = teams?.find(t => t.id === player.teamId);
                  if (playerTeam) {
                    feedItems.push({
                      type: "sold",
                      key: `sold-${player.id}-${idx}`,
                      content: (
                        <span className="inline-flex items-center">
                          <span className="text-emerald-400 font-bold mr-2">SOLD:</span>
                          <span className="text-white font-medium">{player.name}</span>
                          <span className="text-gray-400 mx-2">to</span>
                          <span 
                            className="px-2 py-0.5 rounded text-white font-medium"
                            style={{ backgroundColor: playerTeam.primaryColor }}
                          >
                            {playerTeam.shortName}
                          </span>
                          <span className="text-yellow-400 ml-2 font-bold">{player.soldPrice?.toLocaleString()} pts</span>
                        </span>
                      )
                    });
                  }
                });
                
                // Add team budgets
                teams?.forEach((team, idx) => {
                  const captain = players?.find(p => p.id === team.captainId);
                  const viceCaptain = players?.find(p => p.id === team.viceCaptainId);
                  const hasOwners = captain || viceCaptain;
                  const teamPlayersList = players?.filter(p => p.teamId === team.id && p.id !== team.captainId && p.id !== team.viceCaptainId) || [];
                  const playerCount = teamPlayersList.length + (hasOwners ? 2 : 0);
                  
                  if (hasOwners) {
                    feedItems.push({
                      type: "budget",
                      key: `budget-${team.id}-${idx}`,
                      content: (
                        <span className="inline-flex items-center">
                          <span 
                            className="px-2 py-0.5 rounded text-white font-medium mr-2"
                            style={{ backgroundColor: team.primaryColor }}
                          >
                            {team.shortName}
                          </span>
                          <span className="text-gray-400">Budget:</span>
                          <span className="text-green-400 font-bold ml-1">{team.remainingBudget.toLocaleString()}</span>
                          <span className="text-gray-400 mx-2">|</span>
                          <span className="text-gray-400">Squad:</span>
                          <span className="text-cyan-400 font-bold ml-1">{playerCount}/8</span>
                        </span>
                      )
                    });
                  }
                });
                
                // Add current category info
                if (auctionState?.currentCategory) {
                  feedItems.push({
                    type: "category",
                    key: "current-category",
                    content: (
                      <span className="inline-flex items-center">
                        <span className="text-orange-400 font-bold mr-2">CATEGORY:</span>
                        <span className="text-white font-medium">{auctionState.currentCategory}</span>
                        <span className="text-gray-400 ml-2">in progress</span>
                      </span>
                    )
                  });
                }
                
                // Add broadcast messages
                broadcasts?.forEach((broadcast, idx) => {
                  feedItems.push({
                    type: "broadcast",
                    key: `broadcast-${broadcast.id}-${idx}`,
                    content: (
                      <span className="inline-flex items-center">
                        <span className="text-purple-400 font-medium mr-2">{broadcast.title}:</span>
                        <span className="text-white">{broadcast.content}</span>
                      </span>
                    )
                  });
                });
                
                // Duplicate for seamless loop
                const allItems = [...feedItems, ...feedItems];
                
                return allItems.map((item, idx) => (
                  <span key={`${item.key}-${idx}`} className="inline-flex items-center mx-8">
                    {item.content}
                  </span>
                ));
              })()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Team Roster Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="bg-[#0a0e1a] border-white/20 text-white max-w-3xl max-h-[90vh]">
          {selectedTeam && (
            <>
              <DialogHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display text-2xl overflow-hidden"
                    style={{ backgroundColor: selectedTeam.primaryColor }}
                  >
                    {selectedTeam.logoUrl ? (
                      <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedTeam.shortName
                    )}
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
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/10"
                            data-testid={`roster-player-${player.id}`}
                          >
                            <Avatar className="w-16 h-16 border-3" style={{ borderColor: selectedTeam.primaryColor }}>
                              <AvatarImage src={player.photoUrl} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-orange-500 text-white font-display text-xl">
                                {player.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-lg truncate">{player.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-sm border-gray-600 text-gray-400">
                                  {player.role}
                                </Badge>
                                {player.isCaptain && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">C</Badge>
                                )}
                                {player.isViceCaptain && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">VC</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Base</p>
                                <p className="font-display text-lg text-gray-400">{player.basePoints?.toLocaleString() || '-'}</p>
                              </div>
                              <div className="text-center min-w-[80px]">
                                <p className="text-xs text-emerald-500 uppercase tracking-wider">Sold</p>
                                <p className="font-display text-2xl text-emerald-400 font-bold">{player.soldPrice?.toLocaleString() || '-'}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
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
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display overflow-hidden"
                              style={{ backgroundColor: playerTeam.primaryColor }}
                            >
                              {playerTeam.logoUrl ? (
                                <img src={playerTeam.logoUrl} alt={playerTeam.name} className="w-full h-full object-cover" />
                              ) : (
                                playerTeam.shortName
                              )}
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
