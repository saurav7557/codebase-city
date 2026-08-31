import {
  AIProviderConfigurationError,
} from "@/ai/ai-provider-service";
import { AIValidationError } from "@/ai/ai-validation";
import { AIProviderRequestError } from "@/ai/openai-provider";
import {
  analyzeGitHubRepository,
  PortfolioIntelligenceNotFoundError,
} from "@/services/portfolio-intelligence-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const repositoryId = await getRepositoryId(request);
    return Response.json(await analyzeGitHubRepository(repositoryId));
  } catch (error: unknown) {
    return getAIErrorResponse(error);
  }
}

async function getRepositoryId(request: Request): Promise<string> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AIRequestError("AI_INVALID_REQUEST", 400, "Request body must be valid JSON.");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof (body as Record<string, unknown>).repositoryId !== "string" ||
    !(body as Record<string, string>).repositoryId.trim()
  ) {
    throw new AIRequestError(
      "AI_INVALID_REQUEST",
      400,
      "Provide exactly one non-empty repositoryId.",
    );
  }
  return (body as Record<string, string>).repositoryId.trim();
}

function getAIErrorResponse(error: unknown): Response {
  if (error instanceof AIRequestError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof AIProviderConfigurationError) {
    return Response.json(
      { error: { code: "AI_PROVIDER_NOT_CONFIGURED", message: "No AI provider is configured." } },
      { status: 503 },
    );
  }
  if (error instanceof PortfolioIntelligenceNotFoundError) {
    return Response.json(
      { error: { code: "GITHUB_REPOSITORY_NOT_FOUND", message: "GitHub repository was not found." } },
      { status: 404 },
    );
  }
  if (error instanceof AIValidationError) {
    return Response.json(
      { error: { code: "AI_INVALID_RESPONSE", message: "AI returned an invalid analysis." } },
      { status: 502 },
    );
  }
  if (error instanceof AIProviderRequestError) {
    return Response.json(
      { error: { code: "AI_PROVIDER_FAILED", message: "AI provider could not complete the analysis." } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "AI_ANALYSIS_FAILED", message: "AI analysis could not be completed." } },
    { status: 500 },
  );
}

class AIRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AIRequestError";
  }
}
