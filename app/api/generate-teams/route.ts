export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, format } from "date-fns";
import { Team, TeamPlayer, TeamsData } from "@/lib/types";

function assignTiers(
  players: { id: string; name: string; handicap: number; overrideTier: string | null }[]
): TeamPlayer[] {
  // Sort by handicap (lowest first = best players)
  const sorted = [...players].sort((a, b) => (a?.handicap ?? 0) - (b?.handicap ?? 0));
  const count = sorted?.length ?? 0;

  // Calculate quartile sizes
  const quarterSize = Math.floor(count / 4);
  const remainder = count % 4;

  // Distribute remainder: A gets extra first, then B, C, D
  const sizes = [quarterSize, quarterSize, quarterSize, quarterSize];
  for (let i = 0; i < remainder; i++) {
    sizes[i]++;
  }

  const tiers = ["A", "B", "C", "D"];
  const tieredPlayers: TeamPlayer[] = [];
  let idx = 0;

  for (let t = 0; t < 4; t++) {
    for (let i = 0; i < (sizes?.[t] ?? 0); i++) {
      const player = sorted?.[idx];
      if (player) {
        const assignedTier = player?.overrideTier || tiers?.[t] || "D";
        tieredPlayers.push({
          id: player?.id ?? "",
          name: player?.name ?? "",
          handicap: player?.handicap ?? 0,
          tier: assignedTier,
        });
      }
      idx++;
    }
  }

  return tieredPlayers;
}

function generateTeams(players: TeamPlayer[], requestedTeams?: number): Team[] {
  const count = players?.length ?? 0;
  if (count < 3) return [];

  // Maximum 5 players per team - calculate minimum teams needed
  const MAX_PLAYERS_PER_TEAM = 5;
  const minTeams = Math.ceil(count / MAX_PLAYERS_PER_TEAM);
  
  // Use requested number of teams if valid, otherwise use minimum
  const numTeams = requestedTeams && requestedTeams >= minTeams ? requestedTeams : minTeams;

  // Initialize teams
  const teams: Team[] = [];
  for (let i = 0; i < numTeams; i++) {
    teams.push({
      id: i + 1,
      players: [],
      averageHandicap: 0,
    });
  }

  // Sort all players by handicap (best to worst) - tier labels preserved
  const sortedPlayers = [...players].sort((a, b) => (a?.handicap ?? 0) - (b?.handicap ?? 0));

  // True snake draft across ALL players as one continuous sequence
  // Position 0-4: Teams 0,1,2,3,4
  // Position 5-9: Teams 4,3,2,1,0
  // Position 10-14: Teams 0,1,2,3,4
  // etc.
  for (let i = 0; i < sortedPlayers.length; i++) {
    const cycle = Math.floor(i / numTeams);
    const posInCycle = i % numTeams;
    
    // Even cycles go forward (0→n-1), odd cycles go backward (n-1→0)
    const teamIndex = cycle % 2 === 0 
      ? posInCycle 
      : (numTeams - 1 - posInCycle);
    
    teams[teamIndex].players.push(sortedPlayers[i]);
  }

  // Calculate average handicaps
  for (const team of teams) {
    if ((team?.players?.length ?? 0) > 0) {
      const sum = (team?.players ?? []).reduce((acc, p) => acc + (p?.handicap ?? 0), 0);
      team.averageHandicap = Math.round((sum / (team?.players?.length ?? 1)) * 10) / 10;
    }
  }

  return teams;
}

export async function POST(req: NextRequest) {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    // Parse request body for optional numTeams
    let requestedTeams: number | undefined;
    try {
      const body = await req.json();
      if (body?.numTeams && typeof body.numTeams === "number") {
        requestedTeams = body.numTeams;
      }
    } catch {
      // No body or invalid JSON, use auto calculation
    }

    // Get checked-in players
    const checkedInPlayers = await prisma.attendance.findMany({
      where: {
        sessionDate: new Date(todayStr),
        checkedIn: true,
      },
      include: {
        player: true,
      },
    });

    const players = (checkedInPlayers ?? []).map((a) => ({
      id: a?.player?.id ?? "",
      name: a?.player?.name ?? "",
      handicap: a?.player?.handicap ?? 0,
      overrideTier: a?.player?.overrideTier ?? null,
    }));

    // Include guest players for today
    const guestPlayers = await prisma.guestPlayer.findMany({
      where: { sessionDate: new Date(todayStr) },
    });

    for (const guest of guestPlayers ?? []) {
      players.push({
        id: `guest-${guest.id}`,
        name: `${guest.name} (Guest)`,
        handicap: guest.handicap,
        overrideTier: null,
      });
    }

    if ((players?.length ?? 0) < 3) {
      return NextResponse.json(
        { error: "Need at least 3 checked-in players to generate teams" },
        { status: 400 }
      );
    }

    // Assign tiers
    const tieredPlayers = assignTiers(players);

    // Generate teams
    const teams = generateTeams(tieredPlayers, requestedTeams);

    const teamsData: TeamsData = {
      teams,
      generatedAt: new Date().toISOString(),
    };

    // Save session
    await prisma.session.upsert({
      where: {
        sessionDate: new Date(todayStr),
      },
      update: {
        teamsData: teamsData as any,
      },
      create: {
        sessionDate: new Date(todayStr),
        teamsData: teamsData as any,
      },
    });

    return NextResponse.json(teamsData);
  } catch (error) {
    console.error("Team generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate teams" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    const session = await prisma.session.findUnique({
      where: {
        sessionDate: new Date(todayStr),
      },
    });

    if (!session?.teamsData) {
      return NextResponse.json({ teams: [], generatedAt: null });
    }

    return NextResponse.json(session.teamsData);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
