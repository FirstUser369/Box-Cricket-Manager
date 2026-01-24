import { Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Team, Player } from "@/../../shared/schema";

interface TeamCardProps {
  team: Team;
  players?: Player[];
  onClick?: () => void;
}

export function TeamCard({ team, players = [], onClick }: TeamCardProps) {
  const squadCount = players.length;
  const minSquadSize = 8;
  const maxSquadSize = 9;
  const budgetUsed = team.budget - team.remainingBudget;
  const budgetPercentage = (budgetUsed / team.budget) * 100;

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer transition-all"
      onClick={onClick}
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
              className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display text-xl"
              style={{ backgroundColor: team.primaryColor }}
            >
              {team.shortName}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{team.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{squadCount}/{maxSquadSize} players</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
          
          {squadCount < minSquadSize && (
            <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-500/10">
              Need {minSquadSize - squadCount} more
            </Badge>
          )}
          
          {squadCount >= minSquadSize && squadCount < maxSquadSize && (
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">
              Squad Ready ({maxSquadSize - squadCount} slot left)
            </Badge>
          )}
          
          {squadCount >= maxSquadSize && (
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              Squad Full
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
