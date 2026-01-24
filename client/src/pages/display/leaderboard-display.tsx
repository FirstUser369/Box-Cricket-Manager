import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Target, Star, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OrangeCapLeader, PurpleCapLeader, MVPLeader, Team } from "@shared/schema";

export default function LeaderboardDisplay() {
  const { data: orangeCapLeaders } = useQuery<OrangeCapLeader[]>({
    queryKey: ["/api/leaderboards/orange-cap"],
    refetchInterval: 15000, // Leaderboards update after matches
  });

  const { data: purpleCapLeaders } = useQuery<PurpleCapLeader[]>({
    queryKey: ["/api/leaderboards/purple-cap"],
    refetchInterval: 15000,
  });

  const { data: mvpLeaders } = useQuery<MVPLeader[]>({
    queryKey: ["/api/leaderboards/mvp"],
    refetchInterval: 15000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const getTeam = (teamId: string | null) => teams?.find(t => t.id === teamId);

  const topOrange = orangeCapLeaders?.slice(0, 5) || [];
  const topPurple = purpleCapLeaders?.slice(0, 5) || [];
  const topMVP = mvpLeaders?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      <div className="absolute inset-0 stadium-spotlight opacity-20" />

      <div className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-white/10 z-40">
        <div className="flex items-center justify-center px-6 py-4">
          <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
          <h1 className="font-display text-3xl tracking-wide">BCL LEADERBOARDS</h1>
        </div>
      </div>

      <div className="pt-24 px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-orange-500/20 to-transparent rounded-3xl border border-orange-500/30 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="font-display text-3xl text-white">ORANGE CAP</h2>
                <p className="text-white/80">Top Run Scorers</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {topOrange.length > 0 ? (
                topOrange.map((leader, i) => {
                  const team = getTeam(leader.player?.teamId || null);
                  return (
                    <motion.div
                      key={leader.player?.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-orange-500/30 border border-orange-500/50' : 'bg-white/5'}`}
                    >
                      <span className={`font-display text-3xl ${i === 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                        #{i + 1}
                      </span>
                      <Avatar className="w-14 h-14 border-2" style={{ borderColor: team?.primaryColor }}>
                        <AvatarImage src={leader.player?.photoUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-yellow-500">
                          {(leader.player?.name || "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-lg">{leader.player?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-400">{team?.shortName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-4xl text-orange-400">{leader.totalRuns}</p>
                        <p className="text-xs text-gray-500">{leader.matches} matches</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data yet</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-b from-purple-500/20 to-transparent rounded-3xl border border-purple-500/30 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="font-display text-3xl text-white">PURPLE CAP</h2>
                <p className="text-white/80">Top Wicket Takers</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {topPurple.length > 0 ? (
                topPurple.map((leader, i) => {
                  const team = getTeam(leader.player?.teamId || null);
                  return (
                    <motion.div
                      key={leader.player?.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-purple-500/30 border border-purple-500/50' : 'bg-white/5'}`}
                    >
                      <span className={`font-display text-3xl ${i === 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                        #{i + 1}
                      </span>
                      <Avatar className="w-14 h-14 border-2" style={{ borderColor: team?.primaryColor }}>
                        <AvatarImage src={leader.player?.photoUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                          {(leader.player?.name || "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-lg">{leader.player?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-400">{team?.shortName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-4xl text-purple-400">{leader.totalWickets}</p>
                        <p className="text-xs text-gray-500">{leader.matches} matches</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data yet</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-b from-yellow-500/20 to-transparent rounded-3xl border border-yellow-500/30 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-600 to-amber-400 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="font-display text-3xl text-white">MVP</h2>
                <p className="text-white/80">Most Valuable Players</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {topMVP.length > 0 ? (
                topMVP.map((leader, i) => {
                  const team = getTeam(leader.player?.teamId || null);
                  return (
                    <motion.div
                      key={leader.player?.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-yellow-500/30 border border-yellow-500/50' : 'bg-white/5'}`}
                    >
                      <span className={`font-display text-3xl ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        #{i + 1}
                      </span>
                      <Avatar className="w-14 h-14 border-2" style={{ borderColor: team?.primaryColor }}>
                        <AvatarImage src={leader.player?.photoUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500">
                          {(leader.player?.name || "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-lg">{leader.player?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-400">{team?.shortName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-4xl text-yellow-400">{leader.mvpPoints}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
