"use client";

import { useState, useRef, useCallback } from "react";
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

const LONG_PRESS_MS = 600;

export function PlayerCard({ player, onToggle, loading, showDelete, onDelete }: PlayerCardProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLongPress = useRef(false);

  const attendanceLevel =
    (player?.attendanceCount ?? 0) >= 7 ? "high"
    : (player?.attendanceCount ?? 0) >= 4 ? "medium"
    : "low";

  const attendanceColor = {
    high: "text-green-300",
    medium: "text-yellow-500",
    low: "text-gray-400",
  }[attendanceLevel];

  const cancelHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    holdTimer.current = null;
    progressTimer.current = null;
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (loading || !player?.isCheckedIn) return;
    didLongPress.current = false;
    const startTime = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(Math.min((elapsed / LONG_PRESS_MS) * 100, 100));
    }, 16);
    holdTimer.current = setTimeout(() => {
      didLongPress.current = true;
      cancelHold();
      onToggle(player?.id ?? "", false);
    }, LONG_PRESS_MS);
  }, [loading, player, cancelHold, onToggle]);

  const handleClick = useCallback(() => {
    if (didLongPress.current) { didLongPress.current = false; return; }
    if (loading) return;
    if (!player?.isCheckedIn) {
      onToggle(player?.id ?? "", true);
    }
  }, [loading, player, onToggle]);

  const RADIUS = 22;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (holdProgress / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 rounded-xl shadow-lg transition-all cursor-pointer select-none ${
        player?.isCheckedIn
          ? "bg-green-500/30 border-2 border-green-400"
          : "bg-white/10 border-2 border-transparent hover:border-white/30"
      }`}
      onClick={handleClick}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchMove={cancelHold}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with long-press progress ring */}
          <div className="relative w-10 h-10 flex-shrink-0">
            {player?.isCheckedIn && holdProgress > 0 && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 48 48"
              >
                <circle
                  cx="24" cy="24" r={RADIUS}
                  fill="none"
                  stroke="rgba(239,68,68,0.9)"
                  strokeWidth="4"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              player?.isCheckedIn ? "bg-green-500" : "bg-white/20"
            }`}>
              {player?.isCheckedIn
                ? <Check className="w-5 h-5 text-white" />
                : <User className="w-5 h-5 text-white/70" />}
            </div>
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
            {player?.isCheckedIn && (
              <span className="text-white/40 text-xs">
                {holdProgress > 0 ? "Keep holding to remove…" : "Hold to remove"}
              </span>
            )}
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
