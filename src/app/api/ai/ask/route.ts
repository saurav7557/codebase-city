import { getAIProvider } from "@/ai/ai-provider-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AskRequest {
  question: string;
}

interface AskResponse {
  answer: string;
  evidence: string[];
  confidence: number;
  sources: string[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as AskRequest;

    if (!body.question || typeof body.question !== "string") {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "Question is required" } },
        { status: 400 }
      );
    }

    const provider = getAIProvider();

    // Gather portfolio context
    const [projects, technologies, districts, analyses] = await Promise.all([
      prisma.project.findMany({
        include: {
          district: { select: { name: true } },
          technologies: { include: { technology: { select: { name: true } } } },
        },
      }),
      prisma.technology.findMany({ select: { name: true } }),
      prisma.district.findMany({ select: { name: true, type: true } }),
      prisma.aiAnalysis.findMany({
        where: { confidence: { gte: 0.7 } },
        take: 5,
        orderBy: { confidence: "desc" },
      }),
    ]);

    // Build context for AI
    const context = {
      projects: projects.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        district: p.district.name,
        technologies: p.technologies.map(t => t.technology.name),
        status: p.status,
      })),
      technologies: technologies.map(t => t.name),
      districts: districts.map(d => ({ name: d.name, type: d.type })),
      aiInsights: analyses.map(a => ({
        confidence: a.confidence,
        result: a.result,
      })),
    };

    // Check if provider supports ask functionality
    if (!provider.ask) {
      return Response.json(
        {
          error: {
            code: "NOT_IMPLEMENTED",
            message: "Ask the City AI is not yet implemented for this provider"
          }
        },
        { status: 501 }
      );
    }

    // Call the AI provider with the question and context
    const response = await provider.ask(body.question, context);

    return Response.json({
      answer: response.answer,
      evidence: response.evidence || [],
      confidence: response.confidence || 0.5,
      sources: response.sources || [],
    } as AskResponse);

  } catch (error) {
    console.error("Ask AI failed:", error);
    return Response.json(
      { error: { code: "ASK_FAILED", message: "Failed to process question" } },
      { status: 500 }
    );
  }
}
