import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Team, Player } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Teams() {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const getTeamPlayers = (teamId: string) => {
    return players?.filter(p => p.teamId === teamId) || [];
  };

  if (teamsLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Teams</h1>
          <p className="text-muted-foreground">
            12 teams competing for the championship
          </p>
        </div>

        {!teams || teams.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground">
                Teams will be created by the admin before the auction begins.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const teamPlayers = getTeamPlayers(team.id);
              const squadCount = teamPlayers.length;
              const minSquadSize = 8;
              const budgetUsed = team.budget - team.remainingBudget;
              const budgetPercentage = (budgetUsed / team.budget) * 100;
              const isExpanded = expandedTeam === team.id;

              return (
                <Collapsible
                  key={team.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedTeam(isExpanded ? null : team.id)}
                >
                  <Card 
                    className="overflow-hidden"
                    data-testid={`team-card-${team.id}`}
                  >
                    <div 
                      className="h-2"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-14 h-14 rounded-md flex items-center justify-center text-white font-display text-xl"
                            style={{ backgroundColor: team.primaryColor }}
                          >
                            {team.shortName}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{squadCount}/{minSquadSize} players</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Wallet className="w-4 h-4" />
                              Budget
                            </span>
                            <span className="font-display text-lg">
                              {team.remainingBudget.toLocaleString()} / {team.budget.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={budgetPercentage} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between">
                          {squadCount < minSquadSize ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-500/10">
                              Need {minSquadSize - squadCount} more
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              Squad Complete
                            </Badge>
                          )}

                          <CollapsibleTrigger asChild>
                            <button 
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                              data-testid={`button-expand-team-${team.id}`}
                            >
                              {isExpanded ? (
                                <>Hide Squad <ChevronUp className="w-4 h-4" /></>
                              ) : (
                                <>View Squad <ChevronDown className="w-4 h-4" /></>
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                          <div className="pt-4 border-t border-border space-y-2">
                            {teamPlayers.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No players yet
                              </p>
                            ) : (
                              teamPlayers.map((player) => (
                                <div 
                                  key={player.id}
                                  className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                                  data-testid={`team-player-${player.id}`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={player.photoUrl} alt={player.name} />
                                    <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">{player.role}</p>
                                  </div>
                                  {player.soldPrice && (
                                    <span className="font-display text-sm text-accent">
                                      {player.soldPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </CardContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
