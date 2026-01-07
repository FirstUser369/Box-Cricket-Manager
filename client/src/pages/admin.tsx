import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, Gavel, Play, Settings, Plus, Trash2, Edit, Lock, Unlock, Check, X, CircleDot, Target, Loader2 } from "lucide-react";
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
import type { Player, Team, Match, AuctionState } from "@shared/schema";
import { cn } from "@/lib/utils";

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

        <Tabs defaultValue="auction" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
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
            <TabsTrigger value="scoring" className="gap-2" data-testid="admin-tab-scoring">
              <Play className="w-4 h-4" />
              Scoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auction Control</CardTitle>
                <CardDescription>
                  Status: <Badge variant="outline" className="ml-2">{auctionState?.status || "not_started"}</Badge>
                </CardDescription>
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

                {currentPlayer && auctionState?.status === "in_progress" && (
                  <div className="mt-6 p-6 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} />
                        <AvatarFallback>{currentPlayer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-display text-2xl">{currentPlayer.name}</h3>
                        <p className="text-muted-foreground">{currentPlayer.role}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm text-muted-foreground">Current Bid</p>
                        <p className="font-display text-4xl text-primary">
                          {(auctionState.currentBid || currentPlayer.basePoints).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {currentBiddingTeam && (
                      <div className="mb-4 p-3 rounded-md bg-card flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white font-display text-xs"
                          style={{ backgroundColor: currentBiddingTeam.primaryColor }}
                        >
                          {currentBiddingTeam.shortName}
                        </div>
                        <span className="font-medium">{currentBiddingTeam.name} leads</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {teams?.map((team) => {
                        const canBid = team.remainingBudget >= (auctionState.currentBid || currentPlayer.basePoints) + getBidIncrement(auctionState.currentBid || currentPlayer.basePoints);
                        return (
                          <Button
                            key={team.id}
                            variant="outline"
                            size="sm"
                            disabled={!canBid || currentBiddingTeam?.id === team.id}
                            onClick={() => placeBidMutation.mutate(team.id)}
                            className="flex-col h-auto py-2"
                            style={{ borderColor: team.primaryColor }}
                            data-testid={`button-bid-${team.id}`}
                          >
                            <span 
                              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-display mb-1"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              {team.shortName}
                            </span>
                            <span className="text-xs">{team.remainingBudget.toLocaleString()}</span>
                          </Button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => sellPlayerMutation.mutate()}
                        disabled={!currentBiddingTeam}
                        data-testid="button-sold"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        SOLD
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => unsoldPlayerMutation.mutate()}
                        data-testid="button-unsold"
                      >
                        <X className="w-4 h-4 mr-2" />
                        UNSOLD
                      </Button>
                    </div>
                  </div>
                )}
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
                {teams?.map((team) => (
                  <Card key={team.id} data-testid={`admin-team-${team.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shortName}
                        </div>
                        <div>
                          <h3 className="font-medium">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Budget: {team.remainingBudget.toLocaleString()} / {team.budget.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Match Scoring</h2>
              <CreateMatchDialog teams={teams || []} onSubmit={(data) => createMatchMutation.mutate(data)} />
            </div>

            {liveMatch ? (
              <LiveScoringPanel 
                match={liveMatch} 
                teams={teams || []} 
                onRecordBall={(data) => recordBallMutation.mutate({ matchId: liveMatch.id, ...data })}
                isRecording={recordBallMutation.isPending}
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
        </Tabs>
      </div>
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

function CreateMatchDialog({ teams, onSubmit }: { teams: Team[]; onSubmit: (data: { team1Id: string; team2Id: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");

  const handleSubmit = () => {
    onSubmit({ team1Id, team2Id });
    setOpen(false);
    setTeam1Id("");
    setTeam2Id("");
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
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Team 2</Label>
            <Select value={team2Id} onValueChange={setTeam2Id}>
              <SelectTrigger data-testid="select-team2">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => t.id !== team1Id).map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!team1Id || !team2Id} data-testid="button-submit-match">
            Create Match
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
  isRecording
}: { 
  match: Match; 
  teams: Team[]; 
  onRecordBall: (data: { runs: number; extraType?: string; isWicket?: boolean; wicketType?: string }) => void;
  isRecording: boolean;
}) {
  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);

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
          <Badge className="bg-destructive/20 text-destructive gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            LIVE
          </Badge>
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
