import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Ensure a test account exists for automated testing
  const hashedPassword = await bcrypt.hash("johndoe123", 10);
  await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      name: "John Doe",
      password: hashedPassword,
      isAdmin: true,
    },
  });

  // Create some sample players for testing
  const samplePlayers = [
    { name: "Mike Johnson", handicap: 8.5, overrideTier: null },
    { name: "Tom Wilson", handicap: 12.3, overrideTier: null },
    { name: "Dave Miller", handicap: 15.8, overrideTier: null },
    { name: "Steve Brown", handicap: 18.2, overrideTier: null },
    { name: "Chris Davis", handicap: 22.1, overrideTier: null },
    { name: "John Smith", handicap: 6.2, overrideTier: "A" },
    { name: "Bob Taylor", handicap: 10.5, overrideTier: null },
    { name: "Jim Anderson", handicap: 14.7, overrideTier: null },
  ];

  for (const player of samplePlayers) {
    await prisma.player.upsert({
      where: { name: player.name },
      update: {
        handicap: player.handicap,
        overrideTier: player.overrideTier,
      },
      create: player,
    });
  }

  console.log(`Created ${samplePlayers.length} sample players`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
