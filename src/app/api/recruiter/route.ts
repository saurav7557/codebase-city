
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { Prisma } from "@prisma/client";

type RecruiterProject = Prisma.ProjectGetPayload<{
  include: {
    technologies: { include: { technology: true } };
    district: { select: { name: true; type: true } };
  };
}>;

type RecruiterProjectTechnology = RecruiterProject["technologies"][number];
type RecruiterRepository = Awaited<ReturnType<typeof prisma.gitHubRepository.findMany>>[number];
type RecruiterDistrict = Awaited<ReturnType<typeof prisma.district.findMany>>[number];
type RecruiterEvent = Awaited<ReturnType<typeof prisma.engineeringEvent.findMany>>[number];
type RecruiterAchievement = Awaited<ReturnType<typeof prisma.achievement.findMany>>[number];
type RecruiterAnalysis = Awaited<ReturnType<typeof prisma.aiAnalysis.findMany>>[number];

export async function GET(): Promise<Response> {
  try {
    const [
      projects,
      technologies,
      repositories,
      districts,
      engineeringEvents,
      achievements,
      aiAnalyses,
    ] = await Promise.all([
      prisma.project.findMany({
        include: {
          technologies: { include: { technology: true } },
          district: { select: { name: true, type: true } },
        },
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.technology.findMany({ orderBy: { name: "asc" } }),
      prisma.gitHubRepository.findMany({
        orderBy: { githubUpdatedAt: "desc" },
      }),
      prisma.district.findMany({ orderBy: { name: "asc" } }),
      prisma.engineeringEvent.findMany({
        orderBy: { occurredAt: "desc" },
        take: 200,
      }),
      prisma.achievement.findMany({
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.aiAnalysis.findMany({
        orderBy: { generatedAt: "desc" },
        take: 30,
      }),
    ]);

    const technologySet = new Set<string>();

    for (const project of projects) {
      for (const technology of project.technologies) {
        technologySet.add(technology.technology.name);
      }
    }

    for (const technology of technologies) {
      technologySet.add(technology.name);
    }

    const languages = Array.from(
      new Set(
        repositories
          .map((repository: RecruiterRepository) => repository.primaryLanguage)
          .filter(
            (language: RecruiterRepository["primaryLanguage"]): language is string =>
              Boolean(language),
          ),
      ),
    );

    const allDomains = districts
      .map((district: RecruiterDistrict) => district.name)
      .filter(
        (name: RecruiterDistrict["name"]) =>
          !["Core District", "Achievement District"].includes(name),
      );

    const majorDomains = Array.from(
      new Set(
        projects
          .map((project) => project.district.name)
          .filter(
            (name) =>
              !["Core District", "Achievement District"].includes(name),
          ),
      ),
    );

    const strongProjects = projects.slice(0, 5).map((project: RecruiterProject) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies.map(
        (technology: RecruiterProjectTechnology) => technology.technology.name,
      ),
      status: project.status,
      category: project.category,
      district: project.district.name,
    }));

    const eventCountByMonth = engineeringEvents.reduce(
      (accumulator: Record<string, number>, event: RecruiterEvent) => {
        const month = event.occurredAt.toISOString().slice(0, 7);
        accumulator[month] = (accumulator[month] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    const recentActivity = Object.entries(eventCountByMonth)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .slice(0, 4)
      .map(([month, count]) => ({ month, count }));

    const confidenceAnalyses = aiAnalyses.filter(
      (analysis: RecruiterAnalysis) => analysis.confidence >= 0.7,
    );

    return Response.json({
      name: "Saurav Kumar",
      role: "Full-Stack Engineer",
      domains: allDomains,
      strongProjects,
      technologies: Array.from(technologySet).slice(0, 20),
      githubActivity: {
        repositories: repositories.length,
        commits: engineeringEvents.filter(
          (event: RecruiterEvent) => event.type === "commit",
        ).length,
        recentActivity,
        languages,
      },
      portfolioIntelligence: {
        projectCount: projects.length,
        technologyCount: technologySet.size,
        districtCount: districts.length,
        engineeringEventCount: engineeringEvents.length,
        repositoryCount: repositories.length,
        achievementCount: achievements.length,
        aiAnalysisCount: aiAnalyses.length,
        highConfidenceAnalysisCount: confidenceAnalyses.length,
        featuredProjectCount: projects.filter((project) => project.featured).length,
        projectCategoryCount: new Set(projects.map((project) => project.category)).size,
        majorDomains,
      },
      achievements: achievements.map((achievement: RecruiterAchievement) => ({
        title: achievement.title,
        date: achievement.date.toISOString(),
        category: achievement.category,
      })),
      openSource: repositories.some(
        (repository: RecruiterRepository) => !repository.isFork,
      ),
      aiBackendExperience:
        projects.some(
          (project) =>
            project.category === "ai" || project.category === "backend",
        ) ||
        districts.some(
          (district: RecruiterDistrict) =>
            district.type === "ai" || district.type === "backend",
        ),
    });
  } catch (error) {
    console.error("Failed to fetch recruiter data:", error);

    return Response.json(
      {
        error: {
          code: "RECRUITER_DATA_FAILED",
          message: "Failed to fetch recruiter data",
        },
      },
      { status: 500 },
    );
  }
}
