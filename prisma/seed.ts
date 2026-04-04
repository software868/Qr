import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: nothing to seed (checklists are defined in application code).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e: { code?: string; message?: string }) => {
    console.error(e);
    if (e.code === "P2031") {
      console.error(
        "\nMongoDB must run as a replica set for Prisma writes. Use Atlas, or run mongod with --replSet and rs.initiate(). See .env.example.\n",
      );
    }
    prisma.$disconnect();
    process.exit(1);
  });
