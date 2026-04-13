export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SHEET_ID = "1CWIqwxxXW0wIp7k1lU5Ejc_rZkegjE4c7vxljQVAxJQ";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < (csvText?.length ?? 0); i++) {
    const char = csvText?.[i] ?? "";
    const nextChar = csvText?.[i + 1] ?? "";

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch Google Sheet");
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if ((rows?.length ?? 0) < 2) {
      return NextResponse.json(
        { error: "No data found in spreadsheet" },
        { status: 400 }
      );
    }

    // First row is header: Name, Handicap, Override Tier
    const headers = (rows?.[0] ?? []).map((h) => h?.toLowerCase()?.trim() ?? "");
    let nameIdx = headers.indexOf("name");
    let handicapIdx = headers.indexOf("handicap");
    const overrideIdx = headers.findIndex((h) => h?.includes("override") || h?.includes("tier"));

    // If no "name" header found, assume column A (index 0) is name
    if (nameIdx === -1) {
      nameIdx = 0;
    }
    
    // If no "handicap" header found, assume column B (index 1) is handicap
    if (handicapIdx === -1) {
      handicapIdx = 1;
    }

    // Verify we have data
    if ((rows?.length ?? 0) < 2) {
      return NextResponse.json(
        { error: "No player data found in spreadsheet" },
        { status: 400 }
      );
    }

    const dataRows = rows?.slice(1) ?? [];
    let imported = 0;
    let updated = 0;

    for (const row of dataRows) {
      const name = row?.[nameIdx]?.trim() ?? "";
      const handicapStr = row?.[handicapIdx]?.trim() ?? "";
      const overrideTier = overrideIdx !== -1 ? (row?.[overrideIdx]?.trim()?.toUpperCase() ?? null) : null;

      if (!name || !handicapStr) continue;

      const handicap = parseFloat(handicapStr);
      if (isNaN(handicap)) continue;

      const validTier = overrideTier && ["A", "B", "C", "D"].includes(overrideTier) ? overrideTier : null;

      const existingPlayer = await prisma.player.findUnique({
        where: { name },
      });

      if (existingPlayer) {
        await prisma.player.update({
          where: { name },
          data: {
            handicap,
            overrideTier: validTier,
          },
        });
        updated++;
      } else {
        await prisma.player.create({
          data: {
            name,
            handicap,
            overrideTier: validTier,
          },
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: imported + updated,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import from Google Sheets" },
      { status: 500 }
    );
  }
}
