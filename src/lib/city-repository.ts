import "server-only";

import type { CityBuilding, CityData, CityDistrict } from "@/types/city";

import { prisma } from "./prisma";

export async function getCityData(): Promise<CityData> {
  const [districts, buildings] = await prisma.$transaction([
    prisma.district.findMany({ orderBy: { id: "asc" } }),
    prisma.cityBuilding.findMany({
      include: {
        project: {
          include: {
            technologies: { include: { technology: true } },
          },
        },
        technologies: { include: { technology: true } },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  return {
    districts: districts.map(toCityDistrict),
    buildings: buildings.map(toCityBuilding),
  };
}

export async function getDistricts() {
  return prisma.district.findMany({ orderBy: { id: "asc" } });
}

export async function getProjects() {
  return prisma.project.findMany({
    include: {
      district: true,
      technologies: { include: { technology: true } },
      building: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      district: true,
      technologies: { include: { technology: true } },
      building: true,
    },
  });
}

export async function getAchievements() {
  return prisma.achievement.findMany({ orderBy: { date: "desc" } });
}

export async function getEngineeringEvents() {
  const events = await prisma.engineeringEvent.findMany({ orderBy: { occurredAt: "desc" } });
  return events.map(event => ({
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    summary: event.title,
    category: event.type,
  }));
}

function toCityDistrict(district: {
  id: string;
  name: string;
  color: string;
  centerX: number;
  centerZ: number;
  radius: number;
}): CityDistrict {
  return {
    id: district.id,
    name: district.name,
    color: district.color,
    center: [district.centerX, district.centerZ],
    radius: district.radius,
  };
}

function toCityBuilding(building: {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  districtId: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  height: number;
  color: string;
  accentColor: string;
  project: {
    technologies: { technology: { name: string } }[];
  } | null;
  technologies: { technology: { name: string } }[];
}): CityBuilding {
  return {
    id: building.id,
    name: building.name,
    type: building.type as CityBuilding["type"],
    district: building.districtId,
    description: building.description,
    status: building.status as CityBuilding["status"],
    position: [building.positionX, building.positionY, building.positionZ],
    height: building.height,
    color: building.color,
    accentColor: building.accentColor,
    technologies: (building.project?.technologies ?? building.technologies).map(
      ({ technology }) => technology.name,
    ),
  };
}
