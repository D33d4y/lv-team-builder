export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subWeeks, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const today = startOfDay(new Date());
    const tenWeeksAgo = subWeeks(today, 10);
    const todayStr = format(today, "yyyy-MM-dd");

    // Get all players with their attendance count in last 10 weeks
    const players = await prisma.player.findMany({
      include: {
        attendances: {
          where: {
            sessionDate: {
              gte: tenWeeksAgo,
            },
            checkedIn: true,
          },
        },
      },
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

    // Map players with attendance data
    const playersWithAttendance = (players ?? []).map((player) => ({
      id: player?.id ?? "",
      name: player?.name ?? "",
      handicap: player?.handicap ?? 0,
      overrideTier: player?.overrideTier ?? null,
      attendanceCount: player?.attendances?.length ?? 0,
      isCheckedIn: checkedInIds.has(player?.id ?? ""),
    }));

    // Sort by attendance count (descending), then by name
    playersWithAttendance.sort((a, b) => {
      if ((b?.attendanceCount ?? 0) !== (a?.attendanceCount ?? 0)) {
        return (b?.attendanceCount ?? 0) - (a?.attendanceCount ?? 0);
      }
      return (a?.name ?? "").localeCompare(b?.name ?? "");
    });

    return NextResponse.json(playersWithAttendance);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
