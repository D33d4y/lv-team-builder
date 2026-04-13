export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, format } from "date-fns";

// GET - list today's guest players
export async function GET() {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    const guests = await prisma.guestPlayer.findMany({
      where: { sessionDate: new Date(todayStr) },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(guests ?? []);
  } catch (error) {
    console.error("Error fetching guest players:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - add a guest player for today
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, handicap } = body ?? {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (handicap === undefined || handicap === null || isNaN(Number(handicap))) {
      return NextResponse.json({ error: "Valid handicap is required" }, { status: 400 });
    }

    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");

    const guest = await prisma.guestPlayer.create({
      data: {
        name: name.trim(),
        handicap: Number(handicap),
        sessionDate: new Date(todayStr),
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error adding guest player:", error);
    return NextResponse.json({ error: "Failed to add guest player" }, { status: 500 });
  }
}
