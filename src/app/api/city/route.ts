import { getCityData, getProjects, getDistricts, getEngineeringEvents } from "@/lib/city-repository";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const [cityData, projects, districts, events, techCount, analysisCount] = await Promise.all([
    getCityData(),
    getProjects(),
    getDistricts(),
    getEngineeringEvents(),
    prisma.technology.count(),
    prisma.aiAnalysis.count(),
  ]);

  return Response.json({
    ...cityData,
    projects: projects.length,
    repositories: projects.filter(p => p.githubUrl).length,
    technologies: techCount,
    districts: districts.length,
    engineeringEvents: events.length,
    aiAnalyses: analysisCount,
  });
}
