import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_EMAIL, DEMO_PASSWORD, seedDemoData } from "../src/server/services/demo-seed";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const started = Date.now();
    const result = await seedDemoData(prisma);
    console.log(
      `Seeded demo account ${DEMO_EMAIL} / ${DEMO_PASSWORD}: ${result.links} links, ${result.clicks} clicks (${Date.now() - started}ms)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
