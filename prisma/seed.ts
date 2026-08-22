import { PrismaClient } from "@prisma/client";

import { cityData } from "../src/data/city";

const prisma = new PrismaClient();

const profileBuildingId = "saurav-hq";

async function main() {
  for (const district of cityData.districts) {
    await prisma.district.upsert({
      where: { id: district.id },
      update: {
        name: district.name,
        slug: district.id,
        type: district.id,
        color: district.color,
        centerX: district.center[0],
        centerZ: district.center[1],
        radius: district.radius,
      },
      create: {
        id: district.id,
        name: district.name,
        slug: district.id,
        type: district.id,
        color: district.color,
        centerX: district.center[0],
        centerZ: district.center[1],
        radius: district.radius,
      },
    });
  }

  for (const building of cityData.buildings) {
    const isProfile = building.id === profileBuildingId;
    const projectId = isProfile ? null : building.id;

    if (projectId) {
      await prisma.project.upsert({
        where: { id: projectId },
        update: {
          name: building.name,
          slug: building.id,
          description: building.description,
          category: building.type,
          status: building.status,
          districtId: building.district,
          featured: false,
        },
        create: {
          id: projectId,
          name: building.name,
          slug: building.id,
          description: building.description,
          category: building.type,
          status: building.status,
          districtId: building.district,
          featured: false,
        },
      });

      for (const technologyName of building.technologies ?? []) {
        const technologyId = toSlug(technologyName);
        await prisma.technology.upsert({
          where: { id: technologyId },
          update: { name: technologyName, slug: technologyId },
          create: { id: technologyId, name: technologyName, slug: technologyId },
        });
        await prisma.projectTechnology.upsert({
          where: {
            projectId_technologyId: { projectId, technologyId },
          },
          update: {},
          create: { projectId, technologyId },
        });
      }
    } else {
      for (const technologyName of building.technologies ?? []) {
        const technologyId = toSlug(technologyName);
        await prisma.technology.upsert({
          where: { id: technologyId },
          update: { name: technologyName, slug: technologyId },
          create: { id: technologyId, name: technologyName, slug: technologyId },
        });
      }
    }

    await prisma.cityBuilding.upsert({
      where: { id: building.id },
      update: {
        projectId,
        districtId: building.district,
        name: building.name,
        description: building.description,
        type: building.type,
        status: building.status,
        positionX: building.position[0],
        positionY: building.position[1],
        positionZ: building.position[2],
        height: building.height,
        color: building.color,
        accentColor: building.accentColor,
      },
      create: {
        id: building.id,
        projectId,
        districtId: building.district,
        name: building.name,
        description: building.description,
        type: building.type,
        status: building.status,
        positionX: building.position[0],
        positionY: building.position[1],
        positionZ: building.position[2],
        height: building.height,
        color: building.color,
        accentColor: building.accentColor,
      },
    });

    if (!projectId) {
      for (const technologyName of building.technologies ?? []) {
        const technologyId = toSlug(technologyName);
        await prisma.cityBuildingTechnology.upsert({
          where: {
            buildingId_technologyId: { buildingId: building.id, technologyId },
          },
          update: {},
          create: { buildingId: building.id, technologyId },
        });
      }
    }
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Prisma seed failed:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
