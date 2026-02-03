import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Shield,
  Users,
  Gavel,
  Play,
  Settings,
  Plus,
  Trash2,
  Edit,
  Lock,
  Unlock,
  Check,
  X,
  CircleDot,
  Target,
  Loader2,
  QrCode,
  RotateCcw,
  Trophy,
  Upload,
  Zap,
  Star,
  Award,
  TrendingUp,
  DollarSign,
  CreditCard,
  Save,
  AlertTriangle,
  AlertCircle,
  Download,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AUCTION_CATEGORIES,
  type Player,
  type Team,
  type Match,
  type AuctionState,
  type TournamentSettings,
  type AuctionCategory,
  type CaptainPair,
} from "@shared/schema";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
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

function CaptainPairAssignmentForm({
  players,
  captainPairs,
  onAssign,
  isPending,
}: {
  players: Player[];
  captainPairs: CaptainPair[];
  onAssign: (data: { captainId: string; viceCaptainId: string; slotNumber: number }) => void;
  isPending: boolean;
}) {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedCaptain, setSelectedCaptain] = useState<string>("");
  const [selectedVC, setSelectedVC] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  const availableSlots = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter(slot => !captainPairs.some(p => p.slotNumber === slot));

  const usedPlayerIds = new Set(
    captainPairs.flatMap(p => [p.captainId, p.viceCaptainId])
  );

  const availablePlayers = players.filter(p => 
    p.paymentStatus === "verified" && 
    p.approvalStatus === "approved" &&
    !usedPlayerIds.has(p.id)
  );

  const handleAssign = () => {
    setValidationError("");
    
    if (!selectedSlot) {
      setValidationError("Please select a slot number");
      return;
    }
    if (!selectedCaptain) {
      setValidationError("Please select a captain");
      return;
    }
    if (!selectedVC) {
      setValidationError("Please select a vice-captain");
      return;
    }
    if (selectedCaptain === selectedVC) {
      setValidationError("Captain and vice-captain must be different players");
      return;
    }

    onAssign({
      slotNumber: parseInt(selectedSlot),
      captainId: selectedCaptain,
      viceCaptainId: selectedVC,
    });

    setSelectedSlot("");
    setSelectedCaptain("");
    setSelectedVC("");
  };

  return (
    <div className="p-4 rounded-lg border bg-muted/50">
      <h4 className="font-medium mb-4">Assign New Captain Pair</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label>Slot Number</Label>
          <Select value={selectedSlot} onValueChange={setSelectedSlot}>
            <SelectTrigger data-testid="select-captain-slot">
              <SelectValue placeholder="Select slot..." />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.length === 0 ? (
                <SelectItem value="none" disabled>All slots filled</SelectItem>
              ) : (
                availableSlots.map(slot => (
                  <SelectItem key={slot} value={slot.toString()}>
                    Slot {slot}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Captain</Label>
          <Select value={selectedCaptain} onValueChange={(val) => {
            setSelectedCaptain(val);
            if (val === selectedVC) setSelectedVC("");
          }}>
            <SelectTrigger data-testid="select-captain-player">
              <SelectValue placeholder="Select captain..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.length === 0 ? (
                <SelectItem value="none" disabled>No players available</SelectItem>
              ) : (
                availablePlayers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Vice-Captain</Label>
          <Select value={selectedVC} onValueChange={setSelectedVC}>
            <SelectTrigger data-testid="select-vc-player">
              <SelectValue placeholder="Select vice-captain..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.filter(p => p.id !== selectedCaptain).length === 0 ? (
                <SelectItem value="none" disabled>No players available</SelectItem>
              ) : (
                availablePlayers
                  .filter(p => p.id !== selectedCaptain)
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAssign}
          disabled={isPending || !selectedSlot || !selectedCaptain || !selectedVC}
          data-testid="button-assign-captain-pair"
        >
          <Plus className="w-4 h-4 mr-2" />
          Assign Pair
        </Button>
      </div>
      {validationError && (
        <p className="text-sm text-destructive mt-2">{validationError}</p>
      )}
    </div>
  );
}

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
            <Button
              className="w-full"
              onClick={handleLogin}
              data-testid="button-admin-login"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { toast } = useToast();
  const [pendingAuctionPlayerId, setPendingAuctionPlayerId] = useState<string>("");
  const [manualBidAmount, setManualBidAmount] = useState<string>("");
  const [selectedWinningTeamId, setSelectedWinningTeamId] = useState<string>("");

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: auctionState, isLoading: auctionLoading } =
    useQuery<AuctionState>({
      queryKey: ["/api/auction/state"],
    });

  const { data: captainPairs, isLoading: captainPairsLoading } =
    useQuery<CaptainPair[]>({
      queryKey: ["/api/captain-pairs"],
    });

  const createCaptainPairMutation = useMutation({
    mutationFn: async (pair: {
      captainId: string;
      viceCaptainId: string;
      slotNumber: number;
    }) => {
      return apiRequest("POST", "/api/captain-pairs", pair);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain-pairs"] });
      toast({ title: "Captain pair assigned" });
    },
    onError: (error: any) => {
      let message = "Failed to assign captain pair";
      try {
        const errorStr = error?.message || "";
        const jsonMatch = errorStr.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          message = parsed.error || message;
        }
      } catch {
        message = error?.message || message;
      }
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteCaptainPairMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/captain-pairs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain-pairs"] });
      toast({ title: "Captain pair removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove captain pair", variant: "destructive" });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (team: {
      name: string;
      shortName: string;
      primaryColor: string;
    }) => {
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
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      basePoints?: number;
      isLocked?: boolean;
    }) => {
      return apiRequest("PATCH", `/api/players/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player updated" });
    },
  });

  const assignPlayerMutation = useMutation({
    mutationFn: async ({
      playerId,
      teamId,
      soldPrice,
    }: {
      playerId: string;
      teamId: string;
      soldPrice: number;
    }) => {
      return apiRequest("POST", `/api/players/${playerId}/assign`, { teamId, soldPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Player assigned to team" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign player",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const auctionControlMutation = useMutation({
    mutationFn: async (params: { action: string; category?: string; playerId?: string; pairId?: string }) => {
      return apiRequest("POST", "/api/auction/control", params);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/captain-pairs"] });

      // Show toast when category break is triggered
      if (data?.categoryBreak && data?.completedCategory) {
        toast({
          title: `Category ${data.completedCategory} Complete`,
          description: "Select a different category to continue the auction",
        });
      }
    },
    onError: (error: any) => {
      let message = "Auction control failed";
      try {
        const errorStr = error?.message || "";
        const jsonMatch = errorStr.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          message = parsed.error || message;
        }
      } catch {
        message = error?.message || message;
      }
      toast({ title: message, variant: "destructive" });
    },
  });

  const undoLastSoldMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auction/undo-last-sold", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/captain-pairs"] });
      toast({ title: "Last sold player undone successfully" });
    },
    onError: (error: any) => {
      const message = error?.message || "No sold players to undo";
      toast({ title: message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/captain-pairs"] });
      toast({ title: "Auction reset successfully" });
    },
    onError: (error: any) => {
      let message = "Failed to reset auction";
      try {
        const errorStr = error?.message || "";
        const jsonMatch = errorStr.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          message = parsed.error || message;
        }
      } catch {
        message = error?.message || message;
      }
      toast({ title: message, variant: "destructive" });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      shortName?: string;
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      groupName?: string;
    }) => {
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

  const placeBidMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return apiRequest("POST", "/api/auction/bid", { teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
    },
  });

  const sellPlayerMutation = useMutation({
    mutationFn: async (data: { teamId: string; bidAmount: number }) => {
      return apiRequest("POST", "/api/auction/sell", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auction/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setManualBidAmount("");
      setSelectedWinningTeamId("");
      toast({ title: "Player sold!" });
    },
    onError: (error: any) => {
      console.error("Sell error:", error);
      const errorMsg = error?.message || error?.error || "Unknown error";
      toast({ 
        title: "Cannot complete sale", 
        description: errorMsg,
        variant: "destructive" 
      });
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
    mutationFn: async (data: { team1Id: string; team2Id: string; matchNumber: number }) => {
      return apiRequest("POST", "/api/matches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Match created" });
    },
  });

  const clearMatchesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/matches/clear-scheduled");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "All scheduled matches cleared" });
    },
  });

  const createQuarterfinalsMutation = useMutation({
    mutationFn: async (data: { qf1Teams: string[]; qf2Teams: string[]; qf3Teams: string[]; qf4Teams: string[] }) => {
      return apiRequest("POST", "/api/tournament/create-quarterfinals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Quarter-finals created" });
    },
  });

  const createSemifinalsMutation = useMutation({
    mutationFn: async (data: { semifinal1Teams: string[]; semifinal2Teams: string[] }) => {
      return apiRequest("POST", "/api/tournament/create-semifinals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Semi-finals created" });
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async ({
      matchId,
      ...data
    }: {
      matchId: string;
      tossWinnerId: string;
      tossDecision: string;
      team1PlayingXI?: string[];
      team2PlayingXI?: string[];
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/start`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Match started!" });
    },
  });

  const recordBallMutation = useMutation({
    mutationFn: async ({
      matchId,
      ...data
    }: {
      matchId: string;
      runs: number;
      extraType?: string;
      isWicket?: boolean;
      wicketType?: string;
      fielderId?: string;
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/ball`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ball-events"] });
    },
  });

  const undoBallMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("POST", `/api/matches/${matchId}/undo-ball`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ball-events"] });
      toast({ title: "Last ball undone" });
    },
    onError: () => {
      toast({ title: "Failed to undo ball", variant: "destructive" });
    },
  });

  const resetMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("POST", `/api/matches/${matchId}/reset`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ball-events"] });
      toast({ title: "Match reset successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reset match", variant: "destructive" });
    },
  });

  const setPowerOverMutation = useMutation({
    mutationFn: async ({
      matchId,
      overNumber,
      innings,
    }: {
      matchId: string;
      overNumber: number;
      innings: number;
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/power-over`, {
        overNumber,
        innings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Power Over set!" });
    },
  });

  const setBatsmenMutation = useMutation({
    mutationFn: async ({
      matchId,
      strikerId,
      nonStrikerId,
    }: {
      matchId: string;
      strikerId: string;
      nonStrikerId: string;
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/set-batsmen`, {
        strikerId,
        nonStrikerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Batsmen set!" });
    },
    onError: () => {
      toast({ title: "Failed to set batsmen", variant: "destructive" });
    },
  });

  const setBowlerMutation = useMutation({
    mutationFn: async ({
      matchId,
      bowlerId,
    }: {
      matchId: string;
      bowlerId: string;
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/set-bowler`, {
        bowlerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Bowler set!" });
    },
    onError: () => {
      toast({ title: "Failed to set bowler", variant: "destructive" });
    },
  });

  const newBatsmanMutation = useMutation({
    mutationFn: async ({
      matchId,
      batsmanId,
    }: {
      matchId: string;
      batsmanId: string;
    }) => {
      return apiRequest("POST", `/api/matches/${matchId}/new-batsman`, {
        batsmanId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "New batsman added!" });
    },
    onError: () => {
      toast({ title: "Failed to add batsman", variant: "destructive" });
    },
  });

  const reassignPlayerMutation = useMutation({
    mutationFn: async ({
      playerId,
      newTeamId,
    }: {
      playerId: string;
      newTeamId: string;
    }) => {
      return apiRequest("POST", `/api/players/${playerId}/reassign`, {
        newTeamId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Player reassigned successfully" });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to reassign player";
      toast({ title: message, variant: "destructive" });
    },
  });

  const currentPlayer = players?.find(
    (p) => p.id === auctionState?.currentPlayerId,
  );
  const currentBiddingTeam = teams?.find(
    (t) => t.id === auctionState?.currentBiddingTeamId,
  );
  // For Team Names auction - the team being auctioned and current bidding pair
  const currentTeam = teams?.find(
    (t) => t.id === auctionState?.currentTeamId,
  );
  const currentBiddingPair = captainPairs?.find(
    (p) => p.id === auctionState?.currentBiddingPairId,
  );
  const isTeamNamesAuction = auctionState?.currentCategory === "Team Names";
  const liveMatch = matches?.find((m) => m.status === "live");

  const getNextPlayer = () => {
    const availablePlayers = players?.filter(
      (p) => p.status === "registered" || p.status === "in_auction",
    );
    return availablePlayers?.[0];
  };

  const getBidIncrement = (currentBid: number) => {
    // Up to 4000 → +100, Above 4000 → +200
    if (currentBid <= 4000) return 100;
    return 200;
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
          <TabsList className="flex flex-wrap gap-1 w-full max-w-6xl h-auto">
            <TabsTrigger
              value="registration"
              className="gap-2"
              data-testid="admin-tab-registration"
            >
              <QrCode className="w-4 h-4" />
              Registration
            </TabsTrigger>
            <TabsTrigger
              value="captains"
              className="gap-2"
              data-testid="admin-tab-captains"
            >
              <Star className="w-4 h-4" />
              Captains
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="gap-2"
              data-testid="admin-tab-teams"
            >
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="gap-2"
              data-testid="admin-tab-players"
            >
              <Target className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger
              value="tournament"
              className="gap-2"
              data-testid="admin-tab-tournament"
            >
              <Trophy className="w-4 h-4" />
              Tournament
            </TabsTrigger>
            <TabsTrigger
              value="scoring"
              className="gap-2"
              data-testid="admin-tab-scoring"
            >
              <Play className="w-4 h-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-2"
              data-testid="admin-tab-settings"
            >
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
                    Display this QR code for players to scan and register on
                    their phones
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-white rounded-md">
                    <QRCodeSVG
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/register`
                          : "/register"
                      }
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

              <PlayerApprovalPanel
                players={players}
                isLoading={playersLoading}
              />
            </div>

            {/* Excel Download for Verified Payment Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Verified Players
                </CardTitle>
                <CardDescription>
                  Download an Excel file with all players who have verified payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const verifiedPlayers = players?.filter(p => p.paymentStatus === "verified") || [];
                  
                  const downloadExcel = () => {
                    if (verifiedPlayers.length === 0) {
                      toast({ title: "No verified players to export", variant: "destructive" });
                      return;
                    }
                    
                    const exportData = verifiedPlayers.map(player => ({
                      "Name": player.name,
                      "Mobile": player.mobile,
                      "Phone": player.phone || "",
                      "Role": player.role,
                      "Batting Rating": player.battingRating,
                      "Bowling Rating": player.bowlingRating,
                      "Fielding Rating": player.fieldingRating,
                      "Base Points": player.basePoints,
                      "Payment Status": player.paymentStatus,
                      "Approval Status": player.approvalStatus,
                      "Status": player.status,
                    }));
                    
                    const worksheet = XLSX.utils.json_to_sheet(exportData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Players");
                    
                    const colWidths = [
                      { wch: 25 }, // Name
                      { wch: 15 }, // Mobile
                      { wch: 15 }, // Phone
                      { wch: 12 }, // Role
                      { wch: 15 }, // Batting Rating
                      { wch: 15 }, // Bowling Rating
                      { wch: 15 }, // Fielding Rating
                      { wch: 12 }, // Base Points
                      { wch: 12 }, // Category
                      { wch: 15 }, // Payment Status
                      { wch: 15 }, // Approval Status
                      { wch: 12 }, // Status
                    ];
                    worksheet["!cols"] = colWidths;
                    
                    XLSX.writeFile(workbook, "verified_players.xlsx");
                    toast({ title: `Exported ${verifiedPlayers.length} verified players` });
                  };
                  
                  return (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {verifiedPlayers.length} player{verifiedPlayers.length !== 1 ? "s" : ""} with verified payment
                      </div>
                      <Button
                        onClick={downloadExcel}
                        disabled={verifiedPlayers.length === 0}
                        data-testid="button-download-excel"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Data Import/Export for transferring players between environments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Data Transfer
                </CardTitle>
                <CardDescription>
                  Export all players to a JSON file or import players from another environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const fileInputRef = useRef<HTMLInputElement>(null);
                  const [importing, setImporting] = useState(false);
                  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
                  
                  const exportPlayers = async () => {
                    try {
                      const response = await fetch("/api/players/export/all");
                      const data = await response.json();
                      
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `players-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast({ title: `Exported ${data.playerCount} players` });
                    } catch (error) {
                      toast({ title: "Export failed", variant: "destructive" });
                    }
                  };
                  
                  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    
                    setImporting(true);
                    try {
                      const text = await file.text();
                      const data = JSON.parse(text);
                      
                      const playersToImport = data.players || data;
                      if (!Array.isArray(playersToImport)) {
                        throw new Error("Invalid file format");
                      }
                      
                      const response = await fetch("/api/players/import/all", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ players: playersToImport, mode: importMode }),
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        toast({ title: result.message });
                        queryClient.invalidateQueries({ queryKey: ["/api/players"] });
                      } else {
                        toast({ title: result.error, variant: "destructive" });
                      }
                    } catch (error: any) {
                      toast({ title: `Import failed: ${error.message}`, variant: "destructive" });
                    } finally {
                      setImporting(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }
                  };
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <Button
                          onClick={exportPlayers}
                          variant="outline"
                          data-testid="button-export-players-json"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export All Players (JSON)
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="input-import-players"
                          />
                          <Select value={importMode} onValueChange={(v) => setImportMode(v as "skip" | "overwrite")}>
                            <SelectTrigger className="w-32" data-testid="select-import-mode">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Skip existing</SelectItem>
                              <SelectItem value="overwrite">Overwrite</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            data-testid="button-import-players-json"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {importing ? "Importing..." : "Import Players (JSON)"}
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Use Export to download all player data from your production app. Then use Import here to load that data into this environment.
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Captain Pairs Tab - Assign captain/VC pairs to slots before auction */}
          <TabsContent value="captains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Captain & Vice-Captain Pairs
                </CardTitle>
                <CardDescription>
                  Assign captain and vice-captain pairs to the 12 team slots before the auction.
                  These pairs will bid for team names in the first auction phase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assignment Form */}
                <CaptainPairAssignmentForm
                  players={players || []}
                  captainPairs={captainPairs || []}
                  onAssign={(data) => createCaptainPairMutation.mutate(data)}
                  isPending={createCaptainPairMutation.isPending}
                />

                {/* Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(slotNumber => {
                    const pair = captainPairs?.find(p => p.slotNumber === slotNumber);
                    const captain = pair ? players?.find(p => p.id === pair.captainId) : null;
                    const vc = pair ? players?.find(p => p.id === pair.viceCaptainId) : null;
                    const assignedTeam = pair?.assignedTeamId ? teams?.find(t => t.id === pair.assignedTeamId) : null;
                    
                    return (
                      <Card key={slotNumber} className={pair ? "border-green-500/50" : "border-dashed"}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={pair ? "default" : "secondary"}>
                              Slot {slotNumber}
                            </Badge>
                            {pair && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCaptainPairMutation.mutate(pair.id)}
                                disabled={deleteCaptainPairMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {pair ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{captain?.name || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-blue-500" />
                                <span className="text-muted-foreground">{vc?.name || "Unknown"}</span>
                              </div>
                              {assignedTeam && (
                                <Badge 
                                  style={{ backgroundColor: assignedTeam.primaryColor }}
                                  className="mt-2"
                                >
                                  {assignedTeam.name}
                                </Badge>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                Budget: {pair.remainingBudget.toLocaleString()} / {pair.budget.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-4">
                              Empty Slot
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium">{captainPairs?.length || 0}</span> of 12 slots assigned
                  </div>
                  <div className="text-muted-foreground">
                    {(captainPairs?.length || 0) === 12 
                      ? "All slots assigned - Ready for Team Names auction" 
                      : "Assign all 12 pairs before starting the Team Names auction"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Teams ({teams?.length || 0}/12)
              </h2>
              <CreateTeamDialog
                onSubmit={(data) => createTeamMutation.mutate(data)}
              />
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
                  const teamPlayers =
                    players?.filter((p) => p.teamId === team.id) || [];
                  return (
                    <Card key={team.id} data-testid={`admin-team-${team.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
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
                              Budget: {team.remainingBudget.toLocaleString()} /{" "}
                              {team.budget.toLocaleString()}
                            </p>
                          </div>
                          <EditTeamDialog
                            team={team}
                            onSubmit={(data) =>
                              updateTeamMutation.mutate({
                                id: team.id,
                                ...data,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <EditBudgetDialog
                            team={team}
                            onSubmit={(data) =>
                              updateTeamMutation.mutate({
                                id: team.id,
                                ...data,
                              })
                            }
                          />
                        </div>
                        {team.groupName && (
                          <Badge variant="outline" className="mb-2">
                            Group {team.groupName}
                          </Badge>
                        )}
                        {teamPlayers.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              Players ({teamPlayers.length})
                            </p>
                            <div className="space-y-2">
                              {teamPlayers.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={p.photoUrl} />
                                      <AvatarFallback className="text-xs">
                                        {p.name.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm truncate">
                                      {p.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs shrink-0"
                                    >
                                      {p.soldPrice?.toLocaleString() ||
                                        p.basePoints}
                                    </Badge>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        data-testid={`button-reassign-${p.id}`}
                                      >
                                        <TrendingUp className="w-3 h-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Reassign {p.name}
                                        </DialogTitle>
                                        <DialogDescription>
                                          Move this player to another team.
                                          Budget will be transferred
                                          accordingly. Player price:{" "}
                                          {(
                                            p.soldPrice || p.basePoints
                                          ).toLocaleString()}{" "}
                                          pts
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid grid-cols-2 gap-2 mt-4">
                                        {teams
                                          ?.filter((t) => t.id !== team.id)
                                          .map((otherTeam) => {
                                            const canAfford =
                                              otherTeam.remainingBudget >=
                                              (p.soldPrice || p.basePoints);
                                            return (
                                              <Button
                                                key={otherTeam.id}
                                                variant={
                                                  canAfford
                                                    ? "outline"
                                                    : "ghost"
                                                }
                                                disabled={
                                                  !canAfford ||
                                                  reassignPlayerMutation.isPending
                                                }
                                                className="justify-start gap-2"
                                                onClick={() =>
                                                  reassignPlayerMutation.mutate(
                                                    {
                                                      playerId: p.id,
                                                      newTeamId: otherTeam.id,
                                                    },
                                                  )
                                                }
                                                data-testid={`button-reassign-to-${otherTeam.id}`}
                                              >
                                                <div
                                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display shrink-0"
                                                  style={{
                                                    backgroundColor:
                                                      otherTeam.primaryColor,
                                                  }}
                                                >
                                                  {otherTeam.shortName}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                  <p className="text-xs truncate">
                                                    {otherTeam.name}
                                                  </p>
                                                  <p
                                                    className={cn(
                                                      "text-xs",
                                                      canAfford
                                                        ? "text-muted-foreground"
                                                        : "text-destructive",
                                                    )}
                                                  >
                                                    {otherTeam.remainingBudget.toLocaleString()}{" "}
                                                    pts
                                                  </p>
                                                </div>
                                              </Button>
                                            );
                                          })}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              ))}
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
                  Team Group Assignment
                </CardTitle>
                <CardDescription>
                  Assign teams to 4 groups (3 teams each). Click (+) to add a
                  team, (X) to remove. Top team from each group advances to
                  Semi-Finals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  const unassignedTeams =
                    teams?.filter((t) => !t.groupName) || [];
                  const allGroupsFull = ["A", "B", "C", "D"].every(
                    (g) =>
                      (teams?.filter((t) => t.groupName === g) || []).length >=
                      3,
                  );

                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="text-sm">
                          Unassigned Teams: {unassignedTeams.length}
                        </Badge>
                        {allGroupsFull && (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                            All Groups Complete
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {["A", "B", "C", "D"].map((groupName) => {
                          const groupTeams =
                            teams?.filter((t) => t.groupName === groupName) ||
                            [];
                          const slotsNeeded = 3 - groupTeams.length;

                          return (
                            <Card key={groupName} className="bg-muted/30">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">
                                    Group {groupName}
                                  </CardTitle>
                                  <Badge
                                    variant={
                                      groupTeams.length >= 3
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {groupTeams.length}/3
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {groupTeams.map((team, index) => (
                                  <div
                                    key={team.id}
                                    className="flex items-center gap-2 p-2 rounded-md bg-card"
                                    data-testid={`group-team-${team.id}`}
                                  >
                                    <span className="text-sm font-medium text-muted-foreground w-4">
                                      {index + 1}.
                                    </span>
                                    {team.logoUrl ? (
                                      <img src={team.logoUrl} alt={team.name} className="w-6 h-6 rounded object-cover shrink-0" />
                                    ) : (
                                      <div
                                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display shrink-0"
                                        style={{
                                          backgroundColor: team.primaryColor,
                                        }}
                                      >
                                        {team.shortName?.slice(0, 2)}
                                      </div>
                                    )}
                                    <span className="text-sm truncate flex-1">
                                      {team.name}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        updateTeamMutation.mutate({
                                          id: team.id,
                                          groupName: null as unknown as string,
                                        })
                                      }
                                      data-testid={`button-remove-team-${team.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}

                                {Array.from({ length: slotsNeeded }).map(
                                  (_, slotIndex) => (
                                    <Select
                                      key={`slot-${groupName}-${slotIndex}`}
                                      onValueChange={(teamId) => {
                                        updateTeamMutation.mutate({
                                          id: teamId,
                                          groupName,
                                        });
                                      }}
                                    >
                                      <SelectTrigger
                                        className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50"
                                        data-testid={`select-team-group-${groupName}-${slotIndex}`}
                                      >
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Plus className="h-4 w-4" />
                                          <span>Add Team</span>
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unassignedTeams.length > 0 ? (
                                          unassignedTeams.map((team) => (
                                            <SelectItem
                                              key={team.id}
                                              value={team.id}
                                            >
                                              <div className="flex items-center gap-2">
                                                {team.logoUrl ? (
                                                  <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded object-cover" />
                                                ) : (
                                                  <div
                                                    className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-display"
                                                    style={{
                                                      backgroundColor:
                                                        team.primaryColor,
                                                    }}
                                                  >
                                                    {team.shortName?.slice(0, 2)}
                                                  </div>
                                                )}
                                                <span>{team.name}</span>
                                              </div>
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                            No teams available
                                          </div>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  ),
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {/* League Stage Matches */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">League Stage Matches</CardTitle>
                      <div className="flex items-center gap-2">
                        {(matches?.filter(m => m.status === "scheduled" && m.stage === "group")?.length ?? 0) > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete ALL scheduled matches? This cannot be undone.")) {
                                clearMatchesMutation.mutate();
                              }
                            }}
                            disabled={clearMatchesMutation.isPending}
                            data-testid="button-clear-matches"
                          >
                            {clearMatchesMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                          </Button>
                        )}
                        <CreateMatchDialog
                          teams={teams || []}
                          matches={matches || []}
                          onSubmit={(data) => createMatchMutation.mutate(data)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const groupMatches = matches?.filter((m) => m.stage === "group" || !m.stage) || [];
                      if (groupMatches.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No matches scheduled yet</p>
                            <p className="text-sm">Click "Create Match" to add matches</p>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {groupMatches.map((match) => {
                            const team1 = teams?.find((t) => t.id === match.team1Id);
                            const team2 = teams?.find((t) => t.id === match.team2Id);
                            return (
                              <Card key={match.id} className="bg-card" data-testid={`match-${match.id}`}>
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <span className="text-xs text-muted-foreground font-medium">#{match.matchNumber}</span>
                                      <div className="flex items-center gap-2">
                                        {team1?.logoUrl ? (
                                          <img src={team1.logoUrl} alt={team1.name} className="w-6 h-6 rounded object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team1?.primaryColor }}>
                                            {team1?.shortName?.slice(0, 2)}
                                          </div>
                                        )}
                                        <span className="text-sm font-medium">{team1?.shortName}</span>
                                      </div>
                                      <span className="text-muted-foreground text-sm">vs</span>
                                      <div className="flex items-center gap-2">
                                        {team2?.logoUrl ? (
                                          <img src={team2.logoUrl} alt={team2.name} className="w-6 h-6 rounded object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team2?.primaryColor }}>
                                            {team2?.shortName?.slice(0, 2)}
                                          </div>
                                        )}
                                        <span className="text-sm font-medium">{team2?.shortName}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {match.status === "scheduled" && (
                                        <StartMatchDialog
                                          match={match}
                                          teams={teams || []}
                                          players={players || []}
                                          onStart={(data) =>
                                            startMatchMutation.mutate({
                                              matchId: match.id,
                                              ...data,
                                            })
                                          }
                                        />
                                      )}
                                      {match.status === "live" && (
                                        <Badge className="bg-red-500/20 text-red-600 animate-pulse">LIVE</Badge>
                                      )}
                                      {match.status === "completed" && (
                                        <div className="flex flex-col items-end gap-1">
                                          <Badge variant="secondary">Completed</Badge>
                                          {match.winnerId && (
                                            <span className="text-xs text-emerald-600 font-medium">
                                              {teams?.find(t => t.id === match.winnerId)?.shortName} Won
                                            </span>
                                          )}
                                          {!match.winnerId && match.team1Score === match.team2Score && (
                                            <span className="text-xs text-amber-600 font-medium">Tied</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Quarter-Finals Selection */}
                <QuarterFinalsSection
                  teams={teams || []}
                  matches={matches || []}
                  onCreateQuarterfinals={(data) => createQuarterfinalsMutation.mutate(data)}
                  isCreating={createQuarterfinalsMutation.isPending}
                  startMatchMutation={startMatchMutation}
                  players={players || []}
                />

                {/* Semi-Finals Selection */}
                <SemiFinalsSection
                  teams={teams || []}
                  matches={matches || []}
                  onCreateSemifinals={(data) => createSemifinalsMutation.mutate(data)}
                  isCreating={createSemifinalsMutation.isPending}
                  startMatchMutation={startMatchMutation}
                  players={players || []}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-6">
            <h2 className="text-xl font-semibold">
              Registered Players ({players?.length || 0})
            </h2>

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
                    <Card
                      key={player.id}
                      data-testid={`admin-player-${player.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={player.photoUrl}
                              alt={player.name}
                            />
                            <AvatarFallback>
                              {player.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {player.name}
                              </span>
                              <Badge variant="outline" className="shrink-0">
                                {player.role}
                              </Badge>
                              <Badge
                                className={cn(
                                  "shrink-0",
                                  player.status === "sold" &&
                                    "bg-emerald-500/20 text-emerald-600",
                                  player.status === "unsold" &&
                                    "bg-destructive/20 text-destructive",
                                  player.status === "lost_gold" &&
                                    "bg-amber-500/20 text-amber-600",
                                )}
                              >
                                {player.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="text-orange-500">
                                Bat: {player.battingRating}
                              </span>
                              <span className="text-purple-500">
                                Bowl: {player.bowlingRating}
                              </span>
                              <span className="text-emerald-500">
                                Field: {player.fieldingRating}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {player.soldPrice ? "Sold Price" : "Base Points"}
                              </p>
                              <p className="font-display text-xl">
                                {(player.soldPrice || player.basePoints).toLocaleString()}
                              </p>
                            </div>
                            {!player.teamId && (
                              <AssignPlayerDialog
                                player={player}
                                teams={teams || []}
                                allPlayers={players || []}
                                onAssign={(data) =>
                                  assignPlayerMutation.mutate({
                                    playerId: player.id,
                                    ...data,
                                  })
                                }
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updatePlayerMutation.mutate({
                                  id: player.id,
                                  isLocked: !player.isLocked,
                                })
                              }
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
            <div>
              <h2 className="text-xl font-semibold">Match Scoring</h2>
              <p className="text-sm text-muted-foreground">
                Start a match from the Tournament tab to begin scoring here
              </p>
            </div>

            {liveMatch ? (
              <LiveScoringPanel
                match={liveMatch}
                teams={teams || []}
                players={players || []}
                onRecordBall={(data) =>
                  recordBallMutation.mutate({ matchId: liveMatch.id, ...data })
                }
                isRecording={recordBallMutation.isPending}
                onSetPowerOver={(overNumber) =>
                  setPowerOverMutation.mutate({
                    matchId: liveMatch.id,
                    overNumber,
                    innings: liveMatch.currentInnings ?? 1,
                  })
                }
                onSetBatsmen={(strikerId, nonStrikerId) =>
                  setBatsmenMutation.mutate({
                    matchId: liveMatch.id,
                    strikerId,
                    nonStrikerId,
                  })
                }
                onSetBowler={(bowlerId) =>
                  setBowlerMutation.mutate({ matchId: liveMatch.id, bowlerId })
                }
                onNewBatsman={(batsmanId) =>
                  newBatsmanMutation.mutate({
                    matchId: liveMatch.id,
                    batsmanId,
                  })
                }
                onUndoBall={() => undoBallMutation.mutate(liveMatch.id)}
                onResetMatch={() => resetMatchMutation.mutate(liveMatch.id)}
                isUndoing={undoBallMutation.isPending}
                isResetting={resetMatchMutation.isPending}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Live Match</h3>
                  <p className="text-muted-foreground text-sm">
                    Go to Tournament tab → Start a match to begin scoring
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <TournamentSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CreateTeamDialog({
  onSubmit,
}: {
  onSubmit: (data: {
    name: string;
    shortName: string;
    primaryColor: string;
  }) => void;
}) {
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mumbai Indians"
              data-testid="input-team-name"
            />
          </div>
          <div>
            <Label>Short Name</Label>
            <Input
              value={shortName}
              onChange={(e) =>
                setShortName(e.target.value.toUpperCase().slice(0, 3))
              }
              placeholder="MI"
              maxLength={3}
              data-testid="input-team-short"
            />
          </div>
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 p-1"
                data-testid="input-team-color"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name || !shortName}
            data-testid="button-submit-team"
          >
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTeamDialog({
  team,
  onSubmit,
}: {
  team: Team;
  onSubmit: (data: {
    name?: string;
    shortName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  }) => void;
}) {
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
    onSubmit({
      name,
      shortName,
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid={`button-edit-team-${team.id}`}
        >
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
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 rounded-md object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-md flex items-center justify-center text-white font-display"
                  style={{ backgroundColor: primaryColor }}
                >
                  {shortName}
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  data-testid="input-team-logo"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload team logo (optional)
                </p>
              </div>
            </div>
          </div>
          <div>
            <Label>Team Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-edit-team-name"
            />
          </div>
          <div>
            <Label>Short Name</Label>
            <Input
              value={shortName}
              onChange={(e) =>
                setShortName(e.target.value.toUpperCase().slice(0, 3))
              }
              maxLength={3}
              data-testid="input-edit-team-short"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !shortName}
            data-testid="button-save-team"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditBudgetDialog({
  team,
  onSubmit,
}: {
  team: Team;
  onSubmit: (data: { remainingBudget: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [remainingBudget, setRemainingBudget] = useState(team.remainingBudget);

  const handleSubmit = () => {
    onSubmit({ remainingBudget });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          data-testid={`button-edit-budget-${team.id}`}
        >
          <IndianRupee className="w-3 h-3" />
          Edit Budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget: {team.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Total Budget</Label>
            <p className="text-lg font-semibold">{team.budget.toLocaleString()}</p>
          </div>
          <div>
            <Label>Remaining Budget</Label>
            <Input
              type="number"
              value={remainingBudget}
              onChange={(e) => setRemainingBudget(Number(e.target.value))}
              min={0}
              max={team.budget}
              data-testid="input-remaining-budget"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the correct remaining purse amount
            </p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="text-muted-foreground">Spent: </span>
              <span className="font-medium">{(team.budget - remainingBudget).toLocaleString()}</span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            data-testid="button-save-budget"
          >
            Save Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignPlayerDialog({
  player,
  teams,
  allPlayers,
  onAssign,
}: {
  player: Player;
  teams: Team[];
  allPlayers: Player[];
  onAssign: (data: { teamId: string; soldPrice: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [soldPrice, setSoldPrice] = useState(player.basePoints);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamRosterSize = selectedTeamId ? allPlayers.filter(p => p.teamId === selectedTeamId).length : 0;
  const hasEnoughBudget = selectedTeam && selectedTeam.remainingBudget >= soldPrice;
  const hasRosterSpace = teamRosterSize < 9;
  const canAssign = selectedTeam && hasEnoughBudget && hasRosterSpace;

  const handleSubmit = () => {
    if (selectedTeamId && soldPrice) {
      onAssign({ teamId: selectedTeamId, soldPrice });
      setOpen(false);
      setSelectedTeamId("");
      setSoldPrice(player.basePoints);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          data-testid={`button-assign-player-${player.id}`}
        >
          <Plus className="w-3 h-3" />
          Assign to Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Player: {player.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <Avatar className="h-12 w-12">
              <AvatarImage src={player.photoUrl} alt={player.name} />
              <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{player.name}</p>
              <p className="text-sm text-muted-foreground">{player.role} • Base: {player.basePoints}</p>
            </div>
          </div>
          <div>
            <Label>Select Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger data-testid="select-assign-team">
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} (Budget: {team.remainingBudget.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sold Price</Label>
            <Input
              type="number"
              value={soldPrice}
              onChange={(e) => setSoldPrice(Number(e.target.value))}
              min={0}
              data-testid="input-sold-price"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the price at which player was sold
            </p>
          </div>
          {selectedTeam && !hasEnoughBudget && (
            <p className="text-sm text-destructive">
              Team doesn't have enough budget ({selectedTeam.remainingBudget.toLocaleString()} available)
            </p>
          )}
          {selectedTeam && !hasRosterSpace && (
            <p className="text-sm text-destructive">
              Team already has 9 players (maximum roster size)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTeamId || !canAssign}
            data-testid="button-confirm-assign"
          >
            Assign Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuarterFinalsSection({
  teams,
  matches,
  onCreateQuarterfinals,
  isCreating,
  startMatchMutation,
  players,
}: {
  teams: Team[];
  matches: Match[];
  onCreateQuarterfinals: (data: { qf1Teams: string[]; qf2Teams: string[]; qf3Teams: string[]; qf4Teams: string[] }) => void;
  isCreating: boolean;
  startMatchMutation: any;
  players: Player[];
}) {
  const [qf1Team1, setQf1Team1] = useState<string>("");
  const [qf1Team2, setQf1Team2] = useState<string>("");
  const [qf2Team1, setQf2Team1] = useState<string>("");
  const [qf2Team2, setQf2Team2] = useState<string>("");
  const [qf3Team1, setQf3Team1] = useState<string>("");
  const [qf3Team2, setQf3Team2] = useState<string>("");
  const [qf4Team1, setQf4Team1] = useState<string>("");
  const [qf4Team2, setQf4Team2] = useState<string>("");

  const existingQF1 = matches.find(m => m.stage === "quarterfinal" && m.matchNumber === 1);
  const existingQF2 = matches.find(m => m.stage === "quarterfinal" && m.matchNumber === 2);
  const existingQF3 = matches.find(m => m.stage === "quarterfinal" && m.matchNumber === 3);
  const existingQF4 = matches.find(m => m.stage === "quarterfinal" && m.matchNumber === 4);
  
  const existingQFs = matches.filter(m => m.stage === "quarterfinal");
  const hasExistingQFs = existingQFs.length > 0;

  const selectedTeamIds = [qf1Team1, qf1Team2, qf2Team1, qf2Team2, qf3Team1, qf3Team2, qf4Team1, qf4Team2].filter(Boolean);

  const canCreate = qf1Team1 && qf1Team2 && qf2Team1 && qf2Team2 && qf3Team1 && qf3Team2 && qf4Team1 && qf4Team2 &&
    qf1Team1 !== qf1Team2 && qf2Team1 !== qf2Team2 && qf3Team1 !== qf3Team2 && qf4Team1 !== qf4Team2 &&
    !hasExistingQFs;

  const handleCreate = () => {
    if (canCreate) {
      onCreateQuarterfinals({
        qf1Teams: [qf1Team1, qf1Team2],
        qf2Teams: [qf2Team1, qf2Team2],
        qf3Teams: [qf3Team1, qf3Team2],
        qf4Teams: [qf4Team1, qf4Team2],
      });
    }
  };

  const renderTeamOption = (team: Team, excludeIds: string[] = []) => {
    if (excludeIds.includes(team.id)) return null;
    return (
      <SelectItem key={team.id} value={team.id}>
        <div className="flex items-center gap-2">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded object-cover" />
          ) : (
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team.primaryColor }}>
              {team.shortName?.slice(0, 2)}
            </div>
          )}
          <span>{team.name}</span>
        </div>
      </SelectItem>
    );
  };

  const renderTeamDisplay = (teamId: string | undefined) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
          <span className="text-sm">TBD</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-6 h-6 rounded object-cover" />
        ) : (
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team.primaryColor }}>
            {team.shortName?.slice(0, 2)}
          </div>
        )}
        <span className="text-sm font-medium">{team.name}</span>
      </div>
    );
  };

  const renderQFCard = (
    qfNumber: number,
    existingMatch: Match | undefined,
    team1: string,
    setTeam1: (v: string) => void,
    team2: string,
    setTeam2: (v: string) => void,
    excludeIds: string[]
  ) => (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Quarter-Final {qfNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {existingMatch ? (
          <>
            <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingMatch.team1Id)}</div>
            <div className="text-center text-muted-foreground text-xs">vs</div>
            <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingMatch.team2Id)}</div>
            {existingMatch.status === "scheduled" && (
              <StartMatchDialog
                match={existingMatch}
                teams={teams}
                players={players}
                onStart={(data) => startMatchMutation.mutate({ matchId: existingMatch.id, ...data })}
              />
            )}
            {existingMatch.status === "live" && <Badge className="bg-red-500/20 text-red-600 animate-pulse">LIVE</Badge>}
            {existingMatch.status === "completed" && (
              <div className="flex flex-col items-center gap-1">
                <Badge variant="secondary">Completed</Badge>
                {existingMatch.winnerId && (
                  <span className="text-xs text-emerald-600 font-medium">
                    {teams.find(t => t.id === existingMatch.winnerId)?.shortName} Won
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Select value={team1} onValueChange={setTeam1}>
              <SelectTrigger data-testid={`select-qf${qfNumber}-team1`}>
                <SelectValue placeholder="Select Team 1" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => !excludeIds.includes(t.id) && t.id !== team2).map(t => renderTeamOption(t, []))}
              </SelectContent>
            </Select>
            <div className="text-center text-muted-foreground text-xs">vs</div>
            <Select value={team2} onValueChange={setTeam2}>
              <SelectTrigger data-testid={`select-qf${qfNumber}-team2`}>
                <SelectValue placeholder="Select Team 2" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => !excludeIds.includes(t.id) && t.id !== team1).map(t => renderTeamOption(t, []))}
              </SelectContent>
            </Select>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">Quarter-Finals</CardTitle>
        <CardDescription>Select 8 teams for 4 quarter-final matches</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderQFCard(1, existingQFs[0], qf1Team1, setQf1Team1, qf1Team2, setQf1Team2, [qf2Team1, qf2Team2, qf3Team1, qf3Team2, qf4Team1, qf4Team2].filter(Boolean))}
          {renderQFCard(2, existingQFs[1], qf2Team1, setQf2Team1, qf2Team2, setQf2Team2, [qf1Team1, qf1Team2, qf3Team1, qf3Team2, qf4Team1, qf4Team2].filter(Boolean))}
          {renderQFCard(3, existingQFs[2], qf3Team1, setQf3Team1, qf3Team2, setQf3Team2, [qf1Team1, qf1Team2, qf2Team1, qf2Team2, qf4Team1, qf4Team2].filter(Boolean))}
          {renderQFCard(4, existingQFs[3], qf4Team1, setQf4Team1, qf4Team2, setQf4Team2, [qf1Team1, qf1Team2, qf2Team1, qf2Team2, qf3Team1, qf3Team2].filter(Boolean))}
        </div>

        {!hasExistingQFs && (
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleCreate} 
              disabled={!canCreate || isCreating}
              data-testid="button-create-quarterfinals"
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Quarter-Final Matches
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SemiFinalsSection({
  teams,
  matches,
  onCreateSemifinals,
  isCreating,
  startMatchMutation,
  players,
}: {
  teams: Team[];
  matches: Match[];
  onCreateSemifinals: (data: { semifinal1Teams: string[]; semifinal2Teams: string[] }) => void;
  isCreating: boolean;
  startMatchMutation: any;
  players: Player[];
}) {
  const [sf1Team1, setSf1Team1] = useState<string>("");
  const [sf1Team2, setSf1Team2] = useState<string>("");
  const [sf2Team1, setSf2Team1] = useState<string>("");
  const [sf2Team2, setSf2Team2] = useState<string>("");

  const existingSemi1 = matches.find(m => m.stage === "semifinal" && m.matchNumber === 1);
  const existingSemi2 = matches.find(m => m.stage === "semifinal" && m.matchNumber === 2);

  const selectedTeamIds = [sf1Team1, sf1Team2, sf2Team1, sf2Team2].filter(Boolean);
  const availableTeams = teams.filter(t => !selectedTeamIds.includes(t.id) || t.id === "");

  const canCreate = sf1Team1 && sf1Team2 && sf2Team1 && sf2Team2 && 
    sf1Team1 !== sf1Team2 && sf2Team1 !== sf2Team2 &&
    !existingSemi1 && !existingSemi2;

  const handleCreate = () => {
    if (canCreate) {
      onCreateSemifinals({
        semifinal1Teams: [sf1Team1, sf1Team2],
        semifinal2Teams: [sf2Team1, sf2Team2],
      });
    }
  };

  const renderTeamOption = (team: Team) => (
    <SelectItem key={team.id} value={team.id}>
      <div className="flex items-center gap-2">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded object-cover" />
        ) : (
          <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team.primaryColor }}>
            {team.shortName?.slice(0, 2)}
          </div>
        )}
        <span>{team.name}</span>
      </div>
    </SelectItem>
  );

  const renderTeamDisplay = (teamId: string | undefined) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
          <span className="text-sm">TBD</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-6 h-6 rounded object-cover" />
        ) : (
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-display" style={{ backgroundColor: team.primaryColor }}>
            {team.shortName?.slice(0, 2)}
          </div>
        )}
        <span className="text-sm font-medium">{team.name}</span>
      </div>
    );
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">Semi-Finals</CardTitle>
        <CardDescription>Select 4 teams that advance to semi-finals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Semi-Final 1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {existingSemi1 ? (
                <>
                  <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingSemi1.team1Id)}</div>
                  <div className="text-center text-muted-foreground text-xs">vs</div>
                  <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingSemi1.team2Id)}</div>
                  {existingSemi1.status === "scheduled" && (
                    <StartMatchDialog
                      match={existingSemi1}
                      teams={teams}
                      players={players}
                      onStart={(data) => startMatchMutation.mutate({ matchId: existingSemi1.id, ...data })}
                    />
                  )}
                  {existingSemi1.status === "live" && <Badge className="bg-red-500/20 text-red-600 animate-pulse">LIVE</Badge>}
                  {existingSemi1.status === "completed" && (
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="secondary">Completed</Badge>
                      {existingSemi1.winnerId && (
                        <span className="text-xs text-emerald-600 font-medium">
                          {teams.find(t => t.id === existingSemi1.winnerId)?.shortName} Won
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Select value={sf1Team1} onValueChange={setSf1Team1}>
                    <SelectTrigger data-testid="select-sf1-team1">
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== sf1Team2).map(renderTeamOption)}
                    </SelectContent>
                  </Select>
                  <div className="text-center text-muted-foreground text-xs">vs</div>
                  <Select value={sf1Team2} onValueChange={setSf1Team2}>
                    <SelectTrigger data-testid="select-sf1-team2">
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== sf1Team1).map(renderTeamOption)}
                    </SelectContent>
                  </Select>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Semi-Final 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {existingSemi2 ? (
                <>
                  <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingSemi2.team1Id)}</div>
                  <div className="text-center text-muted-foreground text-xs">vs</div>
                  <div className="p-2 rounded-md bg-muted/50">{renderTeamDisplay(existingSemi2.team2Id)}</div>
                  {existingSemi2.status === "scheduled" && (
                    <StartMatchDialog
                      match={existingSemi2}
                      teams={teams}
                      players={players}
                      onStart={(data) => startMatchMutation.mutate({ matchId: existingSemi2.id, ...data })}
                    />
                  )}
                  {existingSemi2.status === "live" && <Badge className="bg-red-500/20 text-red-600 animate-pulse">LIVE</Badge>}
                  {existingSemi2.status === "completed" && (
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="secondary">Completed</Badge>
                      {existingSemi2.winnerId && (
                        <span className="text-xs text-emerald-600 font-medium">
                          {teams.find(t => t.id === existingSemi2.winnerId)?.shortName} Won
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Select value={sf2Team1} onValueChange={setSf2Team1}>
                    <SelectTrigger data-testid="select-sf2-team1">
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== sf2Team2 && t.id !== sf1Team1 && t.id !== sf1Team2).map(renderTeamOption)}
                    </SelectContent>
                  </Select>
                  <div className="text-center text-muted-foreground text-xs">vs</div>
                  <Select value={sf2Team2} onValueChange={setSf2Team2}>
                    <SelectTrigger data-testid="select-sf2-team2">
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== sf2Team1 && t.id !== sf1Team1 && t.id !== sf1Team2).map(renderTeamOption)}
                    </SelectContent>
                  </Select>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {!existingSemi1 && !existingSemi2 && (
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleCreate} 
              disabled={!canCreate || isCreating}
              data-testid="button-create-semifinals"
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Semi-Final Matches
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateMatchDialog({
  teams,
  matches,
  onSubmit,
}: {
  teams: Team[];
  matches: Match[];
  onSubmit: (data: { team1Id: string; team2Id: string; matchNumber: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");

  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);
  
  const differentGroups = team1 && team2 && team1.groupName && team2.groupName && team1.groupName !== team2.groupName;
  const nextMatchNumber = matches.length > 0 ? Math.max(...matches.map(m => m.matchNumber)) + 1 : 1;

  const handleSubmit = () => {
    if (team1Id && team2Id) {
      onSubmit({ team1Id, team2Id, matchNumber: nextMatchNumber });
      setOpen(false);
      setTeam1Id("");
      setTeam2Id("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-match">
          <Plus className="w-4 h-4 mr-2" />
          Create Match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Team 1</Label>
            <Select value={team1Id} onValueChange={setTeam1Id}>
              <SelectTrigger data-testid="select-team1">
                <SelectValue placeholder="Select first team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} disabled={team.id === team2Id}>
                    {team.name} {team.groupName ? `(Group ${team.groupName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Team 2</Label>
            <Select value={team2Id} onValueChange={setTeam2Id}>
              <SelectTrigger data-testid="select-team2">
                <SelectValue placeholder="Select second team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} disabled={team.id === team1Id}>
                    {team.name} {team.groupName ? `(Group ${team.groupName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {differentGroups && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Warning: These teams are from different groups ({team1?.groupName} vs {team2?.groupName})
              </p>
            </div>
          )}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Match #{nextMatchNumber}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!team1Id || !team2Id || team1Id === team2Id}
            data-testid="button-confirm-create-match"
          >
            Create Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartMatchDialog({
  match,
  teams,
  players,
  onStart,
}: {
  match: Match;
  teams: Team[];
  players: Player[];
  onStart: (data: { 
    tossWinnerId: string; 
    tossDecision: string;
    team1PlayingXI?: string[];
    team2PlayingXI?: string[];
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState("");
  const [team1PlayingXI, setTeam1PlayingXI] = useState<string[]>([]);
  const [team2PlayingXI, setTeam2PlayingXI] = useState<string[]>([]);

  const team1 = teams.find((t) => t.id === match.team1Id);
  const team2 = teams.find((t) => t.id === match.team2Id);
  
  const team1Players = players.filter(p => p.teamId === match.team1Id);
  const team2Players = players.filter(p => p.teamId === match.team2Id);
  
  const team1Needs8 = team1Players.length === 9;
  const team2Needs8 = team2Players.length === 9;
  
  const togglePlayer = (teamNum: 1 | 2, playerId: string) => {
    if (teamNum === 1) {
      setTeam1PlayingXI(prev => 
        prev.includes(playerId) 
          ? prev.filter(id => id !== playerId)
          : prev.length < 8 ? [...prev, playerId] : prev
      );
    } else {
      setTeam2PlayingXI(prev => 
        prev.includes(playerId) 
          ? prev.filter(id => id !== playerId)
          : prev.length < 8 ? [...prev, playerId] : prev
      );
    }
  };

  const handleSubmit = () => {
    const data: {
      tossWinnerId: string;
      tossDecision: string;
      team1PlayingXI?: string[];
      team2PlayingXI?: string[];
    } = { tossWinnerId, tossDecision };
    
    if (team1Needs8) {
      data.team1PlayingXI = team1PlayingXI;
    }
    if (team2Needs8) {
      data.team2PlayingXI = team2PlayingXI;
    }
    
    onStart(data);
    setOpen(false);
  };
  
  const canStart = tossWinnerId && tossDecision && 
    (!team1Needs8 || team1PlayingXI.length === 8) && 
    (!team2Needs8 || team2PlayingXI.length === 8);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid={`button-start-match-${match.id}`}>
          <Play className="w-4 h-4 mr-2" />
          Start
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
          
          {team1Needs8 && (
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{team1?.shortName} Playing 8 ({team1PlayingXI.length}/8 selected)</span>
                {team1PlayingXI.length === 8 && <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">Ready</Badge>}
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                {team1Players.map(p => (
                  <div 
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      team1PlayingXI.includes(p.id) 
                        ? "bg-primary/20 border border-primary" 
                        : "hover:bg-muted-foreground/10"
                    )}
                    onClick={() => togglePlayer(1, p.id)}
                    data-testid={`toggle-player-t1-${p.id}`}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      team1PlayingXI.includes(p.id) ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {team1PlayingXI.includes(p.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {team2Needs8 && (
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{team2?.shortName} Playing 8 ({team2PlayingXI.length}/8 selected)</span>
                {team2PlayingXI.length === 8 && <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">Ready</Badge>}
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                {team2Players.map(p => (
                  <div 
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      team2PlayingXI.includes(p.id) 
                        ? "bg-primary/20 border border-primary" 
                        : "hover:bg-muted-foreground/10"
                    )}
                    onClick={() => togglePlayer(2, p.id)}
                    data-testid={`toggle-player-t2-${p.id}`}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      team2PlayingXI.includes(p.id) ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {team2PlayingXI.includes(p.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canStart}
          >
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
  players,
  onRecordBall,
  isRecording,
  onSetPowerOver,
  onSetBatsmen,
  onSetBowler,
  onNewBatsman,
  onUndoBall,
  onResetMatch,
  isUndoing,
  isResetting,
}: {
  match: Match;
  teams: Team[];
  players: Player[];
  onRecordBall: (data: {
    runs: number;
    extraType?: string;
    isWicket?: boolean;
    wicketType?: string;
    dismissedPlayerId?: string;
    fielderId?: string;
  }) => void;
  isRecording: boolean;
  onSetPowerOver: (overNumber: number) => void;
  onSetBatsmen: (strikerId: string, nonStrikerId: string) => void;
  onSetBowler: (bowlerId: string) => void;
  onNewBatsman: (batsmanId: string) => void;
  onUndoBall: () => void;
  onResetMatch: () => void;
  isUndoing: boolean;
  isResetting: boolean;
}) {
  const [selectedStriker, setSelectedStriker] = useState<string>("");
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>("");
  const [selectedBowler, setSelectedBowler] = useState<string>("");
  const [selectedNewBatsman, setSelectedNewBatsman] = useState<string>("");
  const [selectedDismissedPlayer, setSelectedDismissedPlayer] =
    useState<string>("");
  const [showFielderDialog, setShowFielderDialog] = useState(false);
  const [pendingWicketType, setPendingWicketType] = useState<string>("");
  const [selectedFielder, setSelectedFielder] = useState<string>("");
  const [selectedDismissedBatsman, setSelectedDismissedBatsman] =
    useState<string>("");
  const [runOutRuns, setRunOutRuns] = useState<number>(0);
  const [lastBowlerId, setLastBowlerId] = useState<string | null>(null);

  const team1 = teams.find((t) => t.id === match.team1Id);
  const team2 = teams.find((t) => t.id === match.team2Id);

  // Calculate current over number
  const currentOvers =
    match.currentInnings === 1 ? match.team1Overs : match.team2Overs;
  const [overs, balls] = (currentOvers || "0.0").split(".").map(Number);
  const currentOverNumber = overs + 1;

  // Check if power over is active for current innings
  const isPowerOverActive =
    match.powerOverActive && match.powerOverInnings === match.currentInnings;
  const isPowerOverNow =
    isPowerOverActive && match.powerOverNumber === currentOverNumber;

  // Get batting and bowling team players
  const battingTeamId =
    match.currentInnings === 1 ? match.team1Id : match.team2Id;
  const bowlingTeamId =
    match.currentInnings === 1 ? match.team2Id : match.team1Id;
  const battingTeamPlayers = players.filter((p) => p.teamId === battingTeamId);
  const bowlingTeamPlayers = players.filter((p) => p.teamId === bowlingTeamId);

  // Check current wickets for last-man-standing mode
  const currentWickets =
    match.currentInnings === 1 ? match.team1Wickets : match.team2Wickets;
  const isLastManStanding = (currentWickets || 0) >= 7;

  // Check if batsmen and bowler are set
  // In last-man-standing mode, we only need striker (no non-striker)
  const hasBatsmen = isLastManStanding
    ? !!match.strikerId
    : match.strikerId && match.nonStrikerId;
  const hasBowler = match.currentBowlerId;
  // Need new batsman when one spot is empty but the other is filled (not in last-man-standing mode)
  const needsNewBatsman =
    ((!match.strikerId && !!match.nonStrikerId) ||
      (!!match.strikerId && !match.nonStrikerId)) &&
    !isLastManStanding;
  const needsNewBowler = !match.currentBowlerId;
  const isEndOfOver = balls === 0 && overs > 0;
  const canScore = hasBatsmen && hasBowler;

  const getPlayerName = (playerId: string | null | undefined) => {
    if (!playerId) return "Not selected";
    const player = players.find((p) => p.id === playerId);
    return player?.name || "Unknown";
  };

  const recordRuns = (runs: number) => {
    onRecordBall({ runs });
  };

  const recordExtra = (type: "wide" | "no_ball") => {
    onRecordBall({ runs: 0, extraType: type });
  };

  const recordWicket = (type: string) => {
    // For caught, stumped, run_out - show fielder selection dialog
    if (type === "caught" || type === "stumped" || type === "run_out") {
      setPendingWicketType(type);
      setSelectedFielder("");
      // For run outs, allow selecting which batsman was dismissed
      setSelectedDismissedBatsman(
        type === "run_out" ? "" : match.strikerId || "",
      );
      setShowFielderDialog(true);
    } else {
      // For bowled, lbw - no fielder needed, striker is always dismissed
      onRecordBall({
        runs: 0,
        isWicket: true,
        wicketType: type,
        dismissedPlayerId: match.strikerId || undefined,
      });
    }
  };

  const confirmWicketWithFielder = () => {
    // For run outs, use the selected batsman; otherwise default to striker
    const dismissedId =
      pendingWicketType === "run_out"
        ? selectedDismissedBatsman || match.strikerId || undefined
        : match.strikerId || undefined;

    onRecordBall({
      runs: pendingWicketType === "run_out" ? runOutRuns : 0,
      isWicket: true,
      wicketType: pendingWicketType,
      dismissedPlayerId: dismissedId,
      fielderId: selectedFielder || undefined,
    });
    setShowFielderDialog(false);
    setPendingWicketType("");
    setSelectedDismissedPlayer("");
    setSelectedFielder("");
    setSelectedDismissedBatsman("");
    setRunOutRuns(0);
  };

  return (
    <Card>
      <CardHeader>

        <CardTitle className="flex items-center justify-between">
          <span>
            Live: {team1?.shortName} vs {team2?.shortName}
          </span>
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
            <p className="text-sm text-muted-foreground mb-1">
              {team1?.shortName}
            </p>
            <p className="font-display text-4xl">
              {match.team1Score}/{match.team1Wickets}
              <span className="text-lg text-muted-foreground ml-2">
                ({match.team1Overs})
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              {team2?.shortName}
            </p>
            <p className="font-display text-4xl">
              {match.team2Score}/{match.team2Wickets}
              <span className="text-lg text-muted-foreground ml-2">
                ({match.team2Overs})
              </span>
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
                    over < currentOverNumber && "opacity-50 cursor-not-allowed",
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

        {/* Batsmen & Bowler Selection */}
        <div className="p-4 rounded-md border border-blue-500/30 bg-blue-500/5 space-y-4">
          <Label className="text-sm text-blue-600 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Current Players (Innings {match.currentInnings})
          </Label>

          {/* Last Man Standing indicator */}
          {isLastManStanding && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/30">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                Last Man Standing (7 wickets)
              </span>
            </div>
          )}

          {/* Show current batsmen and bowler if set */}
          {hasBatsmen && hasBowler ? (
            <div
              className={cn(
                "grid gap-3",
                isLastManStanding ? "grid-cols-2" : "grid-cols-3",
              )}
            >
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs text-emerald-600 mb-1">Striker *</p>
                <p className="font-medium text-emerald-700">
                  {getPlayerName(match.strikerId)}
                </p>
              </div>
              {!isLastManStanding && (
                <div className="p-3 rounded-md bg-white/50 border dark:bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Non-Striker
                  </p>
                  <p className="font-medium">
                    {getPlayerName(match.nonStrikerId)}
                  </p>
                </div>
              )}
              <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs text-purple-600 mb-1">Bowler</p>
                <p className="font-medium text-purple-700">
                  {getPlayerName(match.currentBowlerId)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Opening batsmen selection */}
          {!hasBatsmen && !match.strikerId && !match.nonStrikerId && (
            <div className="space-y-3">
              <p className="text-sm text-blue-600 font-medium">
                Select Opening Batsmen
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Striker</Label>
                  <Select
                    value={selectedStriker}
                    onValueChange={setSelectedStriker}
                  >
                    <SelectTrigger data-testid="select-striker">
                      <SelectValue placeholder="Select striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {battingTeamPlayers.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={p.id === selectedNonStriker}
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Non-Striker</Label>
                  <Select
                    value={selectedNonStriker}
                    onValueChange={setSelectedNonStriker}
                  >
                    <SelectTrigger data-testid="select-nonstriker">
                      <SelectValue placeholder="Select non-striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {battingTeamPlayers.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={p.id === selectedStriker}
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (selectedStriker && selectedNonStriker) {
                    onSetBatsmen(selectedStriker, selectedNonStriker);
                    setSelectedStriker("");
                    setSelectedNonStriker("");
                  }
                }}
                disabled={!selectedStriker || !selectedNonStriker}
                data-testid="button-set-batsmen"
              >
                Set Opening Batsmen
              </Button>
            </div>
          )}

          {/* New batsman selection after wicket */}
          {needsNewBatsman && (
            <div className="space-y-3 p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
              <p className="text-sm text-orange-600 font-medium">
                Wicket! Select New Batsman
              </p>
              <div className="flex gap-3">
                <Select
                  value={selectedNewBatsman}
                  onValueChange={setSelectedNewBatsman}
                >
                  <SelectTrigger
                    className="flex-1"
                    data-testid="select-new-batsman"
                  >
                    <SelectValue placeholder="Select new batsman" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const currentBattingOrder =
                        match.currentInnings === 1
                          ? match.innings1BattingOrder || []
                          : match.innings2BattingOrder || [];
                      const remainingBatsman =
                        match.strikerId || match.nonStrikerId;
                      return battingTeamPlayers
                        .filter(
                          (p) =>
                            p.id !== remainingBatsman &&
                            !currentBattingOrder.includes(p.id),
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ));
                    })()}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (selectedNewBatsman) {
                      onNewBatsman(selectedNewBatsman);
                      setSelectedNewBatsman("");
                    }
                  }}
                  disabled={!selectedNewBatsman}
                  data-testid="button-add-batsman"
                >
                  Add Batsman
                </Button>
              </div>
            </div>
          )}

          {/* Bowler selection */}
          {needsNewBowler && hasBatsmen && (
            <div className="space-y-3 p-3 rounded-md bg-purple-500/10 border border-purple-500/30">
              <p className="text-sm text-purple-600 font-medium">
                {isEndOfOver
                  ? "End of Over! Select Next Bowler"
                  : "Select Bowler"}
              </p>
              {lastBowlerId && (
                <p className="text-xs text-muted-foreground">
                    Last bowler: {getPlayerName(lastBowlerId)} (Cannot bowl consecutive overs)
                </p>
              )}
              <div className="flex gap-3">
                <Select
                  value={selectedBowler}
                  onValueChange={setSelectedBowler}
                >
                  <SelectTrigger className="flex-1" data-testid="select-bowler">
                    <SelectValue placeholder="Select bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const currentBowlingOrder =
                        match.currentInnings === 1
                          ? match.innings1BowlingOrder || []
                          : match.innings2BowlingOrder || [];
                      const previousBowlerId =
                        currentBowlingOrder.length > 0
                          ? currentBowlingOrder[currentBowlingOrder.length - 1]
                          : null;
                      return bowlingTeamPlayers.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={isEndOfOver && p.id === previousBowlerId}
                        >
                          {p.name}
                          {isEndOfOver && p.id === previousBowlerId
                            ? " (bowled last over)"
                            : ""}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (selectedBowler) {
                      onSetBowler(selectedBowler);
                      setSelectedBowler("");
                    }
                  }}
                  disabled={!selectedBowler}
                  data-testid="button-set-bowler"
                >
                  Set Bowler
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scoring Section - Only show when players are set */}
        {canScore ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Runs
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                  <Button
                    key={runs}
                    variant={
                      runs === 4
                        ? "default"
                        : runs === 6
                          ? "default"
                          : "outline"
                    }
                    className={cn(
                      "h-14 font-display text-2xl",
                      runs === 4 && "bg-blue-500 hover:bg-blue-600",
                      runs === 6 && "bg-emerald-500 hover:bg-emerald-600",
                    )}
                    onClick={() => recordRuns(runs)}
                    disabled={isRecording}
                    data-testid={`button-runs-${runs}`}
                  >
                    {isRecording ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      runs
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Extras
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 bg-amber-500/10 border-amber-500/30 text-amber-600"
                  onClick={() => recordExtra("wide")}
                  disabled={isRecording}
                  data-testid="button-wide"
                >
                  Wide (+1)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 bg-amber-500/10 border-amber-500/30 text-amber-600"
                  onClick={() => recordExtra("no_ball")}
                  disabled={isRecording}
                  data-testid="button-no-ball"
                >
                  No Ball (+1)
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Wicket
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {["bowled", "caught", "run_out", "stumped"].map(
                  (type) => (
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
                  ),
                )}
              </div>
            </div>

            {/* Undo and Reset buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={onUndoBall}
                disabled={isUndoing || isRecording}
                data-testid="button-undo-ball"
              >
                {isUndoing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Undo Last Ball
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={isResetting || isRecording}
                    data-testid="button-reset-match"
                  >
                    {isResetting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Reset Match
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Match?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all ball events and reset scores to 0.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onResetMatch}
                      data-testid="button-confirm-reset"
                    >
                      Reset Match
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-muted/30 rounded-md">
            <p className="text-muted-foreground">
              {!hasBatsmen
                ? "Select opening batsmen to start scoring"
                : !hasBowler
                  ? "Select a bowler to start scoring"
                  : "Ready to score"}
            </p>
          </div>
        )}

        {/* Wicket Details Dialog */}
        <Dialog open={showFielderDialog} onOpenChange={(open) => {
            if (!open) {
              setShowFielderDialog(false);
              setPendingWicketType("");
              setSelectedFielder("");
              setSelectedDismissedBatsman("");
              setRunOutRuns(0);
            }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                {pendingWicketType === "caught"
                  ? "Caught - Select Fielder"
                  : pendingWicketType === "stumped"
                    ? "Stumped - Select Wicketkeeper"
                    : "Run Out Details"}
              </DialogTitle>
              <DialogDescription>
                {pendingWicketType === "caught"
                  ? "Select the fielder who took the catch"
                  : pendingWicketType === "stumped"
                    ? "Select the wicketkeeper who made the stumping"
                    : "Select which batsman was run out and runs scored before dismissal"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* For run outs, allow selecting which batsman was dismissed and runs */}
              {pendingWicketType === "run_out" && (
                <>
                  <div>
                    <Label>Which Batsman was Run Out?</Label>
                    <Select
                      value={selectedDismissedBatsman}
                      onValueChange={setSelectedDismissedBatsman}
                    >
                      <SelectTrigger data-testid="select-dismissed-batsman">
                        <SelectValue placeholder="Select dismissed batsman" />
                      </SelectTrigger>
                      <SelectContent>
                        {match.strikerId && (
                          <SelectItem value={match.strikerId}>
                            {getPlayerName(match.strikerId)} (Striker)
                          </SelectItem>
                        )}
                        {match.nonStrikerId && (
                          <SelectItem value={match.nonStrikerId}>
                            {getPlayerName(match.nonStrikerId)} (Non-Striker)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Runs Scored Before Run Out</Label>
                    <div className="flex gap-2 mt-2">
                      {[0, 1, 2, 3].map((r) => (
                        <Button
                          key={r}
                          type="button"
                          variant={runOutRuns === r ? "default" : "outline"}
                          className="flex-1 h-12"
                          onClick={() => setRunOutRuns(r)}
                          data-testid={`button-runout-runs-${r}`}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label>
                  {pendingWicketType === "caught"
                    ? "Fielder who caught the ball"
                    : pendingWicketType === "stumped"
                      ? "Wicketkeeper"
                      : "Fielder who made the run out"}
                </Label>
                <Select
                  value={selectedFielder}
                  onValueChange={setSelectedFielder}
                >
                  <SelectTrigger data-testid="select-fielder">
                    <SelectValue placeholder={
                      pendingWicketType === "stumped" 
                        ? "Select wicketkeeper" 
                        : "Select fielder"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {bowlingTeamPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFielderDialog(false);
                  setPendingWicketType("");
                  setSelectedFielder("");
                  setSelectedDismissedBatsman("");
                  setRunOutRuns(0);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmWicketWithFielder}
                disabled={
                  !selectedFielder ||
                  (pendingWicketType === "run_out" && !selectedDismissedBatsman)
                }
                data-testid="button-confirm-wicket"
              >
                Confirm Wicket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function PlayerApprovalPanel({
  players,
  isLoading,
}: {
  players?: Player[];
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRole, setEditRole] = useState<
    "Batsman" | "Bowler" | "All-rounder"
  >("Batsman");
  const [editTshirtSize, setEditTshirtSize] = useState<"S" | "M" | "L" | "XL">(
    "M",
  );
  const [editBatting, setEditBatting] = useState("5");
  const [editBowling, setEditBowling] = useState("5");
  const [editFielding, setEditFielding] = useState("5");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const pendingPlayers =
    players?.filter((p) => p.approvalStatus === "pending") || [];
  const approvedPlayers =
    players?.filter((p) => p.approvalStatus === "approved") || [];
  const rejectedPlayers =
    players?.filter((p) => p.approvalStatus === "rejected") || [];

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

  const editPlayerMutation = useMutation({
    mutationFn: async ({
      playerId,
      ...data
    }: {
      playerId: string;
      name?: string;
      email?: string;
      mobile?: string;
      address?: string;
      role?: string;
      tshirtSize?: string;
      battingRating?: number;
      bowlingRating?: number;
      fieldingRating?: number;
      photoUrl?: string;
    }) => {
      return apiRequest("PATCH", `/api/players/${playerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setEditingPlayer(null);
      toast({ title: "Player updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update player", variant: "destructive" });
    },
  });

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name || "");
    setEditEmail(player.email || "");
    setEditMobile(player.mobile || "");
    setEditAddress(player.address || "");
    setEditRole(
      (player.role as "Batsman" | "Bowler" | "All-rounder") || "Batsman",
    );
    setEditTshirtSize((player.tshirtSize as "S" | "M" | "L" | "XL") || "M");
    setEditBatting(player.battingRating?.toString() || "5");
    setEditBowling(player.bowlingRating?.toString() || "5");
    setEditFielding(player.fieldingRating?.toString() || "5");
    setEditPhotoUrl(player.photoUrl || "");
  };

  const handleEditPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingPhoto(true);
        const imageCompression = (await import("browser-image-compression"))
          .default;
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setEditPhotoUrl(base64);
          setIsCompressingPhoto(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
        setIsCompressingPhoto(false);
        toast({
          title: "Photo Error",
          description:
            "Could not process the photo. Please try a smaller image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSavePlayer = () => {
    if (editingPlayer) {
      editPlayerMutation.mutate({
        playerId: editingPlayer.id,
        name: editName,
        email: editEmail || undefined,
        mobile: editMobile,
        address: editAddress,
        role: editRole,
        tshirtSize: editTshirtSize,
        battingRating: parseInt(editBatting) || 5,
        bowlingRating: parseInt(editBowling) || 5,
        fieldingRating: parseInt(editFielding) || 5,
        photoUrl: editPhotoUrl,
      });
    }
  };

  const renderPlayerCard = (player: Player, showActions: boolean = true) => (
    <Card
      key={player.id}
      className="p-4"
      data-testid={`approval-player-${player.id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={player.photoUrl} alt={player.name} />
          <AvatarFallback>
            {player.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{player.name}</p>
            <Badge variant="outline" className="text-xs">
              {player.role}
            </Badge>
            {player.paymentStatus === "verified" && (
              <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">
                Paid
              </Badge>
            )}
            {player.paymentStatus === "pending" && (
              <Badge className="bg-amber-500/20 text-amber-600 text-xs">
                Payment Pending
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <p>Email: {player.email || "N/A"}</p>
            <p>Phone: {player.phone || "N/A"}</p>
            <p>Mobile: {player.mobile}</p>
            <p>T-Shirt: {player.tshirtSize || "N/A"}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Address: {player.address}
          </p>
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
              variant="outline"
              onClick={() => openEditDialog(player)}
              data-testid={`button-edit-player-pending-${player.id}`}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(player)}
              data-testid={`button-edit-player-${player.id}`}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
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
                    This will permanently delete {player.name} from the system.
                    This action cannot be undone.
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
        <CardDescription>
          Review and approve player registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger
              value="pending"
              className="gap-2"
              data-testid="tab-pending"
            >
              Pending ({pendingPlayers.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="gap-2"
              data-testid="tab-approved"
            >
              Approved ({approvedPlayers.length})
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="gap-2"
              data-testid="tab-rejected"
            >
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
                  {rejectedPlayers.map((player) =>
                    renderPlayerCard(player, false),
                  )}
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

      {/* Edit Player Dialog */}
      <Dialog
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          {editingPlayer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={editPhotoUrl} alt={editName} />
                    <AvatarFallback>
                      {editName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80">
                    {isCompressingPhoto ? (
                      <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-primary-foreground" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditPhotoChange}
                      data-testid="input-edit-photo"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Click icon to change photo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile">Mobile Number</Label>
                  <Input
                    id="edit-mobile"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    data-testid="input-edit-mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email (Optional)</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editRole}
                    onValueChange={(v) => setEditRole(v as typeof editRole)}
                  >
                    <SelectTrigger data-testid="input-edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tshirt">T-Shirt Size (US)</Label>
                  <Select
                    value={editTshirtSize}
                    onValueChange={(v) =>
                      setEditTshirtSize(v as typeof editTshirtSize)
                    }
                  >
                    <SelectTrigger data-testid="input-edit-tshirt">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  data-testid="input-edit-address"
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Player Ratings</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-batting">Batting (1-10)</Label>
                    <Input
                      id="edit-batting"
                      type="number"
                      min="1"
                      max="10"
                      value={editBatting}
                      onChange={(e) => setEditBatting(e.target.value)}
                      data-testid="input-edit-batting"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bowling">Bowling (1-10)</Label>
                    <Input
                      id="edit-bowling"
                      type="number"
                      min="1"
                      max="10"
                      value={editBowling}
                      onChange={(e) => setEditBowling(e.target.value)}
                      data-testid="input-edit-bowling"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fielding">Fielding (1-10)</Label>
                    <Input
                      id="edit-fielding"
                      type="number"
                      min="1"
                      max="10"
                      value={editFielding}
                      onChange={(e) => setEditFielding(e.target.value)}
                      data-testid="input-edit-fielding"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePlayer}
                  disabled={editPlayerMutation.isPending}
                  data-testid="button-save-player"
                >
                  {editPlayerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
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
          <p className="text-sm text-muted-foreground">
            Configure payment methods and tournament details
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          data-testid="button-save-settings"
        >
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
            <CardDescription>
              Set the registration fee for players
            </CardDescription>
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
            <CardDescription>
              Configure Cash App payment details
            </CardDescription>
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
            <CardDescription>
              Login credentials for display/projector mode
            </CardDescription>
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
