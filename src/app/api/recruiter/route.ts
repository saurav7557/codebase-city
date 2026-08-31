import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const [projects, technologies, repositories, districts] = await Promise.all([
      prisma.project.findMany({
        where: { featured: true },
        include: {
          technologies: { include: { technology: true } },
          district: { select: { name: true } },
        },
        take: 5,
      }),
      prisma.technology.findMany({ take: 20 }),
      prisma.gitHubRepository.findMany(),
      prisma.district.findMany(),
    ]);

    // Extract unique technologies
    const uniqueTechs = new Set<string>();
    projects.forEach(p => p.technologies.forEach(t => uniqueTechs.add(t.technology.name)));
    technologies.forEach(t => uniqueTechs.add(t.name));

    // Extract unique languages from GitHub
    const languages = new Set<string>();
    repositories.forEach(r => {
      if (r.primaryLanguage) languages.add(r.primaryLanguage);
    });

    // Extract engineering domains from districts
    const domains = districts
      .map(d => d.name)
      .filter(name => !["Core District", "Achievement District"].includes(name));

    return Response.json({
      name: "Saurav Kumar",
      role: "Full-Stack Engineer",
      domains: domains,
      strongProjects: projects.map(p => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies.map(t => t.technology.name),
        status: p.status,
      })),
      technologies: Array.from(uniqueTechs).slice(0, 15),
      githubActivity: {
        repositories: repositories.length,
        commits: repositories.reduce((sum, r) => sum + (r.forks || 0), 0), // Using forks as commit proxy
        languages: Array.from(languages),
      },
      openSource: repositories.some(r => !r.isFork),
      aiBackendExperience: districts.some(d => d.type === "ai" || d.type === "backend"),
    });
  } catch (error) {
    console.error("Failed to fetch recruiter data:", error);
    return Response.json(
      { error: { code: "RECRUITER_DATA_FAILED", message: "Failed to fetch recruiter data" } },
      { status: 500 }
    );
  }
}
