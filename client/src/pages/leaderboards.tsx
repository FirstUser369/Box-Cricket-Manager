import { useQuery } from "@tanstack/react-query";
import { Award, Target, CircleDot, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrangeCapLeader, PurpleCapLeader, MVPLeader, Team } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Leaderboards() {
  const { data: orangeCap, isLoading: orangeLoading } = useQuery<OrangeCapLeader[]>({
    queryKey: ["/api/leaderboards/orange-cap"],
  });

  const { data: purpleCap, isLoading: purpleLoading } = useQuery<PurpleCapLeader[]>({
    queryKey: ["/api/leaderboards/purple-cap"],
  });

  const { data: mvp, isLoading: mvpLoading } = useQuery<MVPLeader[]>({
    queryKey: ["/api/leaderboards/mvp"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const getTeam = (teamId: string | null) => teamId ? teams?.find(t => t.id === teamId) : null;

  const isLoading = orangeLoading || purpleLoading || mvpLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const LeaderPodium = ({ leaders, type }: { leaders: any[]; type: "orange" | "purple" | "mvp" }) => {
    if (!leaders || leaders.length === 0) {
      return (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Leaders Yet</h3>
            <p className="text-muted-foreground text-sm">
              Leaders will appear after matches are played
            </p>
          </CardContent>
        </Card>
      );
    }

    const bgColor = type === "orange" 
      ? "from-orange-500 to-orange-600" 
      : type === "purple" 
        ? "from-purple-500 to-purple-600"
        : "from-emerald-500 to-emerald-600";

    const iconColor = type === "orange" 
      ? "text-orange-500" 
      : type === "purple" 
        ? "text-purple-500"
        : "text-emerald-500";

    const StatDisplay = ({ leader, index }: { leader: any; index: number }) => {
      const team = getTeam(leader.player?.teamId);
      const isTop3 = index < 3;

      return (
        <div 
          className={cn(
            "flex items-center gap-4 p-4 rounded-md",
            isTop3 ? "bg-muted/50" : ""
          )}
          data-testid={`leader-${type}-${index}`}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-display text-lg shrink-0",
            index === 0 && "bg-yellow-500 text-yellow-900",
            index === 1 && "bg-gray-300 text-gray-700",
            index === 2 && "bg-amber-700 text-amber-100",
            index > 2 && "bg-muted text-muted-foreground"
          )}>
            {index + 1}
          </div>

          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={leader.player?.photoUrl} alt={leader.player?.name} />
            <AvatarFallback>{leader.player?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{leader.player?.name || "Unknown"}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {team && (
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: team.primaryColor }}
                />
              )}
              <span className="truncate">{team?.shortName || "No Team"}</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            {type === "orange" && (
              <>
                <p className="font-display text-3xl text-orange-500">{leader.totalRuns}</p>
                <p className="text-xs text-muted-foreground">runs</p>
              </>
            )}
            {type === "purple" && (
              <>
                <p className="font-display text-3xl text-purple-500">{leader.totalWickets}</p>
                <p className="text-xs text-muted-foreground">wickets</p>
              </>
            )}
            {type === "mvp" && (
              <>
                <p className="font-display text-3xl text-emerald-500">{leader.mvpPoints}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </>
            )}
          </div>
        </div>
      );
    };

    const topLeader = leaders[0];
    const topTeam = getTeam(topLeader?.player?.teamId);

    return (
      <div className="space-y-6">
        {topLeader && (
          <Card className="overflow-hidden">
            <div className={cn("bg-gradient-to-r p-6 text-white", bgColor)}>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white/30">
                    <AvatarImage src={topLeader.player?.photoUrl} alt={topLeader.player?.name} />
                    <AvatarFallback className="text-2xl bg-white/20">
                      {topLeader.player?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-900" />
                  </div>
                </div>
                <div>
                  <Badge className="bg-white/20 text-white mb-2">
                    {type === "orange" ? "Orange Cap" : type === "purple" ? "Purple Cap" : "MVP"}
                  </Badge>
                  <h3 className="font-display text-4xl">{topLeader.player?.name}</h3>
                  <p className="text-white/80">{topTeam?.name || "No Team"}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-display text-6xl">
                    {type === "orange" 
                      ? topLeader.totalRuns 
                      : type === "purple" 
                        ? topLeader.totalWickets
                        : topLeader.mvpPoints}
                  </p>
                  <p className="text-white/80">
                    {type === "orange" ? "Runs" : type === "purple" ? "Wickets" : "Points"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-2">
            {leaders.slice(1).map((leader, i) => (
              <StatDisplay key={i + 1} leader={leader} index={i + 1} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Leaderboards</h1>
          <p className="text-muted-foreground">
            Top performers of the tournament
          </p>
        </div>

        <Tabs defaultValue="orange" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orange" className="gap-2" data-testid="tab-orange-cap">
              <Target className="w-4 h-4 text-orange-500" />
              Orange Cap
            </TabsTrigger>
            <TabsTrigger value="purple" className="gap-2" data-testid="tab-purple-cap">
              <CircleDot className="w-4 h-4 text-purple-500" />
              Purple Cap
            </TabsTrigger>
            <TabsTrigger value="mvp" className="gap-2" data-testid="tab-mvp">
              <Star className="w-4 h-4 text-emerald-500" />
              MVP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orange">
            <LeaderPodium leaders={orangeCap || []} type="orange" />
          </TabsContent>

          <TabsContent value="purple">
            <LeaderPodium leaders={purpleCap || []} type="purple" />
          </TabsContent>

          <TabsContent value="mvp">
            <LeaderPodium leaders={mvp || []} type="mvp" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
