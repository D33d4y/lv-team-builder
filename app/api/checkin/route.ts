export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, format, isSaturday } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, checkedIn } = body ?? {};

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    if (checkedIn) {
      // Look up whether this player already has an attendance record for
      // today BEFORE upserting, so we only count the first check-in of the
      // day toward annual attendance. Toggling check-in on/off again later
      // the same day will not double-count.
      const existing = await prisma.attendance.findUnique({
        where: {
          playerId_sessionDate: {
            playerId,
            sessionDate: new Date(todayStr),
          },
        },
      });

      const isFirstCheckInToday = !existing;

      await prisma.$transaction(async (tx) => {
        // Create or update attendance record
        await tx.attendance.upsert({
          where: {
            playerId_sessionDate: {
              playerId,
              sessionDate: new Date(todayStr),
            },
          },
          update: {
            checkedIn: true,
          },
          create: {
            playerId,
            sessionDate: new Date(todayStr),
            checkedIn: true,
          },
        });

        // Annual attendance ("XX Plays") only increments on Saturdays, and
        // only once per Saturday per player.
        if (isFirstCheckInToday && isSaturday(today)) {
          await tx.player.update({
            where: { id: playerId },
            data: { annualAttendance: { increment: 1 } },
          });
        }
      });
    } else {
      // Remove check-in
      await prisma.attendance.updateMany({
        where: {
          playerId,
          sessionDate: new Date(todayStr),
        },
        data: {
          checkedIn: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to update check-in" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    const checkedInPlayers = await prisma.attendance.findMany({
      where: {
        sessionDate: new Date(todayStr),
        checkedIn: true,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(
      (checkedInPlayers ?? []).map((a) => ({
        id: a?.player?.id ?? "",
        name: a?.player?.name ?? "",
        handicap: a?.player?.handicap ?? 0,
        overrideTier: a?.player?.overrideTier ?? null,
      }))
    );
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 }
    );
  }
}
