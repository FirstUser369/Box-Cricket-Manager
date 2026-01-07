import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, Gavel, Play, BarChart3, ChevronRight, Zap, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Match, Team, AuctionState } from "@shared/schema";

export default function Home() {
  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: auctionState, isLoading: auctionLoading } = useQuery<AuctionState>({
    queryKey: ["/api/auction/state"],
  });

  const liveMatch = matches?.find(m => m.status === "live");

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
          <Badge className="mb-6 text-sm px-4 py-1.5" data-testid="badge-season">
            Season 2025
          </Badge>
          
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              BOX CRICKET
            </span>
            <br />
            <span className="text-foreground">LEAGUE</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the thrill of IPL-style box cricket tournaments. 
            Register, compete in auctions, and battle for the championship.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 gap-2" data-testid="button-register-hero">
                <Zap className="w-5 h-5" />
                Register Now
              </Button>
            </Link>
            <Link href="/matches">
              <Button size="lg" variant="outline" className="text-lg px-8 gap-2" data-testid="button-matches-hero">
                <Play className="w-5 h-5" />
                Watch Live
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-elevate" data-testid="card-stats-teams">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teams</p>
                    {teamsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="font-display text-3xl">{teams?.length || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-stats-matches">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-accent/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matches</p>
                    {matchesLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="font-display text-3xl">{matches?.length || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-stats-auction">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-purple-500/20 flex items-center justify-center">
                    <Gavel className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auction</p>
                    {auctionLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="font-display text-3xl capitalize">
                        {auctionState?.status?.replace(/_/g, " ") || "Not Started"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-stats-live">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-destructive/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Live Now</p>
                    {matchesLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : liveMatch ? (
                      <p className="font-display text-3xl text-destructive">Match #{liveMatch.matchNumber}</p>
                    ) : (
                      <p className="font-display text-3xl text-muted-foreground">No Match</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl mb-4">Quick Links</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to follow the tournament
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/register">
              <Card className="hover-elevate group h-full" data-testid="link-quick-register">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                    <Target className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Player Registration</h3>
                    <p className="text-sm text-muted-foreground">Join the tournament via QR form</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/teams">
              <Card className="hover-elevate group h-full" data-testid="link-quick-teams">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                    <Users className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">View Teams</h3>
                    <p className="text-sm text-muted-foreground">Check all 12 team squads</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/auction">
              <Card className="hover-elevate group h-full" data-testid="link-quick-auction">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-purple-500 to-purple-500/60 flex items-center justify-center shrink-0">
                    <Gavel className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Live Auction</h3>
                    <p className="text-sm text-muted-foreground">Watch IPL-style bidding</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/matches">
              <Card className="hover-elevate group h-full" data-testid="link-quick-matches">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center shrink-0">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Live Matches</h3>
                    <p className="text-sm text-muted-foreground">Ball-by-ball scoring</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/points-table">
              <Card className="hover-elevate group h-full" data-testid="link-quick-points">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-500/60 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Points Table</h3>
                    <p className="text-sm text-muted-foreground">Standings & NRR</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/leaderboards">
              <Card className="hover-elevate group h-full" data-testid="link-quick-leaders">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-orange-500 to-orange-500/60 flex items-center justify-center shrink-0">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Leaderboards</h3>
                    <p className="text-sm text-muted-foreground">Orange & Purple Cap</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">Ready to Play?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Register now and become part of the biggest box cricket tournament. 
            Show your skills and get picked in the auction!
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-10" data-testid="button-register-cta">
              Register as a Player
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
