import { getAIProvider } from "@/ai/ai-provider-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AskRequest {
  question: string;
  buildingId?: string;
}

interface AskResponse {
  answer: string;
  evidence: string[];
  confidence: number;
  sources: string[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as AskRequest;

    if (!body.question || typeof body.question !== "string") {
      return Response.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Question is required",
          },
        },
        { status: 400 },
      );
    }

    const provider = getAIProvider();

    /*
     * ------------------------------------------------------------
     * Gather portfolio context
     * ------------------------------------------------------------
     */

    const [projects, technologies, districts, analyses] =
      await Promise.all([
        prisma.project.findMany({
          include: {
            district: {
              select: {
                name: true,
              },
            },
            technologies: {
              include: {
                technology: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),

        prisma.technology.findMany({
          select: {
            name: true,
          },
        }),

        prisma.district.findMany({
          select: {
            name: true,
            type: true,
          },
        }),

        prisma.aiAnalysis.findMany({
          where: {
            confidence: {
              gte: 0.7,
            },
          },
          take: 5,
          orderBy: {
            confidence: "desc",
          },
        }),
      ]);

    /*
     * ------------------------------------------------------------
     * Optional selected-building context
     * ------------------------------------------------------------
     */

    let selectedBuilding = null;

    if (body.buildingId) {
      const building = await prisma.cityBuilding.findUnique({
        where: {
          id: body.buildingId,
        },
        include: {
          project: {
            include: {
              district: {
                select: {
                  name: true,
                },
              },
              technologies: {
                include: {
                  technology: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (building) {
        selectedBuilding = {
          building: {
            id: building.id,
            name: building.name,
            description: building.description,
            type: building.type,
            status: building.status,
            district: building.districtId,
          },
          project: building.project
            ? {
                id: building.project.id,
                name: building.project.name,
                description: building.project.description,
                category: building.project.category,
                status: building.project.status,
                district: building.project.district.name,
                technologies:
                  building.project.technologies.map(
                    (technology) => technology.technology.name,
                  ),
              }
            : null,
        };
      }
    }

    /*
     * ------------------------------------------------------------
     * Build AI context
     * ------------------------------------------------------------
     */

    const context = {
      selectedBuilding,

      projects: projects.map((project) => ({
        name: project.name,
        description: project.description,
        category: project.category,
        district: project.district.name,
        technologies: project.technologies.map(
          (technology) => technology.technology.name,
        ),
        status: project.status,
      })),

      technologies: technologies.map(
        (technology) => technology.name,
      ),

      districts: districts.map((district) => ({
        name: district.name,
        type: district.type,
      })),

      aiInsights: analyses.map((analysis) => ({
        confidence: analysis.confidence,
        result: analysis.result,
      })),
    };

    /*
     * ------------------------------------------------------------
     * Check provider capability
     * ------------------------------------------------------------
     */

    if (!provider.ask) {
      return Response.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message:
              "Ask the City AI is not yet implemented for this provider",
          },
        },
        { status: 501 },
      );
    }

    /*
     * ------------------------------------------------------------
     * Ask AI
     * ------------------------------------------------------------
     */

    const response = await provider.ask(
      body.question,
      context,
    );

    return Response.json({
      answer: response.answer,
      evidence: response.evidence || [],
      confidence: response.confidence || 0.5,
      sources: response.sources || [],
    } satisfies AskResponse);
  } catch (error) {
    console.error("Ask AI failed:", error);

    return Response.json(
      {
        error: {
          code: "ASK_FAILED",
          message: "Failed to process question",
        },
      },
      { status: 500 },
    );
  }
}