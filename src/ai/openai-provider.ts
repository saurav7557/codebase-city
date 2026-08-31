import "server-only";

import { AIValidationError, validateAIAnalysisResult } from "./ai-validation";
import type { AIAnalysisContext, AIProvider, AIProviderResult } from "./ai-types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 45_000;

export class AIProviderRequestError extends Error {
  constructor(message = "AI provider could not complete the analysis.") {
    super(message);
    this.name = "AIProviderRequestError";
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;

  constructor(
    private readonly apiKey: string,
    model = process.env.OPENAI_MODEL || "gpt-4.1-mini",
  ) {
    this.model = model;
  }

  async analyzeRepository(context: AIAnalysisContext): Promise<AIProviderResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions:
            "You classify real engineering evidence. Use only the supplied context. " +
            "Return no invented technologies, projects, or evidence. Evidence entries must be copied exactly from evidenceFacts. " +
            "Use null when a project, district, or building type is unknown.",
          input: JSON.stringify(context),
          max_output_tokens: 800,
          text: {
            format: {
              type: "json_schema",
              name: "repository_analysis",
              strict: true,
              schema: ANALYSIS_JSON_SCHEMA,
            },
          },
        }),
        signal: controller.signal,
      });

      const body = await parseResponse(response);
      if (!response.ok) {
        throw new AIProviderRequestError();
      }

      const outputText = getOutputText(body);
      let parsed: unknown;
      try {
        parsed = JSON.parse(outputText);
      } catch {
        throw new AIValidationError();
      }

      return {
        model: this.model,
        analysis: validateAIAnalysisResult(
          parsed,
          context.evidenceFacts,
          context.knownTechnologies,
        ),
      };
    } catch (error: unknown) {
      if (error instanceof AIProviderRequestError || error instanceof AIValidationError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AIProviderRequestError("AI provider did not respond before the request timeout.");
      }
      throw new AIProviderRequestError();
    } finally {
      clearTimeout(timeout);
    }
  }
}

const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "projectName",
    "districtType",
    "technologyNames",
    "buildingType",
    "importance",
    "confidence",
    "summary",
    "evidence",
  ],
  properties: {
    projectName: { type: ["string", "null"] },
    districtType: { type: ["string", "null"] },
    technologyNames: { type: "array", items: { type: "string" } },
    buildingType: { type: ["string", "null"] },
    importance: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
  },
} as const;

async function parseResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AIProviderRequestError();
  }
}

function getOutputText(body: unknown): string {
  if (!isRecord(body)) {
    throw new AIProviderRequestError();
  }
  if (typeof body.output_text === "string") {
    return body.output_text;
  }
  if (!Array.isArray(body.output)) {
    throw new AIProviderRequestError();
  }

  for (const item of body.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  throw new AIProviderRequestError();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
