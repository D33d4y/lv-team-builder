export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete all check-ins for today
    const deleted = await prisma.attendance.deleteMany({
      where: {
        sessionDate: today,
      },
    });

    // Also delete any generated teams for today
    await prisma.session.deleteMany({
      where: {
        sessionDate: today,
      },
    });

    // Delete all guest players for today
    await prisma.guestPlayer.deleteMany({
      where: {
        sessionDate: today,
      },
    });

    // Save the last cleared timestamp
    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: { lastCleared: new Date() },
      create: { id: "singleton", lastCleared: new Date() },
    });

    return NextResponse.json({
      success: true,
      clearedCheckins: deleted.count,
      message: "Week cleared! Ready for new check-ins.",
    });
  } catch (error) {
    console.error("Clear check-ins error:", error);
    return NextResponse.json(
      { error: "Failed to clear check-ins" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    return NextResponse.json({
      lastCleared: settings?.lastCleared || null,
    });
  } catch (error) {
    console.error("Fetch last cleared error:", error);
    return NextResponse.json({ lastCleared: null });
  }
}
