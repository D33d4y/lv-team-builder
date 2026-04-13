"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Team } from "@/lib/types";

const tierColors: Record<string, string> = {
  A: "bg-red-600 text-white border-red-500",
  B: "bg-blue-600 text-white border-blue-500",
  C: "bg-amber-600 text-white border-amber-500",
  D: "bg-purple-600 text-white border-purple-500",
};

interface TeamCardProps {
  team: Team;
  index: number;
}

export function TeamCard({ team, index }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Team {team?.id ?? 0}</h3>
            <p className="text-green-300 text-sm">
              {team?.players?.length ?? 0} players
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{team?.averageHandicap ?? 0}</div>
          <div className="text-xs text-white/50">Avg HC</div>
        </div>
      </div>

      <div className="space-y-2">
        {(team?.players ?? []).map((player, idx) => (
          <motion.div
            key={player?.id ?? idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + idx * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-bold border ${
                  tierColors?.[player?.tier ?? "D"] ?? tierColors.D
                }`}
              >
                {player?.tier ?? "?"}
              </span>
              <span className="text-white font-medium">{player?.name ?? "Unknown"}</span>
            </div>
            <span className="text-white/70 text-sm">HC: {player?.handicap ?? 0}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
