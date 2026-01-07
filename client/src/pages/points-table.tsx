import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { PointsTable, Team } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function PointsTablePage() {
  const { data: pointsTable, isLoading: pointsLoading } = useQuery<PointsTable[]>({
    queryKey: ["/api/points-table"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const getTeam = (teamId: string) => teams?.find(t => t.id === teamId);

  const sortedTable = pointsTable?.sort((a, b) => {
    if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
    return parseFloat(b.nrr || "0") - parseFloat(a.nrr || "0");
  }) || [];

  if (pointsLoading) {
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Points Table</h1>
          <p className="text-muted-foreground">
            Team standings and net run rate
          </p>
        </div>

        {sortedTable.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Standings Yet</h3>
              <p className="text-muted-foreground text-sm">
                Points table will be updated as matches are played
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center sticky left-0 bg-card">#</TableHead>
                      <TableHead className="sticky left-12 bg-card min-w-[180px]">Team</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">T</TableHead>
                      <TableHead className="text-center font-semibold">Pts</TableHead>
                      <TableHead className="text-center min-w-[100px]">NRR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTable.map((entry, index) => {
                      const team = getTeam(entry.teamId);
                      const nrrValue = parseFloat(entry.nrr || "0");
                      const isPositiveNRR = nrrValue > 0;
                      const isNegativeNRR = nrrValue < 0;

                      return (
                        <TableRow 
                          key={entry.id}
                          className={cn(
                            index < 4 && "bg-emerald-500/5"
                          )}
                          data-testid={`points-row-${entry.teamId}`}
                        >
                          <TableCell className="text-center font-display text-xl sticky left-0 bg-inherit">
                            {index + 1}
                          </TableCell>
                          <TableCell className="sticky left-12 bg-inherit">
                            <div className="flex items-center gap-3">
                              {team && (
                                <div 
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-white font-display text-xs shrink-0"
                                  style={{ backgroundColor: team.primaryColor }}
                                >
                                  {team.shortName}
                                </div>
                              )}
                              <span className="font-medium truncate">{team?.name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{entry.played}</TableCell>
                          <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            {entry.won}
                          </TableCell>
                          <TableCell className="text-center text-destructive font-medium">
                            {entry.lost}
                          </TableCell>
                          <TableCell className="text-center">{entry.tied}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-display text-2xl">{entry.points}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1 font-mono",
                              isPositiveNRR && "text-emerald-600 dark:text-emerald-400",
                              isNegativeNRR && "text-destructive"
                            )}>
                              {isPositiveNRR && <TrendingUp className="w-4 h-4" />}
                              {isNegativeNRR && <TrendingDown className="w-4 h-4" />}
                              {!isPositiveNRR && !isNegativeNRR && <Minus className="w-4 h-4 text-muted-foreground" />}
                              {isPositiveNRR ? "+" : ""}{nrrValue.toFixed(3)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground justify-center">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
            Playoff qualification zone
          </span>
        </div>
      </div>
    </div>
  );
}
