"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Download,
  Zap,
  Users,
  CheckCircle,
  AlertCircle,
  Trophy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  UserCog,
  Edit,
  Key,
  X,
  Save,
} from "lucide-react";
import { PlayerWithAttendance, TeamsData } from "@/lib/types";
import { PlayerCard } from "@/components/player-card";
import { TeamCard } from "@/components/team-card";

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminContent() {
  const [players, setPlayers] = useState<PlayerWithAttendance[]>([]);
  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"checkin" | "teams" | "manage" | "users">("checkin");
  const [deletingPlayer, setDeletingPlayer] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", name: "", newPassword: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  // Last cleared state
  const [lastCleared, setLastCleared] = useState<string | null>(null);
  
  // Team count selector
  const [selectedTeamCount, setSelectedTeamCount] = useState<number | "auto">("auto");

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res?.json?.();
      setPlayers(data ?? []);
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/generate-teams");
      const data = await res?.json?.();
      setTeamsData(data ?? null);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res?.json?.();
      setUsers(data ?? []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const fetchLastCleared = useCallback(async () => {
    try {
      const res = await fetch("/api/clear-checkins");
      const data = await res?.json?.();
      setLastCleared(data?.lastCleared || null);
    } catch (error) {
      console.error("Failed to fetch last cleared:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
    fetchUsers();
    fetchLastCleared();
    const interval = setInterval(() => {
      fetchPlayers();
      fetchTeams();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPlayers, fetchTeams, fetchUsers, fetchLastCleared]);

  const handleImport = async () => {
    setImporting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/import-sheets", { method: "POST" });
      const data = await res?.json?.();

      if (res?.ok) {
        setMessage({
          type: "success",
          text: `Imported ${data?.imported ?? 0} new, updated ${data?.updated ?? 0} existing players`,
        });
        fetchPlayers();
      } else {
        setMessage({ type: "error", text: data?.error ?? "Import failed" });
      }
    } catch (error) {
      console.error("Import failed:", error);
      setMessage({ type: "error", text: "Failed to import from Google Sheets" });
    } finally {
      setImporting(false);
    }
  };

  const handleGenerateTeams = async () => {
    setGenerating(true);
    setMessage(null);

    try {
      const body = selectedTeamCount !== "auto" ? { numTeams: selectedTeamCount } : undefined;
      const res = await fetch("/api/generate-teams", { 
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res?.json?.();

      if (res?.ok) {
        setTeamsData(data ?? null);
        setMessage({ type: "success", text: `Generated ${data?.teams?.length ?? 0} teams!` });
        setActiveTab("teams");
      } else {
        setMessage({ type: "error", text: data?.error ?? "Team generation failed" });
      }
    } catch (error) {
      console.error("Team generation failed:", error);
      setMessage({ type: "error", text: "Failed to generate teams" });
    } finally {
      setGenerating(false);
    }
  };

  const handleClearWeek = async () => {
    if (!confirm("Clear all check-ins and teams for today? This will reset everything for the new week.")) {
      return;
    }
    
    setClearing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/clear-checkins", { method: "POST" });
      const data = await res?.json?.();

      if (res?.ok) {
        setMessage({ type: "success", text: data?.message ?? "Week cleared!" });
        setTeamsData(null);
        setLastCleared(new Date().toISOString());
        fetchPlayers();
      } else {
        setMessage({ type: "error", text: data?.error ?? "Failed to clear" });
      }
    } catch (error) {
      console.error("Clear failed:", error);
      setMessage({ type: "error", text: "Failed to clear check-ins" });
    } finally {
      setClearing(false);
    }
  };

  const handleToggle = async (playerId: string, checkedIn: boolean) => {
    setUpdatingPlayer(playerId);

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
      fetchPlayers();
    } finally {
      setUpdatingPlayer(null);
    }
  };

  const checkedInCount = (players ?? []).filter((p) => p?.isCheckedIn)?.length ?? 0;

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${playerName}"? This cannot be undone.`)) {
      return;
    }
    
    setDeletingPlayer(playerId);
    setMessage(null);

    try {
      const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
      const data = await res?.json?.();

      if (res?.ok) {
        setMessage({ type: "success", text: `${playerName} has been deleted` });
        setPlayers((prev) => (prev ?? []).filter((p) => p?.id !== playerId));
      } else {
        setMessage({ type: "error", text: data?.error ?? "Failed to delete player" });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({ type: "error", text: "Failed to delete player" });
    } finally {
      setDeletingPlayer(null);
    }
  };

  const startEditingUser = (user: AppUser) => {
    setEditingUser(user.id);
    setEditForm({ email: user.email, name: user.name ?? "", newPassword: "" });
  };

  const cancelEditingUser = () => {
    setEditingUser(null);
    setEditForm({ email: "", name: "", newPassword: "" });
  };

  const handleSaveUser = async (userId: string) => {
    setSavingUser(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editForm.email || undefined,
          name: editForm.name || undefined,
          newPassword: editForm.newPassword || undefined,
        }),
      });
      const data = await res?.json?.();

      if (res?.ok) {
        setMessage({ type: "success", text: data?.message ?? "User updated" });
        setUsers((prev) =>
          (prev ?? []).map((u) =>
            u.id === userId ? { ...u, email: editForm.email, name: editForm.name } : u
          )
        );
        cancelEditingUser();
      } else {
        setMessage({ type: "error", text: data?.error ?? "Failed to update user" });
      }
    } catch (error) {
      console.error("Update failed:", error);
      setMessage({ type: "error", text: "Failed to update user" });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? They will need to sign up again.`)) {
      return;
    }

    setDeletingUser(userId);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res?.json?.();

      if (res?.ok) {
        setMessage({ type: "success", text: `${userName} has been deleted` });
        setUsers((prev) => (prev ?? []).filter((u) => u.id !== userId));
      } else {
        setMessage({ type: "error", text: data?.error ?? "Failed to delete user" });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({ type: "error", text: "Failed to delete user" });
    } finally {
      setDeletingUser(null);
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
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-white/70">Manage players, check-ins, and generate teams</p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
      >
        <ActionButton
          icon={<Download className="w-5 h-5" />}
          label="Import Sheet"
          onClick={handleImport}
          loading={importing}
          color="blue"
        />
        <div className="flex flex-col gap-2">
          <ActionButton
            icon={<Zap className="w-5 h-5" />}
            label="Generate Teams"
            onClick={handleGenerateTeams}
            loading={generating}
            color="green"
            disabled={checkedInCount < 3}
          />
          <select
            value={selectedTeamCount}
            onChange={(e) => setSelectedTeamCount(e.target.value === "auto" ? "auto" : parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-green-400"
          >
            <option value="auto" className="bg-gray-800">Auto (max 5/team)</option>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n} className="bg-gray-800">{n} Teams</option>
            ))}
          </select>
        </div>
        <ActionButton
          icon={<RefreshCw className="w-5 h-5" />}
          label="Refresh"
          onClick={() => {
            fetchPlayers();
            fetchTeams();
          }}
          color="gray"
        />
        <div className="p-4 rounded-xl bg-white/10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{checkedInCount}</div>
            <div className="text-xs text-white/70">Checked In</div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Controls Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Advanced Controls
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-red-200/80 text-sm mb-3">
              ⚠️ This will clear all check-ins and teams for today. Use at the start of a new week.
            </p>
            <ActionButton
              icon={<Trash2 className="w-5 h-5" />}
              label="Clear Week"
              onClick={handleClearWeek}
              loading={clearing}
              color="red"
            />
            {lastCleared && (
              <p className="text-white/50 text-xs mt-3">
                Last cleared: {new Date(lastCleared).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
            message?.type === "success" ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
          }`}
        >
          {message?.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message?.text ?? ""}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={activeTab === "checkin"}
          onClick={() => setActiveTab("checkin")}
          icon={<Users className="w-4 h-4" />}
          label="Check-ins"
        />
        <TabButton
          active={activeTab === "teams"}
          onClick={() => setActiveTab("teams")}
          icon={<Trophy className="w-4 h-4" />}
          label="Teams"
        />
        <TabButton
          active={activeTab === "manage"}
          onClick={() => setActiveTab("manage")}
          icon={<Settings className="w-4 h-4" />}
          label="Manage Players"
        />
        <TabButton
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          icon={<UserCog className="w-4 h-4" />}
          label="Manage Users"
        />
      </div>

      {/* Content */}
      {activeTab === "checkin" && (
        <div className="grid gap-3">
          {(players ?? []).map((player, index) => (
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
          {(players?.length ?? 0) === 0 && (
            <div className="text-center py-12 text-white/70">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No players yet. Click "Import Sheet" to get started.</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === "teams" && (
        <div>
          {(teamsData?.teams?.length ?? 0) > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {(teamsData?.teams ?? []).map((team, index) => (
                <TeamCard key={team?.id ?? index} team={team} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No teams generated yet. Check in players and click "Generate Teams".</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === "manage" && (
        <div>
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-200/80 text-sm">
              ⚠️ Deleting a player is permanent and cannot be undone. Use this to remove players who have moved away.
            </p>
          </div>
          <div className="grid gap-3">
            {(players ?? []).map((player, index) => (
              <motion.div
                key={player?.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <PlayerCard
                  player={player}
                  onToggle={handleToggle}
                  loading={deletingPlayer === player?.id}
                  showDelete={true}
                  onDelete={handleDeletePlayer}
                />
              </motion.div>
            ))}
            {(players?.length ?? 0) === 0 && (
              <div className="text-center py-12 text-white/70">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No players to manage.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-200/80 text-sm">
              Manage registered user accounts. Edit email addresses, names, or reset passwords.
            </p>
          </div>
          <div className="grid gap-3">
            {(users ?? []).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 rounded-xl bg-white/10"
              >
                {editingUser === user.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        placeholder="User name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">New Password (leave empty to keep current)</label>
                      <input
                        type="password"
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        placeholder="New password"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSaveUser(user.id)}
                        disabled={savingUser}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-200 transition-colors disabled:opacity-50"
                      >
                        {savingUser ? (
                          <div className="w-4 h-4 border-2 border-current/50 border-t-current rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEditingUser}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{user.name ?? "No name"}</h3>
                      <p className="text-white/70 text-sm">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditingUser(user)}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-200 transition-all"
                        title="Edit user"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name ?? user.email)}
                        disabled={deletingUser === user.id}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                        title="Delete user"
                      >
                        {deletingUser === user.id ? (
                          <div className="w-5 h-5 border-2 border-current/50 border-t-current rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            {(users?.length ?? 0) === 0 && (
              <div className="text-center py-12 text-white/70">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No registered users yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  loading,
  color,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  color: "blue" | "green" | "gray" | "red";
  disabled?: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200",
    green: "bg-green-500/20 hover:bg-green-500/30 text-green-200",
    gray: "bg-white/10 hover:bg-white/20 text-white",
    red: "bg-red-500/20 hover:bg-red-500/30 text-red-200",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses?.[color] ?? colorClasses.gray}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current/50 border-t-current rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? "bg-white/20 text-white"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
