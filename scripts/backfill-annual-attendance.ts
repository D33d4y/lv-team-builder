/**
 * One-time backfill: sets Player.annualAttendance from the "2026 Saturday
 * Morning golf" attendance spreadsheet (column B = total Saturdays played,
 * column C = player name).
 *
 * Run once, directly against the production database:
 *   npx tsx --require dotenv/config scripts/backfill-annual-attendance.ts
 *
 * Safe to re-run: it always SETS (does not add to) each matched player's
 * total. Names that don't match an existing Player record are skipped and
 * listed at the end so they can be fixed by hand (e.g. correct a spelling,
 * or add the player first) — nothing is created or guessed automatically.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// name -> total Saturdays played, from the spreadsheet
const ATTENDANCE_TOTALS: Record<string, number> = {
  "Todd Pines": 24,
  "Steve Ray": 23,
  "Torrey Mathies": 22,
  "Kirk Smith": 22,
  "Craig Morrissey": 21,
  "Damon Sams": 20,
  "Chris Malek": 19,
  "Mark Moore": 19,
  "Sloan Newman": 19,
  "Shawn Devlin": 19,
  "Byron Bryant": 18,
  "Jason Gremminger": 18,
  "Charlie Holland": 18,
  "Brandon Morrissey": 18,
  "Mark Everson": 18,
  "Johnny Weaver": 14,
  "Jack Williams": 14,
  "Dave Nelson": 13,
  "Scott Pruitt": 12,
  "Randy Thomas": 12,
  "Jerry Gremminger": 11,
  "Joe Cleaver": 11,
  "Keith Childress": 11,
  "Davin Morrissey": 10,
  "Wayne Brady": 10,
  "Norman Pritchett": 9,
  "Dennis Patterson": 9,
  "Travis Marine": 9,
  "Cole Sandy": 9,
  "Luke Tulley": 8,
  "Ellis Canales": 8,
  "Lloyd Waldrup": 8,
  "Kevin Deaton": 8,
  "Kaiden Pines": 6,
  "David Erickson": 5,
  "Steve Roland": 4,
  "Jake Anderson": 4,
  "Charles Everhart": 3,
  "Scott Austin": 3,
  "Mike Oswalt": 2,
  "Dave Hana": 2,
  "Bob Warmack": 2,
  "Adam House": 2,
  "Roger Maddox": 2,
  "Steve Ingram": 1,
  "Ben Tolleson": 1,
  "Jack Barker": 1,
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const players = await prisma.player.findMany();
  const byNormalizedName = new Map(players.map((p) => [normalize(p.name), p]));

  const unmatched: string[] = [];
  let updated = 0;

  for (const [sheetName, total] of Object.entries(ATTENDANCE_TOTALS)) {
    const match = byNormalizedName.get(normalize(sheetName));
    if (!match) {
      unmatched.push(sheetName);
      continue;
    }
    await prisma.player.update({
      where: { id: match.id },
      data: { annualAttendance: total },
    });
    updated++;
  }

  console.log(`Updated ${updated} of ${Object.keys(ATTENDANCE_TOTALS).length} players.`);
  if (unmatched.length > 0) {
    console.log("\nNo matching player found for (check spelling, or add these players first):");
    unmatched.forEach((n) => console.log(`  - ${n}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
