import { PrismaClient, ProductType } from "@prisma/client";

const prisma = new PrismaClient();

const bomSeeds: {
  productType: ProductType;
  name: string;
  lines: { partCode: string; description: string; expectedQty: number }[];
}[] = [
  {
    productType: ProductType.CONTROL_PANEL,
    name: "Control Panel BOM",
    lines: [
      { partCode: "CP-MAIN", description: "Main control board", expectedQty: 1 },
      { partCode: "CP-DISP", description: "Display module", expectedQty: 1 },
      { partCode: "CP-PWR", description: "Power supply unit", expectedQty: 1 },
      { partCode: "CP-IO", description: "I/O expansion", expectedQty: 2 },
    ],
  },
  {
    productType: ProductType.IPS,
    name: "IPS BOM",
    lines: [
      { partCode: "IPS-CORE", description: "IPS processor module", expectedQty: 1 },
      { partCode: "IPS-SENS", description: "Sensor array", expectedQty: 1 },
      { partCode: "IPS-CBL", description: "Harness kit", expectedQty: 1 },
    ],
  },
  {
    productType: ProductType.AVS,
    name: "AVS BOM",
    lines: [
      { partCode: "AVS-VALVE", description: "Primary valve assembly", expectedQty: 1 },
      { partCode: "AVS-ACT", description: "Actuator", expectedQty: 1 },
      { partCode: "AVS-SAFE", description: "Safety interlock", expectedQty: 1 },
    ],
  },
];

async function main() {
  for (const seed of bomSeeds) {
    const existing = await prisma.bomTemplate.findUnique({
      where: { productType: seed.productType },
    });

    if (existing) {
      await prisma.bomTemplateLine.deleteMany({ where: { templateId: existing.id } });
      await prisma.bomTemplate.update({
        where: { id: existing.id },
        data: { name: seed.name },
      });
      let i = 0;
      for (const line of seed.lines) {
        await prisma.bomTemplateLine.create({
          data: {
            templateId: existing.id,
            sortOrder: i++,
            partCode: line.partCode,
            description: line.description,
            expectedQty: line.expectedQty,
          },
        });
      }
    } else {
      const t = await prisma.bomTemplate.create({
        data: {
          productType: seed.productType,
          name: seed.name,
        },
      });
      let i = 0;
      for (const line of seed.lines) {
        await prisma.bomTemplateLine.create({
          data: {
            templateId: t.id,
            sortOrder: i++,
            partCode: line.partCode,
            description: line.description,
            expectedQty: line.expectedQty,
          },
        });
      }
    }
  }
  console.log("BOM templates seeded.");
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
