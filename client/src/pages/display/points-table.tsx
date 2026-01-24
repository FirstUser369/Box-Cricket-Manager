import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team, PointsTable } from "@shared/schema";

interface TeamWithPoints extends Team {
  pointsData?: PointsTable;
}

export default function PointsTableDisplay() {
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 30000, // Teams rarely change
  });

  const { data: pointsTable } = useQuery<PointsTable[]>({
    queryKey: ["/api/points-table"],
    refetchInterval: 15000, // Points update after matches
  });

  const teamsWithPoints: TeamWithPoints[] = (teams || []).map(team => ({
    ...team,
    pointsData: pointsTable?.find(p => p.teamId === team.id),
  }));

  const groups = ["A", "B", "C", "D"];
  
  const getGroupTeams = (groupName: string) => {
    return teamsWithPoints
      .filter(t => t.groupName === groupName)
      .sort((a, b) => {
        const aPoints = a.pointsData?.points || 0;
        const bPoints = b.pointsData?.points || 0;
        if (bPoints !== aPoints) return bPoints - aPoints;
        const aNrr = parseFloat(a.pointsData?.nrr || "0");
        const bNrr = parseFloat(b.pointsData?.nrr || "0");
        return bNrr - aNrr;
      });
  };

  const getNrrColor = (nrr: string) => {
    const value = parseFloat(nrr);
    if (value > 0) return "text-emerald-400";
    if (value < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getNrrIcon = (nrr: string) => {
    const value = parseFloat(nrr);
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      <div className="absolute inset-0 auction-spotlight opacity-20" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="font-display text-5xl text-glow-gold">POINTS TABLE</h1>
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <p className="text-gray-400">Win: 3 pts | Draw: 1 pt | Loss: 0 pts</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((groupName, groupIndex) => {
            const groupTeams = getGroupTeams(groupName);
            if (groupTeams.length === 0) return null;

            return (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, x: groupIndex % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-600/30 to-orange-500/30 border-b border-white/10">
                    <CardTitle className="font-display text-2xl text-center">
                      GROUP {groupName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                          <th className="text-left py-3 px-4">#</th>
                          <th className="text-left py-3 px-4">Team</th>
                          <th className="text-center py-3 px-2">P</th>
                          <th className="text-center py-3 px-2">W</th>
                          <th className="text-center py-3 px-2">L</th>
                          <th className="text-center py-3 px-2">D</th>
                          <th className="text-center py-3 px-2">NRR</th>
                          <th className="text-center py-3 px-4">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupTeams.map((team, index) => {
                          const pts = team.pointsData;
                          const isQualified = index < 2;
                          
                          return (
                            <motion.tr
                              key={team.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className={`border-b border-white/5 ${isQualified ? 'bg-emerald-500/10' : ''}`}
                            >
                              <td className="py-3 px-4">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${isQualified ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: team.primaryColor }}
                                  >
                                    {team.shortName?.substring(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white">{team.shortName}</div>
                                    <div className="text-xs text-gray-500">{team.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center py-3 px-2 text-gray-300">
                                {pts?.played || 0}
                              </td>
                              <td className="text-center py-3 px-2 text-emerald-400 font-semibold">
                                {pts?.won || 0}
                              </td>
                              <td className="text-center py-3 px-2 text-red-400">
                                {pts?.lost || 0}
                              </td>
                              <td className="text-center py-3 px-2 text-gray-400">
                                {pts?.tied || 0}
                              </td>
                              <td className="text-center py-3 px-2">
                                <div className={`flex items-center justify-center gap-1 ${getNrrColor(pts?.nrr || "0")}`}>
                                  {getNrrIcon(pts?.nrr || "0")}
                                  <span className="font-mono text-sm">
                                    {parseFloat(pts?.nrr || "0") > 0 ? '+' : ''}{pts?.nrr || "0.000"}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className="text-xl font-display text-yellow-400">
                                  {pts?.points || 0}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center gap-8 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500" />
            <span>Qualified for Playoffs</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
