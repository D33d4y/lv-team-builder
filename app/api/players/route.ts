export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    const players = await prisma.player.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Get today's check-ins
    const todayCheckIns = await prisma.attendance.findMany({
      where: {
        sessionDate: new Date(todayStr),
        checkedIn: true,
      },
      select: {
        playerId: true,
      },
    });

    const checkedInIds = new Set(todayCheckIns?.map((a) => a?.playerId) ?? []);

    // Map players with annual attendance data
    const playersWithAttendance = (players ?? []).map((player) => ({
      id: player?.id ?? "",
      name: player?.name ?? "",
      handicap: player?.handicap ?? 0,
      overrideTier: player?.overrideTier ?? null,
      annualAttendance: player?.annualAttendance ?? 0,
      isCheckedIn: checkedInIds.has(player?.id ?? ""),
    }));

// Sort alphabetically by name
playersWithAttendance.sort((a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""));

    return NextResponse.json(playersWithAttendance);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
