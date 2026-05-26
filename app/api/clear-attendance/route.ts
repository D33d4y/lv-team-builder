import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getSessionDate } from "@/lib/session-date";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sentinelDate = getSessionDate();
    const count = await prisma.attendance.count({
      where: { sessionDate: { not: sentinelDate } },
    });
    return NextResponse.json({ recordCount: count });
  } catch (error) {
    console.error("GET /api/clear-attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sentinelDate = getSessionDate();
    const result = await prisma.attendance.deleteMany({
      where: { sessionDate: { not: sentinelDate } },
    });
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error("POST /api/clear-attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
