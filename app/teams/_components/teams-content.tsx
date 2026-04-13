"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trophy, Share2, Clock } from "lucide-react";
import { TeamCard } from "@/components/team-card";
import { TeamsData } from "@/lib/types";
import { format } from "date-fns";

export function TeamsContent() {
  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeams = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/generate-teams");
      const data = await res?.json?.();
      setTeamsData(data ?? null);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    // Poll every 30 seconds
    const interval = setInterval(() => fetchTeams(), 30000);
    return () => clearInterval(interval);
  }, [fetchTeams]);

  const handleShare = async () => {
    if (!teamsData?.teams?.length) return;

    const teamsText = (teamsData?.teams ?? []).map((team) => {
      const playersList = (team?.players ?? []).map(
        (p) => `  ${p?.tier ?? "?"}: ${p?.name ?? "Unknown"} (HC: ${p?.handicap ?? 0})`
      ).join("\n");
      return `Team ${team?.id ?? 0} (Avg: ${team?.averageHandicap ?? 0}):\n${playersList}`;
    }).join("\n\n");

    const shareText = `LV Team Builder - ${format(new Date(), "MMMM d, yyyy")}\n\n${teamsText}`;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: "LV Team Builder - Today's Teams",
          text: shareText,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator?.clipboard?.writeText?.(shareText);
        alert("Teams copied to clipboard!");
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const hasTeams = (teamsData?.teams?.length ?? 0) > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Today's Teams</h1>
            {hasTeams && teamsData?.generatedAt && (
              <div className="flex items-center gap-2 text-white/70 mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Generated {format(new Date(teamsData.generatedAt), "h:mm a")}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasTeams && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchTeams(true)}
              disabled={refreshing}
              className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Teams Grid */}
      {!hasTeams ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h2 className="text-xl font-semibold text-white mb-2">No Teams Yet</h2>
          <p className="text-white/70 max-w-md mx-auto">
            Teams haven't been generated for today. Check back once an admin generates the teams.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {(teamsData?.teams ?? []).map((team, index) => (
            <TeamCard key={team?.id ?? index} team={team} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
