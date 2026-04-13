"use client";

import { motion } from "framer-motion";
import { Check, User, TrendingUp, Trash2 } from "lucide-react";
import { PlayerWithAttendance } from "@/lib/types";

interface PlayerCardProps {
  player: PlayerWithAttendance;
  onToggle: (playerId: string, checked: boolean) => void;
  loading?: boolean;
  showDelete?: boolean;
  onDelete?: (playerId: string, playerName: string) => void;
}

export function PlayerCard({ player, onToggle, loading, showDelete, onDelete }: PlayerCardProps) {
  const attendanceLevel =
    (player?.attendanceCount ?? 0) >= 7
      ? "high"
      : (player?.attendanceCount ?? 0) >= 4
      ? "medium"
      : "low";

  const attendanceColor = {
    high: "text-green-300",
    medium: "text-yellow-500",
    low: "text-gray-400",
  }[attendanceLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 rounded-xl shadow-lg transition-all cursor-pointer ${
        player?.isCheckedIn
          ? "bg-green-500/30 border-2 border-green-400"
          : "bg-white/10 border-2 border-transparent hover:border-white/30"
      }`}
      onClick={() => !loading && onToggle(player?.id ?? "", !player?.isCheckedIn)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              player?.isCheckedIn ? "bg-green-500" : "bg-white/20"
            }`}
          >
            {player?.isCheckedIn ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <User className="w-5 h-5 text-white/70" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{player?.name ?? "Unknown"}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/70">HC: {player?.handicap ?? 0}</span>
              {player?.overrideTier && (
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-medium">
                  Tier {player.overrideTier}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-1 ${attendanceColor}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{player?.attendanceCount ?? 0}/10</span>
            </div>
            <span className="text-xs text-white/50">weeks</span>
          </div>
          {showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(player?.id ?? "", player?.name ?? "Unknown");
              }}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
              title="Delete player"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  );
}
