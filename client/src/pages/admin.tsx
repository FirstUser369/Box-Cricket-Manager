import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, Gavel, Play, Settings, Plus, Trash2, Edit, Lock, Unlock, Check, X, CircleDot, Target, Loader2, QrCode, RotateCcw, Trophy, Upload, Zap, Star, Award, TrendingUp, DollarSign, CreditCard, Save, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AUCTION_CATEGORIES, type Player, type Team, type Match, type AuctionState, type TournamentSettings, type AuctionCategory, type Broadcast } from "@shared/schema";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast({ title: "Logged in successfully" });
    } else {
      toast({ title: "Invalid password", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter admin password to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter password"
                data-testid="input-admin-password"
              />
            </div>
            <Button className="w-full" onClick={handleLogin} data-testid="button-admin-login">
              Login
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Default password: admin123
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { toast } = useToast();
  const [showSoldCelebration, setShowSoldCelebration] = useState(false);
  const [soldPlayerName, setSoldPlayerName] = useState("");
  const [soldTeamName, setSoldTeamName] = useState("");
  const [soldAmount, setSoldAmount] = useState(0);

  const triggerConfetti = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff6b35', '#9d4edd', '#ffd60a', '#00f5ff', '#10b981'],
      });
    }, 250);
  }, []);

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: auctionState, isLoading: auctionLoading } = useQuery<AuctionState>({
    queryKey: ["/api/auction/state"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (team: { name: string; shortName: string; primaryColor: string }) => {
      return apiRequest("POST", "/api/teams", team);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create team", variant: "destructive" });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; basePoints?: number; isLocked?: boolean }) => {
      return apiRequest("PATCH", `/api/players/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player updated" });
    },
  });

  const auctionControlMutation = useMutation({
    mutationFn: async (action: string) => {
      return apiRequest("POST", "/api/auction/control", { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const auctionResetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auction/reset", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Auction reset successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reset auction", variant: "destructive" });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; shortName?: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string; groupName?: string }) => {
      return apiRequest("PATCH", `/api/teams/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team updated" });
    },
  });

  const assignGroupsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tournament/assign-groups", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Groups assigned & fixtures generated!" });
    },
  });

  const generateFixturesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tournament/generate-fixtures", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Group stage fixtures generated" });
    },
  });

  const placeBidMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return apiRequest("POST", "/api/auction/bid", { teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
    },
  });

  const sellPlayerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auction/sell", {});
    },
    onMutate: () => {
      if (currentPlayer && currentBiddingTeam && auctionState) {
        setSoldPlayerName(currentPlayer.name);
        setSoldTeamName(currentBiddingTeam.name);
        setSoldAmount(auctionState.currentBid || currentPlayer.basePoints);
        setShowSoldCelebration(true);
        triggerConfetti();
        setTimeout(() => setShowSoldCelebration(false), 3000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Player sold!" });
    },
  });

  const unsoldPlayerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auction/unsold", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player marked as unsold" });
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: { team1Id: string; team2Id: string }) => {
      return apiRequest("POST", "/api/matches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Match created" });
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async ({ matchId, ...data }: { matchId: string; tossWinnerId: string; tossDecision: string }) => {
      return apiRequest("POST", `/api/matches/${matchId}/start`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Match started!" });
    },
  });

  const recordBallMutation = useMutation({
    mutationFn: async ({ matchId, ...data }: { matchId: string; runs: number; extraType?: string; isWicket?: boolean; wicketType?: string }) => {
      return apiRequest("POST", `/api/matches/${matchId}/ball`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ball-events"] });
    },
  });

  const setPowerOverMutation = useMutation({
    mutationFn: async ({ matchId, overNumber, innings }: { matchId: string; overNumber: number; innings: number }) => {
      return apiRequest("POST", `/api/matches/${matchId}/power-over`, { overNumber, innings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Power Over set!" });
    },
  });

  const currentPlayer = players?.find(p => p.id === auctionState?.currentPlayerId);
  const currentBiddingTeam = teams?.find(t => t.id === auctionState?.currentBiddingTeamId);
  const liveMatch = matches?.find(m => m.status === "live");

  const getNextPlayer = () => {
    const availablePlayers = players?.filter(p => p.status === "registered" || p.status === "in_auction");
    return availablePlayers?.[0];
  };

  const getBidIncrement = (currentBid: number) => {
    if (currentBid <= 5000) return 200;
    if (currentBid <= 10000) return 500;
    return 1000;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl">Admin Panel</h1>
            <p className="text-muted-foreground">Manage the tournament</p>
          </div>
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-600">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        </div>

        <Tabs defaultValue="registration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 max-w-6xl">
            <TabsTrigger value="registration" className="gap-2" data-testid="admin-tab-registration">
              <QrCode className="w-4 h-4" />
              Registration
            </TabsTrigger>
            <TabsTrigger value="auction" className="gap-2" data-testid="admin-tab-auction">
              <Gavel className="w-4 h-4" />
              Auction
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2" data-testid="admin-tab-teams">
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2" data-testid="admin-tab-players">
              <Target className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="tournament" className="gap-2" data-testid="admin-tab-tournament">
              <Trophy className="w-4 h-4" />
              Tournament
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2" data-testid="admin-tab-scoring">
              <Play className="w-4 h-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="gap-2" data-testid="admin-tab-broadcasts">
              <Megaphone className="w-4 h-4" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="admin-tab-settings">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Registration QR Code
                  </CardTitle>
                  <CardDescription>
                    Display this QR code for players to scan and register on their phones
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-white rounded-md">
                    <QRCodeSVG 
                      value={typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register'}
                      size={200}
                      level="H"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan to open registration form
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const url = `${window.location.origin}/register`;
                      navigator.clipboard.writeText(url);
                      toast({ title: "Link copied to clipboard" });
                    }}
                    data-testid="button-copy-link"
                  >
                    Copy Registration Link
                  </Button>
                </CardContent>
              </Card>

              <PlayerApprovalPanel players={players} isLoading={playersLoading} />
            </div>
          </TabsContent>

          <TabsContent value="auction" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Auction Control</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    Status: <Badge variant="outline" className="ml-2">{auctionState?.status || "not_started"}</Badge>
                    {auctionState?.currentCategory && (
                      <Badge 
                        className="ml-2 bg-gradient-to-r from-purple-500 to-orange-500 text-white border-0"
                        data-testid="admin-category-badge"
                      >
                        {AUCTION_CATEGORIES[auctionState.currentCategory as AuctionCategory]} ({auctionState.currentCategory} pts)
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-destructive border-destructive/30" data-testid="button-reset-auction">
                      <RotateCcw className="w-4 h-4" />
                      Reset Auction
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Auction?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all player assignments, restore all team budgets to full, and reset the auction to "not started" state. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => auctionResetMutation.mutate()} className="bg-destructive text-destructive-foreground">
                        Reset Auction
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {auctionState?.status === "not_started" && (
                    <Button onClick={() => auctionControlMutation.mutate("start")} data-testid="button-start-auction">
                      <Play className="w-4 h-4 mr-2" />
                      Start Auction
                    </Button>
                  )}
                  {auctionState?.status === "in_progress" && (
                    <Button variant="outline" onClick={() => auctionControlMutation.mutate("pause")}>
                      Pause Auction
                    </Button>
                  )}
                  {auctionState?.status === "paused" && (
                    <Button onClick={() => auctionControlMutation.mutate("resume")}>
                      Resume Auction
                    </Button>
                  )}
                  {(auctionState?.status === "in_progress" || auctionState?.status === "paused") && (
                    <Button variant="outline" onClick={() => auctionControlMutation.mutate("next")}>
                      Next Player
                    </Button>
                  )}
                  {auctionState?.status !== "not_started" && auctionState?.status !== "completed" && (
                    <Button variant="destructive" onClick={() => auctionControlMutation.mutate("stop")}>
                      Stop Auction
                    </Button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {currentPlayer && auctionState?.status === "in_progress" && (
                    <motion.div 
                      key={currentPlayer.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -50, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="mt-6 relative overflow-visible"
                    >
                      <div className="absolute inset-0 auction-spotlight rounded-xl" />
                      <div className="relative p-8 rounded-xl stadium-bg border border-white/10">
                        <div className="absolute top-4 right-4">
                          <Badge variant="outline" className="bg-red-500/20 border-red-500 text-red-400 animate-pulse">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 inline-block" />
                            LIVE
                          </Badge>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-8 mb-6">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="relative"
                          >
                            <div className="absolute inset-0 rounded-full neon-purple opacity-60" />
                            <Avatar className="h-32 w-32 border-4 border-purple-500/50 relative z-10">
                              <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} className="object-cover" />
                              <AvatarFallback className="text-3xl font-display bg-gradient-to-br from-purple-600 to-orange-500">
                                {currentPlayer.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                              <Badge className="bg-gradient-to-r from-purple-600 to-orange-500 border-0 text-white px-3">
                                {currentPlayer.role === "batsman" && <Zap className="w-3 h-3 mr-1" />}
                                {currentPlayer.role === "bowler" && <Target className="w-3 h-3 mr-1" />}
                                {currentPlayer.role === "all-rounder" && <Star className="w-3 h-3 mr-1" />}
                                {currentPlayer.role === "wicket-keeper" && <Shield className="w-3 h-3 mr-1" />}
                                {currentPlayer.role}
                              </Badge>
                            </div>
                          </motion.div>

                          <div className="text-center lg:text-left flex-1">
                            <motion.h3 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="font-display text-4xl text-white text-glow-orange"
                            >
                              {currentPlayer.name}
                            </motion.h3>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                <span className="text-sm text-orange-400">Batting: {currentPlayer.battingRating}/10</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" />
                                <span className="text-sm text-purple-400">Bowling: {currentPlayer.bowlingRating}/10</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-emerald-400">Fielding: {currentPlayer.fieldingRating}/10</span>
                              </div>
                            </div>
                          </div>

                          <motion.div 
                            key={auctionState.currentBid || currentPlayer.basePoints}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                          >
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Current Bid</p>
                            <motion.p 
                              key={auctionState.currentBid}
                              initial={{ scale: 1.3, color: "#ffd60a" }}
                              animate={{ scale: 1, color: "#ff6b35" }}
                              transition={{ duration: 0.3 }}
                              className="font-display text-6xl text-glow-gold"
                            >
                              {(auctionState.currentBid || currentPlayer.basePoints).toLocaleString()}
                            </motion.p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Base: {currentPlayer.basePoints.toLocaleString()}
                            </p>
                          </motion.div>
                        </div>

                        <AnimatePresence>
                          {currentBiddingTeam && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="mb-6 p-4 rounded-lg flex items-center justify-center gap-4"
                              style={{ 
                                background: `linear-gradient(135deg, ${currentBiddingTeam.primaryColor}30 0%, ${currentBiddingTeam.secondaryColor}30 100%)`,
                                borderLeft: `4px solid ${currentBiddingTeam.primaryColor}`
                              }}
                            >
                              <TrendingUp className="w-5 h-5 text-emerald-400" />
                              <span className="font-display text-xl text-white">
                                {currentBiddingTeam.name} LEADS THE BID
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {teams?.map((team, index) => {
                            const canBid = team.remainingBudget >= (auctionState.currentBid || currentPlayer.basePoints) + getBidIncrement(auctionState.currentBid || currentPlayer.basePoints);
                            const isLeading = currentBiddingTeam?.id === team.id;
                            return (
                              <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Button
                                  variant="outline"
                                  disabled={!canBid || isLeading}
                                  onClick={() => placeBidMutation.mutate(team.id)}
                                  className={cn(
                                    "w-full flex-col h-auto py-3 transition-all",
                                    isLeading && "neon-gold animate-pulse-glow"
                                  )}
                                  style={{ 
                                    borderColor: team.primaryColor,
                                    background: isLeading ? `${team.primaryColor}30` : 'transparent'
                                  }}
                                  data-testid={`button-bid-${team.id}`}
                                >
                                  <span 
                                    className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-display mb-2"
                                    style={{ backgroundColor: team.primaryColor }}
                                  >
                                    {team.shortName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{team.remainingBudget.toLocaleString()}</span>
                                </Button>
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="flex gap-4 mt-8">
                          <Button 
                            className="flex-1 h-14 text-lg font-display bg-gradient-to-r from-emerald-600 to-emerald-500 neon-gold"
                            onClick={() => sellPlayerMutation.mutate()}
                            disabled={!currentBiddingTeam}
                            data-testid="button-sold"
                          >
                            <Check className="w-5 h-5 mr-2" />
                            SOLD!
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1 h-14 text-lg font-display"
                            onClick={() => unsoldPlayerMutation.mutate()}
                            data-testid="button-unsold"
                          >
                            <X className="w-5 h-5 mr-2" />
                            UNSOLD
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Teams ({teams?.length || 0}/12)</h2>
              <CreateTeamDialog onSubmit={(data) => createTeamMutation.mutate(data)} />
            </div>

            {teamsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams?.map((team) => {
                  const teamPlayers = players?.filter(p => p.teamId === team.id) || [];
                  return (
                    <Card key={team.id} data-testid={`admin-team-${team.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-md object-cover" />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              {team.shortName}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Budget: {team.remainingBudget.toLocaleString()} / {team.budget.toLocaleString()}
                            </p>
                          </div>
                          <EditTeamDialog team={team} onSubmit={(data) => updateTeamMutation.mutate({ id: team.id, ...data })} />
                        </div>
                        {team.groupName && (
                          <Badge variant="outline" className="mb-2">Group {team.groupName}</Badge>
                        )}
                        {teamPlayers.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Players ({teamPlayers.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {teamPlayers.slice(0, 3).map(p => (
                                <Badge key={p.id} variant="secondary" className="text-xs">{p.name.split(' ')[0]}</Badge>
                              ))}
                              {teamPlayers.length > 3 && (
                                <Badge variant="secondary" className="text-xs">+{teamPlayers.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tournament" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Structure
                </CardTitle>
                <CardDescription>
                  4 Groups of 3 Teams each. Top team from each group advances to Semi-Finals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => assignGroupsMutation.mutate()}
                    disabled={assignGroupsMutation.isPending}
                    data-testid="button-assign-groups"
                  >
                    {assignGroupsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Randomly Assign Groups
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => generateFixturesMutation.mutate()}
                    disabled={generateFixturesMutation.isPending}
                    data-testid="button-generate-fixtures"
                  >
                    {generateFixturesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Group Fixtures
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {["A", "B", "C", "D"].map((groupName) => {
                    const groupTeams = teams?.filter(t => t.groupName === groupName) || [];
                    return (
                      <Card key={groupName} className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Group {groupName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {groupTeams.length > 0 ? (
                            <div className="space-y-2">
                              {groupTeams.map((team, index) => (
                                <div key={team.id} className="flex items-center gap-2 p-2 rounded-md bg-card">
                                  <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display"
                                    style={{ backgroundColor: team.primaryColor }}
                                  >
                                    {team.shortName}
                                  </div>
                                  <span className="text-sm truncate">{team.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No teams assigned
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Tournament Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                      <div className="flex-1 p-4 rounded-md bg-card">
                        <p className="text-xs text-muted-foreground mb-1">GROUP STAGE</p>
                        <p className="font-display text-2xl">12 Matches</p>
                        <p className="text-sm text-muted-foreground">Each team plays 2 matches</p>
                      </div>
                      <div className="text-2xl text-muted-foreground hidden md:block">&rarr;</div>
                      <div className="flex-1 p-4 rounded-md bg-card">
                        <p className="text-xs text-muted-foreground mb-1">SEMI-FINALS</p>
                        <p className="font-display text-2xl">2 Matches</p>
                        <p className="text-sm text-muted-foreground">Top team from each group</p>
                      </div>
                      <div className="text-2xl text-muted-foreground hidden md:block">&rarr;</div>
                      <div className="flex-1 p-4 rounded-md bg-primary/10 border border-primary/20">
                        <p className="text-xs text-primary mb-1">FINAL</p>
                        <p className="font-display text-2xl text-primary">1 Match</p>
                        <p className="text-sm text-muted-foreground">Semi-final winners</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-6">
            <h2 className="text-xl font-semibold">Registered Players ({players?.length || 0})</h2>

            {playersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-4">
                  {players?.map((player) => (
                    <Card key={player.id} data-testid={`admin-player-${player.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={player.photoUrl} alt={player.name} />
                            <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{player.name}</span>
                              <Badge variant="outline" className="shrink-0">{player.role}</Badge>
                              <Badge 
                                className={cn(
                                  "shrink-0",
                                  player.status === "sold" && "bg-emerald-500/20 text-emerald-600",
                                  player.status === "unsold" && "bg-destructive/20 text-destructive",
                                  player.status === "lost_gold" && "bg-amber-500/20 text-amber-600"
                                )}
                              >
                                {player.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="text-orange-500">Bat: {player.battingRating}</span>
                              <span className="text-purple-500">Bowl: {player.bowlingRating}</span>
                              <span className="text-emerald-500">Field: {player.fieldingRating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Base Points</p>
                              <p className="font-display text-xl">{player.basePoints.toLocaleString()}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updatePlayerMutation.mutate({ id: player.id, isLocked: !player.isLocked })}
                              data-testid={`button-lock-${player.id}`}
                            >
                              {player.isLocked ? (
                                <Lock className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Unlock className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="scoring" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Match Scoring</h2>
                <p className="text-sm text-muted-foreground">Matches are auto-generated when groups are assigned in Tournament tab</p>
              </div>
            </div>

            {liveMatch ? (
              <LiveScoringPanel 
                match={liveMatch} 
                teams={teams || []} 
                onRecordBall={(data) => recordBallMutation.mutate({ matchId: liveMatch.id, ...data })}
                isRecording={recordBallMutation.isPending}
                onSetPowerOver={(overNumber) => setPowerOverMutation.mutate({ 
                  matchId: liveMatch.id, 
                  overNumber, 
                  innings: liveMatch.currentInnings ?? 1 
                })}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Live Match</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create a match and start it to begin scoring
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Scheduled Matches</h3>
              {matches?.filter(m => m.status === "scheduled").map((match) => {
                const team1 = teams?.find(t => t.id === match.team1Id);
                const team2 = teams?.find(t => t.id === match.team2Id);
                return (
                  <Card key={match.id} data-testid={`admin-match-${match.id}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">#{match.matchNumber}</span>
                        <span className="font-medium">{team1?.shortName} vs {team2?.shortName}</span>
                      </div>
                      <StartMatchDialog
                        match={match}
                        teams={teams || []}
                        onStart={(data) => startMatchMutation.mutate({ matchId: match.id, ...data })}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="broadcasts" className="space-y-6">
            <BroadcastsManagementPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <TournamentSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {showSoldCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative text-center"
            >
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <span className="font-display text-8xl md:text-9xl text-glow-gold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  SOLD!
                </span>
              </motion.div>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <p className="font-display text-4xl text-white">{soldPlayerName}</p>
                <p className="text-2xl text-purple-400">to {soldTeamName}</p>
                <p className="font-display text-5xl text-emerald-400 text-glow-gold">
                  {soldAmount.toLocaleString()}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateTeamDialog({ onSubmit }: { onSubmit: (data: { name: string; shortName: string; primaryColor: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");

  const handleSubmit = () => {
    onSubmit({ name, shortName, primaryColor });
    setOpen(false);
    setName("");
    setShortName("");
    setPrimaryColor("#6366f1");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-team">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Team Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mumbai Indians" data-testid="input-team-name" />
          </div>
          <div>
            <Label>Short Name</Label>
            <Input value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 3))} placeholder="MI" maxLength={3} data-testid="input-team-short" />
          </div>
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-10 p-1" data-testid="input-team-color" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#6366f1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name || !shortName} data-testid="button-submit-team">
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTeamDialog({ team, onSubmit }: { team: Team; onSubmit: (data: { name?: string; shortName?: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName);
  const [primaryColor, setPrimaryColor] = useState(team.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(team.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || "");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit({ name, shortName, primaryColor, secondaryColor, logoUrl: logoUrl || undefined });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid={`button-edit-team-${team.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team: {team.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Team Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="w-16 h-16 rounded-md object-cover" />
              ) : (
                <div 
                  className="w-16 h-16 rounded-md flex items-center justify-center text-white font-display"
                  style={{ backgroundColor: primaryColor }}
                >
                  {shortName}
                </div>
              )}
              <div className="flex-1">
                <Input type="file" accept="image/*" onChange={handleLogoUpload} data-testid="input-team-logo" />
                <p className="text-xs text-muted-foreground mt-1">Upload team logo (optional)</p>
              </div>
            </div>
          </div>
          <div>
            <Label>Team Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-edit-team-name" />
          </div>
          <div>
            <Label>Short Name</Label>
            <Input value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} data-testid="input-edit-team-short" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || !shortName} data-testid="button-save-team">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function StartMatchDialog({ match, teams, onStart }: { match: Match; teams: Team[]; onStart: (data: { tossWinnerId: string; tossDecision: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState("");

  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);

  const handleSubmit = () => {
    onStart({ tossWinnerId, tossDecision });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid={`button-start-match-${match.id}`}>
          <Play className="w-4 h-4 mr-2" />
          Start
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Match #{match.matchNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Toss Winner</Label>
            <Select value={tossWinnerId} onValueChange={setTossWinnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select toss winner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={match.team1Id}>{team1?.name}</SelectItem>
                <SelectItem value={match.team2Id}>{team2?.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Decision</Label>
            <Select value={tossDecision} onValueChange={setTossDecision}>
              <SelectTrigger>
                <SelectValue placeholder="Elected to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bat">Bat</SelectItem>
                <SelectItem value="bowl">Bowl</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!tossWinnerId || !tossDecision}>
            Start Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveScoringPanel({ 
  match, 
  teams, 
  onRecordBall,
  isRecording,
  onSetPowerOver
}: { 
  match: Match; 
  teams: Team[]; 
  onRecordBall: (data: { runs: number; extraType?: string; isWicket?: boolean; wicketType?: string }) => void;
  isRecording: boolean;
  onSetPowerOver: (overNumber: number) => void;
}) {
  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);
  
  // Calculate current over number
  const currentOvers = match.currentInnings === 1 ? match.team1Overs : match.team2Overs;
  const [overs] = (currentOvers || "0.0").split(".").map(Number);
  const currentOverNumber = overs + 1;
  
  // Check if power over is active for current innings
  const isPowerOverActive = match.powerOverActive && match.powerOverInnings === match.currentInnings;
  const isPowerOverNow = isPowerOverActive && match.powerOverNumber === currentOverNumber;

  const recordRuns = (runs: number) => {
    onRecordBall({ runs });
  };

  const recordExtra = (type: "wide" | "no_ball") => {
    onRecordBall({ runs: 1, extraType: type });
  };

  const recordWicket = (type: string) => {
    onRecordBall({ runs: 0, isWicket: true, wicketType: type });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live: {team1?.shortName} vs {team2?.shortName}</span>
          <div className="flex items-center gap-2">
            {isPowerOverNow && (
              <Badge className="bg-amber-500/20 text-amber-500 animate-pulse gap-1">
                <Zap className="w-3 h-3" />
                POWER OVER
              </Badge>
            )}
            <Badge className="bg-destructive/20 text-destructive gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              LIVE
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{team1?.shortName}</p>
            <p className="font-display text-4xl">
              {match.team1Score}/{match.team1Wickets}
              <span className="text-lg text-muted-foreground ml-2">({match.team1Overs})</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">{team2?.shortName}</p>
            <p className="font-display text-4xl">
              {match.team2Score}/{match.team2Wickets}
              <span className="text-lg text-muted-foreground ml-2">({match.team2Overs})</span>
            </p>
          </div>
        </div>

        {/* Power Over Selection */}
        <div className="p-4 rounded-md border border-amber-500/30 bg-amber-500/5">
          <Label className="text-sm text-amber-600 mb-2 block flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Power Over (Innings {match.currentInnings})
          </Label>
          {isPowerOverActive ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-white">
                Over {match.powerOverNumber} is Power Over
              </Badge>
              <p className="text-xs text-muted-foreground">
                Runs 2x, Wicket -5 points
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((over) => (
                <Button
                  key={over}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 w-10 border-amber-500/30",
                    over < currentOverNumber && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={over < currentOverNumber}
                  onClick={() => onSetPowerOver(over)}
                  data-testid={`button-power-over-${over}`}
                >
                  {over}
                </Button>
              ))}
              <p className="w-full text-xs text-muted-foreground mt-1">
                Select which over will be the Power Over
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Runs</Label>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                <Button
                  key={runs}
                  variant={runs === 4 ? "default" : runs === 6 ? "default" : "outline"}
                  className={cn(
                    "h-14 font-display text-2xl",
                    runs === 4 && "bg-blue-500 hover:bg-blue-600",
                    runs === 6 && "bg-emerald-500 hover:bg-emerald-600"
                  )}
                  onClick={() => recordRuns(runs)}
                  disabled={isRecording}
                  data-testid={`button-runs-${runs}`}
                >
                  {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : runs}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Extras</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-amber-500/10 border-amber-500/30 text-amber-600"
                onClick={() => recordExtra("wide")}
                disabled={isRecording}
                data-testid="button-wide"
              >
                Wide
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-amber-500/10 border-amber-500/30 text-amber-600"
                onClick={() => recordExtra("no_ball")}
                disabled={isRecording}
                data-testid="button-no-ball"
              >
                No Ball
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Wicket</Label>
            <div className="grid grid-cols-3 gap-2">
              {["bowled", "caught", "lbw", "run_out", "stumped"].map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-12 bg-destructive/10 border-destructive/30 text-destructive capitalize"
                  onClick={() => recordWicket(type)}
                  disabled={isRecording}
                  data-testid={`button-wicket-${type}`}
                >
                  {type.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerApprovalPanel({ players, isLoading }: { players?: Player[]; isLoading: boolean }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  const pendingPlayers = players?.filter(p => p.approvalStatus === "pending") || [];
  const approvedPlayers = players?.filter(p => p.approvalStatus === "approved") || [];
  const rejectedPlayers = players?.filter(p => p.approvalStatus === "rejected") || [];

  const approveMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest("POST", `/api/players/${playerId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player approved" });
    },
    onError: () => {
      toast({ title: "Failed to approve player", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest("POST", `/api/players/${playerId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject player", variant: "destructive" });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest("POST", `/api/players/${playerId}/verify-payment`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Payment verified" });
    },
    onError: () => {
      toast({ title: "Failed to verify payment", variant: "destructive" });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest("DELETE", `/api/players/${playerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete player", variant: "destructive" });
    },
  });

  const renderPlayerCard = (player: Player, showActions: boolean = true) => (
    <Card key={player.id} className="p-4" data-testid={`approval-player-${player.id}`}>
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={player.photoUrl} alt={player.name} />
          <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{player.name}</p>
            <Badge variant="outline" className="text-xs">{player.role}</Badge>
            {player.paymentStatus === "verified" && (
              <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">Paid</Badge>
            )}
            {player.paymentStatus === "pending" && (
              <Badge className="bg-amber-500/20 text-amber-600 text-xs">Payment Pending</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <p>Email: {player.email || "N/A"}</p>
            <p>Phone: {player.phone || "N/A"}</p>
            <p>Mobile: {player.mobile}</p>
            <p>T-Shirt: {player.tshirtSize || "N/A"}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">Address: {player.address}</p>
          <div className="flex items-center gap-2 pt-1">
            <Badge className="bg-orange-500/20 text-orange-600 text-xs">
              Batting: {player.battingRating}
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-600 text-xs">
              Bowling: {player.bowlingRating}
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">
              Fielding: {player.fieldingRating}
            </Badge>
          </div>
        </div>
        {showActions && activeTab === "pending" && (
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => approveMutation.mutate(player.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${player.id}`}
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rejectMutation.mutate(player.id)}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${player.id}`}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
        {showActions && activeTab === "approved" && (
          <div className="flex flex-col gap-2">
            {player.paymentStatus !== "verified" && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={() => verifyPaymentMutation.mutate(player.id)}
                disabled={verifyPaymentMutation.isPending}
                data-testid={`button-verify-payment-${player.id}`}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Verify Payment
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid={`button-delete-player-${player.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Player?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {player.name} from the system. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePlayerMutation.mutate(player.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Approval</CardTitle>
        <CardDescription>Review and approve player registrations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
              Pending ({pendingPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2" data-testid="tab-approved">
              Approved ({approvedPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2" data-testid="tab-rejected">
              Rejected ({rejectedPlayers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingPlayers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {pendingPlayers.map((player) => renderPlayerCard(player))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending registrations</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedPlayers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {approvedPlayers.map((player) => renderPlayerCard(player))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No approved players yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedPlayers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {rejectedPlayers.map((player) => renderPlayerCard(player, false))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rejected players</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BroadcastsManagementPanel() {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"announcement" | "rule" | "ticker">("announcement");
  const [newPriority, setNewPriority] = useState("0");

  const { data: broadcasts, isLoading } = useQuery<Broadcast[]>({
    queryKey: ["/api/broadcasts"],
  });

  const createBroadcastMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; type: string; priority: number }) => {
      return apiRequest("POST", "/api/broadcasts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      setNewTitle("");
      setNewContent("");
      setNewType("announcement");
      setNewPriority("0");
      toast({ title: "Broadcast created" });
    },
    onError: () => {
      toast({ title: "Failed to create broadcast", variant: "destructive" });
    },
  });

  const updateBroadcastMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string; type?: string; priority?: number; isActive?: boolean }) => {
      return apiRequest("PATCH", `/api/broadcasts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      toast({ title: "Broadcast updated" });
    },
    onError: () => {
      toast({ title: "Failed to update broadcast", variant: "destructive" });
    },
  });

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/broadcasts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      toast({ title: "Broadcast deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete broadcast", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!newTitle || !newContent) {
      toast({ title: "Please fill in title and content", variant: "destructive" });
      return;
    }
    createBroadcastMutation.mutate({
      title: newTitle,
      content: newContent,
      type: newType,
      priority: parseInt(newPriority) || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const activeBroadcasts = broadcasts?.filter(b => b.isActive) || [];
  const inactiveBroadcasts = broadcasts?.filter(b => !b.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Broadcasts & Announcements</h2>
          <p className="text-sm text-muted-foreground">Manage announcements displayed on the tournament screens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Create Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Important Announcement"
                data-testid="input-broadcast-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-content">Content</Label>
              <Input
                id="broadcast-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the message to display..."
                data-testid="input-broadcast-content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="broadcast-type">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                  <SelectTrigger id="broadcast-type" data-testid="select-broadcast-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="rule">Rule</SelectItem>
                    <SelectItem value="ticker">Ticker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="broadcast-priority">Priority</Label>
                <Input
                  id="broadcast-priority"
                  type="number"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="0"
                  data-testid="input-broadcast-priority"
                />
              </div>
            </div>
            <Button 
              onClick={handleCreate} 
              disabled={createBroadcastMutation.isPending}
              className="w-full"
              data-testid="button-create-broadcast"
            >
              {createBroadcastMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Broadcast
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Active Broadcasts
              <Badge>{activeBroadcasts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeBroadcasts.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {activeBroadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="p-3 rounded-md border bg-muted/50 space-y-2"
                      data-testid={`broadcast-${broadcast.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {broadcast.type}
                          </Badge>
                          <span className="font-medium text-sm">{broadcast.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateBroadcastMutation.mutate({ id: broadcast.id, isActive: false })}
                            data-testid={`button-deactivate-${broadcast.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-delete-${broadcast.id}`}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Broadcast?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this broadcast.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBroadcastMutation.mutate(broadcast.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{broadcast.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active broadcasts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {inactiveBroadcasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Inactive Broadcasts ({inactiveBroadcasts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactiveBroadcasts.map((broadcast) => (
                <Badge
                  key={broadcast.id}
                  variant="outline"
                  className="cursor-pointer opacity-60 hover-elevate"
                  onClick={() => updateBroadcastMutation.mutate({ id: broadcast.id, isActive: true })}
                  data-testid={`button-activate-${broadcast.id}`}
                >
                  {broadcast.title}
                  <Check className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TournamentSettingsPanel() {
  const { toast } = useToast();
  const [registrationFee, setRegistrationFee] = useState("25");
  const [zellePhone, setZellePhone] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [zelleQrUrl, setZelleQrUrl] = useState("");
  const [cashappId, setCashappId] = useState("");
  const [cashappQrUrl, setCashappQrUrl] = useState("");
  const [venmoId, setVenmoId] = useState("");
  const [venmoQrUrl, setVenmoQrUrl] = useState("");
  const [auctionDate, setAuctionDate] = useState("January 25th");
  const [tournamentDate, setTournamentDate] = useState("February 7th");
  const [displayUsername, setDisplayUsername] = useState("Bhulku");
  const [displayPassword, setDisplayPassword] = useState("weareone");

  const { data: settings, isLoading } = useQuery<TournamentSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setRegistrationFee(settings.registrationFee?.toString() || "25");
      setZellePhone(settings.zellePhone || "");
      setZelleEmail(settings.zelleEmail || "");
      setZelleQrUrl(settings.zelleQrUrl || "");
      setCashappId(settings.cashappId || "");
      setCashappQrUrl(settings.cashappQrUrl || "");
      setVenmoId(settings.venmoId || "");
      setVenmoQrUrl(settings.venmoQrUrl || "");
      setAuctionDate(settings.auctionDate || "January 25th");
      setTournamentDate(settings.tournamentDate || "February 7th");
      setDisplayUsername(settings.displayUsername || "Bhulku");
      setDisplayPassword(settings.displayPassword || "weareone");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<TournamentSettings>) => {
      return apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      registrationFee: parseInt(registrationFee) || 25,
      zellePhone: zellePhone || null,
      zelleEmail: zelleEmail || null,
      zelleQrUrl: zelleQrUrl || null,
      cashappId: cashappId || null,
      cashappQrUrl: cashappQrUrl || null,
      venmoId: venmoId || null,
      venmoQrUrl: venmoQrUrl || null,
      auctionDate: auctionDate || null,
      tournamentDate: tournamentDate || null,
      displayUsername: displayUsername || null,
      displayPassword: displayPassword || null,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tournament Settings</h2>
          <p className="text-sm text-muted-foreground">Configure payment methods and tournament details</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettingsMutation.isPending} data-testid="button-save-settings">
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Registration Fee
            </CardTitle>
            <CardDescription>Set the registration fee for players</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="registrationFee">Fee Amount ($)</Label>
              <Input
                id="registrationFee"
                type="number"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                placeholder="25"
                data-testid="input-registration-fee"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Key Dates
            </CardTitle>
            <CardDescription>Important tournament dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="auctionDate">Auction Date</Label>
              <Input
                id="auctionDate"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
                placeholder="January 25th"
                data-testid="input-auction-date"
              />
            </div>
            <div>
              <Label htmlFor="tournamentDate">Tournament Date</Label>
              <Input
                id="tournamentDate"
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                placeholder="February 7th"
                data-testid="input-tournament-date"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Zelle Payment
            </CardTitle>
            <CardDescription>Configure Zelle payment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="zellePhone">Zelle Phone</Label>
              <Input
                id="zellePhone"
                value={zellePhone}
                onChange={(e) => setZellePhone(e.target.value)}
                placeholder="Phone number for Zelle"
                data-testid="input-zelle-phone"
              />
            </div>
            <div>
              <Label htmlFor="zelleEmail">Zelle Email</Label>
              <Input
                id="zelleEmail"
                type="email"
                value={zelleEmail}
                onChange={(e) => setZelleEmail(e.target.value)}
                placeholder="Email for Zelle"
                data-testid="input-zelle-email"
              />
            </div>
            <div>
              <Label htmlFor="zelleQrUrl">Zelle QR Code URL</Label>
              <Input
                id="zelleQrUrl"
                value={zelleQrUrl}
                onChange={(e) => setZelleQrUrl(e.target.value)}
                placeholder="URL for QR code"
                data-testid="input-zelle-qr"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Cash App Payment
            </CardTitle>
            <CardDescription>Configure Cash App payment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cashappId">Cash App ID</Label>
              <Input
                id="cashappId"
                value={cashappId}
                onChange={(e) => setCashappId(e.target.value)}
                placeholder="$yourtag"
                data-testid="input-cashapp-id"
              />
            </div>
            <div>
              <Label htmlFor="cashappQrUrl">Cash App QR Code URL</Label>
              <Input
                id="cashappQrUrl"
                value={cashappQrUrl}
                onChange={(e) => setCashappQrUrl(e.target.value)}
                placeholder="URL for QR code"
                data-testid="input-cashapp-qr"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Venmo Payment
            </CardTitle>
            <CardDescription>Configure Venmo payment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="venmoId">Venmo ID</Label>
              <Input
                id="venmoId"
                value={venmoId}
                onChange={(e) => setVenmoId(e.target.value)}
                placeholder="@yourvenmo"
                data-testid="input-venmo-id"
              />
            </div>
            <div>
              <Label htmlFor="venmoQrUrl">Venmo QR Code URL</Label>
              <Input
                id="venmoQrUrl"
                value={venmoQrUrl}
                onChange={(e) => setVenmoQrUrl(e.target.value)}
                placeholder="URL for QR code"
                data-testid="input-venmo-qr"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Display Mode Credentials
            </CardTitle>
            <CardDescription>Login credentials for display/projector mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="displayUsername">Username</Label>
              <Input
                id="displayUsername"
                value={displayUsername}
                onChange={(e) => setDisplayUsername(e.target.value)}
                placeholder="Display username"
                data-testid="input-display-username"
              />
            </div>
            <div>
              <Label htmlFor="displayPassword">Password</Label>
              <Input
                id="displayPassword"
                value={displayPassword}
                onChange={(e) => setDisplayPassword(e.target.value)}
                placeholder="Display password"
                data-testid="input-display-password"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
