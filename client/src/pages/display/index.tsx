import { Link } from "wouter";
import { motion } from "framer-motion";
import { Gavel, Play, Trophy, Monitor, UserPlus, Table } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const displayOptions = [
  {
    href: "/display/register",
    title: "Player Registration",
    description: "Register as a player for the tournament with QR code support",
    icon: UserPlus,
    gradient: "from-blue-600 to-purple-500",
  },
  {
    href: "/display/auction",
    title: "Auction Display",
    description: "Full-screen live auction broadcast with player reveals and sold celebrations",
    icon: Gavel,
    gradient: "from-purple-600 to-orange-500",
  },
  {
    href: "/display/match",
    title: "Match Display",
    description: "Live scorecard with ball-by-ball updates and cricket event animations",
    icon: Play,
    gradient: "from-emerald-600 to-cyan-500",
  },
  {
    href: "/display/points-table",
    title: "Points Table",
    description: "Group-wise standings with NRR, wins, losses, and qualification status",
    icon: Table,
    gradient: "from-indigo-600 to-blue-500",
  },
  {
    href: "/display/leaderboard",
    title: "Leaderboard Display",
    description: "Orange Cap, Purple Cap, and MVP leaderboards",
    icon: Trophy,
    gradient: "from-yellow-500 to-red-500",
  },
];

export default function DisplayIndex() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="absolute inset-0 auction-spotlight opacity-30" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-6">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-5xl text-glow-purple mb-4">BROADCAST DISPLAYS</h1>
          <p className="text-xl text-gray-400">Select a display mode for your screens</p>
        </motion.div>

        <div className="grid gap-6">
          {displayOptions.map((option, i) => (
            <motion.div
              key={option.href}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={option.href}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-6 p-6">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <option.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-display text-2xl text-white mb-2">{option.title}</h2>
                        <p className="text-gray-400">{option.description}</p>
                      </div>
                      <div className="text-gray-500 group-hover:text-white transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          Display Mode for Screencasting
        </motion.div>
      </div>
    </div>
  );
}
