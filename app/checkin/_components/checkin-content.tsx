"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Users, Search, CheckCircle, Circle, UserPlus, X, ChevronDown, ChevronUp } from "lucide-react";
import { PlayerCard } from "@/components/player-card";
import { PlayerWithAttendance } from "@/lib/types";

interface GuestPlayer {
  id: string;
  name: string;
  handicap: number;
  sessionDate: string;
}

export function CheckinContent() {
  const { data: session } = useSession() || {};
  const [players, setPlayers] = useState<PlayerWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null);
  const [updatingMyCheckin, setUpdatingMyCheckin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Guest player state
  const [guestPlayers, setGuestPlayers] = useState<GuestPlayer[]>([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestHandicap, setGuestHandicap] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [removingGuest, setRemovingGuest] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/players");
      const data = await res?.json?.();
      setPlayers(data ?? []);
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch("/api/guest-players");
      const data = await res?.json?.();
      setGuestPlayers(data ?? []);
    } catch (error) {
      console.error("Failed to fetch guest players:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchGuests();
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchPlayers();
      fetchGuests();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPlayers, fetchGuests]);

  const handleAddGuest = async () => {
    if (!guestName.trim() || guestHandicap === "") return;
    setAddingGuest(true);
    try {
      const res = await fetch("/api/guest-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName.trim(), handicap: Number(guestHandicap) }),
      });
      if (res.ok) {
        setGuestName("");
        setGuestHandicap("");
        setShowGuestForm(false);
        await fetchGuests();
      }
    } catch (error) {
      console.error("Failed to add guest:", error);
    } finally {
      setAddingGuest(false);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    setRemovingGuest(guestId);
    try {
      await fetch(`/api/guest-players/${guestId}`, { method: "DELETE" });
      await fetchGuests();
    } catch (error) {
      console.error("Failed to remove guest:", error);
    } finally {
      setRemovingGuest(null);
    }
  };

  const handleToggle = async (playerId: string, checkedIn: boolean) => {
    setUpdatingPlayer(playerId);

    // Optimistic update
    setPlayers((prev) =>
      (prev ?? []).map((p) =>
        p?.id === playerId ? { ...p, isCheckedIn: checkedIn } : p
      )
    );

    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, checkedIn }),
      });
    } catch (error) {
      console.error("Failed to update check-in:", error);
      // Revert on error
      fetchPlayers();
    } finally {
      setUpdatingPlayer(null);
    }
  };

  const filteredPlayers = (players ?? []).filter((p) =>
    (p?.name ?? "").toLowerCase().includes((searchQuery ?? "").toLowerCase())
  );

  const checkedInCount = (players ?? []).filter((p) => p?.isCheckedIn)?.length ?? 0;
  const guestCount = guestPlayers?.length ?? 0;
  const totalPlayingCount = checkedInCount + guestCount;

  // Find player matching logged-in user's name
  const userName = session?.user?.name ?? "";
  const myPlayer = (() => {
    if (!userName) return undefined;
    const sessionName = userName.toLowerCase().trim();
    const sessionParts = sessionName.split(/[,\s]+/).filter(Boolean);
    
    // First try exact match
    let match = (players ?? []).find((p) => 
      (p?.name ?? "").toLowerCase().trim() === sessionName
    );
    if (match) return match;
    
    // Then try matching where ALL parts of the user's name appear in player name
    // This prevents "Scott" alone from matching "Austin, Scott"
    match = (players ?? []).find((p) => {
      const playerName = (p?.name ?? "").toLowerCase();
      const playerParts = playerName.split(/[,\s]+/).filter(Boolean);
      
      // All session name parts must be found in player name parts
      const allSessionPartsMatch = sessionParts.every((sp) =>
        playerParts.some((pp) => pp === sp || pp.includes(sp) || sp.includes(pp))
      );
      
      // All player name parts must be found in session name parts  
      const allPlayerPartsMatch = playerParts.every((pp) =>
        sessionParts.some((sp) => sp === pp || sp.includes(pp) || pp.includes(sp))
      );
      
      return allSessionPartsMatch && allPlayerPartsMatch;
    });
    
    return match;
  })();

  const handleMyCheckin = async () => {
    if (!myPlayer) return;
    setUpdatingMyCheckin(true);
    const newCheckedIn = !myPlayer.isCheckedIn;
    
    // Optimistic update
    setPlayers((prev) =>
      (prev ?? []).map((p) =>
        p?.id === myPlayer.id ? { ...p, isCheckedIn: newCheckedIn } : p
      )
    );

    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: myPlayer.id, checkedIn: newCheckedIn }),
      });
    } catch (error) {
      console.error("Failed to update check-in:", error);
      fetchPlayers();
    } finally {
      setUpdatingMyCheckin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

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
            <h1 className="text-2xl md:text-3xl font-bold text-white">Player Check-in</h1>
            <p className="text-white/70">Tap to check in · Hold to remove</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchPlayers(true)}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </motion.button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-300" />
            <span className="text-white font-semibold">
              {checkedInCount} / {players?.length ?? 0} checked in
              {guestCount > 0 && (
                <span className="text-amber-300"> + {guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
              )}
            </span>
          </div>
          {(checkedInCount + guestCount) > 0 && (
            <div className="ml-auto text-white/60 text-sm">
              {totalPlayingCount} total playing
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Check-in Button for Current User */}
      {myPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMyCheckin}
            disabled={updatingMyCheckin}
            className={`w-full p-6 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg ${
              myPlayer.isCheckedIn
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-white/20 hover:bg-white/30 text-white border-2 border-dashed border-white/50"
            } disabled:opacity-50`}
          >
            {updatingMyCheckin ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : myPlayer.isCheckedIn ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <Circle className="w-8 h-8" />
            )}
            <div className="text-left">
              <div className="text-2xl font-bold">
                {myPlayer.isCheckedIn ? "You're Checked In!" : "Check Me In"}
              </div>
              <div className="text-sm opacity-80">
                {myPlayer.name} • Handicap: {myPlayer.handicap}
              </div>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Guest Players Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <button
          onClick={() => setShowGuestForm(!showGuestForm)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 transition-colors text-amber-200"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <span className="font-semibold">Guest Players</span>
            {guestCount > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {guestCount}
              </span>
            )}
          </div>
          {showGuestForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {showGuestForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                {/* Add Guest Form */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Handicap"
                    value={guestHandicap}
                    onChange={(e) => setGuestHandicap(e.target.value)}
                    step="0.1"
                    className="w-full sm:w-32 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddGuest}
                    disabled={addingGuest || !guestName.trim() || guestHandicap === ""}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {addingGuest ? "Adding..." : "Add Guest"}
                  </motion.button>
                </div>

                {/* Guest Player List */}
                {guestCount > 0 && (
                  <div className="space-y-2">
                    <p className="text-white/50 text-sm">Guests will be included in team generation and removed when the week is cleared.</p>
                    {guestPlayers.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-400/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-amber-300" />
                          </div>
                          <div>
                            <span className="text-white font-semibold">{guest.name}</span>
                            <span className="text-amber-200/60 text-sm ml-2">HC: {guest.handicap}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveGuest(guest.id)}
                          disabled={removingGuest === guest.id}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                          title="Remove guest"
                        >
                          {removingGuest === guest.id ? (
                            <div className="w-5 h-5 border-2 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {guestCount === 0 && (
                  <p className="text-white/40 text-sm text-center py-2">
                    No guests added yet. Guests are automatically removed when the week is cleared.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e?.target?.value ?? "")}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-green-400 transition-colors"
        />
      </motion.div>

      {/* Player List */}
      {(filteredPlayers?.length ?? 0) === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-white/70"
        >
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No players found. Import players from the Admin panel.</p>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {filteredPlayers.map((player, index) => (
            <motion.div
              key={player?.id ?? index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <PlayerCard
                player={player}
                onToggle={handleToggle}
                loading={updatingPlayer === player?.id}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
