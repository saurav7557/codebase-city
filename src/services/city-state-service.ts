import "server-only";

import { prisma } from "@/lib/prisma";

const HIGH_CONFIDENCE_THRESHOLD = 0.7;

export type CityStateSyncSummary = {
  projectsRead: number;
  technologiesRead: number;
  engineeringEventsRead: number;
  highConfidenceAnalysesRead: number;
  buildingsCreated: number;
  buildingsPreserved: number;
};

/**
 * Reconciles only missing project buildings. Manually curated CityBuilding rows,
 * including their positions and visual details, are preserved exactly. AI analyses
 * are read for observability but cannot overwrite portfolio or city records.
 */
export async function syncCityState(): Promise<CityStateSyncSummary> {
  const [projects, technologyCount, eventCount, highConfidenceAnalysisCount] = await prisma.$transaction([
    prisma.project.findMany({
      include: {
        building: { select: { id: true } },
        district: {
          select: { id: true, color: true, centerX: true, centerZ: true, radius: true },
        },
        technologies: { select: { technologyId: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.technology.count(),
    prisma.engineeringEvent.count(),
    prisma.aiAnalysis.count({ where: { confidence: { gte: HIGH_CONFIDENCE_THRESHOLD } } }),
  ]);
  const projectsWithoutBuildings = projects.filter((project) => !project.building);

  if (projectsWithoutBuildings.length > 0) {
    await prisma.$transaction(
      projectsWithoutBuildings.map((project) =>
        prisma.cityBuilding.upsert({
          where: { projectId: project.id },
          update: {},
          create: createDeterministicBuilding(project),
        }),
      ),
    );
  }

  const summary = {
    projectsRead: projects.length,
    technologiesRead: technologyCount,
    engineeringEventsRead: eventCount,
    highConfidenceAnalysesRead: highConfidenceAnalysisCount,
    buildingsCreated: projectsWithoutBuildings.length,
    buildingsPreserved: projects.length - projectsWithoutBuildings.length,
  };
  console.info("City state sync completed", summary);
  return summary;
}

function createDeterministicBuilding(project: {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  districtId: string;
  district: { color: string; centerX: number; centerZ: number; radius: number };
  technologies: { technologyId: string }[];
}) {
  const hash = stableHash(project.id);
  const normalizedAngle = (hash % 360) * (Math.PI / 180);
  const normalizedRadius = 0.25 + ((hash >>> 9) % 50) / 100;
  const offset = Math.max(3, project.district.radius * normalizedRadius);
  const type = toBuildingType(project.category);
  const status = toBuildingStatus(project.status);

  return {
    id: `city-building-${project.id}`,
    projectId: project.id,
    districtId: project.districtId,
    name: project.name,
    description: project.description,
    type,
    status,
    positionX: round(project.district.centerX + Math.cos(normalizedAngle) * offset),
    positionY: 0,
    positionZ: round(project.district.centerZ + Math.sin(normalizedAngle) * offset),
    height: round(2.5 + Math.min(project.technologies.length, 8) * 0.35),
    color: project.district.color,
    accentColor: "#ffffff",
  };
}

function toBuildingType(category: string): string {
  return ["backend", "ai", "blockchain", "open-source", "achievement"].includes(category)
    ? category
    : "generic";
}

function toBuildingStatus(status: string): string {
  return ["active", "building", "planned"].includes(status) ? status : "planned";
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
