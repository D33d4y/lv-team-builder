export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET: how many players currently have a nonzero annual attendance count,
// shown in the confirmation modal before resetting.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const playerCount = await prisma.player.count({
      where: { annualAttendance: { gt: 0 } },
    });
    return NextResponse.json({ playerCount });
  } catch (error) {
    console.error("GET /api/reset-annual-attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: reset every player's annual attendance ("XX Plays") back to 0.
// Intended to be run manually, once per year, after the Village Cup.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await prisma.player.updateMany({
      data: { annualAttendance: 0 },
    });
    return NextResponse.json({ success: true, resetCount: result.count });
  } catch (error) {
    console.error("POST /api/reset-annual-attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
